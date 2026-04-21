import { z } from 'zod'
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

// ISO-8601 date (YYYY-MM-DD) — DHIS2 accepts this for @Temporal(DATE) fields.
const DateSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'expected a YYYY-MM-DD date')

export const CategoryOptionSchema = z.object({
  code: CodeSchema,
  name: NameSchema,
  shortName: ShortNameSchema.optional(),
  formName: z.string().max(230).optional(),
  description: DescriptionSchema.optional(),
  startDate: DateSchema.optional(),
  endDate: DateSchema.optional(),
  // CategoryOption sharing controls per-disaggregation data capture: a user
  // with metadata read but no data access can see the column but not submit
  // a value into it (see DataApprovalService#hasAccess and friends).
  sharing: SharingSchema.optional(),
})

export type CategoryOptionInput = z.infer<typeof CategoryOptionSchema>
export type CategoryOption = Handle<'CategoryOption', CategoryOptionInput & { shortName: string }>

export function defineCategoryOption(input: z.input<typeof CategoryOptionSchema>): CategoryOption {
  const parsed = CategoryOptionSchema.parse(input)
  return makeHandle('CategoryOption', withDerivedShortName(parsed))
}
