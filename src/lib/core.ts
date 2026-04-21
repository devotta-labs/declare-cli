import { z } from 'zod'

export type MetadataKind =
  | 'Category'
  | 'CategoryOption'
  | 'CategoryCombo'
  | 'OptionSet'
  | 'Option'
  | 'DataElement'
  | 'DataSet'

declare const __kind: unique symbol
declare const __brand: unique symbol

export type Ref<K extends MetadataKind> = {
  readonly [__kind]: K
  readonly [__brand]: 'Ref'
  readonly code: string
}

export type Handle<K extends MetadataKind, Input> = Ref<K> & {
  readonly kind: K
  readonly input: Input
}

export function makeHandle<K extends MetadataKind, Input extends { code: string }>(
  kind: K,
  input: Input,
): Handle<K, Input> {
  return {
    kind,
    code: input.code,
    input,
  } as Handle<K, Input>
}

export function isHandle(value: unknown): value is Handle<MetadataKind, { code: string }> {
  return (
    typeof value === 'object' &&
    value !== null &&
    'kind' in value &&
    'code' in value &&
    'input' in value
  )
}

export const CodeSchema = z
  .string()
  .min(1, 'code is required')
  .max(50, 'code must be at most 50 chars')
  .regex(
    /^[A-Z][A-Z0-9_]*$/,
    'code must start with a letter and contain only uppercase letters, digits and underscores',
  )

export const NameSchema = z.string().min(1, 'name is required').max(230)
export const ShortNameSchema = z.string().min(1).max(50)

export function refSchema<K extends MetadataKind>(kind: K) {
  return z.custom<Ref<K>>(
    (v) => isHandle(v) && (v as Handle<MetadataKind, { code: string }>).kind === kind,
    { message: `expected a ${kind} reference` },
  )
}
