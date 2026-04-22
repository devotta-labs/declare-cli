import { z } from 'zod'
import {
  CodeSchema,
  DescriptionSchema,
  NameSchema,
  makeHandle,
  type Handle,
} from './core.ts'

// Authorities are free-form strings — any server-known or custom value is valid
// (app-module authorities like `M_dhis-web-dataentry`, custom app authorities).
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
