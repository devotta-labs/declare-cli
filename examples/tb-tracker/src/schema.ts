import { defineSchema } from '@devotta-labs/declare'
import { dataElements } from './dataElements.ts'
import { optionSets } from './optionSets.ts'
import { organisationUnitLevels } from './organisationUnits/organisationUnitLevels.ts'
import { organisationUnits } from './organisationUnits/organisationUnits.ts'
import { programs } from './program/program.ts'
import { programStages } from './program/programStages.ts'
import { trackedEntityAttributes } from './trackedEntity/trackedEntityAttributes.ts'
import { trackedEntityTypes } from './trackedEntity/trackedEntityType.ts'
import { userGroups } from './userGroups/userGroups.ts'
import { userRoles } from './userRoles/userRoles.ts'
import { users } from './users/users.ts'

export default defineSchema({
  optionSets,
  dataElements,
  organisationUnitLevels,
  organisationUnits,
  userRoles,
  userGroups,
  users,
  trackedEntityAttributes,
  trackedEntityTypes,
  programs,
  programStages,
})
