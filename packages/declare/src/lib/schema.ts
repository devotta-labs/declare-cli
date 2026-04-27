import { isHandle, stableUid, type Handle } from './core.ts'
import {
  AUTHORING_METADATA_KINDS,
  ENTITY_DEFINITIONS,
  METADATA_KINDS,
  payloadKeyFor,
  type AuthoringMetadataKind,
  type MetadataKind,
} from './entities.ts'
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
import type { TrackedEntityAttribute } from './trackedEntityAttribute.ts'
import type { TrackedEntityType } from './trackedEntityType.ts'
import type { Program } from './program.ts'
import type { ProgramStage } from './programStage.ts'
import type {
  ProgramRule,
  ProgramRuleAction,
  ProgramRuleVariable,
  RuleTest,
} from './programRule.ts'

type HandleByKind = {
  Category: Category
  CategoryOption: CategoryOption
  CategoryCombo: CategoryCombo
  OptionSet: OptionSet
  DataElement: DataElement
  DataSet: DataSet
  OrganisationUnit: OrganisationUnit
  OrganisationUnitLevel: OrganisationUnitLevel
  UserRole: UserRole
  UserGroup: UserGroup
  User: User
  TrackedEntityAttribute: TrackedEntityAttribute
  TrackedEntityType: TrackedEntityType
  Program: Program
  ProgramStage: ProgramStage
  ProgramRuleVariable: ProgramRuleVariable
  ProgramRuleAction: ProgramRuleAction
  ProgramRule: ProgramRule
}

export type AnyHandle = HandleByKind[AuthoringMetadataKind]

export type SchemaInput = {
  [K in AuthoringMetadataKind as (typeof ENTITY_DEFINITIONS)[K]['payloadKey']]?: readonly HandleByKind[K][]
} & {
  ruleTests?: readonly RuleTest[]
}

export type Schema = {
  readonly byKind: Readonly<Record<MetadataKind, readonly Handle<MetadataKind, { code: string }>[]>>
  readonly ruleTests: readonly RuleTest[]
  serialize(): Record<string, unknown[]>
}

function emptyByKind(): Record<MetadataKind, Handle<MetadataKind, { code: string }>[]> {
  const out = {} as Record<MetadataKind, Handle<MetadataKind, { code: string }>[]>
  for (const kind of METADATA_KINDS) out[kind] = []
  return out
}

// DHIS2 master validation hooks crash on transient objects with null UIDs; supply
// a stable one derived from kind:code. For existing objects matched by code, the
// server keeps its own UID and ours is ignored.
function withTopLevelId(kind: MetadataKind, code: string, body: unknown): unknown {
  if (!body || typeof body !== 'object') return body
  return {
    id: stableUid(`${kind}:${code}`),
    ...(body as Record<string, unknown>),
  }
}

// DHIS2's importer requires Options at top-level, not nested in OptionSet.
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

  // identifier=CODE resolves same-bundle refs by code; include both id and code
  // or the option↔optionSet link never wires up.
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
    // Both id and code: code for identifier=CODE preheat; id so transient stubs
    // have a non-null UID (some master validation hooks crash otherwise).
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
  const byKind = emptyByKind()

  const derivedProgramRuleActions = (input.programRules ?? []).flatMap(
    (rule) => rule.input.programRuleActions ?? [],
  )

  const seen = new Set<string>()
  const addHandle = (handle: Handle<MetadataKind, { code: string }>) => {
    const key = `${handle.kind}:${handle.code}`
    if (seen.has(key)) {
      throw new Error(`Duplicate ${handle.kind} with code '${handle.code}' in schema.`)
    }
    seen.add(key)
    byKind[handle.kind].push(handle)
  }

  for (const kind of AUTHORING_METADATA_KINDS) {
    const group = input[payloadKeyFor(kind)] as readonly AnyHandle[] | undefined
    if (!group) continue
    for (const handle of group) {
      addHandle(handle as Handle<MetadataKind, { code: string }>)
    }
  }
  for (const action of derivedProgramRuleActions) {
    addHandle(action as Handle<MetadataKind, { code: string }>)
  }

  // DHIS2 needs a reciprocal `program` back-ref on each ProgramStage; inject it
  // at serialize time rather than making callers tie the knot.
  const stageToProgram = new Map<string, Handle<'Program', { code: string }>>()
  for (const program of byKind.Program as Handle<'Program', { code: string }>[]) {
    const programInput = program.input as {
      programStages?: readonly { code: string }[]
    }
    for (const stageRef of programInput.programStages ?? []) {
      stageToProgram.set(stageRef.code, program)
    }
  }

  const actionToRule = new Map<string, Handle<'ProgramRule', { code: string }>>()
  for (const rule of byKind.ProgramRule as Handle<'ProgramRule', { code: string }>[]) {
    const ruleInput = rule.input as {
      programRuleActions?: readonly { code: string }[]
    }
    for (const actionRef of ruleInput.programRuleActions ?? []) {
      actionToRule.set(actionRef.code, rule)
    }
  }

  return {
    byKind,
    ruleTests: input.ruleTests ?? [],
    serialize() {
      const payload: Record<string, unknown[]> = {}
      const hoistedOptions: Record<string, unknown>[] = []
      for (const kind of METADATA_KINDS) {
        const items = byKind[kind]
        if (items.length === 0) continue
        if (kind === 'OptionSet') {
          payload[payloadKeyFor(kind)] = items.map((h) => {
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
          payload[payloadKeyFor(kind)] = items.map((h) => {
            // Extract sharing before toPayload recurses — the handle → ref
            // conversion strips the brands toSharingPayload needs.
            const rawInput = h.input as Record<string, unknown>
            const originalSharing = rawInput.sharing as SharingInput | undefined
            const bodyWithoutSharing = { ...rawInput }
            delete bodyWithoutSharing.sharing
            const converted = toPayload(bodyWithoutSharing) as Record<string, unknown>
            const withId = withTopLevelId(h.kind, h.code, converted) as Record<string, unknown>
            if (kind === 'ProgramStage' && !('program' in withId)) {
              const owner = stageToProgram.get(h.code)
              if (owner) {
                withId.program = {
                  id: stableUid(`Program:${owner.code}`),
                  code: owner.code,
                }
              }
            }
            if (kind === 'ProgramRuleAction' && !('programRule' in withId)) {
              const owner = actionToRule.get(h.code)
              if (owner) {
                withId.programRule = {
                  id: stableUid(`ProgramRule:${owner.code}`),
                  code: owner.code,
                }
              }
            }
            const sharingPayload = toSharingPayload(originalSharing)
            return sharingPayload ? { ...withId, sharing: sharingPayload } : withId
          })
        }
      }
      if (hoistedOptions.length > 0) payload[payloadKeyFor('Option')] = hoistedOptions
      return payload
    },
  }
}
