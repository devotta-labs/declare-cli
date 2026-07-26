import { ENTITY_DEFINITIONS } from '../../src/lib/entities.ts'
import type { Target } from './config.ts'

export type SnapshotPropertyType =
  | 'BOOLEAN'
  | 'COLLECTION'
  | 'COLOR'
  | 'COMPLEX'
  | 'CONSTANT'
  | 'DATE'
  | 'EMAIL'
  | 'IDENTIFIER'
  | 'INTEGER'
  | 'NUMBER'
  | 'PASSWORD'
  | 'PHONENUMBER'
  | 'REFERENCE'
  | 'TEXT'
  | 'URL'

export type SnapshotProperty = {
  readonly name: string
  readonly fieldName?: string
  /**
   * JSON serialization key for COLLECTION properties. This is the name DHIS2
   * actually accepts in the metadata import API — `fieldName` is just the Java
   * field name and often differs (e.g. DataSet: collectionName="organisationUnits",
   * fieldName="sources"; Program: collectionName="programTrackedEntityAttributes",
   * fieldName="programAttributes"). Always prefer this over fieldName for
   * COLLECTION properties.
   */
  readonly collectionName?: string | null
  readonly propertyType: SnapshotPropertyType
  readonly itemPropertyType?: SnapshotPropertyType | null
  readonly klass?: string | null
  readonly itemKlass?: string | null
  readonly required?: boolean
  readonly persisted?: boolean
  readonly owner?: boolean
  readonly writable?: boolean
  readonly length?: number | null
  readonly min?: number | null
  readonly max?: number | null
  readonly constants?: readonly string[] | null
}

export type SnapshotSchema = {
  readonly name: string
  readonly klass?: string
  readonly properties: readonly SnapshotProperty[]
}

export type Snapshot = {
  readonly schemas: readonly SnapshotSchema[]
}

const PROPERTY_TYPES: ReadonlySet<string> = new Set<SnapshotPropertyType>([
  'BOOLEAN',
  'COLLECTION',
  'COLOR',
  'COMPLEX',
  'CONSTANT',
  'DATE',
  'EMAIL',
  'IDENTIFIER',
  'INTEGER',
  'NUMBER',
  'PASSWORD',
  'PHONENUMBER',
  'REFERENCE',
  'TEXT',
  'URL',
])

function fail(target: Target, message: string): never {
  throw new Error(`Invalid DHIS2 ${target} schema snapshot: ${message}`)
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function validateProperty(target: Target, schemaName: string, value: unknown): void {
  if (!isRecord(value)) fail(target, `${schemaName} contains a non-object property`)
  if (typeof value.name !== 'string' || value.name.length === 0) {
    fail(target, `${schemaName} contains a property without a name`)
  }
  if (typeof value.propertyType !== 'string' || !PROPERTY_TYPES.has(value.propertyType)) {
    fail(
      target,
      `${schemaName}.${value.name} has unsupported propertyType ${String(value.propertyType)}`,
    )
  }
  if (
    value.itemPropertyType !== undefined &&
    value.itemPropertyType !== null &&
    (typeof value.itemPropertyType !== 'string' || !PROPERTY_TYPES.has(value.itemPropertyType))
  ) {
    fail(
      target,
      `${schemaName}.${value.name} has unsupported itemPropertyType ${String(value.itemPropertyType)}`,
    )
  }
  if (
    value.constants !== undefined &&
    value.constants !== null &&
    (!Array.isArray(value.constants) || value.constants.some((item) => typeof item !== 'string'))
  ) {
    fail(target, `${schemaName}.${value.name} has non-string constants`)
  }
}

/**
 * Validate the raw `/api/schemas.json` input before generation. In particular,
 * every entity in the registry must have exactly one schema with the expected
 * upstream Java class; a syntactically valid but partial response must not
 * silently generate empty or incorrectly mapped target types.
 */
export function validateSnapshot(target: Target, value: unknown): asserts value is Snapshot {
  if (!isRecord(value) || !Array.isArray(value.schemas) || value.schemas.length === 0) {
    fail(target, 'expected a non-empty schemas array')
  }

  for (const schema of value.schemas) {
    if (!isRecord(schema)) fail(target, 'schemas contains a non-object entry')
    if (typeof schema.name !== 'string' || schema.name.length === 0) {
      fail(target, 'schemas contains an entry without a name')
    }
    if (typeof schema.klass !== 'string' || schema.klass.length === 0) {
      fail(target, `${schema.name} is missing klass`)
    }
    if (!Array.isArray(schema.properties)) {
      fail(target, `${schema.name} is missing properties`)
    }
    for (const property of schema.properties) {
      validateProperty(target, schema.name, property)
    }
  }

  for (const definition of Object.values(ENTITY_DEFINITIONS)) {
    const matches = value.schemas.filter(
      (schema) => isRecord(schema) && schema.name === definition.schemaName,
    )
    if (matches.length !== 1) {
      fail(
        target,
        `expected exactly one ${definition.schemaName} schema, found ${matches.length}`,
      )
    }
    if (matches[0]?.klass !== definition.klass) {
      fail(
        target,
        `${definition.schemaName} has klass ${String(matches[0]?.klass)}; expected ${definition.klass}`,
      )
    }
    if (!Array.isArray(matches[0]?.properties) || matches[0].properties.length === 0) {
      fail(target, `${definition.schemaName} has no properties`)
    }
  }
}
