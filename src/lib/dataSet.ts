import { z } from 'zod'
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

// DHIS2 uses PeriodType.getName() as the JSON value, which is PascalCase (not
// the UPPER_SNAKE enum constant from the Java side).
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

export const DataSetSchema = z.object({
  code: CodeSchema,
  name: NameSchema,
  shortName: ShortNameSchema.optional(),
  formName: z.string().max(230).optional(),
  description: DescriptionSchema.optional(),
  periodType: PeriodType,
  categoryCombo: refSchema('CategoryCombo').optional(),
  dataSetElements: z.array(DataSetElementSchema).min(1, 'a DataSet needs at least one DataElement'),
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
})

export type DataSetInput = z.infer<typeof DataSetSchema>
export type DataSet = Handle<'DataSet', DataSetInput & { shortName: string }>

export function defineDataSet(input: z.input<typeof DataSetSchema>): DataSet {
  const parsed = DataSetSchema.parse(input)
  return makeHandle('DataSet', withDerivedShortName(parsed))
}
