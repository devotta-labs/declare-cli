import {
  defineOrganisationUnit,
  defineOrganisationUnitLevel,
} from '@devotta-labs/declare'

const OPENING_DATE = '1970-01-01'

export const country = defineOrganisationUnit({
  code: 'EX_COUNTRY',
  name: 'Example country',
  shortName: 'Country',
  openingDate: OPENING_DATE,
})

export const facility = defineOrganisationUnit({
  code: 'EX_FACILITY',
  name: 'Example facility',
  shortName: 'Facility',
  openingDate: OPENING_DATE,
  parent: country,
})

export const organisationUnits = [country, facility]

export const organisationUnitLevels = [
  defineOrganisationUnitLevel({ code: 'EX_LEVEL_COUNTRY', name: 'Country', level: 1 }),
  defineOrganisationUnitLevel({ code: 'EX_LEVEL_FACILITY', name: 'Facility', level: 2 }),
]
