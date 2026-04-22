import { defineUser } from '@devotta-labs/declare'
import { facility } from './organisationUnits.ts'
import { dataEntryRole } from './userRoles.ts'

export const demoReporter = defineUser({
  code: 'EX_USER_DEMO_REPORTER',
  username: 'demo',
  password: 'District1!',
  firstName: 'Demo',
  surname: 'Reporter',
  userRoles: [dataEntryRole],
  organisationUnits: [facility],
  dataViewOrganisationUnits: [facility],
})

export const users = [demoReporter]
