import { z } from 'zod'
import {
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

// DHIS2 master: org.hisp.dhis.trackedentity.TrackedEntityAttribute. A TEA is
// a reusable attribute of a TrackedEntity (e.g. first name, date of birth).
// The same TEA is referenced from both TrackedEntityType.trackedEntityType-
// Attributes and Program.programTrackedEntityAttributes, so it lives as its
// own top-level metadata object.
export const TrackedEntityAttributeSchema = z.object({
  code: CodeSchema,
  name: NameSchema,
  shortName: ShortNameSchema.optional(),
  formName: z.string().max(230).optional(),
  description: DescriptionSchema.optional(),
  valueType: ValueType,
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
