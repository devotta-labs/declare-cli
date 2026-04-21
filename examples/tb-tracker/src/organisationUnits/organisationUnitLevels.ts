import { defineOrganisationUnitLevel } from '@devotta-labs/declare'

// Copied verbatim from the malaria-monthly-reporting example so both demo
// programs live in the same Norge / fylke / kommune hierarchy. Keeping the
// codes identical means a fresh DHIS2 instance with both examples applied
// shares a single OU tree instead of duplicating levels.
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
