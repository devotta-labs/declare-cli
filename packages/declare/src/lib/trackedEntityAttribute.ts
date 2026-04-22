import { z } from 'zod'
import { TrackedEntityAttributeBaseByTarget } from '../generated/trackedEntityAttribute.ts'
import { AggregationTypeByTarget } from '../generated/enums.ts'
import { getTarget, type Target } from '../generated/runtime.ts'
import {
  CodeSchema,
  DescriptionSchema,
  NameSchema,
  ShortNameSchema,
  makeHandle,
  refSchema,
  withDerivedShortName,
  type Handle,
} from './core.ts'
import { SharingSchema } from './sharing.ts'

// Re-declaring `valueType` here with the unversioned `ValueType` enum silently
// re-admits values that the target-specific base rejects (e.g. TRACKER_ASSOCIATE
// was removed in 2.42). Defaults/modifiers on CONSTANT fields therefore pull
// from `<Enum>ByTarget[target]` instead of the union.
const overridesFor = (target: Target) => ({
  code: CodeSchema,
  name: NameSchema,
  shortName: ShortNameSchema.optional(),
  formName: z.string().max(230).optional(),
  description: DescriptionSchema.optional(),
  // Non-null column server-side — import 409s without a value, even though the
  // DHIS2 UI hides the field. Default NONE since TEAs are rarely aggregated.
  aggregationType: AggregationTypeByTarget[target].default('NONE'),
  optionSet: refSchema('OptionSet').optional(),
  unique: z.boolean().default(false),
  inherit: z.boolean().default(false),
  confidential: z.boolean().default(false),
  generated: z.boolean().default(false),
  pattern: z.string().max(255).optional(),
  fieldMask: z.string().max(255).optional(),
  orgunitScope: z.boolean().default(false),
  displayInListNoProgram: z.boolean().default(false),
  sortOrderInListNoProgram: z.number().int().min(0).optional(),
  skipSynchronization: z.boolean().default(false),
  // New in 2.42 — server-defaulted, authors don't set this directly.
  trigramIndexable: z.boolean().default(false),
  sharing: SharingSchema.optional(),
})

const SCHEMAS = {
  '2.40': TrackedEntityAttributeBaseByTarget['2.40'].extend(overridesFor('2.40')),
  '2.41': TrackedEntityAttributeBaseByTarget['2.41'].extend(overridesFor('2.41')),
  '2.42': TrackedEntityAttributeBaseByTarget['2.42'].extend(overridesFor('2.42')),
} as const

// Input/output types span every supported target so authoring works regardless
// of which target is configured (TS can't see runtime target). The runtime
// parse via `SCHEMAS[getTarget()]` is what enforces per-target correctness.
export type TrackedEntityAttributeInput = {
  [T in Target]: z.input<(typeof SCHEMAS)[T]>
}[Target]
export type TrackedEntityAttribute = Handle<
  'TrackedEntityAttribute',
  { [T in Target]: z.output<(typeof SCHEMAS)[T]> }[Target] & { shortName: string }
>

export function defineTrackedEntityAttribute(
  input: TrackedEntityAttributeInput,
): TrackedEntityAttribute {
  const parsed = SCHEMAS[getTarget()].parse(input) as { [T in Target]: z.output<(typeof SCHEMAS)[T]> }[Target]
  return makeHandle('TrackedEntityAttribute', withDerivedShortName(parsed))
}
