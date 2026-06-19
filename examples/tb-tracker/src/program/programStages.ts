import { defineProgramStage, defineProgramStageSection } from '@devotta-labs/declare'
import {
  coughGt2Weeks,
  feverGt2Weeks,
  heightCm,
  knownTbContact,
  nightSweats,
  screeningNotes,
  screeningResult,
  weightKg,
  weightLoss,
} from '../dataElements.ts'
import { captureSharing } from '../sharing.ts'

export const symptomsSection = defineProgramStageSection({
  code: 'PSS_TB_SYMPTOMS',
  name: 'Symptoms',
  sortOrder: 1,
  dataElements: [coughGt2Weeks, feverGt2Weeks, weightLoss, nightSweats, knownTbContact],
})

export const measurementsSection = defineProgramStageSection({
  code: 'PSS_TB_MEASUREMENTS',
  name: 'Measurements and outcome',
  sortOrder: 2,
  dataElements: [weightKg, heightCm, screeningResult, screeningNotes],
})

export const initialScreeningStage = defineProgramStage({
  code: 'PS_TB_INITIAL_SCREENING',
  name: 'Initial screening',
  shortName: 'Initial screen',
  description:
    'First encounter with a TB-presumptive patient. Captures cardinal symptoms, basic anthropometrics, known TB contact status, and a final screening verdict.',
  sortOrder: 1,
  repeatable: false,
  autoGenerateEvent: true,
  openAfterEnrollment: true,
  validationStrategy: 'ON_COMPLETE',
  executionDateLabel: 'Screening date',
  formType: 'SECTION',
  programStageDataElements: [
    { dataElement: coughGt2Weeks, compulsory: true, sortOrder: 1 },
    { dataElement: feverGt2Weeks, compulsory: false, sortOrder: 2 },
    { dataElement: weightLoss, compulsory: false, sortOrder: 3 },
    { dataElement: nightSweats, compulsory: false, sortOrder: 4 },
    { dataElement: knownTbContact, compulsory: false, sortOrder: 5 },
    { dataElement: weightKg, compulsory: false, sortOrder: 6 },
    { dataElement: heightCm, compulsory: false, sortOrder: 7 },
    { dataElement: screeningResult, compulsory: true, sortOrder: 8 },
    { dataElement: screeningNotes, compulsory: false, sortOrder: 9 },
  ],
  programStageSections: [symptomsSection, measurementsSection],
  sharing: captureSharing,
})

export const programStages = [initialScreeningStage]
export const programStageSections = [symptomsSection, measurementsSection]
