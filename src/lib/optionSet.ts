import { z } from 'zod'
import { CodeSchema, NameSchema, makeHandle, type Handle } from './core.ts'

export const OptionValueType = z.enum(['TEXT', 'NUMBER', 'INTEGER', 'BOOLEAN', 'DATE'])
export type OptionValueType = z.infer<typeof OptionValueType>

export const OptionSchema = z.object({
  code: CodeSchema,
  name: NameSchema,
})

export const OptionSetSchema = z.object({
  code: CodeSchema,
  name: NameSchema,
  valueType: OptionValueType,
  options: z.array(OptionSchema).min(1, 'an OptionSet needs at least one Option'),
})

export type OptionInput = z.infer<typeof OptionSchema>
export type OptionSetInput = z.infer<typeof OptionSetSchema>
export type OptionSet = Handle<'OptionSet', OptionSetInput>

export function defineOptionSet(input: z.input<typeof OptionSetSchema>): OptionSet {
  const parsed = OptionSetSchema.parse(input)
  return makeHandle('OptionSet', parsed)
}
