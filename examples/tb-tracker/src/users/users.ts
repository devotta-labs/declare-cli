import { defineUser } from '@devotta-labs/declare'
import { norge } from '../organisationUnits/organisationUnits.ts'
import { trackerDataEntryRole } from '../userRoles/userRoles.ts'

// Demo TB nurse account. Structurally identical to the malaria demoReporter —
// country-root OU assignment so the user can drill to any kommune in the
// Capture app, plain-text password because this is a disposable demo account,
// not a production credential.
export const demoTbNurse = defineUser({
  code: 'USER_TB_NURSE',
  username: 'tbnurse',
  password: 'District1!',
  firstName: 'TB',
  surname: 'Nurse',
  userRoles: [trackerDataEntryRole],
  organisationUnits: [norge],
  dataViewOrganisationUnits: [norge],
})

export const users = [demoTbNurse]
