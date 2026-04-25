import { defineDataElement, defineDataSet } from '@devotta-labs/declare'

const cases = defineDataElement({
  code: 'CASES',
  name: 'Cases',
  valueType: 'NUMBER',
})

defineDataSet({
  code: 'DS_OK',
  name: 'Dataset ok',
  periodType: 'Monthly',
  dataSetElements: [{ dataElement: cases }],
  displayOptions: 'sectionTabs',
})
