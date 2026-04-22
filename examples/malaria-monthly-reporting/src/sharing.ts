import { Sharing } from '@devotta-labs/declare'
import { dataEntryUsers } from './userGroups/userGroups.ts'

// Production-like default: nothing is world-readable. Every metadata object
// the Data Entry form walks (DataSet → DataElement → CategoryCombo →
// Category → CategoryOption, plus OptionSet for coded DEs) is ACL-checked
// independently, so the data-capture user group gets metadata read + data
// read/write on the whole chain. Metadata-editing stays with the superuser.
export const captureSharing = Sharing.private({
  userGroups: [{ group: dataEntryUsers, access: { metadata: 'r', data: 'rw' } }],
})
