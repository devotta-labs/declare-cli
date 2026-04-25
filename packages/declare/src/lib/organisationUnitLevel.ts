import { z } from 'zod'
import { OrganisationUnitLevelBaseByTarget } from '../generated/organisationUnitLevel.ts'
import { getTarget } from '../generated/runtime.ts'
import type { CurrentTarget } from './currentTarget.ts'
import { CodeSchema, NameSchema, makeHandle, type Handle } from './core.ts'

const overrides = {
  code: CodeSchema,
  name: NameSchema,
  level: z.number().int().min(1).max(999),
  offlineLevels: z.number().int().min(0).optional(),
}

const SCHEMAS = {
  '2.40': OrganisationUnitLevelBaseByTarget['2.40'].extend(overrides),
  '2.41': OrganisationUnitLevelBaseByTarget['2.41'].extend(overrides),
  '2.42': OrganisationUnitLevelBaseByTarget['2.42'].extend(overrides),
} as const

export type OrganisationUnitLevelInput = z.input<(typeof SCHEMAS)[CurrentTarget]>
export type OrganisationUnitLevel = Handle<
  'OrganisationUnitLevel',
  z.output<(typeof SCHEMAS)[CurrentTarget]>
>

export function defineOrganisationUnitLevel(
  input: OrganisationUnitLevelInput,
): OrganisationUnitLevel {
  const parsed = SCHEMAS[getTarget()].parse(input) as z.output<(typeof SCHEMAS)[CurrentTarget]>
  return makeHandle('OrganisationUnitLevel', parsed)
}
