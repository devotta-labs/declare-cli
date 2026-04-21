import { z } from 'zod'
import {
  AggregationType,
  CodeSchema,
  DescriptionSchema,
  NUMERIC_AGGREGATIONS,
  NUMERIC_VALUE_TYPES,
  NameSchema,
  ShortNameSchema,
  ValueType,
  makeHandle,
  refSchema,
  withDerivedShortName,
  type Handle,
} from './core.ts'
import { SharingSchema } from './sharing.ts'

export const DomainType = z.enum(['AGGREGATE', 'TRACKER'])

export const DataElementSchema = z
  .object({
    code: CodeSchema,
    name: NameSchema,
    shortName: ShortNameSchema.optional(),
    formName: z.string().max(230).optional(),
    description: DescriptionSchema.optional(),
    url: z.string().url().optional(),
    valueType: ValueType,
    aggregationType: AggregationType.default('SUM'),
    domainType: DomainType.default('AGGREGATE'),
    categoryCombo: refSchema('CategoryCombo').optional(),
    optionSet: refSchema('OptionSet').optional(),
    commentOptionSet: refSchema('OptionSet').optional(),
    aggregationLevels: z.array(z.number().int().positive()).optional(),
    fieldMask: z.string().max(255).optional(),
    zeroIsSignificant: z.boolean().default(false),
    sharing: SharingSchema.optional(),
  })
  .refine(
    (v) => !(NUMERIC_AGGREGATIONS.has(v.aggregationType) && !NUMERIC_VALUE_TYPES.has(v.valueType)),
    {
      message:
        'numeric aggregationType (SUM/AVERAGE/MIN/MAX/STDDEV/VARIANCE/…) requires a numeric valueType (NUMBER, INTEGER, PERCENTAGE, …)',
      path: ['aggregationType'],
    },
  )

export type DataElementInput = z.infer<typeof DataElementSchema>
export type DataElement = Handle<'DataElement', DataElementInput & { shortName: string }>

export function defineDataElement(input: z.input<typeof DataElementSchema>): DataElement {
  const parsed = DataElementSchema.parse(input)
  return makeHandle('DataElement', withDerivedShortName(parsed))
}
