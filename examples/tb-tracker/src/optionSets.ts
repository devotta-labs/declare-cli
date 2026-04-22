import { defineOptionSet } from '@devotta-labs/declare'
import { captureSharing } from './sharing.ts'

export const sexOptionSet = defineOptionSet({
  code: 'OS_SEX',
  name: 'Sex',
  valueType: 'TEXT',
  options: [
    { code: 'MALE', name: 'Male' },
    { code: 'FEMALE', name: 'Female' },
    { code: 'OTHER', name: 'Other' },
    { code: 'UNKNOWN', name: 'Unknown' },
  ],
  sharing: captureSharing,
})

export const ynuOptionSet = defineOptionSet({
  code: 'OS_YES_NO_UNKNOWN',
  name: 'Yes / No / Unknown',
  valueType: 'TEXT',
  options: [
    { code: 'YES', name: 'Yes' },
    { code: 'NO', name: 'No' },
    { code: 'UNKNOWN', name: 'Unknown' },
  ],
  sharing: captureSharing,
})

// Codes mirror the WHO canonical TB screen results for direct analytics joins.
export const tbScreeningResult = defineOptionSet({
  code: 'OS_TB_SCREEN_RESULT',
  name: 'TB screening result',
  valueType: 'TEXT',
  options: [
    { code: 'NOT_PRESUMPTIVE', name: 'Not presumptive' },
    { code: 'PRESUMPTIVE', name: 'Presumptive TB' },
    { code: 'CONFIRMED', name: 'Bacteriologically confirmed' },
    { code: 'REFERRED', name: 'Referred for further investigation' },
  ],
  sharing: captureSharing,
})

export const optionSets = [sexOptionSet, ynuOptionSet, tbScreeningResult]
