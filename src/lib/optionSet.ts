import { z } from 'zod'
import {
  CodeSchema,
  DescriptionSchema,
  NameSchema,
  ValueType,
  makeHandle,
  type Handle,
} from './core.ts'

export const OptionSchema = z.object({
  code: CodeSchema,
  name: NameSchema,
  sortOrder: z.number().int().min(0).optional(),
  formName: z.string().max(230).optional(),
  description: DescriptionSchema.optional(),
})

export const OptionSetSchema = z.object({
  code: CodeSchema,
  name: NameSchema,
  description: DescriptionSchema.optional(),
  valueType: ValueType,
  options: z.array(OptionSchema).min(1, 'an OptionSet needs at least one Option'),
})

export type OptionInput = z.infer<typeof OptionSchema>
export type OptionSetInput = z.infer<typeof OptionSetSchema>
export type OptionSet = Handle<'OptionSet', OptionSetInput>

export function defineOptionSet(input: z.input<typeof OptionSetSchema>): OptionSet {
  const parsed = OptionSetSchema.parse(input)
  return makeHandle('OptionSet', parsed)
}
