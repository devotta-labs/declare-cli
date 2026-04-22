// Minimal typed view of the subset of /api/schemas.json we read. Every field
// we touch is here so mis-spellings fail typecheck.

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
