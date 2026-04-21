import { defineOrganisationUnitLevel } from '@devotta-labs/declare'

export const nationLevel = defineOrganisationUnitLevel({
  code: 'OU_LEVEL_NATION',
  name: 'National',
  level: 1,
})

export const fylkeLevel = defineOrganisationUnitLevel({
  code: 'OU_LEVEL_FYLKE',
  name: 'Fylke',
  level: 2,
})

export const kommuneLevel = defineOrganisationUnitLevel({
  code: 'OU_LEVEL_KOMMUNE',
  name: 'Kommune',
  level: 3,
})

export const organisationUnitLevels = [nationLevel, fylkeLevel, kommuneLevel]
