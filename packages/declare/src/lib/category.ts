import { z } from 'zod'
import { CategoryBaseByTarget } from '../generated/category.ts'
import { DataDimensionType } from '../generated/enums.ts'
import { getTarget } from '../generated/runtime.ts'
import {
  CodeSchema,
  NameSchema,
  ShortNameSchema,
  makeHandle,
  refSchema,
  withDerivedShortName,
  type Handle,
} from './core.ts'
import { SharingSchema } from './sharing.ts'

export { DataDimensionType }

const overrides = {
  code: CodeSchema,
  name: NameSchema,
  shortName: ShortNameSchema.optional(),
  dataDimensionType: DataDimensionType.default('DISAGGREGATION'),
  // Server-computed boolean reflecting dataDimensionType — authors don't set it.
  dataDimension: z.boolean().default(true),
  categoryOptions: z
    .array(refSchema('CategoryOption'))
    .min(1, 'a Category needs at least one CategoryOption'),
  sharing: SharingSchema.optional(),
}

const SCHEMAS = {
  '2.40': CategoryBaseByTarget['2.40'].extend(overrides),
  '2.41': CategoryBaseByTarget['2.41'].extend(overrides),
  '2.42': CategoryBaseByTarget['2.42'].extend(overrides),
} as const

export type CategoryInput = z.input<(typeof SCHEMAS)['2.42']>
export type Category = Handle<
  'Category',
  z.output<(typeof SCHEMAS)['2.42']> & { shortName: string }
>

export function defineCategory(input: CategoryInput): Category {
  const parsed = SCHEMAS[getTarget()].parse(input) as z.output<(typeof SCHEMAS)['2.42']>
  return makeHandle('Category', withDerivedShortName(parsed))
}
