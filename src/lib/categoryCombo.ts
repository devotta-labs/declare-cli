import { z } from 'zod'
import { CodeSchema, NameSchema, makeHandle, refSchema, type Handle } from './core.ts'
import { DataDimensionType } from './category.ts'

export const CategoryComboSchema = z.object({
  code: CodeSchema,
  name: NameSchema,
  dataDimensionType: DataDimensionType.default('DISAGGREGATION'),
  categories: z.array(refSchema('Category')).min(1, 'a CategoryCombo needs at least one Category'),
})

export type CategoryComboInput = z.infer<typeof CategoryComboSchema>
export type CategoryCombo = Handle<'CategoryCombo', CategoryComboInput>

export function defineCategoryCombo(input: z.input<typeof CategoryComboSchema>): CategoryCombo {
  const parsed = CategoryComboSchema.parse(input)
  return makeHandle('CategoryCombo', parsed)
}
