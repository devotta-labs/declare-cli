import { Sharing } from '@devotta-labs/declare'
import { dataEntryUsers } from './userGroups/userGroups.ts'

// Grant metadata read + data rw on the full Data Entry ACL chain
// (DataSet → DataElement → CategoryCombo → Category → CategoryOption → OptionSet)
// to the data-capture group. Metadata editing stays with the superuser.
export const captureSharing = Sharing.private({
  userGroups: [{ group: dataEntryUsers, access: { metadata: 'r', data: 'rw' } }],
})
