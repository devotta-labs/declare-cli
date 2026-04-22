import { defineUserGroup } from '@devotta-labs/declare'
import { demoReporter } from '../users/users.ts'

// DHIS2 sharing ACLs target users and user groups only (never roles) — this
// group mirrors the data-entry role population so we can share with it.
export const dataEntryUsers = defineUserGroup({
  code: 'UG_DATA_ENTRY',
  name: 'Data entry users',
  description: 'Demo group of users authorised to submit aggregate data values.',
  users: [demoReporter],
})

export const userGroups = [dataEntryUsers]
