import { defineUser } from '@devotta-labs/declare'
import { norge } from '../organisationUnits/organisationUnits.ts'
import { dataEntryRole } from '../userRoles/userRoles.ts'

// Demo reporter account. Assigning the country root (NORGE) as the
// data-capture OU gives the user access to the full fylke + kommune subtree
// — so they can drill down to any level-3 OU (e.g. Sel) in the Data Entry
// app without us having to enumerate each OU here.
//
// NOTE: the password is stored in plaintext in the declarative schema on
// purpose. This repo seeds a throwaway demo account on a disposable DHIS2
// instance; it is not a production credential.
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
