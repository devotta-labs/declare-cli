import { defineOrganisationUnit } from '@devotta-labs/declare'

// DHIS2 requires openingDate on every OU. Use a common historical date so the
// whole tree shares the same "we've always been here" baseline.
const OPENING_DATE = '1970-01-01'

// Level 1 — the country.
export const norge = defineOrganisationUnit({
  code: 'NORGE',
  name: 'Norge',
  shortName: 'Norge',
  openingDate: OPENING_DATE,
})

// Level 2 — fylker (three of them, Innlandet included).
export const innlandet = defineOrganisationUnit({
  code: 'FYLKE_INNLANDET',
  name: 'Innlandet',
  shortName: 'Innlandet',
  openingDate: OPENING_DATE,
  parent: norge,
})

export const vestland = defineOrganisationUnit({
  code: 'FYLKE_VESTLAND',
  name: 'Vestland',
  shortName: 'Vestland',
  openingDate: OPENING_DATE,
  parent: norge,
})

export const nordland = defineOrganisationUnit({
  code: 'FYLKE_NORDLAND',
  name: 'Nordland',
  shortName: 'Nordland',
  openingDate: OPENING_DATE,
  parent: norge,
})

// Level 3 — kommuner. Three per fylke; Sel lives under Innlandet.
export const sel = defineOrganisationUnit({
  code: 'KOMM_SEL',
  name: 'Sel',
  shortName: 'Sel',
  openingDate: OPENING_DATE,
  parent: innlandet,
})

export const lillehammer = defineOrganisationUnit({
  code: 'KOMM_LILLEHAMMER',
  name: 'Lillehammer',
  shortName: 'Lillehammer',
  openingDate: OPENING_DATE,
  parent: innlandet,
})

export const gjovik = defineOrganisationUnit({
  code: 'KOMM_GJOVIK',
  name: 'Gjøvik',
  shortName: 'Gjøvik',
  openingDate: OPENING_DATE,
  parent: innlandet,
})

export const bergen = defineOrganisationUnit({
  code: 'KOMM_BERGEN',
  name: 'Bergen',
  shortName: 'Bergen',
  openingDate: OPENING_DATE,
  parent: vestland,
})

export const voss = defineOrganisationUnit({
  code: 'KOMM_VOSS',
  name: 'Voss',
  shortName: 'Voss',
  openingDate: OPENING_DATE,
  parent: vestland,
})

export const stryn = defineOrganisationUnit({
  code: 'KOMM_STRYN',
  name: 'Stryn',
  shortName: 'Stryn',
  openingDate: OPENING_DATE,
  parent: vestland,
})

export const bodo = defineOrganisationUnit({
  code: 'KOMM_BODO',
  name: 'Bodø',
  shortName: 'Bodø',
  openingDate: OPENING_DATE,
  parent: nordland,
})

export const narvik = defineOrganisationUnit({
  code: 'KOMM_NARVIK',
  name: 'Narvik',
  shortName: 'Narvik',
  openingDate: OPENING_DATE,
  parent: nordland,
})

export const vagan = defineOrganisationUnit({
  code: 'KOMM_VAGAN',
  name: 'Vågan',
  shortName: 'Vågan',
  openingDate: OPENING_DATE,
  parent: nordland,
})

export const organisationUnits = [
  norge,
  innlandet,
  vestland,
  nordland,
  sel,
  lillehammer,
  gjovik,
  bergen,
  voss,
  stryn,
  bodo,
  narvik,
  vagan,
]
