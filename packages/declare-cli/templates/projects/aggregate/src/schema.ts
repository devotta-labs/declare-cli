import { defineSchema } from '@devotta-labs/declare'
import { dataElements } from './dataElements.ts'
import { dataSets } from './dataSets.ts'
import { organisationUnits, organisationUnitLevels } from './organisationUnits.ts'

export default defineSchema({
  dataElements,
  dataSets,
  organisationUnits,
  organisationUnitLevels,
})
