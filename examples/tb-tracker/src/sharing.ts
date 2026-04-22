import { Sharing } from '@devotta-labs/declare'
import { tbDataEntryUsers } from './userGroups/userGroups.ts'

// Grant metadata read + data rw on the full Capture ACL chain
// (Program → ProgramStage → DataElement, TrackedEntityType → TEA, OptionSets)
// to the TB data-entry group. Metadata editing stays with the superuser.
export const captureSharing = Sharing.private({
  userGroups: [{ group: tbDataEntryUsers, access: { metadata: 'r', data: 'rw' } }],
})
