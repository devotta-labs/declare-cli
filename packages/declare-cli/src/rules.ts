import {
  ItemValueType,
  Option,
  RuleActionJs,
  RuleAttributeValue,
  RuleDataValue,
  RuleEffectJs,
  RuleEngineContextJs,
  RuleEngineJs,
  RuleEnrollmentJs,
  RuleEnrollmentStatus,
  RuleEventJs,
  RuleEventStatus,
  RuleInstant,
  RuleJs,
  RuleLocalDate,
  RuleSupplementaryDataJs,
  RuleValueType,
  RuleVariableJs,
  RuleVariableType,
  DataItemJs,
} from '@dhis2/rule-engine'
import type {
  DataElement,
  Handle,
  MetadataKind,
  Program,
  ProgramRule,
  ProgramRuleAction,
  ProgramRuleVariable,
  ProgramStage,
  RuleEffectSpec,
  RuleTest,
  RuleTestGiven,
  Schema,
  TrackedEntityAttribute,
  ValueType,
} from '@devotta-labs/declare'

type RuleDataItemJsConstructor = new (
  displayName: string,
  valueType: ItemValueType,
) => DataItemJs

const RuleDataItemJs = DataItemJs as unknown as RuleDataItemJsConstructor

export type RuleDiagnostic = {
  code: string
  message: string
}

export class ProgramRuleValidationError extends Error {
  constructor(readonly diagnostics: readonly RuleDiagnostic[]) {
    super(formatRuleDiagnostics(diagnostics))
    this.name = 'ProgramRuleValidationError'
  }
}

export type EvaluatedRuleEffect = RuleEffectSpec & {
  rule: ProgramRule
}

export type RuleEvaluator = {
  evaluate(rule: ProgramRule, given: RuleTestGiven): RuleEffectSpec[]
  evaluateAll(given: RuleTestGiven): EvaluatedRuleEffect[]
}

type ProgramContext = {
  program: Program
  context: RuleEngineContextJs
  rulesByCode: Map<string, ProgramRule>
}

const EXPRESSION_TOKEN_RE = /#\{([^}]+)\}/g
const CONSTANT_TOKEN_RE = /C\{([^}]+)\}/g

const NUMERIC_VALUE_TYPES = new Set<string>([
  'NUMBER',
  'INTEGER',
  'INTEGER_POSITIVE',
  'INTEGER_NEGATIVE',
  'INTEGER_ZERO_OR_POSITIVE',
  'PERCENTAGE',
  'UNIT_INTERVAL',
])

const DATE_VALUE_TYPES = new Set<string>(['DATE', 'DATETIME', 'TIME', 'AGE'])
const BOOLEAN_VALUE_TYPES = new Set<string>(['BOOLEAN', 'TRUE_ONLY'])

function handlesOf<K extends MetadataKind>(
  schema: Schema,
  kind: K,
): Handle<K, { code: string }>[] {
  return schema.byKind[kind] as Handle<K, { code: string }>[]
}

function programRuleVariables(schema: Schema): ProgramRuleVariable[] {
  return handlesOf(schema, 'ProgramRuleVariable') as ProgramRuleVariable[]
}

function programRules(schema: Schema): ProgramRule[] {
  return handlesOf(schema, 'ProgramRule') as ProgramRule[]
}

function toRuleValueType(valueType: ValueType): RuleValueType {
  if (NUMERIC_VALUE_TYPES.has(valueType)) return RuleValueType.NUMERIC
  if (DATE_VALUE_TYPES.has(valueType)) return RuleValueType.DATE
  if (BOOLEAN_VALUE_TYPES.has(valueType)) return RuleValueType.BOOLEAN
  return RuleValueType.TEXT
}

function toItemValueType(valueType: ValueType): ItemValueType {
  if (NUMERIC_VALUE_TYPES.has(valueType)) return ItemValueType.NUMBER
  if (DATE_VALUE_TYPES.has(valueType)) return ItemValueType.DATE
  if (BOOLEAN_VALUE_TYPES.has(valueType)) return ItemValueType.BOOLEAN
  return ItemValueType.TEXT
}

function variableField(variable: ProgramRuleVariable): string {
  const input = variable.input
  if ('dataElement' in input) return input.dataElement.code
  if ('trackedEntityAttribute' in input) return input.trackedEntityAttribute.code
  return ''
}

function variableProgramStage(variable: ProgramRuleVariable): string | null {
  const input = variable.input as { programStage?: ProgramStage }
  return input.programStage?.code ?? null
}

function optionValues(variable: ProgramRuleVariable): Option[] {
  const input = variable.input
  const optionSet = (
    'dataElement' in input
      ? input.dataElement.input.optionSet
      : 'trackedEntityAttribute' in input
        ? input.trackedEntityAttribute.input.optionSet
        : undefined
  ) as { input?: { options?: readonly { name: string; code: string }[] } } | undefined
  const options = optionSet?.input?.options ?? []
  return options.map((option) => new Option(option.name, option.code))
}

function toRuleVariable(variable: ProgramRuleVariable): RuleVariableJs {
  return new RuleVariableJs(
    RuleVariableType.valueOf(variable.input.programRuleVariableSourceType),
    variable.input.name,
    variable.input.useCodeForOptionSet ?? false,
    optionValues(variable),
    variableField(variable),
    toRuleValueType(variable.input.valueType),
    variableProgramStage(variable),
  )
}

function fieldValues(action: ProgramRuleAction): Record<string, string> {
  if (action.input.dataElement) {
    return { field: action.input.dataElement.code, attributeType: 'DATA_ELEMENT' }
  }
  if (action.input.trackedEntityAttribute) {
    return {
      field: action.input.trackedEntityAttribute.code,
      attributeType: 'TRACKED_ENTITY_ATTRIBUTE',
    }
  }
  return {}
}

function actionValues(action: ProgramRuleAction): Map<string, string> {
  const values: Record<string, string> = {
    ...fieldValues(action),
  }
  if (action.input.content) values.content = action.input.content
  if (action.input.programStage) values.programStage = action.input.programStage.code
  if (action.input.programStageSection) {
    values.programStageSection = action.input.programStageSection
  }
  if (action.input.option) values.option = action.input.option
  if (action.input.optionGroup) values.optionGroup = action.input.optionGroup
  if (action.input.location) values.location = action.input.location
  if (action.input.templateUid) values.templateUid = action.input.templateUid
  return new Map(Object.entries(values))
}

function toRuleAction(action: ProgramRuleAction): RuleActionJs {
  return new RuleActionJs(
    action.input.data ?? null,
    action.input.programRuleActionType,
    actionValues(action),
    action.input.priority ?? null,
  )
}

function toRule(rule: ProgramRule): RuleJs {
  return new RuleJs(
    rule.input.condition,
    rule.input.programRuleActions.map(toRuleAction),
    rule.code,
    rule.input.name,
    rule.input.programStage?.code ?? null,
    rule.input.priority ?? null,
  )
}

function expressionVariables(expression: string): string[] {
  return [...expression.matchAll(EXPRESSION_TOKEN_RE)].map((match) => match[1]!).filter(Boolean)
}

function constants(expression: string): string[] {
  return [...expression.matchAll(CONSTANT_TOKEN_RE)].map((match) => match[1]!).filter(Boolean)
}

function levenshtein(a: string, b: string): number {
  const previous = Array.from({ length: b.length + 1 }, (_, index) => index)
  for (let i = 0; i < a.length; i++) {
    const current = [i + 1]
    for (let j = 0; j < b.length; j++) {
      current[j + 1] =
        a[i] === b[j]
          ? previous[j]!
          : Math.min(previous[j]!, current[j]!, previous[j + 1]!) + 1
    }
    previous.splice(0, previous.length, ...current)
  }
  return previous[b.length]!
}

function suggestion(value: string, candidates: readonly string[]): string | null {
  let best: { value: string; distance: number } | null = null
  for (const candidate of candidates) {
    const distance = levenshtein(value, candidate)
    if (!best || distance < best.distance) best = { value: candidate, distance }
  }
  if (!best || best.distance > Math.max(2, Math.floor(value.length / 2))) return null
  return best.value
}

function validateExpression(
  engine: RuleEngineJs,
  diagnostics: RuleDiagnostic[],
  code: string,
  label: string,
  expression: string | undefined,
  dataItems: Map<string, DataItemJs>,
): void {
  if (!expression) return

  for (const constant of constants(expression)) {
    diagnostics.push({
      code,
      message: `${label} uses C{${constant}}, but declare-cli does not support constants in program rules yet.`,
    })
  }

  const names = [...dataItems.keys()]
  for (const name of expressionVariables(expression)) {
    if (dataItems.has(name)) continue
    const maybe = suggestion(name, names)
    diagnostics.push({
      code,
      message: maybe
        ? `${label} references unknown rule variable #{${name}}. Did you mean #{${maybe}}?`
        : `${label} references unknown rule variable #{${name}}.`,
    })
  }

  const result = engine.validate(expression, dataItems)
  if (!result.valid) {
    diagnostics.push({
      code,
      message: `${label} is not a valid DHIS2 expression: ${result.errorMessage ?? 'unknown parser error'}`,
    })
  }
}

function validateRuleModel(
  schema: Schema,
  variables: readonly ProgramRuleVariable[],
  rules: readonly ProgramRule[],
): RuleDiagnostic[] {
  const diagnostics: RuleDiagnostic[] = []
  const engine = new RuleEngineJs(false)
  const variablesByProgram = new Map<string, ProgramRuleVariable[]>()

  for (const variable of variables) {
    const key = variable.input.program.code
    const list = variablesByProgram.get(key) ?? []
    list.push(variable)
    variablesByProgram.set(key, list)
  }

  for (const [programCode, programVariables] of variablesByProgram) {
    const byName = new Map<string, ProgramRuleVariable>()
    for (const variable of programVariables) {
      const previous = byName.get(variable.input.name)
      if (previous) {
        diagnostics.push({
          code: variable.code,
          message: `Duplicate program rule variable name '${variable.input.name}' in program ${programCode}. '${previous.code}' already uses it.`,
        })
      }
      byName.set(variable.input.name, variable)
    }
  }

  for (const rule of rules) {
    const programVariables = variablesByProgram.get(rule.input.program.code) ?? []
    const dataItems = new Map(
      programVariables.map((variable) => [
        variable.input.name,
        new RuleDataItemJs(variable.input.name, toItemValueType(variable.input.valueType)),
      ]),
    )

    validateExpression(
      engine,
      diagnostics,
      rule.code,
      `ProgramRule ${rule.code} condition`,
      rule.input.condition,
      dataItems,
    )

    for (const action of rule.input.programRuleActions) {
      validateExpression(
        engine,
        diagnostics,
        action.code,
        `ProgramRuleAction ${action.code} data`,
        action.input.data,
        dataItems,
      )

      if (action.input.programRuleActionType === 'ASSIGN' && action.input.content) {
        for (const name of expressionVariables(action.input.content)) {
          if (dataItems.has(name)) continue
          diagnostics.push({
            code: action.code,
            message: `ProgramRuleAction ${action.code} assigns to unknown calculated variable #{${name}}.`,
          })
        }
      }
    }
  }

  for (const test of schema.ruleTests) {
    if (!rules.some((rule) => rule.code === test.rule.code)) {
      diagnostics.push({
        code: test.rule.code,
        message: `Rule test references ${test.rule.code}, but that rule is not included in the schema.`,
      })
    }
  }

  return diagnostics
}

function formatRuleDiagnostics(diagnostics: readonly RuleDiagnostic[]): string {
  return [
    'Program rule validation failed:',
    ...diagnostics.map((diagnostic) => `  - ${diagnostic.code}: ${diagnostic.message}`),
  ].join('\n')
}

function programContexts(
  schema: Schema,
  variables: readonly ProgramRuleVariable[],
  rules: readonly ProgramRule[],
): ProgramContext[] {
  const programs = handlesOf(schema, 'Program') as Program[]
  const contexts: ProgramContext[] = []

  for (const program of programs) {
    const programVariables = variables.filter((variable) => variable.input.program.code === program.code)
    const programRules = rules.filter((rule) => rule.input.program.code === program.code)
    if (programRules.length === 0) continue

    contexts.push({
      program,
      context: new RuleEngineContextJs(
        programRules.map(toRule),
        programVariables.map(toRuleVariable),
        new RuleSupplementaryDataJs([], [], new Map()),
      ),
      rulesByCode: new Map(programRules.map((rule) => [rule.code, rule])),
    })
  }

  return contexts
}

function valueString(value: string | number | boolean | null): string | null {
  if (value === null) return null
  return String(value)
}

function dataValues(given: RuleTestGiven): RuleDataValue[] {
  return (given.event ?? [])
    .map(([dataElement, value]) => {
      const stringValue = valueString(value)
      return stringValue === null ? null : new RuleDataValue(dataElement.code, stringValue)
    })
    .filter((value): value is RuleDataValue => value !== null)
}

function attributeValues(given: RuleTestGiven): RuleAttributeValue[] {
  return (given.attributes ?? [])
    .map(([attribute, value]) => {
      const stringValue = valueString(value)
      return stringValue === null ? null : new RuleAttributeValue(attribute.code, stringValue)
    })
    .filter((value): value is RuleAttributeValue => value !== null)
}

function parseDate(value: string | undefined, fallback: string): RuleLocalDate {
  return RuleLocalDate.parse(value ?? fallback)
}

function targetProgramStage(rule: ProgramRule, given: RuleTestGiven): ProgramStage | undefined {
  if (given.programStage) return given.programStage
  if (rule.input.programStage) return rule.input.programStage
  return rule.input.programRuleActions.find((ruleAction) => ruleAction.input.programStage)?.input
    .programStage
}

function ruleEvent(rule: ProgramRule, given: RuleTestGiven): RuleEventJs {
  const stage = targetProgramStage(rule, given)
  const stageCode = stage?.code ?? 'PROGRAM_STAGE'
  const stageName = stage?.input.name ?? stageCode
  return new RuleEventJs(
    'EVENT',
    stageCode,
    stageName,
    RuleEventStatus.ACTIVE,
    parseDate(given.eventDate, '2020-01-01'),
    RuleInstant.now(),
    null,
    given.dueDate ? RuleLocalDate.parse(given.dueDate) : null,
    null,
    given.organisationUnit ?? 'ORG_UNIT',
    given.organisationUnitCode ?? null,
    dataValues(given),
  )
}

function ruleEnrollment(program: Program, given: RuleTestGiven): RuleEnrollmentJs | null {
  const values = attributeValues(given)
  if (values.length === 0) return null
  return new RuleEnrollmentJs(
    'ENROLLMENT',
    program.input.name,
    parseDate(given.incidentDate, '2020-01-01'),
    parseDate(given.enrollmentDate, '2020-01-01'),
    RuleEnrollmentStatus.ACTIVE,
    given.organisationUnit ?? 'ORG_UNIT',
    given.organisationUnitCode ?? null,
    values,
  )
}

function plainValues(values: Map<string, string>): Record<string, string> | undefined {
  const entries = [...values.entries()]
  if (entries.length === 0) return undefined
  return Object.fromEntries(entries)
}

function plainEffect(effect: RuleEffectJs, rule: ProgramRule): EvaluatedRuleEffect {
  return {
    rule,
    type: effect.ruleAction.type as RuleEffectSpec['type'],
    data: effect.data,
    values: plainValues(effect.ruleAction.values),
    priority: effect.ruleAction.priority,
  }
}

function stripRule(effect: EvaluatedRuleEffect): RuleEffectSpec {
  return {
    type: effect.type,
    data: effect.data,
    values: effect.values,
    priority: effect.priority,
  }
}

function contextForRule(contexts: readonly ProgramContext[], rule: ProgramRule): ProgramContext {
  const context = contexts.find((candidate) => candidate.program.code === rule.input.program.code)
  if (!context) {
    throw new Error(`Program ${rule.input.program.code} has no compiled program-rule context.`)
  }
  return context
}

function evaluateContext(
  engine: RuleEngineJs,
  context: ProgramContext,
  seedRule: ProgramRule,
  given: RuleTestGiven,
): EvaluatedRuleEffect[] {
  const event = ruleEvent(seedRule, given)
  const enrollment = ruleEnrollment(context.program, given)
  return engine
    .evaluateEvent(event, enrollment, [], context.context)
    .map((effect) => {
      const rule = context.rulesByCode.get(effect.ruleId)
      if (!rule) {
        throw new Error(`Rule engine returned effect for unknown rule '${effect.ruleId}'.`)
      }
      return plainEffect(effect, rule)
    })
}

export function buildRuleEngine(schema: Schema): RuleEvaluator {
  const variables = programRuleVariables(schema)
  const rules = programRules(schema)
  const diagnostics = validateRuleModel(schema, variables, rules)
  if (diagnostics.length > 0) throw new ProgramRuleValidationError(diagnostics)

  const engine = new RuleEngineJs(false)
  const contexts = programContexts(schema, variables, rules)

  return {
    evaluate(rule, given) {
      const context = contextForRule(contexts, rule)
      return evaluateContext(engine, context, rule, given)
        .filter((effect) => effect.rule.code === rule.code)
        .map(stripRule)
    },
    evaluateAll(given) {
      const effects: EvaluatedRuleEffect[] = []
      for (const context of contexts) {
        const seedRule = [...context.rulesByCode.values()][0]
        if (!seedRule) continue
        effects.push(...evaluateContext(engine, context, seedRule, given))
      }
      return effects
    },
  }
}

export function evaluateRule(
  schema: Schema,
  rule: ProgramRule,
  given: RuleTestGiven,
): RuleEffectSpec[] {
  return buildRuleEngine(schema).evaluate(rule, given)
}

function stableEffect(effect: RuleEffectSpec): unknown {
  return {
    type: effect.type,
    data: effect.data ?? null,
    values: effect.values ? Object.fromEntries(Object.entries(effect.values).sort()) : {},
    priority: effect.priority ?? null,
  }
}

function sortedEffects(effects: unknown[]): unknown[] {
  return [...effects].sort((a, b) => JSON.stringify(a).localeCompare(JSON.stringify(b)))
}

function assertRuleTest(evaluator: RuleEvaluator, test: RuleTest): RuleDiagnostic[] {
  const actual = sortedEffects(evaluator.evaluate(test.rule, test.given).map(stableEffect))
  const expected = sortedEffects(test.expect.map(stableEffect))
  if (JSON.stringify(actual) === JSON.stringify(expected)) return []
  return [
    {
      code: test.rule.code,
      message: `Rule test failed. Expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}.`,
    },
  ]
}

export function checkProgramRules(schema: Schema): void {
  const variables = programRuleVariables(schema)
  const rules = programRules(schema)
  if (variables.length === 0 && rules.length === 0 && schema.ruleTests.length === 0) return

  const diagnostics = validateRuleModel(schema, variables, rules)
  if (diagnostics.length > 0) throw new ProgramRuleValidationError(diagnostics)

  const evaluator = buildRuleEngine(schema)
  const testDiagnostics = schema.ruleTests.flatMap((test) => assertRuleTest(evaluator, test))
  if (testDiagnostics.length > 0) throw new ProgramRuleValidationError(testDiagnostics)
}

export { formatRuleDiagnostics }
