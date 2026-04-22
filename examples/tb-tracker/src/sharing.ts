import { Sharing } from '@devotta-labs/declare'
import { tbDataEntryUsers } from './userGroups/userGroups.ts'

// Production-like default: nothing is world-readable. Every metadata object
// the Capture app walks (Program → ProgramStage → DataElement,
// TrackedEntityType → TrackedEntityAttribute, plus OptionSet for coded DEs
// and TEAs) is ACL-checked independently, so the TB data-entry user group
// gets metadata read + data read/write on the whole chain. Metadata editing
// stays with the superuser.
export const captureSharing = Sharing.private({
  userGroups: [{ group: tbDataEntryUsers, access: { metadata: 'r', data: 'rw' } }],
})
