import { Authority, defineUserRole } from '@devotta-labs/declare'

export const dataEntryRole = defineUserRole({
  code: 'EX_UR_DATA_ENTRY',
  name: 'Data entry',
  description: 'Can view and submit data values for shared datasets in the Data Entry app.',
  authorities: [
    Authority.F_DATAVALUE_ADD,
    Authority.F_EXPORT_DATA,
    'M_dhis-web-aggregate-data-entry',
    'M_dhis-web-cache-cleaner',
    'M_dhis-web-dashboard',
  ],
})

export const userRoles = [dataEntryRole]
