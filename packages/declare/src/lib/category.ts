import { z } from 'zod'
import { CategoryBaseByTarget } from '../generated/category.ts'
import { DataDimensionType, DataDimensionTypeByTarget } from '../generated/enums.ts'
import { getTarget, type Target } from '../generated/runtime.ts'
import type { CurrentTarget } from './currentTarget.ts'
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

const overridesFor = (target: Target) => ({
  code: CodeSchema,
  name: NameSchema,
  shortName: ShortNameSchema.optional(),
  dataDimensionType: DataDimensionTypeByTarget[target].default('DISAGGREGATION'),
  // Server-computed boolean reflecting dataDimensionType — authors don't set it.
  dataDimension: z.boolean().default(true),
  categoryOptions: z
    .array(refSchema('CategoryOption'))
    .min(1, 'a Category needs at least one CategoryOption'),
  sharing: SharingSchema.optional(),
})

const SCHEMAS = {
  '2.40': CategoryBaseByTarget['2.40'].extend(overridesFor('2.40')),
  '2.41': CategoryBaseByTarget['2.41'].extend(overridesFor('2.41')),
  '2.42': CategoryBaseByTarget['2.42'].extend(overridesFor('2.42')),
} as const

export type CategoryInput = z.input<(typeof SCHEMAS)[CurrentTarget]>
export type Category = Handle<
  'Category',
  z.output<(typeof SCHEMAS)[CurrentTarget]> & { shortName: string }
>

export function defineCategory(input: CategoryInput): Category {
  const parsed = SCHEMAS[getTarget()].parse(input) as z.output<(typeof SCHEMAS)[CurrentTarget]>
  return makeHandle('Category', withDerivedShortName(parsed))
}
