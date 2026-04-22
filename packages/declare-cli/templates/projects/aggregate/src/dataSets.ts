import { defineDataSet } from '@devotta-labs/declare'
import { indicatorValue, reportingStatusDe } from './dataElements.ts'
import { facility } from './organisationUnits.ts'
import { captureSharing } from './sharing.ts'

export const monthlyReport = defineDataSet({
  code: 'EX_DS_MONTHLY',
  name: 'Example monthly report',
  shortName: 'Ex monthly',
  periodType: 'Monthly',
  dataSetElements: [
    { dataElement: indicatorValue },
    { dataElement: reportingStatusDe },
  ],
  organisationUnits: [facility],
  sharing: captureSharing,
})

export const dataSets = [monthlyReport]
