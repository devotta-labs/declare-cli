import { defineUserGroup } from '@devotta-labs/declare'
import { demoTbNurse } from '../users/users.ts'

// Sharing ACL target. Sharing an object with this group is the canonical way
// to grant the tracker role population (there's no "share with role"
// primitive in DHIS2 — only users and user groups).
export const tbDataEntryUsers = defineUserGroup({
  code: 'UG_TB_DATA_ENTRY',
  name: 'TB data entry users',
  description: 'Demo group of users authorised to register TB TEIs and capture screening events.',
  users: [demoTbNurse],
})

export const userGroups = [tbDataEntryUsers]
