import type { MetadataKind } from '../../src/lib/entities.ts'
import { ENTITY_SCHEMAS, ENTITY_SKIP_FIELDS, GLOBAL_SKIP_FIELDS } from './config.ts'
import type { Target } from './config.ts'
import type { Snapshot, SnapshotProperty, SnapshotSchema } from './snapshot.ts'

export type EntityByTarget = Record<Target, readonly SnapshotProperty[]>

export type EntityCollection = Record<MetadataKind, EntityByTarget>

function filterProperties(
  kind: MetadataKind,
  schema: SnapshotSchema | undefined,
): readonly SnapshotProperty[] {
  if (!schema) return []
  const skipEntity = ENTITY_SKIP_FIELDS[kind]
  const props = schema.properties.filter((p) => {
    if (p.persisted !== true || p.owner !== true || p.writable !== true) return false
    // Skip lists may use API, Java, or canonical snapshot names.
    const aliases: readonly string[] = [
      p.name,
      p.fieldName ?? p.name,
      p.collectionName ?? p.name,
    ]
    if (aliases.some((a) => GLOBAL_SKIP_FIELDS.has(a))) return false
    if (aliases.some((a) => skipEntity.has(a))) return false
    return true
  })
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
