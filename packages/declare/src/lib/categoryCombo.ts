import { z } from 'zod'
import { CategoryComboBaseByTarget } from '../generated/categoryCombo.ts'
import { DataDimensionTypeByTarget } from '../generated/enums.ts'
import { getTarget, type Target } from '../generated/runtime.ts'
import type { CurrentTarget } from './currentTarget.ts'
import {
  CodeSchema,
  DescriptionSchema,
  NameSchema,
  makeHandle,
  refSchema,
  type Handle,
} from './core.ts'
import { SharingSchema } from './sharing.ts'

const overridesFor = (target: Target) => ({
  code: CodeSchema,
  name: NameSchema,
  description: DescriptionSchema.optional(),
  dataDimensionType: DataDimensionTypeByTarget[target].default('DISAGGREGATION'),
  categories: z.array(refSchema('Category')).min(1, 'a CategoryCombo needs at least one Category'),
  skipTotal: z.boolean().default(false),
  sharing: SharingSchema.optional(),
})

const SCHEMAS = {
  '2.40': CategoryComboBaseByTarget['2.40'].extend(overridesFor('2.40')),
  '2.41': CategoryComboBaseByTarget['2.41'].extend(overridesFor('2.41')),
  '2.42': CategoryComboBaseByTarget['2.42'].extend(overridesFor('2.42')),
} as const

export type CategoryComboInput = z.input<(typeof SCHEMAS)[CurrentTarget]>
export type CategoryCombo = Handle<'CategoryCombo', z.output<(typeof SCHEMAS)[CurrentTarget]>>

export function defineCategoryCombo(input: CategoryComboInput): CategoryCombo {
  const parsed = SCHEMAS[getTarget()].parse(input) as z.output<(typeof SCHEMAS)[CurrentTarget]>
  return makeHandle('CategoryCombo', parsed)
}
