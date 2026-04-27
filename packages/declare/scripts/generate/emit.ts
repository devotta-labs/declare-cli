import type { MetadataKind } from '../../src/lib/entities.ts'
import { DEFAULT_TARGET, ENTITY_SCHEMAS, KLASS_TO_KIND, TARGETS } from './config.ts'
import type { Target } from './config.ts'
import type { EntityCollection, EntityByTarget } from './collect.ts'
import type { EnumDef } from './enums.ts'
import { enumNameFromKlass } from './enums.ts'
import type { SnapshotProperty } from './snapshot.ts'

const BANNER = [
  '// AUTO-GENERATED — do not edit by hand.',
  '//',
  '// Source: packages/declare/snapshots/schemas-<target>.json',
  '// Tool:   packages/declare/scripts/generate.ts',
  '//',
  '// Re-run `pnpm --filter @devotta-labs/declare gen:schemas` to refresh.',
  '',
].join('\n')

/** Return the pairs [target, perTarget-string] for emitting byTarget records. */
function enumName(prop: SnapshotProperty): string {
  const klass =
    prop.propertyType === 'CONSTANT'
      ? prop.klass
      : prop.propertyType === 'COLLECTION' && prop.itemPropertyType === 'CONSTANT'
        ? prop.itemKlass
        : null
  if (!klass) throw new Error(`No klass on CONSTANT property ${prop.name}`)
  return enumNameFromKlass(klass)
}

/** Emit a Zod expression for a single scalar / constant / reference property. */
function emitScalar(prop: SnapshotProperty, target: Target): string | null {
  switch (prop.propertyType) {
    case 'BOOLEAN':
      return 'z.boolean()'
    case 'INTEGER':
      return 'z.number().int()'
    case 'NUMBER':
      return 'z.number()'
    case 'URL':
      return 'z.string().url()'
    case 'EMAIL':
      return 'z.string().email()'
    case 'PHONENUMBER':
    case 'PASSWORD':
    case 'DATE':
      return 'z.string()'
    case 'TEXT':
    case 'IDENTIFIER': {
      const len = reasonableLength(prop.length)
      return len === null ? 'z.string()' : `z.string().max(${len})`
    }
    case 'CONSTANT': {
      // CONSTANT properties with no constants array are rare but possible
      // (e.g. an enum whose values aren't enumerated in the snapshot). Emit
      // a plain string so validation doesn't crash.
      if (!prop.constants || prop.constants.length === 0) return 'z.string()'
      return `${enumName(prop)}_${targetSuffix(target)}`
    }
    case 'REFERENCE': {
      const klass = prop.klass ?? ''
      const kind = KLASS_TO_KIND[klass]
      if (!kind) return null
      return `refSchema('${kind}')`
    }
    case 'COMPLEX':
      return null
    case 'COLLECTION':
      return emitCollection(prop, target)
  }
}

function unsupportedPropertyMessage(
  kind: MetadataKind,
  target: Target,
  prop: SnapshotProperty,
): string {
  const parts = [
    `propertyType=${prop.propertyType}`,
    prop.klass ? `klass=${prop.klass}` : null,
    prop.itemPropertyType ? `itemPropertyType=${prop.itemPropertyType}` : null,
    prop.itemKlass ? `itemKlass=${prop.itemKlass}` : null,
  ].filter((p): p is string => p !== null)

  return [
    `Cannot emit ${kind}.${apiFieldName(prop)} for DHIS2 ${target} (${parts.join(', ')}).`,
    'Add emitter support, map its klass in KLASS_TO_KIND, or add an explicit skip in generate/config.ts if the hand layer owns it.',
  ].join(' ')
}

function emitCollection(prop: SnapshotProperty, target: Target): string | null {
  const item = prop.itemPropertyType
  if (item === 'REFERENCE') {
    const kind = KLASS_TO_KIND[prop.itemKlass ?? '']
    if (!kind) return null
    return `z.array(refSchema('${kind}'))`
  }
  if (item === 'CONSTANT') {
    if (!prop.constants || prop.constants.length === 0) {
      return 'z.array(z.string())'
    }
    return `z.array(${enumName(prop)}_${targetSuffix(target)})`
  }
  if (item === 'TEXT' || item === 'IDENTIFIER') return 'z.array(z.string())'
  if (item === 'INTEGER') return 'z.array(z.number().int())'
  if (item === 'NUMBER') return 'z.array(z.number())'
  return null
}

/**
 * Snapshot lengths like 255, 2147483647, 230 are meaningful; the Java sentinel
 * `Integer.MAX_VALUE` (2^31 - 1) just means "no limit" and we drop it to avoid
 * confusing error messages.
 */
function reasonableLength(len: number | null | undefined): number | null {
  if (len === null || len === undefined) return null
  if (len <= 0) return null
  if (len >= 2_000_000_000) return null
  return len
}

function targetSuffix(target: Target): string {
  return target.replace('.', '_')
}

/**
 * The JSON key DHIS2 actually reads during a metadata import. For COLLECTION
 * properties this is `collectionName` (e.g. DataSet.organisationUnits,
 * Program.programTrackedEntityAttributes) — using `fieldName` would emit the
 * Java field name instead (`sources`, `programAttributes`) which the API
 * silently ignores on import. For non-COLLECTION properties the canonical
 * `name` is the correct wire-format key — `fieldName` is the Java field name
 * which can differ (e.g. ProgramRuleVariable has `name=trackedEntityAttribute`
 * but `fieldName=attribute`).
 */
function apiFieldName(prop: SnapshotProperty): string {
  if (prop.propertyType === 'COLLECTION' && prop.collectionName) {
    return prop.collectionName
  }
  return prop.name
}

/** Emit `generated/enums.ts` — one z.enum per (enum, target) + a union. */
export function emitEnums(enums: readonly EnumDef[]): string {
  const parts: string[] = [BANNER, "import { z } from 'zod'", '']
  for (const def of enums) {
    parts.push(`// ${def.klass}`)
    // Authoring surface: Union of constants across every target, exported as
    // the canonical name (e.g. `ValueType`). Per-target variants stay as
    // `ValueType_2_40` etc so `<Entity>Base_<target>.ts` imports are uniform.
    const unionLiterals = def.union.map((v) => `'${escapeString(v)}'`).join(', ')
    parts.push(`export const ${def.name} = z.enum([${unionLiterals}])`)
    parts.push(`export type ${def.name} = z.infer<typeof ${def.name}>`)
    for (const target of TARGETS) {
      const values = def.valuesByTarget[target]
      const constName = `${def.name}_${targetSuffix(target)}`
      if (values.length === 0) {
        // Not present in this target — alias to the union so imports resolve.
        parts.push(`export const ${constName} = ${def.name}`)
        continue
      }
      const literals = values.map((v) => `'${escapeString(v)}'`).join(', ')
      parts.push(`export const ${constName} = z.enum([${literals}])`)
    }
    // Per-target lookup so hand-written wrappers can pick the versioned enum
    // without hard-coding target strings. Prevents accidental clobber with the
    // unversioned union when the wrapper needs to attach a default or modifier.
    const byTargetEntries = TARGETS.map(
      (t) => `  '${t}': ${def.name}_${targetSuffix(t)},`,
    ).join('\n')
    parts.push(`export const ${def.name}ByTarget = {\n${byTargetEntries}\n} as const`)
    parts.push('')
  }
  return parts.join('\n')
}

/** Emit `generated/<entity>.ts` — one base schema per target + a byTarget map. */
export function emitEntity(
  kind: MetadataKind,
  perTarget: EntityByTarget,
): { filename: string; contents: string; usedEnums: ReadonlySet<string> } {
  const filename = `${lowerFirst(kind)}.ts`
  const usedEnums = new Set<string>()
  let usesRefSchema = false

  const perTargetBlocks: string[] = []
  for (const target of TARGETS) {
    const props = perTarget[target]
    const lines: string[] = []
    for (const prop of props) {
      const expr = emitScalar(prop, target)
      if (expr === null) {
        throw new Error(unsupportedPropertyMessage(kind, target, prop))
      }
      if (expr.includes('refSchema(')) usesRefSchema = true
      // Track enum usage only when a per-target enum identifier actually
      // appears in the emitted expression — CONSTANT / itemPropertyType=CONSTANT
      // properties with an empty `constants` array fall back to `z.string()` /
      // `z.array(z.string())` and must NOT trigger an enum import (would dangle
      // or, if klass is null, crash enumName()).
      if (
        (prop.propertyType === 'CONSTANT' || prop.itemPropertyType === 'CONSTANT') &&
        prop.constants &&
        prop.constants.length > 0
      ) {
        usedEnums.add(enumName(prop))
      }
      const optional = prop.required === true ? '' : '.optional()'
      lines.push(`  ${apiFieldName(prop)}: ${expr}${optional},`)
    }
    const body = lines.length === 0 ? '' : '\n' + lines.join('\n') + '\n'
    perTargetBlocks.push(
      `export const ${kind}Base_${targetSuffix(target)} = z.object({${body}})`,
    )
  }

  const enumImports = [...usedEnums].sort().flatMap((name) =>
    TARGETS.map((t) => `${name}_${targetSuffix(t)}`),
  )

  const imports = [
    "import { z } from 'zod'",
    ...(usesRefSchema ? ["import { refSchema } from '../lib/core.ts'"] : []),
    ...(enumImports.length > 0
      ? [`import { ${enumImports.join(', ')} } from './enums.ts'`]
      : []),
  ]

  const byTargetEntries = TARGETS.map(
    (t) => `  '${t}': ${kind}Base_${targetSuffix(t)},`,
  ).join('\n')

  const contents = [
    BANNER,
    imports.join('\n'),
    '',
    ...perTargetBlocks.map((b) => b + '\n'),
    `export const ${kind}BaseByTarget = {\n${byTargetEntries}\n} as const`,
    '',
  ].join('\n')

  return { filename, contents, usedEnums }
}

/** Emit `generated/index.ts` re-exporting everything. */
export function emitIndex(): string {
  const kinds = Object.values(ENTITY_SCHEMAS) as readonly MetadataKind[]
  const reexports = kinds
    .slice()
    .sort()
    .map((k) => `export * from './${lowerFirst(k)}.ts'`)
  return [
    BANNER,
    "export { TARGETS, DEFAULT_TARGET, type Target } from './targets.ts'",
    "export { getTarget, setTarget, withTarget } from './runtime.ts'",
    "export * from './enums.ts'",
    ...reexports,
    '',
  ].join('\n')
}

/** Emit `generated/targets.ts` — the sole authority on supported targets. */
export function emitTargets(): string {
  const literals = TARGETS.map((t) => `'${t}'`).join(', ')
  return [
    BANNER,
    `export const TARGETS = [${literals}] as const`,
    'export type Target = (typeof TARGETS)[number]',
    `export const DEFAULT_TARGET: Target = '${DEFAULT_TARGET}'`,
    '',
  ].join('\n')
}

/** Emit `generated/runtime.ts` — mutable global for the current target. */
export function emitRuntime(): string {
  return [
    BANNER,
    "import { AsyncLocalStorage } from 'node:async_hooks'",
    "import { DEFAULT_TARGET, type Target } from './targets.ts'",
    "export type { Target } from './targets.ts'",
    '',
    '// Process-wide fallback target. Library users who import defineX directly',
    '// get DEFAULT_TARGET unless they call setTarget() or wrap their code in',
    '// withTarget(). Async callers should prefer withTarget() so overlapping',
    '// schema loads do not race through this fallback.',
    'let current: Target = DEFAULT_TARGET',
    'const targetStorage = new AsyncLocalStorage<Target>()',
    '',
    'export function getTarget(): Target {',
    '  return targetStorage.getStore() ?? current',
    '}',
    '',
    'export function setTarget(target: Target): void {',
    '  current = target',
    '}',
    '',
    '/**',
    ' * Run `fn` with `target` active for this async execution context.',
    ' * Synchronous callbacks return synchronously; async callbacks keep the',
    ' * target across awaits without changing the process-wide fallback.',
    ' */',
    'export function withTarget<T>(target: Target, fn: () => T): T {',
    '  return targetStorage.run(target, fn)',
    '}',
    '',
  ].join('\n')
}

function lowerFirst(s: string): string {
  return s.charAt(0).toLowerCase() + s.slice(1)
}

function escapeString(s: string): string {
  return s.replace(/\\/g, '\\\\').replace(/'/g, "\\'")
}
