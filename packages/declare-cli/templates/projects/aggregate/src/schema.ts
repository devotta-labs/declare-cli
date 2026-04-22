import { defineSchema } from '@devotta-labs/declare'
import { dataElements } from './dataElements.ts'
import { dataSets } from './dataSets.ts'
import { optionSets } from './optionSets.ts'
import { organisationUnits, organisationUnitLevels } from './organisationUnits.ts'
import { userGroups } from './userGroups.ts'
import { userRoles } from './userRoles.ts'
import { users } from './users.ts'

export default defineSchema({
  optionSets,
  dataElements,
  dataSets,
  organisationUnits,
  organisationUnitLevels,
  userRoles,
  userGroups,
  users,
})
