import { z } from 'zod'
import { OptionSetBaseByTarget } from '../generated/optionSet.ts'
import { getTarget } from '../generated/runtime.ts'
import type { CurrentTarget } from './currentTarget.ts'
import {
  CodeSchema,
  DescriptionSchema,
  NameSchema,
  makeHandle,
  type Handle,
} from './core.ts'
import { SharingSchema } from './sharing.ts'

// Options are authored inline, then hoisted to top-level payloads in schema.ts.
export const OptionSchema = z.object({
  code: CodeSchema,
  name: NameSchema,
  sortOrder: z.number().int().min(0).optional(),
  formName: z.string().max(230).optional(),
  description: DescriptionSchema.optional(),
})

// Do not re-declare valueType; the generated base keeps it target-specific.
const overrides = {
  code: CodeSchema,
  name: NameSchema,
  description: DescriptionSchema.optional(),
  version: z.number().int().optional(),
  options: z.array(OptionSchema).min(1, 'an OptionSet needs at least one Option'),
  sharing: SharingSchema.optional(),
}

const SCHEMAS = {
  '2.40': OptionSetBaseByTarget['2.40'].extend(overrides),
  '2.41': OptionSetBaseByTarget['2.41'].extend(overrides),
  '2.42': OptionSetBaseByTarget['2.42'].extend(overrides),
} as const

export type OptionInput = z.infer<typeof OptionSchema>
export type OptionSetInput = z.input<(typeof SCHEMAS)[CurrentTarget]>
export type OptionSet = Handle<'OptionSet', z.output<(typeof SCHEMAS)[CurrentTarget]>>

export function defineOptionSet(input: OptionSetInput): OptionSet {
  const parsed = SCHEMAS[getTarget()].parse(input) as z.output<(typeof SCHEMAS)[CurrentTarget]>
  return makeHandle('OptionSet', parsed)
}
