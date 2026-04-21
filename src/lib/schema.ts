import { isHandle, stableUid, type Handle, type MetadataKind } from './core.ts'
import { toSharingPayload, type SharingInput } from './sharing.ts'
import type { Category } from './category.ts'
import type { CategoryOption } from './categoryOption.ts'
import type { CategoryCombo } from './categoryCombo.ts'
import type { OptionSet } from './optionSet.ts'
import type { DataElement } from './dataElement.ts'
import type { DataSet } from './dataSet.ts'
import type { OrganisationUnit } from './organisationUnit.ts'
import type { OrganisationUnitLevel } from './organisationUnitLevel.ts'
import type { UserRole } from './userRole.ts'
import type { UserGroup } from './userGroup.ts'
import type { User } from './user.ts'

export type AnyHandle =
  | Category
  | CategoryOption
  | CategoryCombo
  | OptionSet
  | DataElement
  | DataSet
  | OrganisationUnit
  | OrganisationUnitLevel
  | UserRole
  | UserGroup
  | User

// Grouped input — one readonly array per metadata kind. Every field is
// optional so you only declare the sections you use.
export type SchemaInput = {
  categoryOptions?: readonly CategoryOption[]
  categories?: readonly Category[]
  categoryCombos?: readonly CategoryCombo[]
  optionSets?: readonly OptionSet[]
  dataElements?: readonly DataElement[]
  dataSets?: readonly DataSet[]
  organisationUnits?: readonly OrganisationUnit[]
  organisationUnitLevels?: readonly OrganisationUnitLevel[]
  userRoles?: readonly UserRole[]
  userGroups?: readonly UserGroup[]
  users?: readonly User[]
}

export type Schema = {
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
  OrganisationUnit: 'organisationUnits',
  OrganisationUnitLevel: 'organisationUnitLevels',
  UserRole: 'userRoles',
  UserGroup: 'userGroups',
  User: 'users',
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
  const optionRefs: { id: string; code: string }[] = []
  const optionBodies: Record<string, unknown>[] = []

  // With importStrategy=identifier=CODE, DHIS2 resolves same-bundle refs by
  // `code`, not `id`. Every ref must carry both — matching what toPayload does
  // for handles — otherwise the option↔optionSet collection is never wired up
  // and the dropdown renders empty on the server.
  for (const opt of rawOptions) {
    if (!opt || typeof opt !== 'object') continue
    const optCode = typeof opt.code === 'string' ? opt.code : ''
    const optionId = stableUid(`Option:${code}:${optCode}`)
    optionRefs.push({ id: optionId, code: optCode })
    optionBodies.push({
      ...opt,
      id: optionId,
      optionSet: { id: optionSetId, code },
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
    OrganisationUnit: [],
    OrganisationUnitLevel: [],
    UserRole: [],
    UserGroup: [],
    User: [],
  }

  const groups: readonly (readonly AnyHandle[] | undefined)[] = [
    input.categoryOptions,
    input.categories,
    input.categoryCombos,
    input.optionSets,
    input.dataElements,
    input.dataSets,
    input.organisationUnits,
    input.organisationUnitLevels,
    input.userRoles,
    input.userGroups,
    input.users,
  ]

  const seen = new Set<string>()
  for (const group of groups) {
    if (!group) continue
    for (const handle of group) {
      const key = `${handle.kind}:${handle.code}`
      if (seen.has(key)) {
        throw new Error(`Duplicate ${handle.kind} with code '${handle.code}' in schema.`)
      }
      seen.add(key)
      byKind[handle.kind].push(handle as Handle<MetadataKind, { code: string }>)
    }
  }

  return {
    byKind,
    serialize() {
      const payload: Record<string, unknown[]> = {}
      const hoistedOptions: Record<string, unknown>[] = []
      for (const kind of Object.keys(byKind) as MetadataKind[]) {
        const items = byKind[kind]
        if (items.length === 0) continue
        if (kind === 'OptionSet') {
          payload[PAYLOAD_KEY[kind]] = items.map((h) => {
            // Same sharing-extraction dance as the generic branch below —
            // pull sharing off before `toPayload` recursively converts handles
            // to refs, then re-attach a properly-serialized Sharing payload.
            const rawInput = h.input as Record<string, unknown>
            const originalSharing = rawInput.sharing as SharingInput | undefined
            const bodyWithoutSharing = { ...rawInput }
            delete bodyWithoutSharing.sharing
            const { optionSet, options } = splitOptionSet(
              h.code,
              toPayload(bodyWithoutSharing),
            )
            hoistedOptions.push(...options)
            const sharingPayload = toSharingPayload(originalSharing)
            return sharingPayload ? { ...optionSet, sharing: sharingPayload } : optionSet
          })
        } else {
          payload[PAYLOAD_KEY[kind]] = items.map((h) => {
            // Pull sharing off the original input before the recursive
            // handle → ref conversion walks into it and loses the Handle
            // brands that toSharingPayload needs.
            const rawInput = h.input as Record<string, unknown>
            const originalSharing = rawInput.sharing as SharingInput | undefined
            const bodyWithoutSharing = { ...rawInput }
            delete bodyWithoutSharing.sharing
            const converted = toPayload(bodyWithoutSharing) as Record<string, unknown>
            const withId = withTopLevelId(h.kind, h.code, converted) as Record<string, unknown>
            const sharingPayload = toSharingPayload(originalSharing)
            return sharingPayload ? { ...withId, sharing: sharingPayload } : withId
          })
        }
      }
      if (hoistedOptions.length > 0) payload[PAYLOAD_KEY.Option] = hoistedOptions
      return payload
    },
  }
}
