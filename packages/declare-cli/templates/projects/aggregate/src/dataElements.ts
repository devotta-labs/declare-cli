import { defineDataElement } from '@devotta-labs/declare'

export const indicatorValue = defineDataElement({
  code: 'EX_INDICATOR',
  name: 'Example indicator value',
  shortName: 'Ex indicator',
  valueType: 'NUMBER',
  aggregationType: 'SUM',
})

export const dataElements = [indicatorValue]
