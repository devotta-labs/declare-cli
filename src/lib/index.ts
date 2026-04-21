export { defineCategoryOption, type CategoryOption } from './categoryOption.ts'
export { defineCategory, type Category } from './category.ts'
export { defineCategoryCombo, type CategoryCombo } from './categoryCombo.ts'
export { defineOptionSet, type OptionSet } from './optionSet.ts'
export { defineDataElement, type DataElement } from './dataElement.ts'
export { defineDataSet, type DataSet } from './dataSet.ts'
export { defineSchema, type Schema, type AnyHandle } from './schema.ts'

// Re-export shared enums so callers can `import { ValueType } from './lib'`
// when they want to refer to enum values in their own code.
export { ValueType, AggregationType } from './core.ts'
export { DomainType } from './dataElement.ts'
export { PeriodType } from './dataSet.ts'
export { DataDimensionType } from './category.ts'
