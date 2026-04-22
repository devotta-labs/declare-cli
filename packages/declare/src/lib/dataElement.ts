import { z } from 'zod'
import { DataElementBaseByTarget } from '../generated/dataElement.ts'
import { AggregationType, DomainType } from '../generated/enums.ts'
import { getTarget } from '../generated/runtime.ts'
import {
  CodeSchema,
  NUMERIC_AGGREGATIONS,
  NUMERIC_VALUE_TYPES,
  NameSchema,
  ShortNameSchema,
  makeHandle,
  refSchema,
  withDerivedShortName,
  type Handle,
} from './core.ts'
import { SharingSchema } from './sharing.ts'

export { DomainType }

// Hand-layer overrides applied on top of each per-target generated Base:
// stricter `code`, authoring-time defaults, the Sharing DSL, and the
// cross-field refinement DHIS2 enforces only at import time.
const overrides = {
  code: CodeSchema,
  name: NameSchema,
  shortName: ShortNameSchema.optional(),
  aggregationType: AggregationType.default('SUM'),
  domainType: DomainType.default('AGGREGATE'),
  categoryCombo: refSchema('CategoryCombo').optional(),
  zeroIsSignificant: z.boolean().default(false),
  sharing: SharingSchema.optional(),
}

const numericAggRefine = (v: {
  aggregationType: z.infer<typeof AggregationType>
  valueType: string
}) =>
  !(NUMERIC_AGGREGATIONS.has(v.aggregationType) && !NUMERIC_VALUE_TYPES.has(v.valueType as never))

const numericAggMessage = {
  message:
    'numeric aggregationType (SUM/AVERAGE/MIN/MAX/STDDEV/VARIANCE/…) requires a numeric valueType (NUMBER, INTEGER, PERCENTAGE, …)',
  path: ['aggregationType'],
}

const SCHEMAS = {
  '2.40': DataElementBaseByTarget['2.40'].extend(overrides).refine(numericAggRefine, numericAggMessage),
  '2.41': DataElementBaseByTarget['2.41'].extend(overrides).refine(numericAggRefine, numericAggMessage),
  '2.42': DataElementBaseByTarget['2.42'].extend(overrides).refine(numericAggRefine, numericAggMessage),
} as const

export type DataElementInput = z.input<(typeof SCHEMAS)['2.42']>
export type DataElement = Handle<
  'DataElement',
  z.output<(typeof SCHEMAS)['2.42']> & { shortName: string }
>

export function defineDataElement(input: DataElementInput): DataElement {
  const parsed = SCHEMAS[getTarget()].parse(input) as z.output<(typeof SCHEMAS)['2.42']>
  return makeHandle('DataElement', withDerivedShortName(parsed))
}
