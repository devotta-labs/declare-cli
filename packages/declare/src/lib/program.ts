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

// DHIS2 master: org.hisp.dhis.program.ProgramType. `WITH_REGISTRATION` means a
// tracker program (enrols TrackedEntities); `WITHOUT_REGISTRATION` means an
// event-only program. We only cover tracker programs end-to-end right now —
// event programs parse fine but the Capture app needs a TET-less Program to be
// wired slightly differently, so leave that as a future extension.
export const ProgramType = z.enum(['WITH_REGISTRATION', 'WITHOUT_REGISTRATION'])

// DHIS2 master: org.hisp.dhis.common.AccessLevel. Governs how non-owning users
// see TEIs in the Capture app. OPEN (default) is simplest — everyone assigned
// to the program OU sees every TEI.
export const ProgramAccessLevel = z.enum(['OPEN', 'AUDITED', 'PROTECTED', 'CLOSED'])

// DHIS2 master: org.hisp.dhis.program.ProgramTrackedEntityAttribute. Embedded
// join linking a TrackedEntityAttribute to a Program with presentation and
// validation rules (mandatory, searchable, display order). Not a top-level
// metadata object — lives inline on Program.programTrackedEntityAttributes.
const ProgramTrackedEntityAttributeSchema = z.object({
  trackedEntityAttribute: refSchema('TrackedEntityAttribute'),
  displayInList: z.boolean().default(false),
  mandatory: z.boolean().default(false),
  searchable: z.boolean().default(false),
  allowFutureDate: z.boolean().default(false),
  sortOrder: z.number().int().min(0).optional(),
})

// DHIS2 master: org.hisp.dhis.program.Program. The top-level object for both
// tracker and event programs. ProgramStages are listed here by ref; the
// serializer auto-emits the reciprocal `program` back-ref on each stage so
// callers never have to deal with the circular relationship.
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
