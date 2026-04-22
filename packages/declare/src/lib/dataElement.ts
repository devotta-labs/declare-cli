import { z } from 'zod'
import { DataElementBaseByTarget } from '../generated/dataElement.ts'
import { AggregationType, AggregationTypeByTarget, DomainType, DomainTypeByTarget } from '../generated/enums.ts'
import { getTarget, type Target } from '../generated/runtime.ts'
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
// cross-field refinement DHIS2 enforces only at import time. CONSTANT
// fields pull from `<Enum>ByTarget[target]` so defaults don't clobber
// the versioned enum with the unversioned union.
const overridesFor = (target: Target) => ({
  code: CodeSchema,
  name: NameSchema,
  shortName: ShortNameSchema.optional(),
  aggregationType: AggregationTypeByTarget[target].default('SUM'),
  domainType: DomainTypeByTarget[target].default('AGGREGATE'),
  categoryCombo: refSchema('CategoryCombo').optional(),
  zeroIsSignificant: z.boolean().default(false),
  sharing: SharingSchema.optional(),
})

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
  '2.40': DataElementBaseByTarget['2.40'].extend(overridesFor('2.40')).refine(numericAggRefine, numericAggMessage),
  '2.41': DataElementBaseByTarget['2.41'].extend(overridesFor('2.41')).refine(numericAggRefine, numericAggMessage),
  '2.42': DataElementBaseByTarget['2.42'].extend(overridesFor('2.42')).refine(numericAggRefine, numericAggMessage),
} as const

// Input/output types span every supported target so authoring works regardless
// of which target is configured; runtime parse enforces the actual target.
export type DataElementInput = { [T in Target]: z.input<(typeof SCHEMAS)[T]> }[Target]
export type DataElement = Handle<
  'DataElement',
  { [T in Target]: z.output<(typeof SCHEMAS)[T]> }[Target] & { shortName: string }
>

export function defineDataElement(input: DataElementInput): DataElement {
  const parsed = SCHEMAS[getTarget()].parse(input) as { [T in Target]: z.output<(typeof SCHEMAS)[T]> }[Target]
  return makeHandle('DataElement', withDerivedShortName(parsed))
}
