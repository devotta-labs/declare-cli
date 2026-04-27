// AUTO-GENERATED — do not edit by hand.
//
// Source: packages/declare/snapshots/schemas-<target>.json
// Tool:   packages/declare/scripts/generate.ts
//
// Re-run `pnpm --filter @devotta-labs/declare gen:schemas` to refresh.

import { z } from 'zod'
import { refSchema } from '../lib/core.ts'

export const ProgramRuleBase_2_40 = z.object({
  code: z.string().max(50).optional(),
  condition: z.string().optional(),
  description: z.string().max(255).optional(),
  name: z.string().max(230),
  priority: z.number().int().optional(),
  program: refSchema('Program'),
  programRuleActions: z.array(refSchema('ProgramRuleAction')).optional(),
  programStage: refSchema('ProgramStage').optional(),
})

export const ProgramRuleBase_2_41 = z.object({
  code: z.string().max(50).optional(),
  condition: z.string().optional(),
  description: z.string().max(255).optional(),
  name: z.string().max(230),
  priority: z.number().int().optional(),
  program: refSchema('Program'),
  programRuleActions: z.array(refSchema('ProgramRuleAction')).optional(),
  programStage: refSchema('ProgramStage').optional(),
})

export const ProgramRuleBase_2_42 = z.object({
  code: z.string().max(50).optional(),
  condition: z.string().optional(),
  description: z.string().max(255).optional(),
  name: z.string().max(230),
  priority: z.number().int().optional(),
  program: refSchema('Program'),
  programRuleActions: z.array(refSchema('ProgramRuleAction')).optional(),
  programStage: refSchema('ProgramStage').optional(),
})

export const ProgramRuleBaseByTarget = {
  '2.40': ProgramRuleBase_2_40,
  '2.41': ProgramRuleBase_2_41,
  '2.42': ProgramRuleBase_2_42,
} as const
