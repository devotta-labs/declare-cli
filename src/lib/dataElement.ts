import { z } from 'zod'
import { CodeSchema, NameSchema, ShortNameSchema, makeHandle, refSchema, type Handle } from './core.ts'

export const ValueType = z.enum([
  'NUMBER',
  'INTEGER',
  'INTEGER_POSITIVE',
  'INTEGER_NEGATIVE',
  'INTEGER_ZERO_OR_POSITIVE',
  'PERCENTAGE',
  'UNIT_INTERVAL',
  'TEXT',
  'LONG_TEXT',
  'BOOLEAN',
  'TRUE_ONLY',
  'DATE',
  'DATETIME',
  'TIME',
])

export const AggregationType = z.enum([
  'SUM',
  'AVERAGE',
  'AVERAGE_SUM_ORG_UNIT',
  'COUNT',
  'MIN',
  'MAX',
  'NONE',
])

export const DomainType = z.enum(['AGGREGATE', 'TRACKER'])

export const DataElementSchema = z
  .object({
    code: CodeSchema,
    name: NameSchema,
    shortName: ShortNameSchema.optional(),
    description: z.string().max(2000).optional(),
    valueType: ValueType,
    aggregationType: AggregationType.default('SUM'),
    domainType: DomainType.default('AGGREGATE'),
    categoryCombo: refSchema('CategoryCombo').optional(),
    optionSet: refSchema('OptionSet').optional(),
    zeroIsSignificant: z.boolean().default(false),
  })
  .refine(
    (v) => {
      const numericAggregates = new Set(['SUM', 'AVERAGE', 'AVERAGE_SUM_ORG_UNIT', 'MIN', 'MAX'])
      const numericValues = new Set([
        'NUMBER',
        'INTEGER',
        'INTEGER_POSITIVE',
        'INTEGER_NEGATIVE',
        'INTEGER_ZERO_OR_POSITIVE',
        'PERCENTAGE',
        'UNIT_INTERVAL',
      ])
      if (numericAggregates.has(v.aggregationType) && !numericValues.has(v.valueType)) {
        return false
      }
      return true
    },
    {
      message:
        'aggregationType SUM/AVERAGE/MIN/MAX requires a numeric valueType (NUMBER, INTEGER, PERCENTAGE, …)',
      path: ['aggregationType'],
    },
  )

export type DataElementInput = z.infer<typeof DataElementSchema>
export type DataElement = Handle<'DataElement', DataElementInput>

export function defineDataElement(input: z.input<typeof DataElementSchema>): DataElement {
  const parsed = DataElementSchema.parse(input)
  return makeHandle('DataElement', parsed)
}
