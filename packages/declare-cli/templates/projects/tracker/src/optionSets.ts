import { defineOptionSet } from '@devotta-labs/declare'
import { captureSharing } from './sharing.ts'

export const sexOptionSet = defineOptionSet({
  code: 'EX_OS_SEX',
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

export const optionSets = [sexOptionSet]
