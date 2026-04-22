import type { MetadataKind } from '../../src/lib/core.ts'
import { ENTITY_SCHEMAS, ENTITY_SKIP_FIELDS, GLOBAL_SKIP_FIELDS } from './config.ts'
import type { Target } from './config.ts'
import type { Snapshot, SnapshotProperty, SnapshotSchema } from './snapshot.ts'

export type EntityByTarget = Record<Target, readonly SnapshotProperty[]>

/**
 * For each MetadataKind, a map of target → the filtered, de-duped property list.
 * Only owner/persisted/writable fields survive; entity- and global-level skips
 * are applied here so downstream emitters can treat the list as authoritative.
 */
export type EntityCollection = Record<MetadataKind, EntityByTarget>

function filterProperties(
  kind: MetadataKind,
  schema: SnapshotSchema | undefined,
): readonly SnapshotProperty[] {
  if (!schema) return []
  const skipEntity = ENTITY_SKIP_FIELDS[kind]
  const props = schema.properties.filter(
    (p) =>
      p.persisted === true &&
      p.owner === true &&
      p.writable === true &&
      !GLOBAL_SKIP_FIELDS.has(p.name) &&
      !GLOBAL_SKIP_FIELDS.has(p.fieldName ?? p.name) &&
      !skipEntity.has(p.name) &&
      !skipEntity.has(p.fieldName ?? p.name),
  )
  // Stable order — snapshots aren't alphabetical; sorting makes diffs tiny.
  return [...props].sort((a, b) => a.name.localeCompare(b.name))
}

export function collectEntities(
  snapshots: Readonly<Record<Target, Snapshot>>,
  targets: readonly Target[],
): EntityCollection {
  const kinds = Object.values(ENTITY_SCHEMAS) as readonly MetadataKind[]
  const out = {} as Record<MetadataKind, EntityByTarget>
  for (const kind of kinds) {
    const perTarget = {} as EntityByTarget
    const entityName = Object.entries(ENTITY_SCHEMAS).find(([, k]) => k === kind)?.[0]
    if (!entityName) throw new Error(`Unreachable: no entity name for kind ${kind}`)
    for (const target of targets) {
      const snap = snapshots[target]
      const schema = snap.schemas.find((s) => s.name === entityName)
      perTarget[target] = filterProperties(kind, schema)
    }
    out[kind] = perTarget
  }
  return out
}
