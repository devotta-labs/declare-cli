import { describe, expect, it } from 'vitest'
import {
  action,
  defineDataElement,
  defineOrganisationUnit,
  defineProgram,
  defineProgramSection,
  defineProgramStage,
  defineProgramStageSection,
  defineSchema,
  defineTrackedEntityAttribute,
  defineTrackedEntityType,
  effect,
} from './index.ts'
import { stableUid } from './core.ts'

const facility = defineOrganisationUnit({
  code: 'OU_FORM_FACILITY',
  name: 'Form facility',
  openingDate: '2024-01-01',
})

const firstName = defineTrackedEntityAttribute({
  code: 'TEA_FORM_FIRST_NAME',
  name: 'First name',
  valueType: 'TEXT',
})

const person = defineTrackedEntityType({
  code: 'TET_FORM_PERSON',
  name: 'Person',
  trackedEntityTypeAttributes: [
    { trackedEntityAttribute: firstName, displayInList: true, mandatory: true, searchable: true },
  ],
})

const visitNotes = defineDataElement({
  code: 'DE_FORM_VISIT_NOTES',
  name: 'Visit notes',
  valueType: 'TEXT',
  aggregationType: 'NONE',
  domainType: 'TRACKER',
})

const enrollmentSection = defineProgramSection({
  code: 'PRS_FORM_DEMOGRAPHICS',
  name: 'Demographics',
  sortOrder: 1,
  trackedEntityAttributes: [firstName],
})

const visitSection = defineProgramStageSection({
  code: 'PSS_FORM_VISIT',
  name: 'Visit',
  sortOrder: 1,
  dataElements: [visitNotes],
})

const visitStage = defineProgramStage({
  code: 'PS_FORM_VISIT',
  name: 'Visit',
  sortOrder: 1,
  programStageDataElements: [{ dataElement: visitNotes, sortOrder: 1 }],
  formType: 'SECTION',
  programStageSections: [visitSection],
})

const trackerProgram = defineProgram({
  code: 'PRG_FORM_TRACKER',
  name: 'Form tracker',
  programType: 'WITH_REGISTRATION',
  trackedEntityType: person,
  organisationUnits: [facility],
  programStages: [visitStage],
  programTrackedEntityAttributes: [
    { trackedEntityAttribute: firstName, mandatory: true, searchable: true, sortOrder: 1 },
  ],
  formType: 'SECTION',
  programSections: [enrollmentSection],
})

describe('section forms', () => {
  it('serializes program and program stage sections with owner back-refs', () => {
    const payload = defineSchema({
      organisationUnits: [facility],
      trackedEntityAttributes: [firstName],
      trackedEntityTypes: [person],
      dataElements: [visitNotes],
      programs: [trackerProgram],
      programSections: [enrollmentSection],
      programStages: [visitStage],
      programStageSections: [visitSection],
    }).serialize() as Record<string, Record<string, unknown>[] | undefined>

    expect(payload.programs?.[0]).not.toHaveProperty('formType')
    expect(payload.programs?.[0]?.programSections).toEqual([
      { id: stableUid('ProgramSection:PRS_FORM_DEMOGRAPHICS'), code: 'PRS_FORM_DEMOGRAPHICS' },
    ])
    expect(payload.programSections?.[0]).toMatchObject({
      id: stableUid('ProgramSection:PRS_FORM_DEMOGRAPHICS'),
      code: 'PRS_FORM_DEMOGRAPHICS',
      program: { id: stableUid('Program:PRG_FORM_TRACKER'), code: 'PRG_FORM_TRACKER' },
      trackedEntityAttributes: [
        { id: stableUid('TrackedEntityAttribute:TEA_FORM_FIRST_NAME'), code: 'TEA_FORM_FIRST_NAME' },
      ],
    })

    expect(payload.programStages?.[0]).not.toHaveProperty('formType')
    expect(payload.programStages?.[0]?.programStageSections).toEqual([
      { id: stableUid('ProgramStageSection:PSS_FORM_VISIT'), code: 'PSS_FORM_VISIT' },
    ])
    expect(payload.programStageSections?.[0]).toMatchObject({
      id: stableUid('ProgramStageSection:PSS_FORM_VISIT'),
      code: 'PSS_FORM_VISIT',
      programStage: { id: stableUid('ProgramStage:PS_FORM_VISIT'), code: 'PS_FORM_VISIT' },
      dataElements: [
        { id: stableUid('DataElement:DE_FORM_VISIT_NOTES'), code: 'DE_FORM_VISIT_NOTES' },
      ],
    })
  })

  it('requires sections when formType is SECTION', () => {
    expect(() =>
      defineProgramStage({
        code: 'PS_FORM_BAD',
        name: 'Bad stage',
        formType: 'SECTION',
        programStageDataElements: [{ dataElement: visitNotes }],
      }),
    ).toThrow(/programStageSections/)
  })

  it('rejects sections when formType is explicitly DEFAULT', () => {
    expect(() =>
      defineProgram({
        code: 'PRG_FORM_BAD',
        name: 'Bad program',
        programType: 'WITH_REGISTRATION',
        trackedEntityType: person,
        organisationUnits: [facility],
        programSections: [enrollmentSection],
        formType: 'DEFAULT',
      }),
    ).toThrow(/DEFAULT forms/)
  })

  it('targets typed program stage sections in program rules', () => {
    const sectionUid = stableUid('ProgramStageSection:PSS_FORM_VISIT')

    expect(action.hideSection({ section: visitSection })).toMatchObject({
      programRuleActionType: 'HIDESECTION',
      programStageSection: sectionUid,
    })
    expect(effect.hideSection({ section: visitSection })).toMatchObject({
      type: 'HIDESECTION',
      values: { programStageSection: sectionUid },
    })
  })
})
