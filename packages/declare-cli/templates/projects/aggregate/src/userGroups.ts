import { defineUserGroup } from '@devotta-labs/declare'
import { demoReporter } from './users.ts'

export const dataEntryUsers = defineUserGroup({
  code: 'EX_UG_DATA_ENTRY',
  name: 'Data entry users',
  description: 'Users authorised to submit aggregate data values.',
  users: [demoReporter],
})

export const userGroups = [dataEntryUsers]
