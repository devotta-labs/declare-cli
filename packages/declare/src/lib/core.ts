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

// DHIS2 master ValueType (org.hisp.dhis.common.ValueType).
export const ValueType = z.enum([
  'TEXT',
  'LONG_TEXT',
  'MULTI_TEXT',
  'LETTER',
  'PHONE_NUMBER',
  'EMAIL',
  'BOOLEAN',
  'TRUE_ONLY',
  'DATE',
  'DATETIME',
  'TIME',
  'NUMBER',
  'UNIT_INTERVAL',
  'PERCENTAGE',
  'INTEGER',
  'INTEGER_POSITIVE',
  'INTEGER_NEGATIVE',
  'INTEGER_ZERO_OR_POSITIVE',
  'USERNAME',
  'COORDINATE',
  'ORGANISATION_UNIT',
  'REFERENCE',
  'AGE',
  'URL',
  'FILE_RESOURCE',
  'IMAGE',
  'GEOJSON',
])
export type ValueType = z.infer<typeof ValueType>

// DHIS2 master AggregationType (org.hisp.dhis.analytics.AggregationType).
export const AggregationType = z.enum([
  'SUM',
  'AVERAGE',
  'AVERAGE_SUM_ORG_UNIT',
  'LAST',
  'LAST_AVERAGE_ORG_UNIT',
  'LAST_LAST_ORG_UNIT',
  'LAST_IN_PERIOD',
  'LAST_IN_PERIOD_AVERAGE_ORG_UNIT',
  'FIRST',
  'FIRST_AVERAGE_ORG_UNIT',
  'FIRST_FIRST_ORG_UNIT',
  'COUNT',
  'STDDEV',
  'VARIANCE',
  'MIN',
  'MAX',
  'MIN_SUM_ORG_UNIT',
  'MAX_SUM_ORG_UNIT',
  'NONE',
  'CUSTOM',
  'DEFAULT',
])
export type AggregationType = z.infer<typeof AggregationType>

// The subset of ValueTypes that carry numeric semantics. Used for cross-field
// refinements (e.g. SUM only makes sense on numeric data).
export const NUMERIC_VALUE_TYPES = new Set<ValueType>([
  'NUMBER',
  'INTEGER',
  'INTEGER_POSITIVE',
  'INTEGER_NEGATIVE',
  'INTEGER_ZERO_OR_POSITIVE',
  'PERCENTAGE',
  'UNIT_INTERVAL',
])

// Aggregations that reduce data numerically, so the underlying value type must
// be numeric too. LAST/FIRST/COUNT/NONE/CUSTOM/DEFAULT are not on this list —
// they work on any value type.
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

// DHIS2 requires a non-null shortName on most Nameable types. Rather than make
// the caller repeat the name, derive it from `name` when omitted, truncated to
// the server's 50-char limit.
export function withDerivedShortName<T extends { name: string; shortName?: string | undefined }>(
  value: T,
): T & { shortName: string } {
  return { ...value, shortName: value.shortName ?? value.name.slice(0, 50) }
}

// DHIS2 UIDs are 11-char strings matching [A-Za-z][A-Za-z0-9]{10}. Some master
// validation hooks (e.g. CategoryComboObjectBundleHook → DefaultCategoryService)
// assume a non-null UID on transient objects while the bundle is still being
// validated, so we supply one up-front. Deriving it from `kind:code` gives a
// stable UID across runs — matters only until the object first exists on the
// server; after that, the server keeps its own UID and our supplied one is a
// no-op for matches by code.
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
