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
})

defineDataSet({
  code: 'DS_BAD',
  name: 'Dataset bad',
  periodType: 'Monthly',
  dataSetElements: [{ dataElement: cases }],
  // @ts-expect-error displayOptions is not available on DHIS2 2.40.
  displayOptions: 'sectionTabs',
})
