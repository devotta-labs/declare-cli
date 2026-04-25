import { z } from 'zod'
import { UserGroupBaseByTarget } from '../generated/userGroup.ts'
import { getTarget } from '../generated/runtime.ts'
import type { CurrentTarget } from './currentTarget.ts'
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
const overrides = {
  code: CodeSchema,
  name: NameSchema,
  description: DescriptionSchema.optional(),
  users: z.array(refSchema('User')).optional(),
}

const SCHEMAS = {
  '2.40': UserGroupBaseByTarget['2.40'].extend(overrides),
  '2.41': UserGroupBaseByTarget['2.41'].extend(overrides),
  '2.42': UserGroupBaseByTarget['2.42'].extend(overrides),
} as const

export type UserGroupInput = z.input<(typeof SCHEMAS)[CurrentTarget]>
export type UserGroup = Handle<'UserGroup', z.output<(typeof SCHEMAS)[CurrentTarget]>>

export function defineUserGroup(input: UserGroupInput): UserGroup {
  const parsed = SCHEMAS[getTarget()].parse(input) as z.output<(typeof SCHEMAS)[CurrentTarget]>
  return makeHandle('UserGroup', parsed)
}
