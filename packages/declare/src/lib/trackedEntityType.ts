import { z } from 'zod'
import {
  CodeSchema,
  DescriptionSchema,
  FeatureType,
  NameSchema,
  ShortNameSchema,
  makeHandle,
  refSchema,
  withDerivedShortName,
  type Handle,
} from './core.ts'
import { SharingSchema } from './sharing.ts'

const TrackedEntityTypeAttributeSchema = z.object({
  trackedEntityAttribute: refSchema('TrackedEntityAttribute'),
  displayInList: z.boolean().default(false),
  mandatory: z.boolean().default(false),
  searchable: z.boolean().default(false),
})

export const TrackedEntityTypeSchema = z.object({
  code: CodeSchema,
  name: NameSchema,
  shortName: ShortNameSchema.optional(),
  description: DescriptionSchema.optional(),
  formName: z.string().max(230).optional(),
  featureType: FeatureType.default('NONE'),
  trackedEntityTypeAttributes: z.array(TrackedEntityTypeAttributeSchema).optional(),
  minAttributesRequiredToSearch: z.number().int().min(0).default(1),
  maxTeiCountToReturn: z.number().int().min(0).default(0),
  allowAuditLog: z.boolean().default(false),
  sharing: SharingSchema.optional(),
})

export type TrackedEntityTypeInput = z.infer<typeof TrackedEntityTypeSchema>
export type TrackedEntityType = Handle<
  'TrackedEntityType',
  TrackedEntityTypeInput & { shortName: string }
>

export function defineTrackedEntityType(
  input: z.input<typeof TrackedEntityTypeSchema>,
): TrackedEntityType {
  const parsed = TrackedEntityTypeSchema.parse(input)
  return makeHandle('TrackedEntityType', withDerivedShortName(parsed))
}
