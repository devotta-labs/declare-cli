import { z } from 'zod'
import { ValueTypeByTarget } from '../generated/enums.ts'
import type { ValueType } from '../generated/enums.ts'
import { getTarget, type Target } from '../generated/runtime.ts'
import type { CurrentTarget } from './currentTarget.ts'
import {
  CodeSchema,
  DescriptionSchema,
  NameSchema,
  makeHandle,
  refSchema,
  type Handle,
  type Ref,
} from './core.ts'
import type { DataElement } from './dataElement.ts'
import type { Program } from './program.ts'
import type { ProgramStage } from './programStage.ts'
import type { TrackedEntityAttribute } from './trackedEntityAttribute.ts'

export const ProgramRuleVariableSourceType = z.enum([
  'DATAELEMENT_NEWEST_EVENT_PROGRAM_STAGE',
  'DATAELEMENT_NEWEST_EVENT_PROGRAM',
  'DATAELEMENT_CURRENT_EVENT',
  'DATAELEMENT_PREVIOUS_EVENT',
  'CALCULATED_VALUE',
  'TEI_ATTRIBUTE',
])
export type ProgramRuleVariableSourceType = z.infer<typeof ProgramRuleVariableSourceType>

const ProgramRuleActionType_2_40 = z.enum([
  'DISPLAYTEXT',
  'DISPLAYKEYVALUEPAIR',
  'HIDEFIELD',
  'HIDESECTION',
  'HIDEPROGRAMSTAGE',
  'ASSIGN',
  'SHOWWARNING',
  'WARNINGONCOMPLETE',
  'SHOWERROR',
  'ERRORONCOMPLETE',
  'CREATEEVENT',
  'SETMANDATORYFIELD',
  'SENDMESSAGE',
  'SCHEDULEMESSAGE',
  'HIDEOPTION',
  'SHOWOPTIONGROUP',
  'HIDEOPTIONGROUP',
])

const ProgramRuleActionType_2_41 = ProgramRuleActionType_2_40

const ProgramRuleActionType_2_42 = z.enum([
  'DISPLAYTEXT',
  'DISPLAYKEYVALUEPAIR',
  'HIDEFIELD',
  'HIDESECTION',
  'HIDEPROGRAMSTAGE',
  'ASSIGN',
  'SHOWWARNING',
  'WARNINGONCOMPLETE',
  'SHOWERROR',
  'ERRORONCOMPLETE',
  'SCHEDULEEVENT',
  'CREATEEVENT',
  'SETMANDATORYFIELD',
  'SENDMESSAGE',
  'SCHEDULEMESSAGE',
  'HIDEOPTION',
  'SHOWOPTIONGROUP',
  'HIDEOPTIONGROUP',
])

export const ProgramRuleActionType = ProgramRuleActionType_2_42
export type ProgramRuleActionType = z.infer<typeof ProgramRuleActionType>

const ProgramRuleActionTypeByTarget = {
  '2.40': ProgramRuleActionType_2_40,
  '2.41': ProgramRuleActionType_2_41,
  '2.42': ProgramRuleActionType_2_42,
} as const

export const ProgramRuleActionEvaluationTime = z.enum([
  'ON_DATA_ENTRY',
  'ON_COMPLETE',
  'ALWAYS',
])
export type ProgramRuleActionEvaluationTime = z.infer<
  typeof ProgramRuleActionEvaluationTime
>

const VariableNameSchema = z
  .string()
  .min(1, 'name is required')
  .max(230)
  .regex(
    /^[A-Za-z][A-Za-z0-9_]*$/,
    'name must start with a letter and contain only letters, digits and underscores',
  )

const ValueTypeSchema = (target: Target) => ValueTypeByTarget[target]

const CommonVariableSchema = (target: Target) =>
  z.object({
    code: CodeSchema,
    name: VariableNameSchema,
    program: refSchema('Program'),
    valueType: ValueTypeSchema(target).optional(),
    useCodeForOptionSet: z.boolean().default(false),
  })

const DataElementVariableSchema = (target: Target) =>
  CommonVariableSchema(target).extend({
    programRuleVariableSourceType: z.enum([
      'DATAELEMENT_NEWEST_EVENT_PROGRAM',
      'DATAELEMENT_CURRENT_EVENT',
      'DATAELEMENT_PREVIOUS_EVENT',
    ]),
    dataElement: refSchema('DataElement'),
    programStage: refSchema('ProgramStage').optional(),
  })

const StagedDataElementVariableSchema = (target: Target) =>
  CommonVariableSchema(target).extend({
    programRuleVariableSourceType: z.literal('DATAELEMENT_NEWEST_EVENT_PROGRAM_STAGE'),
    dataElement: refSchema('DataElement'),
    programStage: refSchema('ProgramStage'),
  })

const AttributeVariableSchema = (target: Target) =>
  CommonVariableSchema(target).extend({
    programRuleVariableSourceType: z.literal('TEI_ATTRIBUTE'),
    trackedEntityAttribute: refSchema('TrackedEntityAttribute'),
  })

const CalculatedVariableSchema = (target: Target) =>
  CommonVariableSchema(target).extend({
    programRuleVariableSourceType: z.literal('CALCULATED_VALUE'),
    valueType: ValueTypeSchema(target),
  })

function variableSchemaFor(target: Target) {
  return z
    .discriminatedUnion('programRuleVariableSourceType', [
      DataElementVariableSchema(target),
      StagedDataElementVariableSchema(target),
      AttributeVariableSchema(target),
      CalculatedVariableSchema(target),
    ])
    .transform((value) => {
      if (value.valueType) return value
      if ('dataElement' in value) {
        return { ...value, valueType: (value.dataElement as DataElement).input.valueType }
      }
      if ('trackedEntityAttribute' in value) {
        return {
          ...value,
          valueType: (value.trackedEntityAttribute as TrackedEntityAttribute).input.valueType,
        }
      }
      return value
    })
}

const VariableSchemas = {
  '2.40': variableSchemaFor('2.40'),
  '2.41': variableSchemaFor('2.41'),
  '2.42': variableSchemaFor('2.42'),
} as const

type DataElementVariableOutput = Omit<
  z.output<ReturnType<typeof DataElementVariableSchema>>,
  'program' | 'dataElement' | 'programStage' | 'valueType'
> & {
  program: Program
  dataElement: DataElement
  programStage?: ProgramStage | undefined
  valueType: ValueType
}

type StagedDataElementVariableOutput = Omit<
  z.output<ReturnType<typeof StagedDataElementVariableSchema>>,
  'program' | 'dataElement' | 'programStage' | 'valueType'
> & {
  program: Program
  dataElement: DataElement
  programStage: ProgramStage
  valueType: ValueType
}

type AttributeVariableOutput = Omit<
  z.output<ReturnType<typeof AttributeVariableSchema>>,
  'program' | 'trackedEntityAttribute' | 'valueType'
> & {
  program: Program
  trackedEntityAttribute: TrackedEntityAttribute
  valueType: ValueType
}

type CalculatedVariableOutput = Omit<
  z.output<ReturnType<typeof CalculatedVariableSchema>>,
  'program'
> & {
  program: Program
}

type ProgramRuleVariableOutput =
  | DataElementVariableOutput
  | StagedDataElementVariableOutput
  | AttributeVariableOutput
  | CalculatedVariableOutput

export type ProgramRuleVariableInput = z.input<(typeof VariableSchemas)[CurrentTarget]>
export type ProgramRuleVariable = Handle<
  'ProgramRuleVariable',
  ProgramRuleVariableOutput
>

export function defineProgramRuleVariable(
  input: ProgramRuleVariableInput,
): ProgramRuleVariable {
  const parsed = VariableSchemas[getTarget()].parse(input) as z.output<
    (typeof VariableSchemas)[CurrentTarget]
  >
  return makeHandle('ProgramRuleVariable', parsed as ProgramRuleVariableOutput)
}

type FieldTarget = DataElement | TrackedEntityAttribute

type FieldTargetFields =
  | { dataElement: DataElement; trackedEntityAttribute?: never }
  | { dataElement?: never; trackedEntityAttribute: TrackedEntityAttribute }

function fieldTarget(target: FieldTarget): FieldTargetFields {
  if (target.kind === 'DataElement') return { dataElement: target }
  return { trackedEntityAttribute: target }
}

function fieldName(target: FieldTarget): string {
  return target.code
}

function expressionTarget(target: FieldTarget | ProgramRuleVariable): {
  content?: string
  dataElement?: DataElement
  trackedEntityAttribute?: TrackedEntityAttribute
} {
  if (target.kind === 'ProgramRuleVariable') return { content: `#{${target.input.name}}` }
  return fieldTarget(target)
}

export type ProgramRuleActionSpec = {
  readonly programRuleActionType: ProgramRuleActionType
  readonly evaluationTime?: ProgramRuleActionEvaluationTime | undefined
  readonly data?: string | undefined
  readonly content?: string | undefined
  readonly dataElement?: DataElement | undefined
  readonly trackedEntityAttribute?: TrackedEntityAttribute | undefined
  readonly programStage?: ProgramStage | undefined
  readonly programStageSection?: string | undefined
  readonly location?: string | undefined
  readonly option?: string | undefined
  readonly optionGroup?: string | undefined
  readonly templateUid?: string | undefined
  readonly priority?: number | undefined
}

const ProgramRuleActionSchema = (target: Target) =>
  z.object({
    code: CodeSchema,
    programRuleActionType: ProgramRuleActionTypeByTarget[target],
    evaluationTime: ProgramRuleActionEvaluationTime.default('ALWAYS'),
    data: z.string().optional(),
    content: z.string().optional(),
    dataElement: refSchema('DataElement').optional(),
    trackedEntityAttribute: refSchema('TrackedEntityAttribute').optional(),
    programStage: refSchema('ProgramStage').optional(),
    programRule: refSchema('ProgramRule').optional(),
    // Program stage sections and option groups are intentionally loose in the
    // MVP because declare does not model those metadata kinds yet.
    programStageSection: z.string().optional(),
    location: z.string().max(255).optional(),
    option: z.string().optional(),
    optionGroup: z.string().optional(),
    templateUid: z.string().optional(),
    priority: z.number().int().optional(),
  })

const ProgramRuleActionSchemas = {
  '2.40': ProgramRuleActionSchema('2.40'),
  '2.41': ProgramRuleActionSchema('2.41'),
  '2.42': ProgramRuleActionSchema('2.42'),
} as const

type ProgramRuleActionOutput = Omit<
  z.output<(typeof ProgramRuleActionSchemas)[CurrentTarget]>,
  'dataElement' | 'trackedEntityAttribute' | 'programStage' | 'programRule'
> & {
  dataElement?: DataElement | undefined
  trackedEntityAttribute?: TrackedEntityAttribute | undefined
  programStage?: ProgramStage | undefined
  programRule?: Ref<'ProgramRule'> | undefined
}

export type ProgramRuleActionInput = z.input<(typeof ProgramRuleActionSchemas)[CurrentTarget]>
export type ProgramRuleAction = Handle<
  'ProgramRuleAction',
  ProgramRuleActionOutput
>

function defineProgramRuleAction(input: ProgramRuleActionInput): ProgramRuleAction {
  const parsed = ProgramRuleActionSchemas[getTarget()].parse(input) as z.output<
    (typeof ProgramRuleActionSchemas)[CurrentTarget]
  >
  return makeHandle('ProgramRuleAction', parsed as ProgramRuleActionOutput)
}

type MessageInput = {
  on: FieldTarget
  content: string
  evaluationTime?: ProgramRuleActionEvaluationTime
  priority?: number
}

type DisplayInput = {
  content: string
  value?: string
  on?: FieldTarget
  evaluationTime?: ProgramRuleActionEvaluationTime
  priority?: number
}

type TargetOnlyInput = {
  on: FieldTarget
  evaluationTime?: ProgramRuleActionEvaluationTime
  priority?: number
}

type ProgramStageInput = {
  programStage: ProgramStage
  data?: string
  content?: string
  evaluationTime?: ProgramRuleActionEvaluationTime
  priority?: number
}

type OptionInput = {
  on: FieldTarget
  option: string
  evaluationTime?: ProgramRuleActionEvaluationTime
  priority?: number
}

type OptionGroupInput = {
  on: FieldTarget
  optionGroup: string
  evaluationTime?: ProgramRuleActionEvaluationTime
  priority?: number
}

function targetAction(
  type: ProgramRuleActionType,
  input: TargetOnlyInput,
): ProgramRuleActionSpec {
  return {
    programRuleActionType: type,
    evaluationTime: input.evaluationTime,
    priority: input.priority,
    ...fieldTarget(input.on),
  }
}

function messageAction(
  type: ProgramRuleActionType,
  input: MessageInput,
): ProgramRuleActionSpec {
  return {
    programRuleActionType: type,
    content: input.content,
    evaluationTime: input.evaluationTime,
    priority: input.priority,
    ...fieldTarget(input.on),
  }
}

function displayAction(
  type: ProgramRuleActionType,
  input: DisplayInput,
): ProgramRuleActionSpec {
  return {
    programRuleActionType: type,
    content: input.content,
    data: input.value,
    evaluationTime: input.evaluationTime,
    priority: input.priority,
    ...(input.on ? fieldTarget(input.on) : {}),
  }
}

function programStageAction(
  type: ProgramRuleActionType,
  input: ProgramStageInput,
): ProgramRuleActionSpec {
  return {
    programRuleActionType: type,
    programStage: input.programStage,
    data: input.data,
    content: input.content,
    evaluationTime: input.evaluationTime,
    priority: input.priority,
  }
}

function assertTargetSupportsAction(type: ProgramRuleActionType): void {
  if (!ProgramRuleActionTypeByTarget[getTarget()].safeParse(type).success) {
    throw new Error(`${type} is not supported by DHIS2 target ${getTarget()}.`)
  }
}

type ScheduleEventFactory<T extends Target> = T extends '2.42'
  ? (input: ProgramStageInput) => ProgramRuleActionSpec
  : never

type ActionFactories<T extends Target> = {
  displayText(input: DisplayInput): ProgramRuleActionSpec
  displayKeyValuePair(input: DisplayInput): ProgramRuleActionSpec
  hideField(input: TargetOnlyInput): ProgramRuleActionSpec
  hideSection(input: {
    section: string
    evaluationTime?: ProgramRuleActionEvaluationTime
    priority?: number
  }): ProgramRuleActionSpec
  hideProgramStage(input: ProgramStageInput): ProgramRuleActionSpec
  assign(input: {
    target: FieldTarget | ProgramRuleVariable
    value: string
    evaluationTime?: ProgramRuleActionEvaluationTime
    priority?: number
  }): ProgramRuleActionSpec
  showWarning(input: MessageInput): ProgramRuleActionSpec
  warningOnComplete(input: MessageInput): ProgramRuleActionSpec
  showError(input: MessageInput): ProgramRuleActionSpec
  errorOnComplete(input: MessageInput): ProgramRuleActionSpec
  scheduleEvent: ScheduleEventFactory<T>
  createEvent(input: ProgramStageInput): ProgramRuleActionSpec
  setMandatoryField(input: TargetOnlyInput): ProgramRuleActionSpec
  sendMessage(input: {
    content?: string
    data?: string
    templateUid?: string
    evaluationTime?: ProgramRuleActionEvaluationTime
    priority?: number
  }): ProgramRuleActionSpec
  scheduleMessage(input: {
    content?: string
    data?: string
    templateUid?: string
    evaluationTime?: ProgramRuleActionEvaluationTime
    priority?: number
  }): ProgramRuleActionSpec
  hideOption(input: OptionInput): ProgramRuleActionSpec
  showOptionGroup(input: OptionGroupInput): ProgramRuleActionSpec
  hideOptionGroup(input: OptionGroupInput): ProgramRuleActionSpec
}

export const action: ActionFactories<CurrentTarget> = {
  displayText: (input) => displayAction('DISPLAYTEXT', input),
  displayKeyValuePair: (input) => displayAction('DISPLAYKEYVALUEPAIR', input),
  hideField: (input) => targetAction('HIDEFIELD', input),
  hideSection: (input) => ({
    programRuleActionType: 'HIDESECTION',
    programStageSection: input.section,
    evaluationTime: input.evaluationTime,
    priority: input.priority,
  }),
  hideProgramStage: (input) => programStageAction('HIDEPROGRAMSTAGE', input),
  assign: (input) => ({
    programRuleActionType: 'ASSIGN',
    data: input.value,
    evaluationTime: input.evaluationTime,
    priority: input.priority,
    ...expressionTarget(input.target),
  }),
  showWarning: (input) => messageAction('SHOWWARNING', input),
  warningOnComplete: (input) => messageAction('WARNINGONCOMPLETE', input),
  showError: (input) => messageAction('SHOWERROR', input),
  errorOnComplete: (input) => messageAction('ERRORONCOMPLETE', input),
  scheduleEvent: ((input: ProgramStageInput) => {
    assertTargetSupportsAction('SCHEDULEEVENT')
    return programStageAction('SCHEDULEEVENT', input)
  }) as ScheduleEventFactory<CurrentTarget>,
  createEvent: (input) => programStageAction('CREATEEVENT', input),
  setMandatoryField: (input) => targetAction('SETMANDATORYFIELD', input),
  sendMessage: (input) => ({
    programRuleActionType: 'SENDMESSAGE',
    content: input.content,
    data: input.data,
    templateUid: input.templateUid,
    evaluationTime: input.evaluationTime,
    priority: input.priority,
  }),
  scheduleMessage: (input) => ({
    programRuleActionType: 'SCHEDULEMESSAGE',
    content: input.content,
    data: input.data,
    templateUid: input.templateUid,
    evaluationTime: input.evaluationTime,
    priority: input.priority,
  }),
  hideOption: (input) => ({
    programRuleActionType: 'HIDEOPTION',
    option: input.option,
    evaluationTime: input.evaluationTime,
    priority: input.priority,
    ...fieldTarget(input.on),
  }),
  showOptionGroup: (input) => ({
    programRuleActionType: 'SHOWOPTIONGROUP',
    optionGroup: input.optionGroup,
    evaluationTime: input.evaluationTime,
    priority: input.priority,
    ...fieldTarget(input.on),
  }),
  hideOptionGroup: (input) => ({
    programRuleActionType: 'HIDEOPTIONGROUP',
    optionGroup: input.optionGroup,
    evaluationTime: input.evaluationTime,
    priority: input.priority,
    ...fieldTarget(input.on),
  }),
}

const ProgramRuleSchema = z.object({
  code: CodeSchema,
  name: NameSchema,
  description: DescriptionSchema.optional(),
  program: refSchema('Program'),
  programStage: refSchema('ProgramStage').optional(),
  condition: z.string().default(''),
  priority: z.number().int().optional(),
  programRuleActions: z.array(refSchema('ProgramRuleAction')),
})

export type ProgramRuleInput = {
  code: string
  name: string
  description?: string
  program: Ref<'Program'>
  programStage?: Ref<'ProgramStage'>
  condition: string
  priority?: number
  actions: readonly ProgramRuleActionSpec[]
}

type ProgramRuleOutput = Omit<
  z.output<typeof ProgramRuleSchema>,
  'program' | 'programStage' | 'programRuleActions'
> & {
  program: Program
  programStage?: ProgramStage | undefined
  programRuleActions: ProgramRuleAction[]
}

export type ProgramRule = Handle<'ProgramRule', ProgramRuleOutput>

function generatedActionCode(ruleCode: string, actionType: ProgramRuleActionType, index: number): string {
  const suffix = `_${index + 1}_${actionType}`
  const maxRuleCodeLength = 50 - suffix.length
  const base = ruleCode.slice(0, Math.max(1, maxRuleCodeLength))
  return `${base}${suffix}`.slice(0, 50)
}

export function defineProgramRule(input: ProgramRuleInput): ProgramRule {
  const actions = input.actions.map((spec, index) =>
    defineProgramRuleAction({
      code: generatedActionCode(input.code, spec.programRuleActionType, index),
      ...spec,
    }),
  )
  const parsed = ProgramRuleSchema.parse({
    code: input.code,
    name: input.name,
    description: input.description,
    program: input.program,
    programStage: input.programStage,
    condition: input.condition,
    priority: input.priority,
    programRuleActions: actions,
  })
  return makeHandle('ProgramRule', parsed as ProgramRuleOutput)
}

export type RuleEffectSpec = {
  readonly type: ProgramRuleActionType
  readonly data?: string | null | undefined
  readonly values?: Readonly<Record<string, string>> | undefined
  readonly priority?: number | null | undefined
}

function effectFor(
  type: ProgramRuleActionType,
  input: {
    data?: string | null | undefined
    values?: Readonly<Record<string, string>>
    priority?: number | null | undefined
  } = {},
): RuleEffectSpec {
  const values =
    input.values && Object.keys(input.values).length > 0 ? input.values : undefined
  return {
    type,
    data: input.data === undefined ? '' : input.data,
    values,
    priority: input.priority ?? null,
  }
}

function valuesForTarget(target: FieldTarget): Record<string, string> {
  return {
    field: fieldName(target),
    attributeType: target.kind === 'DataElement' ? 'DATA_ELEMENT' : 'TRACKED_ENTITY_ATTRIBUTE',
  }
}

export const effect = {
  displayText(input: { data?: string | null; content?: string; on?: FieldTarget } = {}) {
    return effectFor('DISPLAYTEXT', {
      data: input.data,
      values: {
        ...(input.content ? { content: input.content } : {}),
        ...(input.on ? valuesForTarget(input.on) : {}),
      },
    })
  },
  displayKeyValuePair(input: { data?: string | null; content?: string; on?: FieldTarget } = {}) {
    return effectFor('DISPLAYKEYVALUEPAIR', {
      data: input.data,
      values: {
        ...(input.content ? { content: input.content } : {}),
        ...(input.on ? valuesForTarget(input.on) : {}),
      },
    })
  },
  hideField(input: { on: FieldTarget }) {
    return effectFor('HIDEFIELD', { values: valuesForTarget(input.on) })
  },
  hideSection(input: { section: string }) {
    return effectFor('HIDESECTION', { values: { programStageSection: input.section } })
  },
  hideProgramStage(input: { programStage: ProgramStage }) {
    return effectFor('HIDEPROGRAMSTAGE', {
      values: { programStage: input.programStage.code },
    })
  },
  assign(input: { target: FieldTarget | ProgramRuleVariable; data: string | null }) {
    if (input.target.kind === 'ProgramRuleVariable') {
      return effectFor('ASSIGN', {
        data: input.data,
        values: { content: `#{${input.target.input.name}}` },
      })
    }
    return effectFor('ASSIGN', {
      data: input.data,
      values: valuesForTarget(input.target),
    })
  },
  showWarning(input: { on: FieldTarget; content: string; data?: string | null }) {
    return effectFor('SHOWWARNING', {
      data: input.data,
      values: { content: input.content, ...valuesForTarget(input.on) },
    })
  },
  warningOnComplete(input: { on: FieldTarget; content: string; data?: string | null }) {
    return effectFor('WARNINGONCOMPLETE', {
      data: input.data,
      values: { content: input.content, ...valuesForTarget(input.on) },
    })
  },
  showError(input: { on: FieldTarget; content: string; data?: string | null }) {
    return effectFor('SHOWERROR', {
      data: input.data,
      values: { content: input.content, ...valuesForTarget(input.on) },
    })
  },
  errorOnComplete(input: { on: FieldTarget; content: string; data?: string | null }) {
    return effectFor('ERRORONCOMPLETE', {
      data: input.data,
      values: { content: input.content, ...valuesForTarget(input.on) },
    })
  },
  scheduleEvent(input: { programStage: ProgramStage; data?: string | null }) {
    return effectFor('SCHEDULEEVENT', {
      data: input.data,
      values: { programStage: input.programStage.code },
    })
  },
  createEvent(input: { programStage: ProgramStage; data?: string | null }) {
    return effectFor('CREATEEVENT', {
      data: input.data,
      values: { programStage: input.programStage.code },
    })
  },
  setMandatoryField(input: { on: FieldTarget }) {
    return effectFor('SETMANDATORYFIELD', { values: valuesForTarget(input.on) })
  },
  sendMessage(input: { data?: string | null; content?: string; templateUid?: string } = {}) {
    return effectFor('SENDMESSAGE', {
      data: input.data,
      values: {
        ...(input.content ? { content: input.content } : {}),
        ...(input.templateUid ? { templateUid: input.templateUid } : {}),
      },
    })
  },
  scheduleMessage(input: { data?: string | null; content?: string; templateUid?: string } = {}) {
    return effectFor('SCHEDULEMESSAGE', {
      data: input.data,
      values: {
        ...(input.content ? { content: input.content } : {}),
        ...(input.templateUid ? { templateUid: input.templateUid } : {}),
      },
    })
  },
  hideOption(input: { on: FieldTarget; option: string }) {
    return effectFor('HIDEOPTION', {
      values: { option: input.option, ...valuesForTarget(input.on) },
    })
  },
  showOptionGroup(input: { on: FieldTarget; optionGroup: string }) {
    return effectFor('SHOWOPTIONGROUP', {
      values: { optionGroup: input.optionGroup, ...valuesForTarget(input.on) },
    })
  },
  hideOptionGroup(input: { on: FieldTarget; optionGroup: string }) {
    return effectFor('HIDEOPTIONGROUP', {
      values: { optionGroup: input.optionGroup, ...valuesForTarget(input.on) },
    })
  },
}

export type RuleTestGiven = {
  readonly event?: readonly (readonly [DataElement, string | number | boolean | null])[]
  readonly attributes?: readonly (
    readonly [TrackedEntityAttribute, string | number | boolean | null]
  )[]
  readonly programStage?: ProgramStage | undefined
  readonly eventDate?: string | undefined
  readonly dueDate?: string | undefined
  readonly enrollmentDate?: string | undefined
  readonly incidentDate?: string | undefined
  readonly organisationUnit?: string | undefined
  readonly organisationUnitCode?: string | undefined
}

export type RuleTest = {
  readonly rule: ProgramRule
  readonly given: RuleTestGiven
  readonly expect: readonly RuleEffectSpec[]
}

export function defineRuleTest(input: RuleTest): RuleTest {
  return input
}
