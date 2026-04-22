import { Sharing } from '@devotta-labs/declare'
import { trackerDataEntryUsers } from './userGroups.ts'

export const captureSharing = Sharing.private({
  userGroups: [{ group: trackerDataEntryUsers, access: { metadata: 'r', data: 'rw' } }],
})
