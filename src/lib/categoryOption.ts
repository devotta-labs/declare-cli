import { z } from 'zod'
import { CodeSchema, NameSchema, ShortNameSchema, makeHandle, type Handle } from './core.ts'

export const CategoryOptionSchema = z.object({
  code: CodeSchema,
  name: NameSchema,
  shortName: ShortNameSchema.optional(),
})

export type CategoryOptionInput = z.infer<typeof CategoryOptionSchema>
export type CategoryOption = Handle<'CategoryOption', CategoryOptionInput>

export function defineCategoryOption(input: CategoryOptionInput): CategoryOption {
  const parsed = CategoryOptionSchema.parse(input)
  return makeHandle('CategoryOption', parsed)
}
