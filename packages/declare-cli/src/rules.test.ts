import { describe, expect, it } from 'vitest'
import {
  action,
  defineDataElement,
  defineOrganisationUnit,
  defineProgram,
  defineProgramRule,
  defineProgramRuleVariable,
  defineProgramStage,
  defineRuleTest,
  defineSchema,
  effect,
} from '@devotta-labs/declare'
import {
  ProgramRuleValidationError,
  buildRuleEngine,
  checkProgramRules,
  evaluateRule,
} from './rules.ts'

const ou = defineOrganisationUnit({
  code: 'OU_RULE_EVAL',
  name: 'Rule eval OU',
  shortName: 'Rule eval',
  openingDate: '2020-01-01',
})

const age = defineDataElement({
  code: 'DE_RULE_AGE',
  name: 'Rule age',
  valueType: 'INTEGER_ZERO_OR_POSITIVE',
  aggregationType: 'NONE',
})

const review = defineDataElement({
  code: 'DE_RULE_REVIEW',
  name: 'Needs review',
  valueType: 'TEXT',
  aggregationType: 'NONE',
})

const stage = defineProgramStage({
  code: 'PST_RULE_EVAL',
  name: 'Rule eval stage',
  programStageDataElements: [{ dataElement: age }, { dataElement: review }],
})

const program = defineProgram({
  code: 'PRG_RULE_EVAL',
  name: 'Rule eval program',
  programType: 'WITHOUT_REGISTRATION',
  organisationUnits: [ou],
  programStages: [stage],
})

const ageVariable = defineProgramRuleVariable({
  code: 'PRV_RULE_AGE',
  name: 'age',
  program,
  programRuleVariableSourceType: 'DATAELEMENT_CURRENT_EVENT',
  dataElement: age,
})

const minorRule = defineProgramRule({
  code: 'PR_MINOR',
  name: 'Minor warning',
  program,
  condition: '#{age} < 18',
  actions: [action.showWarning({ on: age, content: 'Under 18' })],
})

describe('program rule engine bridge', () => {
  it('evaluates declared rules with the real DHIS2 rule engine', () => {
    const schema = defineSchema({
      organisationUnits: [ou],
      dataElements: [age, review],
      programStages: [stage],
      programs: [program],
      programRuleVariables: [ageVariable],
      programRules: [minorRule],
    })

    expect(evaluateRule(schema, minorRule, { event: [[age, 17]], programStage: stage })).toEqual([
      effect.showWarning({ on: age, content: 'Under 18' }),
    ])
    expect(evaluateRule(schema, minorRule, { event: [[age, 25]], programStage: stage })).toEqual([])
  })

  it('runs declare rule tests during check validation', () => {
    const schema = defineSchema({
      organisationUnits: [ou],
      dataElements: [age, review],
      programStages: [stage],
      programs: [program],
      programRuleVariables: [ageVariable],
      programRules: [minorRule],
      ruleTests: [
        defineRuleTest({
          rule: minorRule,
          given: { event: [[age, 17]], programStage: stage },
          expect: [effect.showWarning({ on: age, content: 'Under 18' })],
        }),
      ],
    })

    expect(() => checkProgramRules(schema)).not.toThrow()
    expect(buildRuleEngine(schema).evaluateAll({ event: [[age, 17]], programStage: stage })).toEqual([
      expect.objectContaining({ rule: minorRule, type: 'SHOWWARNING', data: '' }),
    ])
  })

  it('reports unknown variables with suggestions before evaluation', () => {
    const badRule = defineProgramRule({
      code: 'PR_BAD_REF',
      name: 'Bad ref',
      program,
      condition: '#{gae} < 18',
      actions: [action.hideField({ on: review })],
    })
    const schema = defineSchema({
      organisationUnits: [ou],
      dataElements: [age, review],
      programStages: [stage],
      programs: [program],
      programRuleVariables: [ageVariable],
      programRules: [badRule],
    })

    expect(() => checkProgramRules(schema)).toThrow(ProgramRuleValidationError)
    expect(() => checkProgramRules(schema)).toThrow(/Did you mean #\{age\}/)
  })

  it('rejects constants with a clear MVP error', () => {
    const badRule = defineProgramRule({
      code: 'PR_CONSTANT',
      name: 'Constant ref',
      program,
      condition: 'C{THRESHOLD} > 18',
      actions: [action.hideField({ on: review })],
    })
    const schema = defineSchema({
      organisationUnits: [ou],
      dataElements: [age, review],
      programStages: [stage],
      programs: [program],
      programRuleVariables: [ageVariable],
      programRules: [badRule],
    })

    expect(() => checkProgramRules(schema)).toThrow(/does not support constants/)
  })
})
