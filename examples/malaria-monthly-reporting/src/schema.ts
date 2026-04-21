import { defineSchema } from '@devotta-labs/declare'
import { categories } from './categories/categories.ts'
import { categoryCombos } from './categories/categoryCombos.ts'
import { categoryOptions } from './categories/categoryOptions.ts'
import { dataElements } from './dataElements.ts'
import { dataSets } from './dataSets.ts'
import { optionSets } from './optionSets.ts'
import { organisationUnitLevels } from './organisationUnits/organisationUnitLevels.ts'
import { organisationUnits } from './organisationUnits/organisationUnits.ts'
import { userGroups } from './userGroups/userGroups.ts'
import { userRoles } from './userRoles/userRoles.ts'
import { users } from './users/users.ts'

export default defineSchema({
  categoryOptions,
  categories,
  categoryCombos,
  optionSets,
  dataElements,
  dataSets,
  organisationUnitLevels,
  organisationUnits,
  userRoles,
  userGroups,
  users,
})
