import { z } from 'zod'
import { UserRoleBaseByTarget } from '../generated/userRole.ts'
import { getTarget } from '../generated/runtime.ts'
import type { CurrentTarget } from './currentTarget.ts'
import {
  CodeSchema,
  DescriptionSchema,
  NameSchema,
  makeHandle,
  type Handle,
} from './core.ts'

// Authorities are free-form strings — any server-known or custom value is valid
// (app-module authorities like `M_dhis-web-dataentry`, custom app authorities).
const overrides = {
  code: CodeSchema,
  name: NameSchema,
  description: DescriptionSchema.optional(),
  authorities: z.array(z.string().min(1)).default([]),
  restrictions: z.array(z.string().min(1)).optional(),
}

const SCHEMAS = {
  '2.40': UserRoleBaseByTarget['2.40'].extend(overrides),
  '2.41': UserRoleBaseByTarget['2.41'].extend(overrides),
  '2.42': UserRoleBaseByTarget['2.42'].extend(overrides),
} as const

export type UserRoleInput = z.input<(typeof SCHEMAS)[CurrentTarget]>
export type UserRole = Handle<'UserRole', z.output<(typeof SCHEMAS)[CurrentTarget]>>

export function defineUserRole(input: UserRoleInput): UserRole {
  const parsed = SCHEMAS[getTarget()].parse(input) as z.output<(typeof SCHEMAS)[CurrentTarget]>
  return makeHandle('UserRole', parsed)
}
