import { defineUser } from '@devotta-labs/declare'
import { facility } from './organisationUnits.ts'
import { trackerDataEntryRole } from './userRoles.ts'

export const demoTrackerUser = defineUser({
  code: 'EX_USER_DEMO_TRACKER',
  username: 'demo',
  password: 'District1!',
  firstName: 'Demo',
  surname: 'Tracker',
  userRoles: [trackerDataEntryRole],
  organisationUnits: [facility],
  dataViewOrganisationUnits: [facility],
})

export const users = [demoTrackerUser]
