import { defineUserGroup } from '@devotta-labs/declare'
import { demoReporter } from '../users/users.ts'

// Mirrors the data-entry role population — DHIS2 sharing ACLs target users
// and user groups, never roles directly, so granting visibility to "everyone
// with the data-entry role" means sharing with this group.
export const dataEntryUsers = defineUserGroup({
  code: 'UG_DATA_ENTRY',
  name: 'Data entry users',
  description: 'Demo group of users authorised to submit aggregate data values.',
  users: [demoReporter],
})

export const userGroups = [dataEntryUsers]
