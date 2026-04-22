import { defineProgram } from '@devotta-labs/declare'
import {
  bergen,
  bodo,
  gjovik,
  lillehammer,
  narvik,
  norge,
  sel,
  stryn,
  vagan,
  voss,
} from '../organisationUnits/organisationUnits.ts'
import { captureSharing } from '../sharing.ts'
import {
  dateOfBirthTea,
  firstNameTea,
  hivStatusTea,
  lastNameTea,
  nationalIdTea,
  phoneNumberTea,
  previousTbTreatmentTea,
  sexTea,
} from '../trackedEntity/trackedEntityAttributes.ts'
import { personTrackedEntityType } from '../trackedEntity/trackedEntityType.ts'
import { initialScreeningStage } from './programStages.ts'

export const tbProgram = defineProgram({
  code: 'PRG_TB_TRACKER',
  name: 'TB tracker',
  shortName: 'TB tracker',
  description:
    'Tuberculosis registration and initial screening programme. Enrols people suspected of TB, captures their first screening visit, and records a presumptive/confirmed outcome.',
  programType: 'WITH_REGISTRATION',
  trackedEntityType: personTrackedEntityType,
  organisationUnits: [norge, sel, lillehammer, gjovik, bergen, voss, stryn, bodo, narvik, vagan],
  programStages: [initialScreeningStage],
  displayFrontPageList: true,
  displayIncidentDate: false,
  onlyEnrollOnce: false,
  useFirstStageDuringRegistration: true,
  accessLevel: 'OPEN',
  minAttributesRequiredToSearch: 1,
  enrollmentDateLabel: 'Enrollment date',
  programTrackedEntityAttributes: [
    {
      trackedEntityAttribute: firstNameTea,
      displayInList: true,
      mandatory: true,
      searchable: true,
      sortOrder: 1,
    },
    {
      trackedEntityAttribute: lastNameTea,
      displayInList: true,
      mandatory: true,
      searchable: true,
      sortOrder: 2,
    },
    {
      trackedEntityAttribute: dateOfBirthTea,
      displayInList: true,
      mandatory: false,
      searchable: true,
      sortOrder: 3,
    },
    {
      trackedEntityAttribute: sexTea,
      displayInList: true,
      mandatory: false,
      searchable: false,
      sortOrder: 4,
    },
    {
      trackedEntityAttribute: nationalIdTea,
      displayInList: true,
      mandatory: false,
      searchable: true,
      sortOrder: 5,
    },
    {
      trackedEntityAttribute: phoneNumberTea,
      displayInList: false,
      mandatory: false,
      searchable: false,
      sortOrder: 6,
    },
    {
      trackedEntityAttribute: hivStatusTea,
      displayInList: false,
      mandatory: false,
      searchable: false,
      sortOrder: 7,
    },
    {
      trackedEntityAttribute: previousTbTreatmentTea,
      displayInList: false,
      mandatory: false,
      searchable: false,
      sortOrder: 8,
    },
  ],
  sharing: captureSharing,
})

export const programs = [tbProgram]
