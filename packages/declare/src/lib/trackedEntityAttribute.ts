import { z } from 'zod'
import { TrackedEntityAttributeBaseByTarget } from '../generated/trackedEntityAttribute.ts'
import { getTarget } from '../generated/runtime.ts'
import {
  AggregationType,
  CodeSchema,
  DescriptionSchema,
  NameSchema,
  ShortNameSchema,
  ValueType,
  makeHandle,
  refSchema,
  withDerivedShortName,
  type Handle,
} from './core.ts'
import { SharingSchema } from './sharing.ts'

const overrides = {
  code: CodeSchema,
  name: NameSchema,
  shortName: ShortNameSchema.optional(),
  formName: z.string().max(230).optional(),
  description: DescriptionSchema.optional(),
  valueType: ValueType,
  // Non-null column server-side — import 409s without a value, even though the
  // DHIS2 UI hides the field. Default NONE since TEAs are rarely aggregated.
  aggregationType: AggregationType.default('NONE'),
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
}

const SCHEMAS = {
  '2.40': TrackedEntityAttributeBaseByTarget['2.40'].extend(overrides),
  '2.41': TrackedEntityAttributeBaseByTarget['2.41'].extend(overrides),
  '2.42': TrackedEntityAttributeBaseByTarget['2.42'].extend(overrides),
} as const

export type TrackedEntityAttributeInput = z.input<(typeof SCHEMAS)['2.42']>
export type TrackedEntityAttribute = Handle<
  'TrackedEntityAttribute',
  z.output<(typeof SCHEMAS)['2.42']> & { shortName: string }
>

export function defineTrackedEntityAttribute(
  input: TrackedEntityAttributeInput,
): TrackedEntityAttribute {
  const parsed = SCHEMAS[getTarget()].parse(input) as z.output<(typeof SCHEMAS)['2.42']>
  return makeHandle('TrackedEntityAttribute', withDerivedShortName(parsed))
}
