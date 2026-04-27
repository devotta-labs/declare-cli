type EntityDefinition = {
  readonly schemaName: string
  readonly payloadKey: string
  readonly klass: string
  readonly authoring: boolean
}

export const ENTITY_DEFINITIONS = {
  Category: {
    schemaName: 'category',
    payloadKey: 'categories',
    klass: 'org.hisp.dhis.category.Category',
    authoring: true,
  },
  CategoryOption: {
    schemaName: 'categoryOption',
    payloadKey: 'categoryOptions',
    klass: 'org.hisp.dhis.category.CategoryOption',
    authoring: true,
  },
  CategoryCombo: {
    schemaName: 'categoryCombo',
    payloadKey: 'categoryCombos',
    klass: 'org.hisp.dhis.category.CategoryCombo',
    authoring: true,
  },
  OptionSet: {
    schemaName: 'optionSet',
    payloadKey: 'optionSets',
    klass: 'org.hisp.dhis.option.OptionSet',
    authoring: true,
  },
  Option: {
    schemaName: 'option',
    payloadKey: 'options',
    klass: 'org.hisp.dhis.option.Option',
    authoring: false,
  },
  DataElement: {
    schemaName: 'dataElement',
    payloadKey: 'dataElements',
    klass: 'org.hisp.dhis.dataelement.DataElement',
    authoring: true,
  },
  DataSet: {
    schemaName: 'dataSet',
    payloadKey: 'dataSets',
    klass: 'org.hisp.dhis.dataset.DataSet',
    authoring: true,
  },
  OrganisationUnit: {
    schemaName: 'organisationUnit',
    payloadKey: 'organisationUnits',
    klass: 'org.hisp.dhis.organisationunit.OrganisationUnit',
    authoring: true,
  },
  OrganisationUnitLevel: {
    schemaName: 'organisationUnitLevel',
    payloadKey: 'organisationUnitLevels',
    klass: 'org.hisp.dhis.organisationunit.OrganisationUnitLevel',
    authoring: true,
  },
  UserRole: {
    schemaName: 'userRole',
    payloadKey: 'userRoles',
    klass: 'org.hisp.dhis.user.UserRole',
    authoring: true,
  },
  UserGroup: {
    schemaName: 'userGroup',
    payloadKey: 'userGroups',
    klass: 'org.hisp.dhis.user.UserGroup',
    authoring: true,
  },
  User: {
    schemaName: 'user',
    payloadKey: 'users',
    klass: 'org.hisp.dhis.user.User',
    authoring: true,
  },
  TrackedEntityAttribute: {
    schemaName: 'trackedEntityAttribute',
    payloadKey: 'trackedEntityAttributes',
    klass: 'org.hisp.dhis.trackedentity.TrackedEntityAttribute',
    authoring: true,
  },
  TrackedEntityType: {
    schemaName: 'trackedEntityType',
    payloadKey: 'trackedEntityTypes',
    klass: 'org.hisp.dhis.trackedentity.TrackedEntityType',
    authoring: true,
  },
  Program: {
    schemaName: 'program',
    payloadKey: 'programs',
    klass: 'org.hisp.dhis.program.Program',
    authoring: true,
  },
  ProgramStage: {
    schemaName: 'programStage',
    payloadKey: 'programStages',
    klass: 'org.hisp.dhis.program.ProgramStage',
    authoring: true,
  },
  ProgramRuleVariable: {
    schemaName: 'programRuleVariable',
    payloadKey: 'programRuleVariables',
    klass: 'org.hisp.dhis.programrule.ProgramRuleVariable',
    authoring: true,
  },
  ProgramRuleAction: {
    schemaName: 'programRuleAction',
    payloadKey: 'programRuleActions',
    klass: 'org.hisp.dhis.programrule.ProgramRuleAction',
    authoring: false,
  },
  ProgramRule: {
    schemaName: 'programRule',
    payloadKey: 'programRules',
    klass: 'org.hisp.dhis.programrule.ProgramRule',
    authoring: true,
  },
} as const satisfies Record<string, EntityDefinition>

export type MetadataKind = keyof typeof ENTITY_DEFINITIONS
export type AuthoringMetadataKind = {
  [K in MetadataKind]: (typeof ENTITY_DEFINITIONS)[K]['authoring'] extends true ? K : never
}[MetadataKind]

export const METADATA_KINDS = Object.keys(ENTITY_DEFINITIONS) as MetadataKind[]

function isAuthoringKind(kind: MetadataKind): kind is AuthoringMetadataKind {
  return ENTITY_DEFINITIONS[kind].authoring
}

export const AUTHORING_METADATA_KINDS = METADATA_KINDS.filter(isAuthoringKind)

export const PAYLOAD_KEY_BY_KIND = Object.fromEntries(
  METADATA_KINDS.map((kind) => [kind, ENTITY_DEFINITIONS[kind].payloadKey]),
) as { readonly [K in MetadataKind]: (typeof ENTITY_DEFINITIONS)[K]['payloadKey'] }

export const ENTITY_SCHEMA_TO_KIND = Object.fromEntries(
  METADATA_KINDS.map((kind) => [ENTITY_DEFINITIONS[kind].schemaName, kind]),
) as Readonly<Record<string, MetadataKind>>

export const KLASS_TO_KIND = Object.fromEntries(
  METADATA_KINDS.map((kind) => [ENTITY_DEFINITIONS[kind].klass, kind]),
) as Readonly<Record<string, MetadataKind>>

export function payloadKeyFor<K extends MetadataKind>(
  kind: K,
): (typeof ENTITY_DEFINITIONS)[K]['payloadKey'] {
  return ENTITY_DEFINITIONS[kind].payloadKey
}

export function kindForKlass(klass: string): MetadataKind | undefined {
  return KLASS_TO_KIND[klass]
}

export function labelForKlass(klass: string): string {
  return kindForKlass(klass) ?? klass.split('.').pop() ?? klass
}
