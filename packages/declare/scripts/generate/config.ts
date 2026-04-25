// Hand-curated configuration for the schema generator. Small, explicit, and
// deliberately kept in one place so that additions by upstream DHIS2 versions
// fail loudly rather than being guessed at.

import {
  ENTITY_SCHEMA_TO_KIND,
  KLASS_TO_KIND as REGISTRY_KLASS_TO_KIND,
  type MetadataKind,
} from '../../src/lib/entities.ts'

/** DHIS2 stable targets we generate Zod validators for. */
export const TARGETS = ['2.40', '2.41', '2.42'] as const
export type Target = (typeof TARGETS)[number]

/** Default target used by the library when no config is active. */
export const DEFAULT_TARGET: Target = '2.42'

/**
 * /api/schemas.json entity name → our MetadataKind.
 *
 * The generator only emits output for these 16 entities; anything else in
 * the snapshot is ignored. Keep the left-hand side lowerCamelCase to match
 * `schema.name` in the DHIS2 payload.
 */
export const ENTITY_SCHEMAS: Readonly<Record<string, MetadataKind>> = ENTITY_SCHEMA_TO_KIND

/**
 * Java class → MetadataKind for REFERENCE / COLLECTION itemKlass properties.
 *
 * Limited to kinds the authoring DSL supports. A REFERENCE whose klass is not
 * listed fails generation unless the field is explicitly skipped below. The
 * generator never silently drops a field.
 */
export const KLASS_TO_KIND: Readonly<Record<string, MetadataKind>> = REGISTRY_KLASS_TO_KIND

/**
 * System-managed fields the authoring layer must never set directly.
 *
 * These are either populated by DHIS2 at import time (id, created,
 * lastUpdated, user, createdBy, lastUpdatedBy, access, href, favorites,
 * translations, attributeValues), or they're legacy sharing slots that the
 * hand-written Sharing DSL already covers (publicAccess, userAccesses,
 * userGroupAccesses, sharing).
 *
 * Complex types without a Zod shape we can emit (style, geometry,
 * valueTypeOptions) live here too — the hand layer can re-add them as it
 * grows support. This is shared across all entities.
 */
export const GLOBAL_SKIP_FIELDS: ReadonlySet<string> = new Set([
  // identity / audit
  'id',
  'uid',
  'created',
  'lastUpdated',
  'createdBy',
  'lastUpdatedBy',
  'user',

  // i18n / attributes
  'translations',
  'translation',
  'attributeValues',
  'attributeValue',

  // computed / convenience
  'access',
  'href',
  'favorite',
  'favorites',
  'dimensionItem',
  'dimensionItemType',
  'queryMods',
  'translatable',

  // legacy sharing — superseded by the Sharing DSL on the hand layer
  'publicAccess',
  'externalAccess',
  'userAccesses',
  'userGroupAccesses',
  'sharing',

  // complex types without hand-written Zod support (yet)
  'style',
  'geometry',
  'valueTypeOptions',
])

/**
 * Per-entity field skip list. Use sparingly — only for fields where the
 * hand layer either replaces the generated version entirely (e.g.
 * DataSet.dataSetElements uses a typed sub-schema) or where the field's
 * wire shape can't be inferred from /api/schemas.json alone.
 */
export const ENTITY_SKIP_FIELDS: Readonly<Record<MetadataKind, ReadonlySet<string>>> = {
  Category: new Set<string>(),
  CategoryOption: new Set<string>(),
  CategoryCombo: new Set<string>(),
  OptionSet: new Set<string>(['options']),                       // hand layer hoists options
  Option: new Set<string>(),
  DataElement: new Set<string>([
    'legendSets',                                                 // not in DSL surface
  ]),
  DataSet: new Set<string>([
    'dataSetElements',                                            // typed { dataElement, categoryCombo }
    'dataEntryForm',                                              // not in DSL surface
    'dataInputPeriods',                                           // complex collection, TODO
    'compulsoryDataElementOperands',                              // complex collection
    'workflow',                                                   // not in DSL surface
    'indicators',                                                 // not in DSL surface
    'legendSets',
    'sections',
  ]),
  OrganisationUnit: new Set<string>([
    'children',                                                   // computed
    'image',                                                      // file resource support not in DSL surface
  ]),
  OrganisationUnitLevel: new Set<string>(),
  UserRole: new Set<string>(['members', 'users']),                // set server-side via users.userRoles
  UserGroup: new Set<string>(['managedGroups', 'managedByGroups']),
  User: new Set<string>([
    // /api/schemas lists userCredentials-style fields on User in some versions
    'userCredentials',
    'cogsDimensionConstraints',
    'catDimensionConstraints',
    'groups',                                                     // handled via UserGroup.users
    'avatar',
  ]),
  TrackedEntityAttribute: new Set<string>([
    'legendSets',
  ]),
  TrackedEntityType: new Set<string>([
    'trackedEntityTypeAttributes',                                // typed sub-schema
  ]),
  Program: new Set<string>([
    'dataEntryForm',                                              // not in DSL surface
    'expiryPeriodType',                                           // complex PeriodType, not in DSL surface
    'programStages',                                              // typed ref[]
    'programTrackedEntityAttributes',                             // typed sub-schema
    'programSections',                                            // not in DSL surface
    'categoryMappings',
    'notificationTemplates',
    'programIndicators',
    'programRuleVariables',
    'userRoles',                                                  // access control via sharing
  ]),
  ProgramStage: new Set<string>([
    'dataEntryForm',                                              // not in DSL surface
    'programStageDataElements',                                   // typed sub-schema
    'programStageSections',
    'notificationTemplates',
    'program',                                                    // back-ref injected at serialize time
  ]),
  ProgramRuleVariable: new Set<string>(),
  ProgramRuleAction: new Set<string>([
    'legendSet',
    'optionGroup',
    'programIndicator',
    'programStageSection',
  ]),
  ProgramRule: new Set<string>(),
}
