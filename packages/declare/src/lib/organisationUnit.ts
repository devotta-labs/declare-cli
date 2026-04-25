import { z } from 'zod'
import { OrganisationUnitBaseByTarget } from '../generated/organisationUnit.ts'
import { getTarget } from '../generated/runtime.ts'
import type { CurrentTarget } from './currentTarget.ts'
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

const overrides = {
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
}

const SCHEMAS = {
  '2.40': OrganisationUnitBaseByTarget['2.40'].extend(overrides),
  '2.41': OrganisationUnitBaseByTarget['2.41'].extend(overrides),
  '2.42': OrganisationUnitBaseByTarget['2.42'].extend(overrides),
} as const

export type OrganisationUnitInput = z.input<(typeof SCHEMAS)[CurrentTarget]>
export type OrganisationUnit = Handle<
  'OrganisationUnit',
  z.output<(typeof SCHEMAS)[CurrentTarget]> & { shortName: string }
>

export function defineOrganisationUnit(input: OrganisationUnitInput): OrganisationUnit {
  const parsed = SCHEMAS[getTarget()].parse(input) as z.output<(typeof SCHEMAS)[CurrentTarget]>
  return makeHandle('OrganisationUnit', withDerivedShortName(parsed))
}
