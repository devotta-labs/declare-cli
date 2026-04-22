import { Access, Sharing, defineDataElement } from '@devotta-labs/declare'
import { tbScreeningResult, ynuOptionSet } from './optionSets.ts'

// `domainType: 'TRACKER'` is the critical flag distinguishing event-world data
// elements from aggregate ones — the Capture app only renders TRACKER DEs on
// event forms, and ProgramStage.programStageDataElements rejects AGGREGATE ones.
const publicRW = Sharing.public(Access.readWrite)

export const coughGt2Weeks = defineDataElement({
  code: 'DE_TB_COUGH_GT_2_WEEKS',
  name: 'Cough for more than 2 weeks',
  shortName: 'Cough >2 w',
  valueType: 'TEXT',
  aggregationType: 'NONE',
  domainType: 'TRACKER',
  optionSet: ynuOptionSet,
  sharing: publicRW,
})

export const feverGt2Weeks = defineDataElement({
  code: 'DE_TB_FEVER_GT_2_WEEKS',
  name: 'Fever for more than 2 weeks',
  shortName: 'Fever >2 w',
  valueType: 'TEXT',
  aggregationType: 'NONE',
  domainType: 'TRACKER',
  optionSet: ynuOptionSet,
  sharing: publicRW,
})

export const weightLoss = defineDataElement({
  code: 'DE_TB_WEIGHT_LOSS',
  name: 'Unexplained weight loss',
  shortName: 'Weight loss',
  valueType: 'TEXT',
  aggregationType: 'NONE',
  domainType: 'TRACKER',
  optionSet: ynuOptionSet,
  sharing: publicRW,
})

export const nightSweats = defineDataElement({
  code: 'DE_TB_NIGHT_SWEATS',
  name: 'Night sweats',
  shortName: 'Night sweats',
  valueType: 'TEXT',
  aggregationType: 'NONE',
  domainType: 'TRACKER',
  optionSet: ynuOptionSet,
  sharing: publicRW,
})

export const knownTbContact = defineDataElement({
  code: 'DE_TB_KNOWN_CONTACT',
  name: 'Known contact with TB patient',
  shortName: 'TB contact',
  valueType: 'TEXT',
  aggregationType: 'NONE',
  domainType: 'TRACKER',
  optionSet: ynuOptionSet,
  sharing: publicRW,
})

export const weightKg = defineDataElement({
  code: 'DE_TB_WEIGHT_KG',
  name: 'Weight (kg)',
  shortName: 'Weight (kg)',
  valueType: 'NUMBER',
  aggregationType: 'AVERAGE',
  domainType: 'TRACKER',
  sharing: publicRW,
})

export const heightCm = defineDataElement({
  code: 'DE_TB_HEIGHT_CM',
  name: 'Height (cm)',
  shortName: 'Height (cm)',
  valueType: 'NUMBER',
  aggregationType: 'AVERAGE',
  domainType: 'TRACKER',
  sharing: publicRW,
})

export const screeningResult = defineDataElement({
  code: 'DE_TB_SCREENING_RESULT',
  name: 'Screening result',
  shortName: 'Screening result',
  valueType: 'TEXT',
  aggregationType: 'NONE',
  domainType: 'TRACKER',
  optionSet: tbScreeningResult,
  sharing: publicRW,
})

export const screeningNotes = defineDataElement({
  code: 'DE_TB_SCREENING_NOTES',
  name: 'Screening notes',
  shortName: 'Notes',
  valueType: 'LONG_TEXT',
  aggregationType: 'NONE',
  domainType: 'TRACKER',
  sharing: publicRW,
})

export const dataElements = [
  coughGt2Weeks,
  feverGt2Weeks,
  weightLoss,
  nightSweats,
  knownTbContact,
  weightKg,
  heightCm,
  screeningResult,
  screeningNotes,
]
