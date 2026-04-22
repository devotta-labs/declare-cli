import { Authority, defineUserRole } from '@devotta-labs/declare'

export const trackerDataEntryRole = defineUserRole({
  code: 'EX_UR_TRACKER_DATA_ENTRY',
  name: 'Tracker data entry',
  description: 'Can register TEIs, enrol them in programs, and capture events.',
  authorities: [
    Authority.F_TRACKED_ENTITY_INSTANCE_ADD,
    Authority.F_TRACKED_ENTITY_INSTANCE_SEARCH,
    Authority.F_TRACKED_ENTITY_INSTANCE_LIST,
    Authority.F_PROGRAM_ENROLLMENT,
    Authority.F_PROGRAM_UNENROLLMENT,
    Authority.F_ENROLLMENT_CASCADE_DELETE,
    Authority.F_PROGRAM_STAGE_INSTANCE_ADD,
    Authority.F_PROGRAM_STAGE_INSTANCE_SEARCH,
    Authority.F_PROGRAM_STAGE_INSTANCE_DELETE,
    Authority.F_EXPORT_EVENTS,
    Authority.F_VIEW_EVENT_ANALYTICS,
    Authority.F_EXPORT_DATA,
    'M_dhis-web-capture',
    'M_dhis-web-tracker-capture',
    'M_dhis-web-cache-cleaner',
    'M_dhis-web-dashboard',
  ],
})

export const userRoles = [trackerDataEntryRole]
