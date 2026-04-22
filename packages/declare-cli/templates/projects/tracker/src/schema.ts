import { defineSchema } from '@devotta-labs/declare'
import { dataElements } from './dataElements.ts'
import { optionSets } from './optionSets.ts'
import { organisationUnits, organisationUnitLevels } from './organisationUnits.ts'
import { programs, programStages } from './program.ts'
import { trackedEntityAttributes, trackedEntityTypes } from './trackedEntity.ts'
import { userGroups } from './userGroups.ts'
import { userRoles } from './userRoles.ts'
import { users } from './users.ts'

export default defineSchema({
  optionSets,
  dataElements,
  organisationUnits,
  organisationUnitLevels,
  trackedEntityAttributes,
  trackedEntityTypes,
  programs,
  programStages,
  userRoles,
  userGroups,
  users,
})
