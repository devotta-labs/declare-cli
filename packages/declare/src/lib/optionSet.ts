import { z } from 'zod'
import { OptionSetBaseByTarget } from '../generated/optionSet.ts'
import { ValueType } from '../generated/enums.ts'
import { getTarget } from '../generated/runtime.ts'
import {
  CodeSchema,
  DescriptionSchema,
  NameSchema,
  makeHandle,
  type Handle,
} from './core.ts'
import { SharingSchema } from './sharing.ts'

// Option is hoisted/split by schema.ts — its wire shape lives on Option, but
// authors declare it inline inside OptionSet. Kept hand-written because the
// splitter in schema.ts depends on this exact shape.
export const OptionSchema = z.object({
  code: CodeSchema,
  name: NameSchema,
  sortOrder: z.number().int().min(0).optional(),
  formName: z.string().max(230).optional(),
  description: DescriptionSchema.optional(),
})

const overrides = {
  code: CodeSchema,
  name: NameSchema,
  description: DescriptionSchema.optional(),
  valueType: ValueType,
  // Server-incremented on every change; authors never set this.
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
export type OptionSetInput = z.input<(typeof SCHEMAS)['2.42']>
export type OptionSet = Handle<'OptionSet', z.output<(typeof SCHEMAS)['2.42']>>

export function defineOptionSet(input: OptionSetInput): OptionSet {
  const parsed = SCHEMAS[getTarget()].parse(input) as z.output<(typeof SCHEMAS)['2.42']>
  return makeHandle('OptionSet', parsed)
}
