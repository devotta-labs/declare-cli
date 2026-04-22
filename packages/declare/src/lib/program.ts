import { z } from 'zod'
import { ProgramBaseByTarget } from '../generated/program.ts'
import { ProgramAccessLevel, ProgramType } from '../generated/enums.ts'
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

export { ProgramAccessLevel, ProgramType }

const ProgramTrackedEntityAttributeSchema = z.object({
  trackedEntityAttribute: refSchema('TrackedEntityAttribute'),
  displayInList: z.boolean().default(false),
  mandatory: z.boolean().default(false),
  searchable: z.boolean().default(false),
  allowFutureDate: z.boolean().default(false),
  sortOrder: z.number().int().min(0).optional(),
})

const overrides = {
  code: CodeSchema,
  name: NameSchema,
  shortName: ShortNameSchema.optional(),
  formName: z.string().max(230).optional(),
  description: DescriptionSchema.optional(),
  programType: ProgramType,
  trackedEntityType: refSchema('TrackedEntityType').optional(),
  categoryCombo: refSchema('CategoryCombo').optional(),
  // New in 2.42 — server auto-assigns the default CategoryCombo.
  enrollmentCategoryCombo: refSchema('CategoryCombo').optional(),
  organisationUnits: z.array(refSchema('OrganisationUnit')).min(1),
  programStages: z.array(refSchema('ProgramStage')).optional(),
  programTrackedEntityAttributes: z.array(ProgramTrackedEntityAttributeSchema).optional(),
  featureType: FeatureType.optional(),
  accessLevel: ProgramAccessLevel.default('OPEN'),
  displayFrontPageList: z.boolean().default(false),
  displayIncidentDate: z.boolean().default(false),
  onlyEnrollOnce: z.boolean().default(false),
  selectEnrollmentDatesInFuture: z.boolean().default(false),
  selectIncidentDatesInFuture: z.boolean().default(false),
  useFirstStageDuringRegistration: z.boolean().default(false),
  ignoreOverdueEvents: z.boolean().default(false),
  skipOffline: z.boolean().default(false),
  expiryDays: z.number().int().min(0).default(0),
  completeEventsExpiryDays: z.number().int().min(0).default(0),
  openDaysAfterCoEndDate: z.number().int().min(0).default(0),
  minAttributesRequiredToSearch: z.number().int().min(0).default(1),
  maxTeiCountToReturn: z.number().int().min(0).default(0),
  enrollmentDateLabel: z.string().max(230).optional(),
  incidentDateLabel: z.string().max(230).optional(),
  sharing: SharingSchema.optional(),
}

const trackerRefine = (v: { programType: z.infer<typeof ProgramType>; trackedEntityType?: unknown }) =>
  !(v.programType === 'WITH_REGISTRATION' && !v.trackedEntityType)
const trackerRefineMessage = {
  message: 'tracker programs (WITH_REGISTRATION) must declare a trackedEntityType',
  path: ['trackedEntityType'],
}

const SCHEMAS = {
  '2.40': ProgramBaseByTarget['2.40'].extend(overrides).refine(trackerRefine, trackerRefineMessage),
  '2.41': ProgramBaseByTarget['2.41'].extend(overrides).refine(trackerRefine, trackerRefineMessage),
  '2.42': ProgramBaseByTarget['2.42'].extend(overrides).refine(trackerRefine, trackerRefineMessage),
} as const

export type ProgramInput = z.input<(typeof SCHEMAS)['2.42']>
export type Program = Handle<
  'Program',
  z.output<(typeof SCHEMAS)['2.42']> & { shortName: string }
>

export function defineProgram(input: ProgramInput): Program {
  const parsed = SCHEMAS[getTarget()].parse(input) as z.output<(typeof SCHEMAS)['2.42']>
  return makeHandle('Program', withDerivedShortName(parsed))
}
