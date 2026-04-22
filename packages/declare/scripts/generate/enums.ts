import type { Target } from './config.ts'
import type { EntityCollection } from './collect.ts'
import type { SnapshotProperty } from './snapshot.ts'

export type EnumDef = {
  /** Stable TS identifier derived from the Java klass name. */
  readonly name: string
  /** Full klass string from the snapshot — used only for debugging/diagnostics. */
  readonly klass: string
  /** Constants observed in each target (ordered as the snapshot ordered them). */
  readonly valuesByTarget: Readonly<Record<Target, readonly string[]>>
  /** Deduplicated union across all observed targets (stable order). */
  readonly union: readonly string[]
}

/**
 * Scan every CONSTANT property across every target, group by klass, and
 * build one EnumDef per distinct klass.
 *
 * Name clashes (two different klasses with the same last segment) are a
 * hard error — the generator is small enough that picking fully-qualified
 * names is easier than silently merging.
 */
export function collectEnums(
  collection: EntityCollection,
  targets: readonly Target[],
): readonly EnumDef[] {
  const byKlass = new Map<string, Map<Target, string[]>>()
  for (const target of targets) {
    for (const props of Object.values(collection)) {
      const perTarget = props[target]
      for (const prop of perTarget) {
        walkConstants(prop, target, byKlass)
      }
    }
  }

  const results: EnumDef[] = []
  const takenNames = new Map<string, string>()
  for (const [klass, observed] of byKlass) {
    const name = enumNameFromKlass(klass)
    const prior = takenNames.get(name)
    if (prior && prior !== klass) {
      throw new Error(
        `Enum name clash: ${name} maps to both ${prior} and ${klass}. ` +
          `Add an explicit alias in generate/enums.ts.`,
      )
    }
    takenNames.set(name, klass)

    const valuesByTarget = {} as Record<Target, readonly string[]>
    for (const target of targets) {
      valuesByTarget[target] = observed.get(target) ?? []
    }
    const seen = new Set<string>()
    const union: string[] = []
    for (const target of targets) {
      for (const v of valuesByTarget[target]) {
        if (!seen.has(v)) {
          seen.add(v)
          union.push(v)
        }
      }
    }
    results.push({ name, klass, valuesByTarget, union })
  }
  results.sort((a, b) => a.name.localeCompare(b.name))
  return results
}

function walkConstants(
  prop: SnapshotProperty,
  target: Target,
  sink: Map<string, Map<Target, string[]>>,
): void {
  if (prop.propertyType === 'CONSTANT' && prop.klass && prop.constants) {
    add(sink, prop.klass, target, [...prop.constants])
    return
  }
  // CONSTANT collections exist (e.g. program.accessLevels when it's a set of enum).
  if (
    prop.propertyType === 'COLLECTION' &&
    prop.itemPropertyType === 'CONSTANT' &&
    prop.itemKlass &&
    prop.constants
  ) {
    add(sink, prop.itemKlass, target, [...prop.constants])
  }
}

function add(
  sink: Map<string, Map<Target, string[]>>,
  klass: string,
  target: Target,
  values: readonly string[],
): void {
  let perKlass = sink.get(klass)
  if (!perKlass) {
    perKlass = new Map()
    sink.set(klass, perKlass)
  }
  // De-dupe within a (klass, target) but keep first-seen order.
  const existing = perKlass.get(target) ?? []
  const seen = new Set(existing)
  for (const v of values) {
    if (!seen.has(v)) {
      seen.add(v)
      existing.push(v)
    }
  }
  perKlass.set(target, existing)
}

/**
 * Last segment of a Java FQN, with a couple of renames for readability.
 * `DataElementDomain` → `DomainType` matches the hand-layer name users
 * already import from lib/dataElement.ts.
 */
export function enumNameFromKlass(klass: string): string {
  const last = klass.split('.').pop()!
  return ENUM_RENAMES[last] ?? last
}

const ENUM_RENAMES: Readonly<Record<string, string>> = {
  DataElementDomain: 'DomainType',
  AccessLevel: 'ProgramAccessLevel',
}
