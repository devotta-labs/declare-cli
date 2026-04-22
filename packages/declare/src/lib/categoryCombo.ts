import { z } from 'zod'
import { CategoryComboBaseByTarget } from '../generated/categoryCombo.ts'
import { DataDimensionType } from '../generated/enums.ts'
import { getTarget } from '../generated/runtime.ts'
import {
  CodeSchema,
  DescriptionSchema,
  NameSchema,
  makeHandle,
  refSchema,
  type Handle,
} from './core.ts'
import { SharingSchema } from './sharing.ts'

const overrides = {
  code: CodeSchema,
  name: NameSchema,
  description: DescriptionSchema.optional(),
  dataDimensionType: DataDimensionType.default('DISAGGREGATION'),
  categories: z.array(refSchema('Category')).min(1, 'a CategoryCombo needs at least one Category'),
  skipTotal: z.boolean().default(false),
  sharing: SharingSchema.optional(),
}

const SCHEMAS = {
  '2.40': CategoryComboBaseByTarget['2.40'].extend(overrides),
  '2.41': CategoryComboBaseByTarget['2.41'].extend(overrides),
  '2.42': CategoryComboBaseByTarget['2.42'].extend(overrides),
} as const

export type CategoryComboInput = z.input<(typeof SCHEMAS)['2.42']>
export type CategoryCombo = Handle<'CategoryCombo', z.output<(typeof SCHEMAS)['2.42']>>

export function defineCategoryCombo(input: CategoryComboInput): CategoryCombo {
  const parsed = SCHEMAS[getTarget()].parse(input) as z.output<(typeof SCHEMAS)['2.42']>
  return makeHandle('CategoryCombo', parsed)
}
