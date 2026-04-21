import { isHandle, type Handle, type MetadataKind } from './core.ts'
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

function toPayload(value: unknown): unknown {
  if (isHandle(value)) {
    return { code: value.code }
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
      for (const kind of Object.keys(byKind) as MetadataKind[]) {
        const items = byKind[kind]
        if (items.length === 0) continue
        payload[PAYLOAD_KEY[kind]] = items.map((h) => toPayload(h.input))
      }
      return payload
    },
  }
}
