import { isHandle, stableUid, type Handle, type MetadataKind } from './core.ts'
import type { Category } from './category.ts'
import type { CategoryOption } from './categoryOption.ts'
import type { CategoryCombo } from './categoryCombo.ts'
import type { OptionSet } from './optionSet.ts'
import type { DataElement } from './dataElement.ts'
import type { DataSet } from './dataSet.ts'

export type AnyHandle =
  | Category
  | CategoryOption
  | CategoryCombo
  | OptionSet
  | DataElement
  | DataSet

export type SchemaInput = {
  objects: readonly AnyHandle[]
}

export type Schema = {
  readonly objects: readonly AnyHandle[]
  readonly byKind: Readonly<Record<MetadataKind, readonly Handle<MetadataKind, { code: string }>[]>>
  serialize(): Record<string, unknown[]>
}

const PAYLOAD_KEY: Record<MetadataKind, string> = {
  Category: 'categories',
  CategoryOption: 'categoryOptions',
  CategoryCombo: 'categoryCombos',
  OptionSet: 'optionSets',
  Option: 'options',
  DataElement: 'dataElements',
  DataSet: 'dataSets',
}

// Assign a stable DHIS2 UID (derived from kind:code) to the top-level object
// as `id`. Master validation hooks crash on transient objects with null UIDs
// (see DefaultCategoryService.validate); for objects that already exist on
// the server (matched by code), DHIS2 keeps its own UID and our supplied one
// is a no-op.
function withTopLevelId(kind: MetadataKind, code: string, body: unknown): unknown {
  if (!body || typeof body !== 'object') return body
  return {
    id: stableUid(`${kind}:${code}`),
    ...(body as Record<string, unknown>),
  }
}

// DHIS2's metadata importer requires Options as top-level entries under
// `options`, not nested inside OptionSet. Split them out: in the OptionSet
// body, replace `options: [...]` with id-only refs, and hoist the full
// Option bodies to a sibling top-level list.
type SplitOptionSet = {
  optionSet: Record<string, unknown>
  options: Record<string, unknown>[]
}

function splitOptionSet(code: string, body: unknown): SplitOptionSet {
  const src = body as Record<string, unknown>
  const optionSetId = stableUid(`OptionSet:${code}`)
  const rawOptions = Array.isArray(src.options) ? (src.options as Record<string, unknown>[]) : []
  const optionRefs: { id: string }[] = []
  const optionBodies: Record<string, unknown>[] = []

  for (const opt of rawOptions) {
    if (!opt || typeof opt !== 'object') continue
    const optCode = typeof opt.code === 'string' ? opt.code : ''
    const optionId = stableUid(`Option:${code}:${optCode}`)
    optionRefs.push({ id: optionId })
    optionBodies.push({
      ...opt,
      id: optionId,
      optionSet: { id: optionSetId },
    })
  }

  return {
    optionSet: { id: optionSetId, ...src, options: optionRefs },
    options: optionBodies,
  }
}

function toPayload(value: unknown): unknown {
  if (isHandle(value)) {
    // Include both `code` (for preheat identifier=CODE resolution) and a
    // stable `id` so that transient stub objects created by Jackson from the
    // nested ref still have a non-null UID — some master validation hooks
    // (e.g. CategoryComboObjectBundleHook) crash otherwise.
    return { id: stableUid(`${value.kind}:${value.code}`), code: value.code }
  }
  if (Array.isArray(value)) {
    return value.map(toPayload)
  }
  if (value && typeof value === 'object') {
    const out: Record<string, unknown> = {}
    for (const [k, v] of Object.entries(value)) {
      out[k] = toPayload(v)
    }
    return out
  }
  return value
}

export function defineSchema(input: SchemaInput): Schema {
  const byKind: Record<MetadataKind, Handle<MetadataKind, { code: string }>[]> = {
    Category: [],
    CategoryOption: [],
    CategoryCombo: [],
    OptionSet: [],
    Option: [],
    DataElement: [],
    DataSet: [],
  }

  const seen = new Set<string>()
  for (const handle of input.objects) {
    const key = `${handle.kind}:${handle.code}`
    if (seen.has(key)) {
      throw new Error(`Duplicate ${handle.kind} with code '${handle.code}' in schema.`)
    }
    seen.add(key)
    byKind[handle.kind].push(handle as Handle<MetadataKind, { code: string }>)
  }

  return {
    objects: input.objects,
    byKind,
    serialize() {
      const payload: Record<string, unknown[]> = {}
      const hoistedOptions: Record<string, unknown>[] = []
      for (const kind of Object.keys(byKind) as MetadataKind[]) {
        const items = byKind[kind]
        if (items.length === 0) continue
        if (kind === 'OptionSet') {
          payload[PAYLOAD_KEY[kind]] = items.map((h) => {
            const { optionSet, options } = splitOptionSet(h.code, toPayload(h.input))
            hoistedOptions.push(...options)
            return optionSet
          })
        } else {
          payload[PAYLOAD_KEY[kind]] = items.map((h) =>
            withTopLevelId(h.kind, h.code, toPayload(h.input)),
          )
        }
      }
      if (hoistedOptions.length > 0) payload[PAYLOAD_KEY.Option] = hoistedOptions
      return payload
    },
  }
}
