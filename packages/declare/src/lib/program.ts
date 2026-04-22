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

export const ProgramType = z.enum(['WITH_REGISTRATION', 'WITHOUT_REGISTRATION'])

export const ProgramAccessLevel = z.enum(['OPEN', 'AUDITED', 'PROTECTED', 'CLOSED'])

const ProgramTrackedEntityAttributeSchema = z.object({
  trackedEntityAttribute: refSchema('TrackedEntityAttribute'),
  displayInList: z.boolean().default(false),
  mandatory: z.boolean().default(false),
  searchable: z.boolean().default(false),
  allowFutureDate: z.boolean().default(false),
  sortOrder: z.number().int().min(0).optional(),
})

export const ProgramSchema = z
  .object({
    code: CodeSchema,
    name: NameSchema,
    shortName: ShortNameSchema.optional(),
    formName: z.string().max(230).optional(),
    description: DescriptionSchema.optional(),
    programType: ProgramType,
    trackedEntityType: refSchema('TrackedEntityType').optional(),
    categoryCombo: refSchema('CategoryCombo').optional(),
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
  })
  .refine(
    (v) => !(v.programType === 'WITH_REGISTRATION' && !v.trackedEntityType),
    {
      message: 'tracker programs (WITH_REGISTRATION) must declare a trackedEntityType',
      path: ['trackedEntityType'],
    },
  )

export type ProgramInput = z.infer<typeof ProgramSchema>
export type Program = Handle<'Program', ProgramInput & { shortName: string }>

export function defineProgram(input: z.input<typeof ProgramSchema>): Program {
  const parsed = ProgramSchema.parse(input)
  return makeHandle('Program', withDerivedShortName(parsed))
}
