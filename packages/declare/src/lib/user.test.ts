import { describe, expect, it } from 'vitest'
import { defineOrganisationUnit } from './organisationUnit.ts'
import { defineSchema } from './schema.ts'
import { defineUser } from './user.ts'
import { defineUserRole } from './userRole.ts'

const ou = defineOrganisationUnit({
  code: 'OU_ROOT',
  name: 'Root',
  shortName: 'Root',
  openingDate: '1970-01-01',
})

const role = defineUserRole({
  code: 'UR_DATA_ENTRY',
  name: 'Data entry',
  authorities: ['F_DATAVALUE_ADD'],
})

describe('defineUserRole', () => {
  it('stores authorities as a plain string array (DHIS2 accepts custom authorities too)', () => {
    const r = defineUserRole({
      code: 'UR_CUSTOM',
      name: 'Custom',
      authorities: ['F_DATAVALUE_ADD', 'M_dhis-web-app-management'],
    })
    expect(r.input.authorities).toEqual(['F_DATAVALUE_ADD', 'M_dhis-web-app-management'])
  })
})

describe('defineUser', () => {
  it('rejects a user with no roles (mirrors DHIS2 E4055)', () => {
    expect(() =>
      defineUser({
        code: 'U_NOPE',
        username: 'nope',
        password: 'District1!',
        firstName: 'No',
        surname: 'Roles',
        userRoles: [],
        organisationUnits: [ou],
      }),
    ).toThrow(/UserRole/)
  })

  it('rejects a user with no data-capture OUs', () => {
    expect(() =>
      defineUser({
        code: 'U_NOPE2',
        username: 'nope2',
        password: 'District1!',
        firstName: 'No',
        surname: 'OU',
        userRoles: [role],
        organisationUnits: [],
      }),
    ).toThrow(/OU/)
  })

  it('rejects usernames shorter than 4 chars or with illegal characters', () => {
    expect(() =>
      defineUser({
        code: 'U_SHORT',
        username: 'ab',
        password: 'District1!',
        firstName: 'A',
        surname: 'B',
        userRoles: [role],
        organisationUnits: [ou],
      }),
    ).toThrow()
    expect(() =>
      defineUser({
        code: 'U_BAD',
        username: 'has space',
        password: 'District1!',
        firstName: 'A',
        surname: 'B',
        userRoles: [role],
        organisationUnits: [ou],
      }),
    ).toThrow()
  })
})

describe('schema serialize with users', () => {
  it('emits users with ref-shaped roles/OUs and a stable top-level id', () => {
    const user = defineUser({
      code: 'U_DEMO',
      username: 'demo',
      password: 'District1!',
      firstName: 'Demo',
      surname: 'User',
      userRoles: [role],
      organisationUnits: [ou],
      dataViewOrganisationUnits: [ou],
    })

    const schema = defineSchema({
      organisationUnits: [ou],
      userRoles: [role],
      users: [user],
    })

    const payload = schema.serialize() as Record<string, unknown[]>
    expect(payload.userRoles).toHaveLength(1)
    expect(payload.users).toHaveLength(1)

    const users = payload.users ?? []
    const u = users[0] as Record<string, unknown>
    expect(u.id).toMatch(/^[A-Za-z][A-Za-z0-9]{10}$/)
    expect(u.username).toBe('demo')
    expect(u.password).toBe('District1!')
    expect(u.firstName).toBe('Demo')
    expect(u.surname).toBe('User')

    const roles = u.userRoles as { id: string; code: string }[]
    expect(roles).toHaveLength(1)
    const firstRole = roles[0]!
    expect(firstRole.code).toBe('UR_DATA_ENTRY')
    expect(firstRole.id).toMatch(/^[A-Za-z][A-Za-z0-9]{10}$/)

    const ous = u.organisationUnits as { id: string; code: string }[]
    expect(ous).toEqual([expect.objectContaining({ code: 'OU_ROOT' })])
  })
})
