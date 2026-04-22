import { z } from 'zod'
import { OptionSetBaseByTarget } from '../generated/optionSet.ts'
import { getTarget, type Target } from '../generated/runtime.ts'
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

// Intentionally does NOT re-declare `valueType` — the generated per-target base
// already uses the versioned `ValueType_2_XX` enum; re-declaring with the
// unversioned union would silently re-admit values the target has dropped.
const overrides = {
  code: CodeSchema,
  name: NameSchema,
  description: DescriptionSchema.optional(),
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
// Input/output types span every supported target so authoring works regardless
// of which target is configured; runtime parse enforces the actual target.
export type OptionSetInput = { [T in Target]: z.input<(typeof SCHEMAS)[T]> }[Target]
export type OptionSet = Handle<
  'OptionSet',
  { [T in Target]: z.output<(typeof SCHEMAS)[T]> }[Target]
>

export function defineOptionSet(input: OptionSetInput): OptionSet {
  const parsed = SCHEMAS[getTarget()].parse(input) as { [T in Target]: z.output<(typeof SCHEMAS)[T]> }[Target]
  return makeHandle('OptionSet', parsed)
}
