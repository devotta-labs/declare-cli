import { afterEach, describe, expect, it } from 'vitest'
import { defineDataElement } from './dataElement.ts'
import { defineOrganisationUnit } from './organisationUnit.ts'
import { defineProgram } from './program.ts'
import {
  action,
  defineProgramRule,
  defineProgramRuleVariable,
  effect,
} from './programRule.ts'
import { defineProgramStage } from './programStage.ts'
import { defineProgramStageSection } from './programStageSection.ts'
import { defineSchema } from './schema.ts'
import { defineTrackedEntityAttribute } from './trackedEntityAttribute.ts'
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

const status = defineTrackedEntityAttribute({
  code: 'TEA_STATUS',
  name: 'Status',
  valueType: 'TEXT',
})

const stage = defineProgramStage({
  code: 'PST_RULES',
  name: 'Rules stage',
  programStageDataElements: [{ dataElement: age }],
})

const section = defineProgramStageSection({
  code: 'PSSEC_RULES',
  name: 'Rules section',
  dataElements: [age],
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

  it.each([
    {
      source: 'current event data element',
      input: {
        code: 'PRV_CURRENT',
        name: 'currentAge',
        program,
        programRuleVariableSourceType: 'DATAELEMENT_CURRENT_EVENT' as const,
        dataElement: age,
      },
      expected: { valueType: 'INTEGER_ZERO_OR_POSITIVE', useCodeForOptionSet: false },
    },
    {
      source: 'newest staged data element',
      input: {
        code: 'PRV_STAGED',
        name: 'stagedAge',
        program,
        programRuleVariableSourceType: 'DATAELEMENT_NEWEST_EVENT_PROGRAM_STAGE' as const,
        dataElement: age,
        programStage: stage,
      },
      expected: {
        valueType: 'INTEGER_ZERO_OR_POSITIVE',
        useCodeForOptionSet: false,
        programStage: stage,
      },
    },
    {
      source: 'tracked entity attribute',
      input: {
        code: 'PRV_STATUS',
        name: 'patientStatus',
        program,
        programRuleVariableSourceType: 'TEI_ATTRIBUTE' as const,
        trackedEntityAttribute: status,
        useCodeForOptionSet: true,
      },
      expected: { valueType: 'TEXT', useCodeForOptionSet: true },
    },
    {
      source: 'calculated value',
      input: {
        code: 'PRV_CALCULATED',
        name: 'calculatedAge',
        program,
        programRuleVariableSourceType: 'CALCULATED_VALUE' as const,
        valueType: 'NUMBER' as const,
      },
      expected: { valueType: 'NUMBER', useCodeForOptionSet: false },
    },
  ])('defines a $source variable with the expected value type', ({ input, expected }) => {
    expect(defineProgramRuleVariable(input).input).toEqual(expect.objectContaining(expected))
  })

  it.each([
    {
      name: 'a staged data-element variable without a stage',
      input: {
        code: 'PRV_NO_STAGE',
        name: 'missingStage',
        program,
        programRuleVariableSourceType: 'DATAELEMENT_NEWEST_EVENT_PROGRAM_STAGE',
        dataElement: age,
      },
      message: /programStage/,
    },
    {
      name: 'a calculated variable without a value type',
      input: {
        code: 'PRV_NO_TYPE',
        name: 'missingType',
        program,
        programRuleVariableSourceType: 'CALCULATED_VALUE',
      },
      message: /valueType/,
    },
    {
      name: 'an invalid expression variable name',
      input: {
        code: 'PRV_BAD_NAME',
        name: '2 bad-name',
        program,
        programRuleVariableSourceType: 'DATAELEMENT_CURRENT_EVENT',
        dataElement: age,
      },
      message: /name must start with a letter/,
    },
  ])('rejects $name', ({ input, message }) => {
    expect(() =>
      defineProgramRuleVariable(
        input as Parameters<typeof defineProgramRuleVariable>[0],
      ),
    ).toThrow(message)
  })

  it.each([
    {
      label: 'display text',
      type: 'DISPLAYTEXT',
      actionSpec: action.displayText({
        content: 'Age',
        value: "'Shown'",
        on: age,
        evaluationTime: 'ON_DATA_ENTRY',
        priority: 7,
      }),
      effectSpec: effect.displayText({ content: 'Age', data: 'Shown', on: age }),
      expectedAction: { content: 'Age', data: "'Shown'", dataElement: age },
      expectedEffect: {
        data: 'Shown',
        values: { content: 'Age', field: age.code, attributeType: 'DATA_ELEMENT' },
      },
    },
    {
      label: 'display key/value pair',
      type: 'DISPLAYKEYVALUEPAIR',
      actionSpec: action.displayKeyValuePair({
        content: 'Status',
        value: "'Open'",
        on: status,
        evaluationTime: 'ON_DATA_ENTRY',
        priority: 7,
      }),
      effectSpec: effect.displayKeyValuePair({ content: 'Status', data: 'Open', on: status }),
      expectedAction: { content: 'Status', data: "'Open'", trackedEntityAttribute: status },
      expectedEffect: {
        data: 'Open',
        values: {
          content: 'Status',
          field: status.code,
          attributeType: 'TRACKED_ENTITY_ATTRIBUTE',
        },
      },
    },
    {
      label: 'hide field',
      type: 'HIDEFIELD',
      actionSpec: action.hideField({ on: age, evaluationTime: 'ON_DATA_ENTRY', priority: 7 }),
      effectSpec: effect.hideField({ on: age }),
      expectedAction: { dataElement: age },
      expectedEffect: {
        data: '',
        values: { field: age.code, attributeType: 'DATA_ELEMENT' },
      },
    },
    {
      label: 'hide section',
      type: 'HIDESECTION',
      actionSpec: action.hideSection({
        section,
        evaluationTime: 'ON_DATA_ENTRY',
        priority: 7,
      }),
      effectSpec: effect.hideSection({ section }),
      expectedAction: {},
      expectedEffect: { data: '' },
    },
    {
      label: 'hide program stage',
      type: 'HIDEPROGRAMSTAGE',
      actionSpec: action.hideProgramStage({
        programStage: stage,
        evaluationTime: 'ON_DATA_ENTRY',
        priority: 7,
      }),
      effectSpec: effect.hideProgramStage({ programStage: stage }),
      expectedAction: { programStage: stage },
      expectedEffect: { data: '', values: { programStage: stage.code } },
    },
    {
      label: 'assign field',
      type: 'ASSIGN',
      actionSpec: action.assign({
        target: age,
        value: '10',
        evaluationTime: 'ON_DATA_ENTRY',
        priority: 7,
      }),
      effectSpec: effect.assign({ target: age, data: '10' }),
      expectedAction: { data: '10', dataElement: age },
      expectedEffect: {
        data: '10',
        values: { field: age.code, attributeType: 'DATA_ELEMENT' },
      },
    },
    {
      label: 'show warning',
      type: 'SHOWWARNING',
      actionSpec: action.showWarning({
        on: age,
        content: 'Warning',
        evaluationTime: 'ON_DATA_ENTRY',
        priority: 7,
      }),
      effectSpec: effect.showWarning({ on: age, content: 'Warning' }),
      expectedAction: { content: 'Warning', dataElement: age },
      expectedEffect: {
        data: '',
        values: {
          content: 'Warning',
          field: age.code,
          attributeType: 'DATA_ELEMENT',
        },
      },
    },
    {
      label: 'warning on complete',
      type: 'WARNINGONCOMPLETE',
      actionSpec: action.warningOnComplete({
        on: age,
        content: 'Warning',
        evaluationTime: 'ON_DATA_ENTRY',
        priority: 7,
      }),
      effectSpec: effect.warningOnComplete({ on: age, content: 'Warning' }),
      expectedAction: { content: 'Warning', dataElement: age },
      expectedEffect: {
        data: '',
        values: {
          content: 'Warning',
          field: age.code,
          attributeType: 'DATA_ELEMENT',
        },
      },
    },
    {
      label: 'show error',
      type: 'SHOWERROR',
      actionSpec: action.showError({
        on: age,
        content: 'Error',
        evaluationTime: 'ON_DATA_ENTRY',
        priority: 7,
      }),
      effectSpec: effect.showError({ on: age, content: 'Error' }),
      expectedAction: { content: 'Error', dataElement: age },
      expectedEffect: {
        data: '',
        values: { content: 'Error', field: age.code, attributeType: 'DATA_ELEMENT' },
      },
    },
    {
      label: 'error on complete',
      type: 'ERRORONCOMPLETE',
      actionSpec: action.errorOnComplete({
        on: age,
        content: 'Error',
        evaluationTime: 'ON_DATA_ENTRY',
        priority: 7,
      }),
      effectSpec: effect.errorOnComplete({ on: age, content: 'Error' }),
      expectedAction: { content: 'Error', dataElement: age },
      expectedEffect: {
        data: '',
        values: { content: 'Error', field: age.code, attributeType: 'DATA_ELEMENT' },
      },
    },
    {
      label: 'schedule event',
      type: 'SCHEDULEEVENT',
      actionSpec: action.scheduleEvent({
        programStage: stage,
        data: "'2020-01-02'",
        evaluationTime: 'ON_DATA_ENTRY',
        priority: 7,
      }),
      effectSpec: effect.scheduleEvent({ programStage: stage, data: '2020-01-02' }),
      expectedAction: { data: "'2020-01-02'", programStage: stage },
      expectedEffect: { data: '2020-01-02', values: { programStage: stage.code } },
    },
    {
      label: 'create event',
      type: 'CREATEEVENT',
      actionSpec: action.createEvent({
        programStage: stage,
        data: "'2020-01-02'",
        evaluationTime: 'ON_DATA_ENTRY',
        priority: 7,
      }),
      effectSpec: effect.createEvent({ programStage: stage, data: '2020-01-02' }),
      expectedAction: { data: "'2020-01-02'", programStage: stage },
      expectedEffect: { data: '2020-01-02', values: { programStage: stage.code } },
    },
    {
      label: 'set mandatory field',
      type: 'SETMANDATORYFIELD',
      actionSpec: action.setMandatoryField({
        on: status,
        evaluationTime: 'ON_DATA_ENTRY',
        priority: 7,
      }),
      effectSpec: effect.setMandatoryField({ on: status }),
      expectedAction: { trackedEntityAttribute: status },
      expectedEffect: {
        data: '',
        values: { field: status.code, attributeType: 'TRACKED_ENTITY_ATTRIBUTE' },
      },
    },
    {
      label: 'send message',
      type: 'SENDMESSAGE',
      actionSpec: action.sendMessage({
        content: 'Now',
        data: "'payload'",
        templateUid: 'Template123',
        evaluationTime: 'ON_DATA_ENTRY',
        priority: 7,
      }),
      effectSpec: effect.sendMessage({
        content: 'Now',
        data: 'payload',
        templateUid: 'Template123',
      }),
      expectedAction: { content: 'Now', data: "'payload'", templateUid: 'Template123' },
      expectedEffect: {
        data: 'payload',
        values: { content: 'Now', templateUid: 'Template123' },
      },
    },
    {
      label: 'schedule message',
      type: 'SCHEDULEMESSAGE',
      actionSpec: action.scheduleMessage({
        content: 'Later',
        data: "'payload'",
        templateUid: 'Template123',
        evaluationTime: 'ON_DATA_ENTRY',
        priority: 7,
      }),
      effectSpec: effect.scheduleMessage({
        content: 'Later',
        data: 'payload',
        templateUid: 'Template123',
      }),
      expectedAction: { content: 'Later', data: "'payload'", templateUid: 'Template123' },
      expectedEffect: {
        data: 'payload',
        values: { content: 'Later', templateUid: 'Template123' },
      },
    },
    {
      label: 'hide option',
      type: 'HIDEOPTION',
      actionSpec: action.hideOption({
        on: age,
        option: 'hidden',
        evaluationTime: 'ON_DATA_ENTRY',
        priority: 7,
      }),
      effectSpec: effect.hideOption({ on: age, option: 'hidden' }),
      expectedAction: { dataElement: age, option: 'hidden' },
      expectedEffect: {
        data: '',
        values: { option: 'hidden', field: age.code, attributeType: 'DATA_ELEMENT' },
      },
    },
    {
      label: 'show option group',
      type: 'SHOWOPTIONGROUP',
      actionSpec: action.showOptionGroup({
        on: age,
        optionGroup: 'shown',
        evaluationTime: 'ON_DATA_ENTRY',
        priority: 7,
      }),
      effectSpec: effect.showOptionGroup({ on: age, optionGroup: 'shown' }),
      expectedAction: { dataElement: age, optionGroup: 'shown' },
      expectedEffect: {
        data: '',
        values: { optionGroup: 'shown', field: age.code, attributeType: 'DATA_ELEMENT' },
      },
    },
    {
      label: 'hide option group',
      type: 'HIDEOPTIONGROUP',
      actionSpec: action.hideOptionGroup({
        on: age,
        optionGroup: 'hidden',
        evaluationTime: 'ON_DATA_ENTRY',
        priority: 7,
      }),
      effectSpec: effect.hideOptionGroup({ on: age, optionGroup: 'hidden' }),
      expectedAction: { dataElement: age, optionGroup: 'hidden' },
      expectedEffect: {
        data: '',
        values: { optionGroup: 'hidden', field: age.code, attributeType: 'DATA_ELEMENT' },
      },
    },
  ])('builds matching $label action and effect contracts', ({
    type,
    actionSpec,
    effectSpec,
    expectedAction,
    expectedEffect,
  }) => {
    const rule = defineProgramRule({
      code: `PR_${type}`,
      name: `${type} rule`,
      program,
      condition: 'true',
      actions: [actionSpec],
    })
    const declaredAction = rule.input.programRuleActions[0]

    expect(declaredAction?.input).toEqual(
      expect.objectContaining({
        programRuleActionType: type,
        evaluationTime: 'ON_DATA_ENTRY',
        priority: 7,
        ...expectedAction,
      }),
    )
    expect(effectSpec).toEqual({
      type,
      priority: null,
      ...expectedEffect,
      ...(type === 'HIDESECTION'
        ? {
            values: {
              programStageSection: declaredAction?.input.programStageSection,
            },
          }
        : {}),
    })
  })

  it('assigns to a calculated variable through its expression name', () => {
    const calculated = defineProgramRuleVariable({
      code: 'PRV_RESULT',
      name: 'result',
      program,
      programRuleVariableSourceType: 'CALCULATED_VALUE',
      valueType: 'NUMBER',
    })
    const rule = defineProgramRule({
      code: 'PR_ASSIGN_RESULT',
      name: 'Assign result',
      program,
      condition: 'true',
      actions: [action.assign({ target: calculated, value: '42' })],
    })

    expect(rule.input.programRuleActions[0]?.input).toEqual(
      expect.objectContaining({
        content: '#{result}',
        data: '42',
        evaluationTime: 'ALWAYS',
      }),
    )
    expect(effect.assign({ target: calculated, data: '42' })).toEqual({
      type: 'ASSIGN',
      data: '42',
      values: { content: '#{result}' },
      priority: null,
    })
  })

  it('accepts a raw program-stage section UID', () => {
    const rule = defineProgramRule({
      code: 'PR_HIDE_SECTION_UID',
      name: 'Hide section by UID',
      program,
      condition: 'true',
      actions: [action.hideSection({ section: 'Section123' })],
    })

    expect(rule.input.programRuleActions[0]?.input.programStageSection).toBe('Section123')
    expect(effect.hideSection({ section: 'Section123' }).values).toEqual({
      programStageSection: 'Section123',
    })
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

  it('keeps generated action codes unique when long rule codes share a prefix', () => {
    const firstRule = defineProgramRule({
      code: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ_ABCDEFGHI_X',
      name: 'First long code rule',
      program,
      condition: 'true',
      actions: [action.showWarning({ on: age, content: 'First' })],
    })
    const secondRule = defineProgramRule({
      code: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ_ABCDEFGHI_Y',
      name: 'Second long code rule',
      program,
      condition: 'true',
      actions: [action.showWarning({ on: age, content: 'Second' })],
    })

    const firstAction = firstRule.input.programRuleActions[0]
    const secondAction = secondRule.input.programRuleActions[0]

    expect(firstAction?.code).toMatch(/^[A-Z][A-Z0-9_]{0,49}$/)
    expect(secondAction?.code).toMatch(/^[A-Z][A-Z0-9_]{0,49}$/)
    expect(firstAction?.code).not.toBe(secondAction?.code)
    expect(() =>
      defineSchema({
        organisationUnits: [ou],
        dataElements: [age],
        programStages: [stage],
        programs: [program],
        programRules: [firstRule, secondRule],
      }),
    ).not.toThrow()
  })
})
