import { readFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'
import { TARGETS, type Target } from './config.ts'
import { validateSnapshot, type Snapshot, type SnapshotProperty } from './snapshot.ts'

const SNAPSHOT_DIR = resolve(dirname(fileURLToPath(import.meta.url)), '../../snapshots')

function loadSnapshot(target: Target): Snapshot {
  const value: unknown = JSON.parse(
    readFileSync(resolve(SNAPSHOT_DIR, `schemas-${target}.json`), 'utf8'),
  )
  validateSnapshot(target, value)
  return value
}

const snapshots = Object.fromEntries(
  TARGETS.map((target) => [target, loadSnapshot(target)]),
) as Record<Target, Snapshot>

function property(target: Target, schemaName: string, propertyName: string) {
  return snapshots[target].schemas
    .find((schema) => schema.name === schemaName)
    ?.properties.find((candidate) => candidate.name === propertyName)
}

function writableTextProperty(): Partial<SnapshotProperty> {
  return {
    propertyType: 'TEXT',
    persisted: true,
    owner: true,
    writable: true,
    required: false,
  }
}

describe('pinned DHIS2 schema snapshots', () => {
  it.each(TARGETS)('validates the %s snapshot structure and registered entity coverage', (target) => {
    expect(() => validateSnapshot(target, snapshots[target])).not.toThrow()
  })

  it('rejects a parseable snapshot that is missing a registered entity schema', () => {
    const withoutDataSet = {
      schemas: snapshots['2.43'].schemas.filter((schema) => schema.name !== 'dataSet'),
    }

    expect(() => validateSnapshot('2.43', withoutDataSet)).toThrow(
      /expected exactly one dataSet schema, found 0/,
    )
  })
})

describe('authoritative target boundaries from /api/schemas.json', () => {
  it('introduces writable program labels in 2.41 and retains them', () => {
    expect(property('2.40', 'program', 'enrollmentLabel')).toBeUndefined()
    for (const target of ['2.41', '2.42', '2.43'] as const) {
      expect(property(target, 'program', 'enrollmentLabel')).toMatchObject(
        writableTextProperty(),
      )
    }
  })

  it('introduces DataSet.displayOptions in 2.42 and retains it in 2.43', () => {
    expect(property('2.40', 'dataSet', 'displayOptions')).toBeUndefined()
    expect(property('2.41', 'dataSet', 'displayOptions')).toBeUndefined()
    for (const target of ['2.42', '2.43'] as const) {
      expect(property(target, 'dataSet', 'displayOptions')).toMatchObject({
        ...writableTextProperty(),
        length: 50_000,
      })
    }
  })

  it('removes TRACKER_ASSOCIATE from ValueType in 2.42 and keeps it removed in 2.43', () => {
    for (const target of ['2.40', '2.41'] as const) {
      expect(property(target, 'trackedEntityAttribute', 'valueType')?.constants).toContain(
        'TRACKER_ASSOCIATE',
      )
    }
    for (const target of ['2.42', '2.43'] as const) {
      expect(property(target, 'trackedEntityAttribute', 'valueType')?.constants).not.toContain(
        'TRACKER_ASSOCIATE',
      )
    }
  })

  it('introduces the SCHEDULEEVENT program-rule action in 2.42 and retains it in 2.43', () => {
    for (const target of ['2.40', '2.41'] as const) {
      expect(property(target, 'programRuleAction', 'programRuleActionType')?.constants).not.toContain(
        'SCHEDULEEVENT',
      )
    }
    for (const target of ['2.42', '2.43'] as const) {
      expect(property(target, 'programRuleAction', 'programRuleActionType')?.constants).toContain(
        'SCHEDULEEVENT',
      )
    }
  })

  it('models blockedSearchOperators as QueryOperator values from 2.42 onward', () => {
    expect(property('2.41', 'trackedEntityAttribute', 'blockedSearchOperators')).toBeUndefined()
    for (const target of ['2.42', '2.43'] as const) {
      expect(property(target, 'trackedEntityAttribute', 'blockedSearchOperators')).toMatchObject({
        propertyType: 'COLLECTION',
        itemPropertyType: 'CONSTANT',
        itemKlass: 'org.hisp.dhis.common.QueryOperator',
        persisted: true,
        owner: true,
        writable: true,
      })
    }
  })
})
