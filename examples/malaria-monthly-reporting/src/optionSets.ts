import { Access, Sharing, defineOptionSet } from '@devotta-labs/declare'

export const caseClassification = defineOptionSet({
  code: 'MAL_CASE_CLASS',
  name: 'Malaria case classification',
  valueType: 'TEXT',
  options: [
    { code: 'CONFIRMED', name: 'Confirmed' },
    { code: 'SUSPECTED', name: 'Suspected' },
    { code: 'IMPORTED', name: 'Imported' },
  ],
  // Demo-wide public access — see dataElements.ts for the rationale.
  sharing: Sharing.public(Access.readWrite),
})

export const optionSets = [caseClassification]
