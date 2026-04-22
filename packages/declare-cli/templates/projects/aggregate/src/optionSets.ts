import { defineOptionSet } from '@devotta-labs/declare'
import { captureSharing } from './sharing.ts'

export const reportingStatus = defineOptionSet({
  code: 'EX_OS_REPORTING_STATUS',
  name: 'Reporting status',
  valueType: 'TEXT',
  options: [
    { code: 'ON_TIME', name: 'On time' },
    { code: 'LATE', name: 'Late' },
    { code: 'MISSING', name: 'Missing' },
  ],
  sharing: captureSharing,
})

export const optionSets = [reportingStatus]
