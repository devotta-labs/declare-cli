import { defineOptionSet } from '@devotta-labs/declare'
import { captureSharing } from './sharing.ts'

export const caseClassification = defineOptionSet({
  code: 'MAL_CASE_CLASS',
  name: 'Malaria case classification',
  valueType: 'TEXT',
  options: [
    { code: 'CONFIRMED', name: 'Confirmed' },
    { code: 'SUSPECTED', name: 'Suspected' },
    { code: 'IMPORTED', name: 'Imported' },
  ],
  sharing: captureSharing,
})

export const optionSets = [caseClassification]
