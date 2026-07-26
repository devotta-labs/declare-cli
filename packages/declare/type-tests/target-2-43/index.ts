import { action, defineDataElement, defineDataSet, defineProgramStage } from '@devotta-labs/declare'

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

const stage = defineProgramStage({
  code: 'STAGE',
  name: 'Stage',
})

action.scheduleEvent({ programStage: stage })
