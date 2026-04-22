import { z } from 'zod'
import {
  CodeSchema,
  DescriptionSchema,
  NameSchema,
  makeHandle,
  refSchema,
  type Handle,
} from './core.ts'

// Field is `users` (not `members`) to match the wire format — anything else is
// silently dropped by /api/metadata import.
export const UserGroupSchema = z.object({
  code: CodeSchema,
  name: NameSchema,
  description: DescriptionSchema.optional(),
  users: z.array(refSchema('User')).optional(),
})

export type UserGroupInput = z.infer<typeof UserGroupSchema>
export type UserGroup = Handle<'UserGroup', UserGroupInput>

export function defineUserGroup(input: z.input<typeof UserGroupSchema>): UserGroup {
  const parsed = UserGroupSchema.parse(input)
  return makeHandle('UserGroup', parsed)
}
