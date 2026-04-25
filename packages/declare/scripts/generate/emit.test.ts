import { describe, expect, it } from 'vitest'
import { emitEntity } from './emit.ts'
import type { EntityByTarget } from './collect.ts'
import type { SnapshotProperty } from './snapshot.ts'

const unsupportedReference = {
  name: 'form',
  fieldName: 'dataEntryForm',
  propertyType: 'REFERENCE',
  klass: 'org.hisp.dhis.dataentryform.DataEntryForm',
  persisted: true,
  owner: true,
  writable: true,
  required: false,
} satisfies SnapshotProperty

describe('emitEntity', () => {
  it('fails loudly for unsupported properties that survived collection filtering', () => {
    const perTarget: EntityByTarget = {
      '2.40': [unsupportedReference],
      '2.41': [],
      '2.42': [],
    }

    expect(() => emitEntity('DataSet', perTarget)).toThrow(
      /Cannot emit DataSet\.dataEntryForm for DHIS2 2\.40/,
    )
  })
})
