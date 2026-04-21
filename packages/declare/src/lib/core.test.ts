import { describe, expect, it } from 'vitest'
import { defineDataElement } from './dataElement.ts'
import { stableUid } from './core.ts'

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
