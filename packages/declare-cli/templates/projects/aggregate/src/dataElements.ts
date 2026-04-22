import { defineDataElement } from '@devotta-labs/declare'
import { reportingStatus } from './optionSets.ts'
import { captureSharing } from './sharing.ts'

export const indicatorValue = defineDataElement({
  code: 'EX_INDICATOR',
  name: 'Example indicator value',
  shortName: 'Ex indicator',
  valueType: 'NUMBER',
  aggregationType: 'SUM',
  sharing: captureSharing,
})

export const reportingStatusDe = defineDataElement({
  code: 'EX_DE_REPORTING_STATUS',
  name: 'Reporting status',
  shortName: 'Reporting status',
  valueType: 'TEXT',
  aggregationType: 'NONE',
  optionSet: reportingStatus,
  sharing: captureSharing,
})

export const dataElements = [indicatorValue, reportingStatusDe]
