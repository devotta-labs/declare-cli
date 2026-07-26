import { z } from 'zod'
import { ProgramSectionBaseByTarget } from '../generated/programSection.ts'
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
import type { Program } from './program.ts'
import type { TrackedEntityAttribute } from './trackedEntityAttribute.ts'

const overrides = {
  code: CodeSchema,
  name: NameSchema,
  formName: z.string().max(230).optional(),
  description: DescriptionSchema.optional(),
  sortOrder: z.number().int().min(0).default(1),
  program: refSchema('Program').optional(),
  trackedEntityAttributes: z
    .array(refSchema('TrackedEntityAttribute'))
    .min(1, 'a ProgramSection needs at least one TrackedEntityAttribute'),
}

const SCHEMAS = {
  '2.40': ProgramSectionBaseByTarget['2.40'].extend(overrides),
  '2.41': ProgramSectionBaseByTarget['2.41'].extend(overrides),
  '2.42': ProgramSectionBaseByTarget['2.42'].extend(overrides),
  '2.43': ProgramSectionBaseByTarget['2.43'].extend(overrides),
} as const

type ProgramSectionOutput = Omit<
  z.output<(typeof SCHEMAS)[CurrentTarget]>,
  'program' | 'trackedEntityAttributes'
> & {
  program?: Program | undefined
  trackedEntityAttributes: TrackedEntityAttribute[]
}

export type ProgramSectionInput = z.input<(typeof SCHEMAS)[CurrentTarget]>
export type ProgramSection = Handle<'ProgramSection', ProgramSectionOutput>

export function defineProgramSection(input: ProgramSectionInput): ProgramSection {
  const parsed = SCHEMAS[getTarget()].parse(input) as z.output<
    (typeof SCHEMAS)[CurrentTarget]
  >
  return makeHandle('ProgramSection', parsed as ProgramSectionOutput)
}
