import { z } from 'zod'
import { CodeSchema, NameSchema, makeHandle, type Handle } from './core.ts'

export const OrganisationUnitLevelSchema = z.object({
  code: CodeSchema,
  name: NameSchema,
  level: z.number().int().min(1).max(999),
  offlineLevels: z.number().int().min(0).optional(),
})

export type OrganisationUnitLevelInput = z.infer<typeof OrganisationUnitLevelSchema>
export type OrganisationUnitLevel = Handle<'OrganisationUnitLevel', OrganisationUnitLevelInput>

export function defineOrganisationUnitLevel(
  input: z.input<typeof OrganisationUnitLevelSchema>,
): OrganisationUnitLevel {
  const parsed = OrganisationUnitLevelSchema.parse(input)
  return makeHandle('OrganisationUnitLevel', parsed)
}
