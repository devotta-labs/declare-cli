import { z } from 'zod'
import { TrackedEntityTypeBaseByTarget } from '../generated/trackedEntityType.ts'
import { FeatureTypeByTarget } from '../generated/enums.ts'
import { getTarget, type Target } from '../generated/runtime.ts'
import type { CurrentTarget } from './currentTarget.ts'
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

const TrackedEntityTypeAttributeSchema = z.object({
  trackedEntityAttribute: refSchema('TrackedEntityAttribute'),
  displayInList: z.boolean().default(false),
  mandatory: z.boolean().default(false),
  searchable: z.boolean().default(false),
})

const overridesFor = (target: Target) => ({
  code: CodeSchema,
  name: NameSchema,
  shortName: ShortNameSchema.optional(),
  description: DescriptionSchema.optional(),
  formName: z.string().max(230).optional(),
  featureType: FeatureTypeByTarget[target].default('NONE'),
  trackedEntityTypeAttributes: z.array(TrackedEntityTypeAttributeSchema).optional(),
  minAttributesRequiredToSearch: z.number().int().min(0).default(1),
  maxTeiCountToReturn: z.number().int().min(0).default(0),
  allowAuditLog: z.boolean().default(false),
  sharing: SharingSchema.optional(),
})

const SCHEMAS = {
  '2.40': TrackedEntityTypeBaseByTarget['2.40'].extend(overridesFor('2.40')),
  '2.41': TrackedEntityTypeBaseByTarget['2.41'].extend(overridesFor('2.41')),
  '2.42': TrackedEntityTypeBaseByTarget['2.42'].extend(overridesFor('2.42')),
} as const

export type TrackedEntityTypeInput = z.input<(typeof SCHEMAS)[CurrentTarget]>
export type TrackedEntityType = Handle<
  'TrackedEntityType',
  z.output<(typeof SCHEMAS)[CurrentTarget]> & { shortName: string }
>

export function defineTrackedEntityType(input: TrackedEntityTypeInput): TrackedEntityType {
  const parsed = SCHEMAS[getTarget()].parse(input) as z.output<(typeof SCHEMAS)[CurrentTarget]>
  return makeHandle('TrackedEntityType', withDerivedShortName(parsed))
}
