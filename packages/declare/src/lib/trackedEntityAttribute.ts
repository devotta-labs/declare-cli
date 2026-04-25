import { z } from 'zod'
import { TrackedEntityAttributeBaseByTarget } from '../generated/trackedEntityAttribute.ts'
import { AggregationTypeByTarget } from '../generated/enums.ts'
import { getTarget, type Target } from '../generated/runtime.ts'
import type { CurrentTarget } from './currentTarget.ts'
import {
  CodeSchema,
  DescriptionSchema,
  NameSchema,
  ShortNameSchema,
  makeHandle,
  optionSetValueTypeMessage,
  optionSetValueTypeRefine,
  refSchema,
  withDerivedShortName,
  type Handle,
} from './core.ts'
import { SharingSchema } from './sharing.ts'

// Defaults use per-target enums so removed constants stay rejected.
const overridesFor = (target: Target) => ({
  code: CodeSchema,
  name: NameSchema,
  shortName: ShortNameSchema.optional(),
  formName: z.string().max(230).optional(),
  description: DescriptionSchema.optional(),
  // Required by metadata import even though the DHIS2 UI hides it.
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
  trigramIndexable: z.boolean().default(false),
  sharing: SharingSchema.optional(),
})

const SCHEMAS = {
  '2.40': TrackedEntityAttributeBaseByTarget['2.40']
    .extend(overridesFor('2.40'))
    .refine(optionSetValueTypeRefine, optionSetValueTypeMessage),
  '2.41': TrackedEntityAttributeBaseByTarget['2.41']
    .extend(overridesFor('2.41'))
    .refine(optionSetValueTypeRefine, optionSetValueTypeMessage),
  '2.42': TrackedEntityAttributeBaseByTarget['2.42']
    .extend(overridesFor('2.42'))
    .refine(optionSetValueTypeRefine, optionSetValueTypeMessage),
} as const

export type TrackedEntityAttributeInput = z.input<(typeof SCHEMAS)[CurrentTarget]>
export type TrackedEntityAttribute = Handle<
  'TrackedEntityAttribute',
  z.output<(typeof SCHEMAS)[CurrentTarget]> & { shortName: string }
>

export function defineTrackedEntityAttribute(
  input: TrackedEntityAttributeInput,
): TrackedEntityAttribute {
  const parsed = SCHEMAS[getTarget()].parse(input) as z.output<(typeof SCHEMAS)[CurrentTarget]>
  return makeHandle('TrackedEntityAttribute', withDerivedShortName(parsed))
}
