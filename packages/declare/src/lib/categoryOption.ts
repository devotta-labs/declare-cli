import { z } from 'zod'
import { CategoryOptionBaseByTarget } from '../generated/categoryOption.ts'
import { getTarget } from '../generated/runtime.ts'
import type { CurrentTarget } from './currentTarget.ts'
import {
  CodeSchema,
  DescriptionSchema,
  NameSchema,
  ShortNameSchema,
  makeHandle,
  withDerivedShortName,
  type Handle,
} from './core.ts'
import { SharingSchema } from './sharing.ts'

const DateSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'expected a YYYY-MM-DD date')

const overrides = {
  code: CodeSchema,
  name: NameSchema,
  shortName: ShortNameSchema.optional(),
  formName: z.string().max(230).optional(),
  description: DescriptionSchema.optional(),
  startDate: DateSchema.optional(),
  endDate: DateSchema.optional(),
  sharing: SharingSchema.optional(),
}

const SCHEMAS = {
  '2.40': CategoryOptionBaseByTarget['2.40'].extend(overrides),
  '2.41': CategoryOptionBaseByTarget['2.41'].extend(overrides),
  '2.42': CategoryOptionBaseByTarget['2.42'].extend(overrides),
} as const

export type CategoryOptionInput = z.input<(typeof SCHEMAS)[CurrentTarget]>
export type CategoryOption = Handle<
  'CategoryOption',
  z.output<(typeof SCHEMAS)[CurrentTarget]> & { shortName: string }
>

export function defineCategoryOption(input: CategoryOptionInput): CategoryOption {
  const parsed = SCHEMAS[getTarget()].parse(input) as z.output<(typeof SCHEMAS)[CurrentTarget]>
  return makeHandle('CategoryOption', withDerivedShortName(parsed))
}
