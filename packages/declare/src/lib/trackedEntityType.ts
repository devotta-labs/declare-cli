import { z } from 'zod'
import { TrackedEntityTypeBaseByTarget } from '../generated/trackedEntityType.ts'
import { getTarget } from '../generated/runtime.ts'
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

const overrides = {
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
}

const SCHEMAS = {
  '2.40': TrackedEntityTypeBaseByTarget['2.40'].extend(overrides),
  '2.41': TrackedEntityTypeBaseByTarget['2.41'].extend(overrides),
  '2.42': TrackedEntityTypeBaseByTarget['2.42'].extend(overrides),
} as const

export type TrackedEntityTypeInput = z.input<(typeof SCHEMAS)['2.42']>
export type TrackedEntityType = Handle<
  'TrackedEntityType',
  z.output<(typeof SCHEMAS)['2.42']> & { shortName: string }
>

export function defineTrackedEntityType(input: TrackedEntityTypeInput): TrackedEntityType {
  const parsed = SCHEMAS[getTarget()].parse(input) as z.output<(typeof SCHEMAS)['2.42']>
  return makeHandle('TrackedEntityType', withDerivedShortName(parsed))
}
