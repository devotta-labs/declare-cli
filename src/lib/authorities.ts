// Curated subset of org.hisp.dhis.security.Authorities — mirrored from
// dhis2-core master (dhis-2/dhis-api/.../security/Authorities.java). The JSON
// API accepts the enum `.toString()` value on UserRole#authorities; for every
// entry in the enum except the bundled app-module ones that's just `name()`.
//
// Keeping a constant object here (instead of a Zod enum) means callers get
// autocomplete without us having to track every single authority the server
// supports — they can pass raw strings too, which matches DHIS2's own
// "anything goes" semantics for custom app authorities.
export const Authority = {
  /** Superuser. Grants everything. */
  ALL: 'ALL',

  // --- Data values / data entry ---------------------------------------------
  /** Required to write data values. */
  F_DATAVALUE_ADD: 'F_DATAVALUE_ADD',
  F_EXPORT_DATA: 'F_EXPORT_DATA',
  F_SKIP_DATA_IMPORT_AUDIT: 'F_SKIP_DATA_IMPORT_AUDIT',
  F_APPROVE_DATA: 'F_APPROVE_DATA',
  F_APPROVE_DATA_LOWER_LEVELS: 'F_APPROVE_DATA_LOWER_LEVELS',
  F_ACCEPT_DATA_LOWER_LEVELS: 'F_ACCEPT_DATA_LOWER_LEVELS',
  F_VIEW_UNAPPROVED_DATA: 'F_VIEW_UNAPPROVED_DATA',
  F_RUN_VALIDATION: 'F_RUN_VALIDATION',
  F_PREDICTOR_RUN: 'F_PREDICTOR_RUN',
  F_GENERATE_MIN_MAX_VALUES: 'F_GENERATE_MIN_MAX_VALUES',
  F_MINMAX_DATAELEMENT_ADD: 'F_MINMAX_DATAELEMENT_ADD',
  F_EDIT_EXPIRED: 'F_EDIT_EXPIRED',
  F_UNCOMPLETE_EVENT: 'F_UNCOMPLETE_EVENT',

  // --- Metadata / admin -----------------------------------------------------
  F_METADATA_EXPORT: 'F_METADATA_EXPORT',
  F_METADATA_IMPORT: 'F_METADATA_IMPORT',
  F_METADATA_MANAGE: 'F_METADATA_MANAGE',
  F_PERFORM_MAINTENANCE: 'F_PERFORM_MAINTENANCE',
  F_SYSTEM_SETTING: 'F_SYSTEM_SETTING',
  F_VIEW_SERVER_INFO: 'F_VIEW_SERVER_INFO',

  // --- Users ---------------------------------------------------------------
  F_USER_VIEW: 'F_USER_VIEW',
  F_REPLICATE_USER: 'F_REPLICATE_USER',

  // --- Analytics ------------------------------------------------------------
  F_VIEW_EVENT_ANALYTICS: 'F_VIEW_EVENT_ANALYTICS',
  F_PERFORM_ANALYTICS_EXPLAIN: 'F_PERFORM_ANALYTICS_EXPLAIN',
} as const

export type Authority = (typeof Authority)[keyof typeof Authority]
