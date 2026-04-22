import { Sharing } from '@devotta-labs/declare'
import { dataEntryUsers } from './userGroups.ts'

export const captureSharing = Sharing.private({
  userGroups: [{ group: dataEntryUsers, access: { metadata: 'r', data: 'rw' } }],
})
