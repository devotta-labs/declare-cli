import { defineUser } from '@devotta-labs/declare'
import { norge } from '../organisationUnits/organisationUnits.ts'
import { dataEntryRole } from '../userRoles/userRoles.ts'

// Plaintext password — throwaway demo account on a disposable instance.
export const demoReporter = defineUser({
  code: 'USER_DEMO_REPORTER',
  username: 'demo',
  password: 'District1!',
  firstName: 'Demo',
  surname: 'Reporter',
  userRoles: [dataEntryRole],
  organisationUnits: [norge],
  dataViewOrganisationUnits: [norge],
})

export const users = [demoReporter]
