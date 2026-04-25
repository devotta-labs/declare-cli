import { afterEach, describe, expect, it } from 'vitest'
import { defineDataElement } from './dataElement.ts'
import { defineOrganisationUnit } from './organisationUnit.ts'
import { defineProgram } from './program.ts'
import { action, defineProgramRule, defineProgramRuleVariable } from './programRule.ts'
import { defineProgramStage } from './programStage.ts'
import { defineSchema } from './schema.ts'
import { DEFAULT_TARGET } from '../generated/targets.ts'
import { setTarget } from '../generated/runtime.ts'

const ou = defineOrganisationUnit({
  code: 'OU_RULES',
  name: 'Rules OU',
  shortName: 'Rules OU',
  openingDate: '2020-01-01',
})

const age = defineDataElement({
  code: 'DE_AGE',
  name: 'Age',
  valueType: 'INTEGER_ZERO_OR_POSITIVE',
  aggregationType: 'NONE',
})

const stage = defineProgramStage({
  code: 'PST_RULES',
  name: 'Rules stage',
  programStageDataElements: [{ dataElement: age }],
})

const program = defineProgram({
  code: 'PRG_RULES',
  name: 'Rules program',
  programType: 'WITHOUT_REGISTRATION',
  organisationUnits: [ou],
  programStages: [stage],
})

describe('program rules', () => {
  afterEach(() => setTarget(DEFAULT_TARGET))

  it('defines variables, hoists rule actions, and serializes DHIS2 metadata', () => {
    const ageVariable = defineProgramRuleVariable({
      code: 'PRV_AGE',
      name: 'age',
      program,
      programRuleVariableSourceType: 'DATAELEMENT_CURRENT_EVENT',
      dataElement: age,
    })

    const rule = defineProgramRule({
      code: 'PR_AGE_WARNING',
      name: 'Age warning',
      program,
      condition: '#{age} < 18',
      actions: [action.showWarning({ on: age, content: 'Under 18' })],
    })

    const schema = defineSchema({
      organisationUnits: [ou],
      dataElements: [age],
      programStages: [stage],
      programs: [program],
      programRuleVariables: [ageVariable],
      programRules: [rule],
    })

    const payload = schema.serialize() as Record<string, Record<string, unknown>[]>

    expect(payload.programRuleVariables?.[0]).toEqual(
      expect.objectContaining({
        code: 'PRV_AGE',
        name: 'age',
        programRuleVariableSourceType: 'DATAELEMENT_CURRENT_EVENT',
        valueType: 'INTEGER_ZERO_OR_POSITIVE',
        dataElement: expect.objectContaining({ code: 'DE_AGE' }),
      }),
    )
    expect(payload.programRules?.[0]).toEqual(
      expect.objectContaining({
        code: 'PR_AGE_WARNING',
        condition: '#{age} < 18',
        programRuleActions: [expect.objectContaining({ code: 'PR_AGE_WARNING_1_SHOWWARNING' })],
      }),
    )
    expect(payload.programRuleActions?.[0]).toEqual(
      expect.objectContaining({
        code: 'PR_AGE_WARNING_1_SHOWWARNING',
        programRuleActionType: 'SHOWWARNING',
        content: 'Under 18',
        dataElement: expect.objectContaining({ code: 'DE_AGE' }),
        programRule: expect.objectContaining({ code: 'PR_AGE_WARNING' }),
      }),
    )
  })

  it('rejects SCHEDULEEVENT before DHIS2 2.42', () => {
    setTarget('2.41')
    expect(() =>
      defineProgramRule({
        code: 'PR_SCHEDULE',
        name: 'Schedule',
        program,
        condition: 'true',
        actions: [action.scheduleEvent({ programStage: stage, data: "'2020-01-01'" })],
      }),
    ).toThrow(/SCHEDULEEVENT/)
  })
})
