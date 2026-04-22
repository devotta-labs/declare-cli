import { defineProgram, defineProgramStage } from '@devotta-labs/declare'
import { visitNotes } from './dataElements.ts'
import { country, facility } from './organisationUnits.ts'
import { captureSharing } from './sharing.ts'
import { firstNameTea, lastNameTea, personTrackedEntityType } from './trackedEntity.ts'

export const visitStage = defineProgramStage({
  code: 'EX_PS_VISIT',
  name: 'Visit',
  shortName: 'Visit',
  description: 'Example program stage.',
  sortOrder: 1,
  repeatable: false,
  autoGenerateEvent: true,
  openAfterEnrollment: true,
  validationStrategy: 'ON_COMPLETE',
  executionDateLabel: 'Visit date',
  programStageDataElements: [
    { dataElement: visitNotes, compulsory: false, sortOrder: 1 },
  ],
  sharing: captureSharing,
})

export const programStages = [visitStage]

export const examplePrograms = defineProgram({
  code: 'EX_PRG_EXAMPLE',
  name: 'Example tracker program',
  shortName: 'Example',
  description: 'Minimal starter tracker program.',
  programType: 'WITH_REGISTRATION',
  trackedEntityType: personTrackedEntityType,
  organisationUnits: [country, facility],
  programStages: [visitStage],
  displayFrontPageList: true,
  displayIncidentDate: false,
  onlyEnrollOnce: false,
  useFirstStageDuringRegistration: true,
  accessLevel: 'OPEN',
  minAttributesRequiredToSearch: 1,
  enrollmentDateLabel: 'Enrollment date',
  programTrackedEntityAttributes: [
    { trackedEntityAttribute: firstNameTea, displayInList: true, mandatory: true, searchable: true, sortOrder: 1 },
    { trackedEntityAttribute: lastNameTea, displayInList: true, mandatory: true, searchable: true, sortOrder: 2 },
  ],
  sharing: captureSharing,
})

export const programs = [examplePrograms]
