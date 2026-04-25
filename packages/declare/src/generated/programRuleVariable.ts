// AUTO-GENERATED — do not edit by hand.
//
// Source: packages/declare/snapshots/schemas-<target>.json
// Tool:   packages/declare/scripts/generate.ts
//
// Re-run `pnpm --filter @devotta-labs/declare gen:schemas` to refresh.

import { z } from 'zod'
import { refSchema } from '../lib/core.ts'
import { ProgramRuleVariableSourceType_2_40, ProgramRuleVariableSourceType_2_41, ProgramRuleVariableSourceType_2_42, ValueType_2_40, ValueType_2_41, ValueType_2_42 } from './enums.ts'

export const ProgramRuleVariableBase_2_40 = z.object({
  code: z.string().max(50).optional(),
  dataElement: refSchema('DataElement').optional(),
  name: z.string().max(230),
  program: refSchema('Program'),
  sourceType: ProgramRuleVariableSourceType_2_40,
  programStage: refSchema('ProgramStage').optional(),
  attribute: refSchema('TrackedEntityAttribute').optional(),
  useCodeForOptionSet: z.boolean().optional(),
  valueType: ValueType_2_40,
})

export const ProgramRuleVariableBase_2_41 = z.object({
  code: z.string().max(50).optional(),
  dataElement: refSchema('DataElement').optional(),
  name: z.string().max(230),
  program: refSchema('Program'),
  sourceType: ProgramRuleVariableSourceType_2_41,
  programStage: refSchema('ProgramStage').optional(),
  attribute: refSchema('TrackedEntityAttribute').optional(),
  useCodeForOptionSet: z.boolean().optional(),
  valueType: ValueType_2_41,
})

export const ProgramRuleVariableBase_2_42 = z.object({
  code: z.string().max(50).optional(),
  dataElement: refSchema('DataElement').optional(),
  name: z.string().max(230),
  program: refSchema('Program'),
  sourceType: ProgramRuleVariableSourceType_2_42,
  programStage: refSchema('ProgramStage').optional(),
  attribute: refSchema('TrackedEntityAttribute').optional(),
  useCodeForOptionSet: z.boolean().optional(),
  valueType: ValueType_2_42,
})

export const ProgramRuleVariableBaseByTarget = {
  '2.40': ProgramRuleVariableBase_2_40,
  '2.41': ProgramRuleVariableBase_2_41,
  '2.42': ProgramRuleVariableBase_2_42,
} as const
