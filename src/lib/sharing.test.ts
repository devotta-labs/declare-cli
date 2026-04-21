import { describe, expect, it } from 'vitest'
import { defineDataElement } from './dataElement.ts'
import { defineDataSet } from './dataSet.ts'
import { defineOrganisationUnit } from './organisationUnit.ts'
import { defineSchema } from './schema.ts'
import { defineUser } from './user.ts'
import { defineUserGroup } from './userGroup.ts'
import { defineUserRole } from './userRole.ts'

const ou = defineOrganisationUnit({
  code: 'OU_ROOT',
  name: 'Root',
  shortName: 'Root',
  openingDate: '1970-01-01',
})

const role = defineUserRole({
  code: 'UR_TEST',
  name: 'Test',
  authorities: ['F_DATAVALUE_ADD'],
})

const de = defineDataElement({
  code: 'DE_X',
  name: 'X',
  valueType: 'NUMBER',
})

describe('sharing serialization', () => {
  it('rejects access strings with characters other than r/w/- or wrong length', () => {
    expect(() =>
      defineDataSet({
        code: 'DS_BAD',
        name: 'Bad',
        periodType: 'Monthly',
        dataSetElements: [{ dataElement: de }],
        sharing: { publicAccess: 'rwrwxxxx' as string },
      }),
    ).toThrow()
    expect(() =>
      defineDataSet({
        code: 'DS_BAD_LEN',
        name: 'Bad len',
        periodType: 'Monthly',
        dataSetElements: [{ dataElement: de }],
        sharing: { publicAccess: 'rwrw' as string },
      }),
    ).toThrow()
  })

  it('emits the DHIS2 Sharing JSON shape (public key, owner null, uid-keyed maps)', () => {
    const user = defineUser({
      code: 'U_ONE',
      username: 'user1',
      password: 'District1!',
      firstName: 'One',
      surname: 'User',
      userRoles: [role],
      organisationUnits: [ou],
    })
    const group = defineUserGroup({ code: 'UG_ONE', name: 'Group one' })
    const ds = defineDataSet({
      code: 'DS_SHARE',
      name: 'Shared',
      periodType: 'Monthly',
      dataSetElements: [{ dataElement: de }],
      sharing: {
        publicAccess: 'rwrw----',
        users: [{ user, access: 'rwrw----' }],
        userGroups: [{ userGroup: group, access: 'r-rw----' }],
      },
    })

    const schema = defineSchema({
      dataElements: [de],
      dataSets: [ds],
      organisationUnits: [ou],
      userRoles: [role],
      userGroups: [group],
      users: [user],
    })

    const payload = schema.serialize() as Record<string, unknown[]>
    const dataSets = payload.dataSets ?? []
    const shared = dataSets[0] as Record<string, unknown>
    const sharing = shared.sharing as Record<string, unknown>

    expect(sharing.public).toBe('rwrw----')
    expect(sharing.owner).toBeNull()

    const userMap = sharing.users as Record<string, { id: string; access: string }>
    const userKeys = Object.keys(userMap)
    expect(userKeys).toHaveLength(1)
    const userKey = userKeys[0]!
    expect(userKey).toMatch(/^[A-Za-z][A-Za-z0-9]{10}$/)
    expect(userMap[userKey]!.access).toBe('rwrw----')
    expect(userMap[userKey]!.id).toBe(userKey)

    const groupMap = sharing.userGroups as Record<string, { id: string; access: string }>
    expect(Object.values(groupMap)).toEqual([
      expect.objectContaining({ access: 'r-rw----' }),
    ])
  })

  it('serialises UserGroup membership under the DHIS2 `users` wire field', () => {
    const user = defineUser({
      code: 'U_MEM',
      username: 'member',
      password: 'District1!',
      firstName: 'Mem',
      surname: 'Ber',
      userRoles: [role],
      organisationUnits: [ou],
    })
    const group = defineUserGroup({
      code: 'UG_WITH_MEMBER',
      name: 'With member',
      users: [user],
    })

    const schema = defineSchema({
      organisationUnits: [ou],
      userRoles: [role],
      userGroups: [group],
      users: [user],
    })
    const payload = schema.serialize() as Record<string, unknown[]>
    const groups = payload.userGroups ?? []
    const g = groups[0] as Record<string, unknown>
    expect(g).not.toHaveProperty('members')
    expect(g.users).toEqual([expect.objectContaining({ code: 'U_MEM' })])
  })

  it('leaves datasets without a sharing declaration unchanged', () => {
    const ds = defineDataSet({
      code: 'DS_NOSHARE',
      name: 'No share',
      periodType: 'Monthly',
      dataSetElements: [{ dataElement: de }],
    })

    const schema = defineSchema({ dataElements: [de], dataSets: [ds] })
    const payload = schema.serialize() as Record<string, unknown[]>
    const dataSets = payload.dataSets ?? []
    const entry = dataSets[0] as Record<string, unknown>
    expect(entry.sharing).toBeUndefined()
  })
})
