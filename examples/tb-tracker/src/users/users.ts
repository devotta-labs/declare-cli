import { defineUser } from '@devotta-labs/declare'
import { norge } from '../organisationUnits/organisationUnits.ts'
import { trackerDataEntryRole } from '../userRoles/userRoles.ts'

// Plaintext password — throwaway demo account on a disposable instance.
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
