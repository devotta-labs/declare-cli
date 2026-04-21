import { Authority, defineUserRole } from '../../lib/index.ts'

// Minimal role for demoing aggregate data capture: the user needs
// F_DATAVALUE_ADD to submit values via the Data Entry app; F_EXPORT_DATA is
// included so the same account can navigate to analytics / reports during
// the demo without surprises. Intentionally does **not** grant ALL so the
// demo stays recognisably non-superuser.
//
// M_dhis-web-aggregate-data-entry is the "see app" authority for the bundled
// Aggregate Data Entry app (App#getSeeAppAuthority = `M_` + `dhis-web-` +
// shortName). Without it the app is hidden from the launcher even when all
// F_ authorities are present.
export const dataEntryRole = defineUserRole({
  code: 'UR_DATA_ENTRY',
  name: 'Data entry',
  description:
    'Demo role — can view and submit data values for shared datasets in the Data Entry app.',
  authorities: [
    Authority.F_DATAVALUE_ADD,
    Authority.F_EXPORT_DATA,
    'M_dhis-web-aggregate-data-entry',
    'M_dhis-web-cache-cleaner',
    'M_dhis-web-dashboard',
  ],
})

export const userRoles = [dataEntryRole]
