import { z } from 'zod'
import {
  CodeSchema,
  DescriptionSchema,
  NameSchema,
  makeHandle,
  type Handle,
} from './core.ts'

// DHIS2 UserRole#authorities is a `Set<String>`; any server-known or custom
// authority value is accepted. We don't restrict to a Zod enum so app-module
// authorities (e.g. `M_dhis-web-dataentry`) or custom ones keep working — see
// `authorities.ts` for a curated list of core ones.
export const UserRoleSchema = z.object({
  code: CodeSchema,
  name: NameSchema,
  description: DescriptionSchema.optional(),
  authorities: z.array(z.string().min(1)).default([]),
  restrictions: z.array(z.string().min(1)).optional(),
})

export type UserRoleInput = z.infer<typeof UserRoleSchema>
export type UserRole = Handle<'UserRole', UserRoleInput>

export function defineUserRole(input: z.input<typeof UserRoleSchema>): UserRole {
  const parsed = UserRoleSchema.parse(input)
  return makeHandle('UserRole', parsed)
}
