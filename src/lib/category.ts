import { z } from 'zod'
import {
  CodeSchema,
  NameSchema,
  ShortNameSchema,
  makeHandle,
  refSchema,
  withDerivedShortName,
  type Handle,
} from './core.ts'

export const DataDimensionType = z.enum(['DISAGGREGATION', 'ATTRIBUTE'])

export const CategorySchema = z.object({
  code: CodeSchema,
  name: NameSchema,
  shortName: ShortNameSchema.optional(),
  dataDimensionType: DataDimensionType.default('DISAGGREGATION'),
  categoryOptions: z
    .array(refSchema('CategoryOption'))
    .min(1, 'a Category needs at least one CategoryOption'),
})

export type CategoryInput = z.infer<typeof CategorySchema>
export type Category = Handle<'Category', CategoryInput & { shortName: string }>

export function defineCategory(input: z.input<typeof CategorySchema>): Category {
  const parsed = CategorySchema.parse(input)
  return makeHandle('Category', withDerivedShortName(parsed))
}
