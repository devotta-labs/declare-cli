import { describe, expect, it } from 'vitest'
import { emitEntity } from './emit.ts'
import type { EntityByTarget } from './collect.ts'
import type { EnumDef } from './enums.ts'
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

const collectionWithoutInlineConstants = {
  name: 'blockedSearchOperators',
  collectionName: 'blockedSearchOperators',
  propertyType: 'COLLECTION',
  itemPropertyType: 'CONSTANT',
  itemKlass: 'org.hisp.dhis.common.QueryOperator',
  persisted: true,
  owner: true,
  writable: true,
  required: false,
} satisfies SnapshotProperty

const queryOperator = {
  name: 'QueryOperator',
  klass: 'org.hisp.dhis.common.QueryOperator',
  valuesByTarget: {
    '2.40': [],
    '2.41': [],
    '2.42': ['SW', 'EW', 'LIKE'],
    '2.43': ['SW', 'EW', 'LIKE'],
  },
  union: ['SW', 'EW', 'LIKE'],
} satisfies EnumDef

describe('emitEntity', () => {
  it('fails loudly for unsupported properties that survived collection filtering', () => {
    const perTarget: EntityByTarget = {
      '2.40': [unsupportedReference],
      '2.41': [],
      '2.42': [],
      '2.43': [],
    }

    expect(() => emitEntity('DataSet', perTarget)).toThrow(
      /Cannot emit DataSet\.form for DHIS2 2\.40/,
    )
  })

  it('reuses constants observed on another property with the same upstream enum class', () => {
    const perTarget: EntityByTarget = {
      '2.40': [],
      '2.41': [],
      '2.42': [collectionWithoutInlineConstants],
      '2.43': [collectionWithoutInlineConstants],
    }

    const { contents } = emitEntity('TrackedEntityAttribute', perTarget, [queryOperator])

    expect(contents).toContain(
      'blockedSearchOperators: z.array(QueryOperator_2_42).optional()',
    )
    expect(contents).toContain(
      'blockedSearchOperators: z.array(QueryOperator_2_43).optional()',
    )
  })
})
