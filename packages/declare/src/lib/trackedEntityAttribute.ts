import { z } from 'zod'
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

export const TrackedEntityAttributeSchema = z.object({
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
  sharing: SharingSchema.optional(),
})

export type TrackedEntityAttributeInput = z.infer<typeof TrackedEntityAttributeSchema>
export type TrackedEntityAttribute = Handle<
  'TrackedEntityAttribute',
  TrackedEntityAttributeInput & { shortName: string }
>

export function defineTrackedEntityAttribute(
  input: z.input<typeof TrackedEntityAttributeSchema>,
): TrackedEntityAttribute {
  const parsed = TrackedEntityAttributeSchema.parse(input)
  return makeHandle('TrackedEntityAttribute', withDerivedShortName(parsed))
}
