import { z } from 'zod'
import { CodeSchema, makeHandle, refSchema, type Handle } from './core.ts'

// DHIS2 usernames: `ValidationUtils.usernameIsValid` (server-side). Practically
// 4-255 chars of the usual letters/digits/._@- set. We mirror the same shape
// but keep the regex pragmatic — the server enforces the canonical rule.
const UsernameSchema = z
  .string()
  .min(4, 'username must be at least 4 characters')
  .max(255, 'username must be at most 255 characters')
  .regex(/^[\w.@-]+$/, 'username may only contain letters, digits, underscore, dot, @ and -')

// DHIS2's password strength rules (digit + uppercase + special char + min
// length) are enforced by the user REST controller, **not** by the metadata
// bundle import path — and we additionally import with `skipValidation=true`.
// We still require a non-trivial password locally to catch typos early.
const PasswordSchema = z
  .string()
  .min(8, 'password must be at least 8 characters')
  .max(60, 'password must be at most 60 characters')

export const UserSchema = z.object({
  code: CodeSchema,
  username: UsernameSchema,
  password: PasswordSchema,
  firstName: z.string().min(1).max(160),
  surname: z.string().min(1).max(160),
  email: z.string().email().max(255).optional(),
  phoneNumber: z.string().max(150).optional(),
  // DHIS2 rejects users without at least one role (E4055).
  userRoles: z
    .array(refSchema('UserRole'))
    .min(1, 'a User needs at least one UserRole'),
  // Data-capture OUs. Assigning a root gives access to the whole subtree.
  organisationUnits: z
    .array(refSchema('OrganisationUnit'))
    .min(1, 'a User needs at least one data-capture OU'),
  // Analytics OUs; defaults to the same set as `organisationUnits` when omitted
  // at serialization time.
  dataViewOrganisationUnits: z.array(refSchema('OrganisationUnit')).optional(),
  // Tracker-specific OU set. Optional for aggregate-only demos.
  teiSearchOrganisationUnits: z.array(refSchema('OrganisationUnit')).optional(),
})

export type UserInput = z.infer<typeof UserSchema>
export type User = Handle<'User', UserInput>

export function defineUser(input: z.input<typeof UserSchema>): User {
  const parsed = UserSchema.parse(input)
  return makeHandle('User', parsed)
}
