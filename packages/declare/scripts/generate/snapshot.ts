export type SnapshotPropertyType =
  | 'BOOLEAN'
  | 'COLLECTION'
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
