import { describe, expect, it } from 'vitest'
import {
  action,
  defineDataElement,
  defineOptionSet,
  defineOrganisationUnit,
  defineProgram,
  defineProgramRule,
  defineProgramRuleVariable,
  defineProgramStage,
  defineRuleTest,
  defineSchema,
  defineTrackedEntityAttribute,
  effect,
} from '@devotta-labs/declare'
import {
  ProgramRuleValidationError,
  buildRuleEngine,
  checkProgramRules,
  evaluateRule,
  formatRuleDiagnostics,
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

const visitDate = defineDataElement({
  code: 'DE_RULE_VISIT_DATE',
  name: 'Visit date',
  valueType: 'DATE',
  aggregationType: 'NONE',
})

const consent = defineDataElement({
  code: 'DE_RULE_CONSENT',
  name: 'Consent',
  valueType: 'BOOLEAN',
  aggregationType: 'NONE',
})

const statusOptions = defineOptionSet({
  code: 'OS_RULE_STATUS',
  name: 'Rule status',
  valueType: 'TEXT',
  options: [
    { code: 'OPEN', name: 'Open' },
    { code: 'CLOSED', name: 'Closed' },
  ],
})

const status = defineTrackedEntityAttribute({
  code: 'TEA_RULE_STATUS',
  name: 'Rule status',
  valueType: 'TEXT',
  optionSet: statusOptions,
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

const statusVariable = defineProgramRuleVariable({
  code: 'PRV_RULE_STATUS',
  name: 'patientStatus',
  program,
  programRuleVariableSourceType: 'TEI_ATTRIBUTE',
  trackedEntityAttribute: status,
  useCodeForOptionSet: true,
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

  it('maps declared action contracts through the real rule engine', () => {
    const allActionsRule = defineProgramRule({
      code: 'PR_ALL_ACTIONS',
      name: 'All actions',
      program,
      condition: 'true',
      priority: 3,
      actions: [
        action.displayText({ content: 'Age', on: age, priority: 1 }),
        action.displayKeyValuePair({ content: 'Status', on: status }),
        action.hideField({ on: age }),
        action.hideSection({ section: 'Section123' }),
        action.hideProgramStage({ programStage: stage }),
        action.assign({ target: age, value: 'true' }),
        action.showWarning({ on: age, content: 'Warning' }),
        action.warningOnComplete({ on: age, content: 'Complete warning' }),
        action.showError({ on: age, content: 'Error' }),
        action.errorOnComplete({ on: age, content: 'Complete error' }),
        action.scheduleEvent({ programStage: stage }),
        action.createEvent({ programStage: stage }),
        action.setMandatoryField({ on: status }),
        action.sendMessage({
          content: 'Now',
          templateUid: 'Template123',
        }),
        action.scheduleMessage({
          content: 'Later',
          templateUid: 'Template123',
        }),
        action.hideOption({ on: age, option: 'hidden' }),
        action.showOptionGroup({ on: age, optionGroup: 'shown' }),
        action.hideOptionGroup({ on: age, optionGroup: 'hidden' }),
      ],
    })
    const schema = defineSchema({
      organisationUnits: [ou],
      optionSets: [statusOptions],
      trackedEntityAttributes: [status],
      dataElements: [age, review],
      programStages: [stage],
      programs: [program],
      programRuleVariables: [ageVariable, statusVariable],
      programRules: [allActionsRule],
    })

    const evaluated = evaluateRule(schema, allActionsRule, {
      event: [[age, 17]],
      attributes: [[status, 'OPEN']],
    })

    expect(evaluated).toEqual([
      { ...effect.displayText({ content: 'Age', on: age }), priority: 1 },
      effect.hideField({ on: age }),
      effect.hideSection({ section: 'Section123' }),
      effect.hideProgramStage({ programStage: stage }),
      effect.assign({ target: age, data: 'true' }),
      effect.showWarning({ on: age, content: 'Warning' }),
      effect.warningOnComplete({ on: age, content: 'Complete warning' }),
      effect.showError({ on: age, content: 'Error' }),
      effect.errorOnComplete({ on: age, content: 'Complete error' }),
      effect.scheduleEvent({ programStage: stage }),
      effect.createEvent({ programStage: stage }),
      effect.sendMessage({ content: 'Now', templateUid: 'Template123' }),
      effect.scheduleMessage({
        content: 'Later',
        templateUid: 'Template123',
      }),
      effect.hideOption({ on: age, option: 'hidden' }),
      effect.showOptionGroup({ on: age, optionGroup: 'shown' }),
      effect.hideOptionGroup({ on: age, optionGroup: 'hidden' }),
    ])
    expect(evaluated.map((result) => result.type)).not.toContain('DISPLAYKEYVALUEPAIR')
    expect(evaluated.map((result) => result.type)).not.toContain('SETMANDATORYFIELD')
  })

  it('compiles numeric, date, boolean, text, and calculated variables', () => {
    const visitDateVariable = defineProgramRuleVariable({
      code: 'PRV_RULE_VISIT_DATE',
      name: 'visitDate',
      program,
      programRuleVariableSourceType: 'DATAELEMENT_CURRENT_EVENT',
      dataElement: visitDate,
    })
    const consentVariable = defineProgramRuleVariable({
      code: 'PRV_RULE_CONSENT',
      name: 'consent',
      program,
      programRuleVariableSourceType: 'DATAELEMENT_CURRENT_EVENT',
      dataElement: consent,
    })
    const calculatedVariable = defineProgramRuleVariable({
      code: 'PRV_RULE_CALCULATED',
      name: 'calculated',
      program,
      programRuleVariableSourceType: 'CALCULATED_VALUE',
      valueType: 'NUMBER',
    })
    const schema = defineSchema({
      organisationUnits: [ou],
      optionSets: [statusOptions],
      trackedEntityAttributes: [status],
      dataElements: [age, review, visitDate, consent],
      programStages: [stage],
      programs: [program],
      programRuleVariables: [
        ageVariable,
        statusVariable,
        visitDateVariable,
        consentVariable,
        calculatedVariable,
      ],
      programRules: [minorRule],
    })

    expect(() => buildRuleEngine(schema)).not.toThrow()
  })

  it.each([
    {
      label: 'event and enrollment values',
      given: {
        event: [[age, 17]] as const,
        attributes: [[status, 'OPEN']] as const,
        programStage: stage,
      },
      expected: true,
    },
    {
      label: 'a non-matching attribute',
      given: {
        event: [[age, 17]] as const,
        attributes: [[status, 'CLOSED']] as const,
        programStage: stage,
      },
      expected: false,
    },
    {
      label: 'null values omitted from the engine input',
      given: {
        event: [[age, null]] as const,
        attributes: [[status, null]] as const,
        programStage: stage,
      },
      expected: false,
    },
  ])('evaluates $label', ({ given, expected }) => {
    const enrollmentRule = defineProgramRule({
      code: 'PR_EVENT_ENROLLMENT',
      name: 'Event and enrollment',
      program,
      condition: "#{age} < 18 && #{patientStatus} == 'OPEN'",
      actions: [action.hideField({ on: review })],
    })
    const schema = defineSchema({
      organisationUnits: [ou],
      optionSets: [statusOptions],
      trackedEntityAttributes: [status],
      dataElements: [age, review],
      programStages: [stage],
      programs: [program],
      programRuleVariables: [ageVariable, statusVariable],
      programRules: [enrollmentRule],
    })

    expect(evaluateRule(schema, enrollmentRule, given)).toEqual(
      expected ? [effect.hideField({ on: review })] : [],
    )
  })

  it('accepts the complete event and enrollment context', () => {
    const schema = defineSchema({
      organisationUnits: [ou],
      dataElements: [age, review],
      programStages: [stage],
      programs: [program],
      programRuleVariables: [ageVariable],
      programRules: [minorRule],
    })

    expect(
      evaluateRule(schema, minorRule, {
        event: [[age, 17]],
        programStage: stage,
        eventDate: '2024-01-01',
        dueDate: '2024-01-02',
        enrollmentDate: '2023-12-01',
        incidentDate: '2023-11-01',
        organisationUnit: 'Ou123456789',
        organisationUnitCode: 'OU_CODE',
      }),
    ).toEqual([effect.showWarning({ on: age, content: 'Under 18' })])
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

  it('reports duplicate variable names within a program', () => {
    const duplicate = defineProgramRuleVariable({
      code: 'PRV_RULE_AGE_DUPLICATE',
      name: 'age',
      program,
      programRuleVariableSourceType: 'DATAELEMENT_NEWEST_EVENT_PROGRAM',
      dataElement: age,
    })
    const schema = defineSchema({
      organisationUnits: [ou],
      dataElements: [age, review],
      programStages: [stage],
      programs: [program],
      programRuleVariables: [ageVariable, duplicate],
      programRules: [minorRule],
    })

    expect(() => checkProgramRules(schema)).toThrow(
      /Duplicate program rule variable name 'age'.*PRV_RULE_AGE/,
    )
  })

  it('reports unknown variables without a misleading suggestion', () => {
    const badRule = defineProgramRule({
      code: 'PR_UNKNOWN_REF',
      name: 'Unknown ref',
      program,
      condition: '#{completelyDifferent} < 18',
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

    expect(() => checkProgramRules(schema)).toThrow(
      /references unknown rule variable #\{completelyDifferent\}\./,
    )
    expect(() => checkProgramRules(schema)).not.toThrow(/Did you mean/)
  })

  it('reports malformed DHIS2 expressions', () => {
    const badRule = defineProgramRule({
      code: 'PR_BAD_EXPRESSION',
      name: 'Bad expression',
      program,
      condition: '#{age} <',
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

    expect(() => checkProgramRules(schema)).toThrow(/is not a valid DHIS2 expression/)
  })

  it('reports unknown variables in action data and calculated assignment targets', () => {
    const missingTarget = defineProgramRuleVariable({
      code: 'PRV_MISSING_TARGET',
      name: 'missingTarget',
      program,
      programRuleVariableSourceType: 'CALCULATED_VALUE',
      valueType: 'NUMBER',
    })
    const badRule = defineProgramRule({
      code: 'PR_BAD_ACTION_REFS',
      name: 'Bad action refs',
      program,
      condition: 'true',
      actions: [
        action.createEvent({ programStage: stage, data: '#{missingData}' }),
        action.assign({ target: missingTarget, value: '1' }),
      ],
    })
    const schema = defineSchema({
      organisationUnits: [ou],
      dataElements: [age, review],
      programStages: [stage],
      programs: [program],
      programRuleVariables: [ageVariable],
      programRules: [badRule],
    })

    expect(() => checkProgramRules(schema)).toThrow(/unknown rule variable #\{missingData\}/)
    expect(() => checkProgramRules(schema)).toThrow(
      /assigns to unknown calculated variable #\{missingTarget\}/,
    )
  })

  it('reports rule tests whose rules are missing from the schema', () => {
    const schema = defineSchema({
      organisationUnits: [ou],
      dataElements: [age, review],
      programStages: [stage],
      programs: [program],
      programRuleVariables: [ageVariable],
      ruleTests: [
        defineRuleTest({
          rule: minorRule,
          given: { event: [[age, 17]], programStage: stage },
          expect: [effect.showWarning({ on: age, content: 'Under 18' })],
        }),
      ],
    })

    expect(() => checkProgramRules(schema)).toThrow(
      /PR_MINOR, but that rule is not included in the schema/,
    )
  })

  it('reports a stable diff when a declared rule test fails', () => {
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
          expect: [effect.hideField({ on: review })],
        }),
      ],
    })

    expect(() => checkProgramRules(schema)).toThrow(/Rule test failed\. Expected .*HIDEFIELD.*SHOWWARNING/)
  })

  it('does nothing when the schema has no program-rule metadata', () => {
    const schema = defineSchema({
      organisationUnits: [ou],
      dataElements: [age],
    })

    expect(() => checkProgramRules(schema)).not.toThrow()
    expect(buildRuleEngine(schema).evaluateAll({})).toEqual([])
  })

  it('rejects evaluation of a rule from an uncompiled program', () => {
    const otherProgram = defineProgram({
      code: 'PRG_RULE_OTHER',
      name: 'Other rule program',
      programType: 'WITHOUT_REGISTRATION',
      organisationUnits: [ou],
      programStages: [stage],
    })
    const otherRule = defineProgramRule({
      code: 'PR_OTHER',
      name: 'Other program rule',
      program: otherProgram,
      condition: 'true',
      actions: [action.hideField({ on: review })],
    })
    const schema = defineSchema({
      organisationUnits: [ou],
      dataElements: [age, review],
      programStages: [stage],
      programs: [program],
      programRuleVariables: [ageVariable],
      programRules: [minorRule],
    })

    expect(() => buildRuleEngine(schema).evaluate(otherRule, {})).toThrow(
      /PRG_RULE_OTHER has no compiled program-rule context/,
    )
  })

  it('formats multiple diagnostics for CLI output', () => {
    expect(
      formatRuleDiagnostics([
        { code: 'PR_FIRST', message: 'First problem' },
        { code: 'PR_SECOND', message: 'Second problem' },
      ]),
    ).toBe(
      [
        'Program rule validation failed:',
        '  - PR_FIRST: First problem',
        '  - PR_SECOND: Second problem',
      ].join('\n'),
    )
  })
})
