import { defineDataSet } from '@devotta-labs/declare'
import { indicatorValue } from './dataElements.ts'
import { facility } from './organisationUnits.ts'

export const monthlyReport = defineDataSet({
  code: 'EX_DS_MONTHLY',
  name: 'Example monthly report',
  shortName: 'Ex monthly',
  periodType: 'Monthly',
  dataSetElements: [{ dataElement: indicatorValue }],
  organisationUnits: [facility],
})

export const dataSets = [monthlyReport]
