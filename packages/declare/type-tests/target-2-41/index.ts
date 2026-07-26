import {
  action,
  defineDataElement,
  defineDataSet,
  defineProgram,
  defineProgramStage,
  defineTrackedEntityAttribute,
} from '@devotta-labs/declare'

const cases = defineDataElement({
  code: 'CASES',
  name: 'Cases',
  valueType: 'NUMBER',
})

defineDataSet({
  code: 'DS_241',
  name: 'Dataset 2.41',
  periodType: 'Monthly',
  dataSetElements: [{ dataElement: cases }],
  // @ts-expect-error displayOptions first appears in the pinned 2.42 DataSet schema.
  displayOptions: 'sectionTabs',
})

defineTrackedEntityAttribute({
  code: 'TEA_LEGACY_ASSOCIATE',
  name: 'Legacy associate',
  // Retained by the pinned 2.41 ValueType constants.
  valueType: 'TRACKER_ASSOCIATE',
})

defineTrackedEntityAttribute({
  code: 'TEA_SEARCH_TOO_NEW',
  name: 'Search config too new',
  valueType: 'TEXT',
  // @ts-expect-error blockedSearchOperators first appears in the pinned 2.42 schema.
  blockedSearchOperators: ['SW'],
})

defineProgram({
  code: 'PROGRAM_241',
  name: 'Program 2.41',
  programType: 'WITHOUT_REGISTRATION',
  organisationUnits: [],
  // First present as a writable field in the pinned 2.41 Program schema.
  enrollmentLabel: 'Enrollment',
})

const stage = defineProgramStage({
  code: 'STAGE',
  name: 'Stage',
  // First present as a writable field in the pinned 2.41 ProgramStage schema.
  eventLabel: 'Event',
})

// @ts-expect-error SCHEDULEEVENT first appears in the pinned 2.42 action constants.
action.scheduleEvent({ programStage: stage })
