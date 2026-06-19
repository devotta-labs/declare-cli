import { z } from 'zod'
import { ProgramStageSectionBaseByTarget } from '../generated/programStageSection.ts'
import { getTarget } from '../generated/runtime.ts'
import type { CurrentTarget } from './currentTarget.ts'
import {
  CodeSchema,
  DescriptionSchema,
  NameSchema,
  makeHandle,
  refSchema,
  type Handle,
} from './core.ts'
import type { DataElement } from './dataElement.ts'
import type { ProgramStage } from './programStage.ts'

const overrides = {
  code: CodeSchema,
  name: NameSchema,
  formName: z.string().max(230).optional(),
  description: DescriptionSchema.optional(),
  sortOrder: z.number().int().min(0).default(1),
  programStage: refSchema('ProgramStage').optional(),
  dataElements: z
    .array(refSchema('DataElement'))
    .min(1, 'a ProgramStageSection needs at least one DataElement'),
}

const SCHEMAS = {
  '2.40': ProgramStageSectionBaseByTarget['2.40'].extend(overrides),
  '2.41': ProgramStageSectionBaseByTarget['2.41'].extend(overrides),
  '2.42': ProgramStageSectionBaseByTarget['2.42'].extend(overrides),
} as const

type ProgramStageSectionOutput = Omit<
  z.output<(typeof SCHEMAS)[CurrentTarget]>,
  'programStage' | 'dataElements'
> & {
  programStage?: ProgramStage | undefined
  dataElements: DataElement[]
}

export type ProgramStageSectionInput = z.input<(typeof SCHEMAS)[CurrentTarget]>
export type ProgramStageSection = Handle<
  'ProgramStageSection',
  ProgramStageSectionOutput
>

export function defineProgramStageSection(
  input: ProgramStageSectionInput,
): ProgramStageSection {
  const parsed = SCHEMAS[getTarget()].parse(input) as z.output<
    (typeof SCHEMAS)[CurrentTarget]
  >
  return makeHandle('ProgramStageSection', parsed as ProgramStageSectionOutput)
}
