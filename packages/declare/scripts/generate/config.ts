import {
  ENTITY_SCHEMA_TO_KIND,
  KLASS_TO_KIND as REGISTRY_KLASS_TO_KIND,
  type MetadataKind,
} from '../../src/lib/entities.ts'

export const TARGETS = ['2.40', '2.41', '2.42'] as const
export type Target = (typeof TARGETS)[number]

export const DEFAULT_TARGET: Target = '2.42'

export const ENTITY_SCHEMAS: Readonly<Record<string, MetadataKind>> = ENTITY_SCHEMA_TO_KIND

export const KLASS_TO_KIND: Readonly<Record<string, MetadataKind>> = REGISTRY_KLASS_TO_KIND

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

  // legacy sharing, covered by the Sharing DSL
  'publicAccess',
  'externalAccess',
  'userAccesses',
  'userGroupAccesses',
  'sharing',

  // complex types without hand-written Zod support
  'style',
  'geometry',
  'valueTypeOptions',
])

export const ENTITY_SKIP_FIELDS: Readonly<Record<MetadataKind, ReadonlySet<string>>> = {
  Category: new Set<string>(),
  CategoryOption: new Set<string>(),
  CategoryCombo: new Set<string>(),
  OptionSet: new Set<string>(['options']),
  Option: new Set<string>(),
  DataElement: new Set<string>([
    'legendSets',
  ]),
  DataSet: new Set<string>([
    'dataSetElements',
    'dataEntryForm',
    'dataInputPeriods',
    'compulsoryDataElementOperands',
    'workflow',
    'indicators',
    'legendSets',
    'sections',
  ]),
  OrganisationUnit: new Set<string>([
    'children',
    'image',
  ]),
  OrganisationUnitLevel: new Set<string>(),
  UserRole: new Set<string>(['members', 'users']),
  UserGroup: new Set<string>(['managedGroups', 'managedByGroups']),
  User: new Set<string>([
    // /api/schemas lists userCredentials-style fields on User in some versions
    'userCredentials',
    'cogsDimensionConstraints',
    'catDimensionConstraints',
    'groups',
    'avatar',
  ]),
  TrackedEntityAttribute: new Set<string>([
    'legendSets',
  ]),
  TrackedEntityType: new Set<string>([
    'trackedEntityTypeAttributes',
  ]),
  Program: new Set<string>([
    'dataEntryForm',
    'expiryPeriodType',
    'programStages',
    'programTrackedEntityAttributes',
    'programSections',
    'categoryMappings',
    'notificationTemplates',
    'programIndicators',
    'programRuleVariables',
    'userRoles',
  ]),
  ProgramStage: new Set<string>([
    'dataEntryForm',
    'programStageDataElements',
    'programStageSections',
    'notificationTemplates',
    'program',
  ]),
}
