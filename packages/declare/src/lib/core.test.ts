import { afterEach, describe, expect, it } from 'vitest'
import { defineDataElement } from './dataElement.ts'
import { defineTrackedEntityAttribute } from './trackedEntityAttribute.ts'
import { stableUid } from './core.ts'
import { DEFAULT_TARGET } from '../generated/targets.ts'
import { setTarget } from '../generated/runtime.ts'

describe('stableUid', () => {
  it('produces an 11-char DHIS2 UID that starts with a letter and is deterministic', () => {
    const uid = stableUid('DataElement:MAL_CASES')

    expect(uid).toMatch(/^[A-Za-z][A-Za-z0-9]{10}$/)
    expect(stableUid('DataElement:MAL_CASES')).toBe(uid)
    expect(stableUid('DataElement:MAL_DEATHS')).not.toBe(uid)
  })
})

describe('defineDataElement', () => {
  it('rejects a numeric aggregationType paired with a non-numeric valueType', () => {
    expect(() =>
      defineDataElement({
        code: 'BAD_ELEMENT',
        name: 'Bad element',
        valueType: 'TEXT',
        aggregationType: 'SUM',
      }),
    ).toThrow(/numeric aggregationType/)
  })
})

describe('target-versioned valueType enforcement', () => {
  afterEach(() => setTarget(DEFAULT_TARGET))

  it('accepts TRACKER_ASSOCIATE on 2.40 (field still exists there)', () => {
    setTarget('2.40')
    expect(() =>
      defineTrackedEntityAttribute({
        code: 'EX_TEA_OK',
        name: 'Ok TEA',
        valueType: 'TRACKER_ASSOCIATE',
      }),
    ).not.toThrow()
  })

  it('rejects TRACKER_ASSOCIATE on 2.42 (removed upstream)', () => {
    setTarget('2.42')
    expect(() =>
      defineTrackedEntityAttribute({
        code: 'EX_TEA_BAD',
        name: 'Bad TEA',
        valueType: 'TRACKER_ASSOCIATE',
      }),
    ).toThrow(/valueType/)
  })
})
