import {
  action,
  defineDataElement,
  defineDataSet,
  defineProgramStage,
  defineTrackedEntityAttribute,
} from '@devotta-labs/declare'

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

defineTrackedEntityAttribute({
  code: 'TEA_SEARCH',
  name: 'Searchable attribute',
  valueType: 'TEXT',
  minCharactersToSearch: 3,
  blockedSearchOperators: ['SW', 'EW', 'LIKE'],
})

defineTrackedEntityAttribute({
  code: 'TEA_BAD_VALUE_TYPE',
  name: 'Removed value type',
  // @ts-expect-error TRACKER_ASSOCIATE is absent from the pinned 2.42 ValueType constants.
  valueType: 'TRACKER_ASSOCIATE',
})

defineTrackedEntityAttribute({
  code: 'TEA_BAD_OPERATOR',
  name: 'Non-blockable operator',
  valueType: 'TEXT',
  // @ts-expect-error Official Tracker semantics only allow SW, EW, and LIKE here.
  blockedSearchOperators: ['EQ'],
})

const stage = defineProgramStage({
  code: 'STAGE',
  name: 'Stage',
})

action.scheduleEvent({ programStage: stage })
