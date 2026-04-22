import { defineUserGroup } from '@devotta-labs/declare'
import { demoTbNurse } from '../users/users.ts'

export const tbDataEntryUsers = defineUserGroup({
  code: 'UG_TB_DATA_ENTRY',
  name: 'TB data entry users',
  description: 'Demo group of users authorised to register TB TEIs and capture screening events.',
  users: [demoTbNurse],
})

export const userGroups = [tbDataEntryUsers]
