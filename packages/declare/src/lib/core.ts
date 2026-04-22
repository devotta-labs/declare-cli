import { createHash } from 'node:crypto'
import { z } from 'zod'

export type MetadataKind =
  | 'Category'
  | 'CategoryOption'
  | 'CategoryCombo'
  | 'OptionSet'
  | 'Option'
  | 'DataElement'
  | 'DataSet'
  | 'OrganisationUnit'
  | 'OrganisationUnitLevel'
  | 'UserRole'
  | 'UserGroup'
  | 'User'
  | 'TrackedEntityAttribute'
  | 'TrackedEntityType'
  | 'Program'
  | 'ProgramStage'

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
export const DescriptionSchema = z.string().max(2000)

// The canonical enum surface is generated from /api/schemas.json snapshots —
// see packages/declare/scripts/generate.ts. We re-export the union variants
// here so existing lib/<entity>.ts imports keep working and so consumers that
// `import { ValueType } from '@devotta-labs/declare'` pick up new constants
// without touching core.ts.
export { AggregationType, FeatureType, ValueType } from '../generated/enums.ts'
import type { AggregationType, ValueType } from '../generated/enums.ts'

export const NUMERIC_VALUE_TYPES = new Set<ValueType>([
  'NUMBER',
  'INTEGER',
  'INTEGER_POSITIVE',
  'INTEGER_NEGATIVE',
  'INTEGER_ZERO_OR_POSITIVE',
  'PERCENTAGE',
  'UNIT_INTERVAL',
])

// Aggregations that require a numeric value type. LAST/FIRST/COUNT/NONE/CUSTOM/
// DEFAULT are omitted — they work on any value type.
export const NUMERIC_AGGREGATIONS = new Set<AggregationType>([
  'SUM',
  'AVERAGE',
  'AVERAGE_SUM_ORG_UNIT',
  'MIN',
  'MAX',
  'MIN_SUM_ORG_UNIT',
  'MAX_SUM_ORG_UNIT',
  'STDDEV',
  'VARIANCE',
])

export function refSchema<K extends MetadataKind>(kind: K) {
  return z.custom<Ref<K>>(
    (v) => isHandle(v) && (v as Handle<MetadataKind, { code: string }>).kind === kind,
    { message: `expected a ${kind} reference` },
  )
}

// DHIS2 requires a non-null shortName on most Nameable types; derive from name.
export function withDerivedShortName<T extends { name: string; shortName?: string | undefined }>(
  value: T,
): T & { shortName: string } {
  return { ...value, shortName: value.shortName ?? value.name.slice(0, 50) }
}

// DHIS2 UIDs: [A-Za-z][A-Za-z0-9]{10}. Derived from kind:code for stability;
// used only for new objects (existing ones keep the server's UID on code-match).
const UID_LETTERS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz'
const UID_ALPHANUM = `${UID_LETTERS}0123456789`

export function stableUid(seed: string): string {
  const bytes = createHash('sha256').update(seed).digest()
  let out = UID_LETTERS[bytes[0]! % UID_LETTERS.length]!
  for (let i = 1; i < 11; i++) {
    out += UID_ALPHANUM[bytes[i]! % UID_ALPHANUM.length]
  }
  return out
}
