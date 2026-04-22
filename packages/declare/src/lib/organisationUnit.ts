import { z } from 'zod'
import {
  CodeSchema,
  DescriptionSchema,
  NameSchema,
  ShortNameSchema,
  makeHandle,
  refSchema,
  withDerivedShortName,
  type Handle,
} from './core.ts'

const DateSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'expected a YYYY-MM-DD date')

export const OrganisationUnitSchema = z.object({
  code: CodeSchema,
  name: NameSchema,
  shortName: ShortNameSchema.optional(),
  description: DescriptionSchema.optional(),
  openingDate: DateSchema,
  closedDate: DateSchema.optional(),
  parent: refSchema('OrganisationUnit').optional(),
  comment: z.string().max(2000).optional(),
  url: z.string().url().optional(),
  contactPerson: z.string().max(255).optional(),
  address: z.string().max(255).optional(),
  email: z.string().email().optional(),
  phoneNumber: z.string().max(150).optional(),
})

export type OrganisationUnitInput = z.infer<typeof OrganisationUnitSchema>
export type OrganisationUnit = Handle<
  'OrganisationUnit',
  OrganisationUnitInput & { shortName: string }
>

export function defineOrganisationUnit(
  input: z.input<typeof OrganisationUnitSchema>,
): OrganisationUnit {
  const parsed = OrganisationUnitSchema.parse(input)
  return makeHandle('OrganisationUnit', withDerivedShortName(parsed))
}
