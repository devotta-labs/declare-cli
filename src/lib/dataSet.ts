import { z } from 'zod'
import { CodeSchema, NameSchema, ShortNameSchema, makeHandle, refSchema, type Handle } from './core.ts'

export const PeriodType = z.enum([
  'Daily',
  'Weekly',
  'Monthly',
  'BiMonthly',
  'Quarterly',
  'SixMonthly',
  'Yearly',
  'FinancialOct',
  'FinancialJuly',
  'FinancialApril',
])

export const DataSetElementSchema = z.object({
  dataElement: refSchema('DataElement'),
  categoryCombo: refSchema('CategoryCombo').optional(),
})

export const DataSetSchema = z.object({
  code: CodeSchema,
  name: NameSchema,
  shortName: ShortNameSchema.optional(),
  description: z.string().max(2000).optional(),
  periodType: PeriodType,
  categoryCombo: refSchema('CategoryCombo').optional(),
  dataSetElements: z.array(DataSetElementSchema).min(1, 'a DataSet needs at least one DataElement'),
  expiryDays: z.number().int().min(0).default(0),
  openFuturePeriods: z.number().int().min(0).default(0),
  timelyDays: z.number().int().min(0).default(15),
})

export type DataSetInput = z.infer<typeof DataSetSchema>
export type DataSet = Handle<'DataSet', DataSetInput>

export function defineDataSet(input: z.input<typeof DataSetSchema>): DataSet {
  const parsed = DataSetSchema.parse(input)
  return makeHandle('DataSet', parsed)
}
