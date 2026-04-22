import { defineSchema } from '@devotta-labs/declare'
import { dataElements } from './dataElements.ts'
import { organisationUnits, organisationUnitLevels } from './organisationUnits.ts'
import { programs, programStages } from './program.ts'
import { trackedEntityAttributes, trackedEntityTypes } from './trackedEntity.ts'

export default defineSchema({
  dataElements,
  organisationUnits,
  organisationUnitLevels,
  trackedEntityAttributes,
  trackedEntityTypes,
  programs,
  programStages,
})
