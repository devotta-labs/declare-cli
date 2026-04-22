import { z } from 'zod'
import { ProgramStageBaseByTarget } from '../generated/programStage.ts'
import { FeatureTypeByTarget, ValidationStrategy, ValidationStrategyByTarget } from '../generated/enums.ts'
import { getTarget, type Target } from '../generated/runtime.ts'
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

const overridesFor = (target: Target) => ({
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
  validationStrategy: ValidationStrategyByTarget[target].default('ON_COMPLETE'),
  featureType: FeatureTypeByTarget[target].default('NONE'),
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
})

const SCHEMAS = {
  '2.40': ProgramStageBaseByTarget['2.40'].extend(overridesFor('2.40')),
  '2.41': ProgramStageBaseByTarget['2.41'].extend(overridesFor('2.41')),
  '2.42': ProgramStageBaseByTarget['2.42'].extend(overridesFor('2.42')),
} as const

// Input/output types span every supported target so authoring works regardless
// of which target is configured; runtime parse enforces the actual target.
export type ProgramStageInput = { [T in Target]: z.input<(typeof SCHEMAS)[T]> }[Target]
export type ProgramStage = Handle<
  'ProgramStage',
  { [T in Target]: z.output<(typeof SCHEMAS)[T]> }[Target] & { shortName: string }
>

export function defineProgramStage(input: ProgramStageInput): ProgramStage {
  const parsed = SCHEMAS[getTarget()].parse(input) as { [T in Target]: z.output<(typeof SCHEMAS)[T]> }[Target]
  return makeHandle('ProgramStage', withDerivedShortName(parsed))
}
