import { z } from 'zod'
import { DataSetBaseByTarget } from '../generated/dataSet.ts'
import { getTarget } from '../generated/runtime.ts'
import type { CurrentTarget } from './currentTarget.ts'
import {
  CodeSchema,
  DescriptionSchema,
  NameSchema,
  ShortNameSchema,
  makeHandle,
  refSchema,
  withDerivedShortName,
  type Handle,
} from './core.ts'
import { SharingSchema } from './sharing.ts'

// PascalCase on the wire (PeriodType.getName()), not UPPER_SNAKE.
// /api/schemas.json returns periodType as a plain TEXT field, so this list is
// authoring-only — the server accepts any known period type string.
export const PeriodType = z.enum([
  'Daily',
  'Weekly',
  'WeeklyWednesday',
  'WeeklyThursday',
  'WeeklyFriday',
  'WeeklySaturday',
  'WeeklySunday',
  'BiWeekly',
  'Monthly',
  'BiMonthly',
  'Quarterly',
  'QuarterlyNov',
  'SixMonthly',
  'SixMonthlyApril',
  'SixMonthlyNov',
  'Yearly',
  'FinancialApril',
  'FinancialJuly',
  'FinancialOct',
  'FinancialNov',
  'FinancialFeb',
  'FinancialAug',
  'FinancialSep',
  'TwoYearly',
])

export const DataSetElementSchema = z.object({
  dataElement: refSchema('DataElement'),
  categoryCombo: refSchema('CategoryCombo').optional(),
})

const overrides = {
  code: CodeSchema,
  name: NameSchema,
  shortName: ShortNameSchema.optional(),
  formName: z.string().max(230).optional(),
  description: DescriptionSchema.optional(),
  periodType: PeriodType,
  categoryCombo: refSchema('CategoryCombo').optional(),
  // Legacy mobile-client flag — server-defaulted, rarely set by authors.
  mobile: z.boolean().default(false),
  dataSetElements: z.array(DataSetElementSchema).min(1, 'a DataSet needs at least one DataElement'),
  organisationUnits: z.array(refSchema('OrganisationUnit')).optional(),
  expiryDays: z.number().int().min(0).default(0),
  openFuturePeriods: z.number().int().min(0).default(0),
  openPeriodsAfterCoEndDate: z.number().int().min(0).default(0),
  timelyDays: z.number().int().min(0).default(15),
  fieldCombinationRequired: z.boolean().default(false),
  validCompleteOnly: z.boolean().default(false),
  noValueRequiresComment: z.boolean().default(false),
  skipOffline: z.boolean().default(false),
  renderAsTabs: z.boolean().default(false),
  renderHorizontally: z.boolean().default(false),
  compulsoryFieldsCompleteOnly: z.boolean().default(false),
  dataElementDecoration: z.boolean().default(false),
  notifyCompletingUser: z.boolean().default(false),
  sharing: SharingSchema.optional(),
}

const SCHEMAS = {
  '2.40': DataSetBaseByTarget['2.40'].extend(overrides),
  '2.41': DataSetBaseByTarget['2.41'].extend(overrides),
  '2.42': DataSetBaseByTarget['2.42'].extend(overrides),
} as const

export type DataSetInput = z.input<(typeof SCHEMAS)[CurrentTarget]>
export type DataSet = Handle<
  'DataSet',
  z.output<(typeof SCHEMAS)[CurrentTarget]> & { shortName: string }
>

export function defineDataSet(input: DataSetInput): DataSet {
  const parsed = SCHEMAS[getTarget()].parse(input) as z.output<(typeof SCHEMAS)[CurrentTarget]>
  return makeHandle('DataSet', withDerivedShortName(parsed))
}
