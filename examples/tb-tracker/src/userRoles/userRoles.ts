import { Authority, defineUserRole } from '@devotta-labs/declare'

// `M_dhis-web-capture` / `M_dhis-web-tracker-capture` are "see app" authorities
// — granted for both so either tracker entry point shows in the launcher.
export const trackerDataEntryRole = defineUserRole({
  code: 'UR_TB_DATA_ENTRY',
  name: 'TB data entry',
  description:
    'Demo tracker role — can register and enrol TEIs, capture events, and view event analytics for the TB programme.',
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
