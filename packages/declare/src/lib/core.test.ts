import { afterEach, describe, expect, it } from 'vitest'
import { defineDataElement } from './dataElement.ts'
import { defineOptionSet } from './optionSet.ts'
import { defineTrackedEntityAttribute } from './trackedEntityAttribute.ts'
import { stableUid } from './core.ts'
import { DEFAULT_TARGET, TARGETS } from '../generated/targets.ts'
import { getTarget, setTarget, withTarget } from '../generated/runtime.ts'

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

describe('optionSet valueType consistency', () => {
  const textOptionSet = defineOptionSet({
    code: 'OS_TEXT',
    name: 'Text option set',
    valueType: 'TEXT',
    options: [{ code: 'A', name: 'A' }],
  })

  it('rejects a NUMBER data element backed by a TEXT option set', () => {
    expect(() =>
      defineDataElement({
        code: 'DE_MISMATCH',
        name: 'Mismatch',
        valueType: 'NUMBER',
        aggregationType: 'NONE',
        optionSet: textOptionSet,
      }),
    ).toThrow(/optionSet/)
  })

  it('accepts a TEXT data element backed by a TEXT option set', () => {
    expect(() =>
      defineDataElement({
        code: 'DE_MATCH',
        name: 'Match',
        valueType: 'TEXT',
        aggregationType: 'NONE',
        optionSet: textOptionSet,
      }),
    ).not.toThrow()
  })

  it('rejects a NUMBER tracked entity attribute backed by a TEXT option set', () => {
    expect(() =>
      defineTrackedEntityAttribute({
        code: 'TEA_MISMATCH',
        name: 'Mismatch',
        valueType: 'NUMBER',
        optionSet: textOptionSet,
      }),
    ).toThrow(/optionSet/)
  })

  it('accepts a TEXT tracked entity attribute backed by a TEXT option set', () => {
    expect(() =>
      defineTrackedEntityAttribute({
        code: 'TEA_MATCH',
        name: 'Match',
        valueType: 'TEXT',
        optionSet: textOptionSet,
      }),
    ).not.toThrow()
  })
})

describe('target-versioned valueType enforcement', () => {
  afterEach(() => setTarget(DEFAULT_TARGET))

  it.each(['2.40', '2.41'] as const)(
    'accepts TRACKER_ASSOCIATE on %s (field still exists there)',
    (target) => {
      setTarget(target)
      expect(() =>
        defineTrackedEntityAttribute({
          code: 'EX_TEA_OK',
          name: 'Ok TEA',
          valueType: 'TRACKER_ASSOCIATE',
        }),
      ).not.toThrow()
    },
  )

  it.each(['2.42', '2.43'] as const)(
    'rejects TRACKER_ASSOCIATE on %s (removed upstream)',
    (target) => {
      setTarget(target)
      expect(() =>
        defineTrackedEntityAttribute({
          code: 'EX_TEA_BAD',
          name: 'Bad TEA',
          valueType: 'TRACKER_ASSOCIATE',
        }),
      ).toThrow(/valueType/)
    },
  )
})

describe('target-versioned blocked search operators', () => {
  afterEach(() => setTarget(DEFAULT_TARGET))

  it.each(['2.42', '2.43'] as const)(
    'accepts the three blockable Tracker operators on %s',
    (target) => {
      setTarget(target)
      expect(() =>
        defineTrackedEntityAttribute({
          code: 'EX_TEA_SEARCH_OK',
          name: 'Searchable TEA',
          valueType: 'TEXT',
          blockedSearchOperators: ['SW', 'EW', 'LIKE'],
        }),
      ).not.toThrow()
    },
  )

  it.each(['2.42', '2.43'] as const)(
    'rejects the non-blockable EQ operator on %s',
    (target) => {
      setTarget(target)
      expect(() =>
        defineTrackedEntityAttribute({
          code: 'EX_TEA_SEARCH_BAD',
          name: 'Bad searchable TEA',
          valueType: 'TEXT',
          blockedSearchOperators: ['EQ'] as never,
        }),
      ).toThrow(/blockedSearchOperators/)
    },
  )
})

describe('target context', () => {
  afterEach(() => setTarget(DEFAULT_TARGET))

  it('supports DHIS2 2.40 through 2.43 and defaults to the newest target', () => {
    expect(TARGETS).toEqual(['2.40', '2.41', '2.42', '2.43'])
    expect(DEFAULT_TARGET).toBe('2.43')
  })

  it('isolates overlapping async withTarget calls', async () => {
    const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

    const [first, second] = await Promise.all([
      withTarget('2.40', async () => {
        await wait(10)
        return getTarget()
      }),
      withTarget('2.43', async () => {
        await wait(1)
        return getTarget()
      }),
    ])

    expect(first).toBe('2.40')
    expect(second).toBe('2.43')
    expect(getTarget()).toBe(DEFAULT_TARGET)
  })
})
