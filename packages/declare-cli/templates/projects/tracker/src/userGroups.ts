import { defineUserGroup } from '@devotta-labs/declare'
import { demoTrackerUser } from './users.ts'

export const trackerDataEntryUsers = defineUserGroup({
  code: 'EX_UG_TRACKER_DATA_ENTRY',
  name: 'Tracker data entry users',
  description: 'Users authorised to register TEIs and capture events.',
  users: [demoTrackerUser],
})

export const userGroups = [trackerDataEntryUsers]
