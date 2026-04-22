import { z } from 'zod'
import { ProgramStageBaseByTarget } from '../generated/programStage.ts'
import { ValidationStrategy } from '../generated/enums.ts'
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

export { ValidationStrategy }

const ProgramStageDataElementSchema = z.object({
  dataElement: refSchema('DataElement'),
  compulsory: z.boolean().default(false),
  allowProvidedElsewhere: z.boolean().default(false),
  allowFutureDate: z.boolean().default(false),
  displayInReports: z.boolean().default(false),
  skipSynchronization: z.boolean().default(false),
  skipAnalytics: z.boolean().default(false),
  sortOrder: z.number().int().min(0).optional(),
})

const overrides = {
  code: CodeSchema,
  name: NameSchema,
  shortName: ShortNameSchema.optional(),
  formName: z.string().max(230).optional(),
  description: DescriptionSchema.optional(),
  sortOrder: z.number().int().min(0).default(1),
  minDaysFromStart: z.number().int().min(0).default(0),
  standardInterval: z.number().int().min(0).optional(),
  repeatable: z.boolean().default(false),
  autoGenerateEvent: z.boolean().default(true),
  validationStrategy: ValidationStrategy.default('ON_COMPLETE'),
  featureType: FeatureType.default('NONE'),
  blockEntryForm: z.boolean().default(false),
  preGenerateUID: z.boolean().default(false),
  remindCompleted: z.boolean().default(false),
  generatedByEnrollmentDate: z.boolean().default(false),
  allowGenerateNextVisit: z.boolean().default(false),
  openAfterEnrollment: z.boolean().default(false),
  hideDueDate: z.boolean().default(false),
  displayGenerateEventBox: z.boolean().default(true),
  enableUserAssignment: z.boolean().default(false),
  referral: z.boolean().default(false),
  executionDateLabel: z.string().max(230).optional(),
  dueDateLabel: z.string().max(230).optional(),
  programStageDataElements: z.array(ProgramStageDataElementSchema).optional(),
  sharing: SharingSchema.optional(),
}

const SCHEMAS = {
  '2.40': ProgramStageBaseByTarget['2.40'].extend(overrides),
  '2.41': ProgramStageBaseByTarget['2.41'].extend(overrides),
  '2.42': ProgramStageBaseByTarget['2.42'].extend(overrides),
} as const

export type ProgramStageInput = z.input<(typeof SCHEMAS)['2.42']>
export type ProgramStage = Handle<
  'ProgramStage',
  z.output<(typeof SCHEMAS)['2.42']> & { shortName: string }
>

export function defineProgramStage(input: ProgramStageInput): ProgramStage {
  const parsed = SCHEMAS[getTarget()].parse(input) as z.output<(typeof SCHEMAS)['2.42']>
  return makeHandle('ProgramStage', withDerivedShortName(parsed))
}
