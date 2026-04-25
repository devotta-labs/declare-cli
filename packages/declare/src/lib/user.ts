import { z } from 'zod'
import { UserBaseByTarget } from '../generated/user.ts'
import { getTarget } from '../generated/runtime.ts'
import type { CurrentTarget } from './currentTarget.ts'
import { CodeSchema, makeHandle, refSchema, type Handle } from './core.ts'

const UsernameSchema = z
  .string()
  .min(4, 'username must be at least 4 characters')
  .max(255, 'username must be at most 255 characters')
  .regex(/^[\w.@-]+$/, 'username may only contain letters, digits, underscore, dot, @ and -')

// DHIS2 password strength rules are enforced by the REST controller, not the
// metadata import path — local minimum just to catch typos.
const PasswordSchema = z
  .string()
  .min(8, 'password must be at least 8 characters')
  .max(60, 'password must be at most 60 characters')

const overrides = {
  code: CodeSchema,
  username: UsernameSchema,
  password: PasswordSchema,
  firstName: z.string().min(1).max(160),
  surname: z.string().min(1).max(160),
  email: z.string().email().max(255).optional(),
  phoneNumber: z.string().max(150).optional(),
  userRoles: z
    .array(refSchema('UserRole'))
    .min(1, 'a User needs at least one UserRole'),
  organisationUnits: z
    .array(refSchema('OrganisationUnit'))
    .min(1, 'a User needs at least one data-capture OU'),
  dataViewOrganisationUnits: z.array(refSchema('OrganisationUnit')).optional(),
  teiSearchOrganisationUnits: z.array(refSchema('OrganisationUnit')).optional(),
}

const SCHEMAS = {
  '2.40': UserBaseByTarget['2.40'].extend(overrides),
  '2.41': UserBaseByTarget['2.41'].extend(overrides),
  '2.42': UserBaseByTarget['2.42'].extend(overrides),
} as const

export type UserInput = z.input<(typeof SCHEMAS)[CurrentTarget]>
export type User = Handle<'User', z.output<(typeof SCHEMAS)[CurrentTarget]>>

export function defineUser(input: UserInput): User {
  const parsed = SCHEMAS[getTarget()].parse(input) as z.output<(typeof SCHEMAS)[CurrentTarget]>
  return makeHandle('User', parsed)
}
