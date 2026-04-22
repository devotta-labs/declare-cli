import { Authority, defineUserRole } from '@devotta-labs/declare'

// `M_dhis-web-aggregate-data-entry` is the "see app" authority — without it the
// Data Entry app is hidden from the launcher even with F_DATAVALUE_ADD granted.
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
