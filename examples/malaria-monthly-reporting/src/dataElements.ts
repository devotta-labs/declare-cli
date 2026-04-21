import { Access, Sharing, defineDataElement } from '@devotta-labs/declare'
import { sexAge } from './categories/categoryCombos.ts'
import { caseClassification } from './optionSets.ts'

// Every metadata object the Data Entry form walks (DataSet → DataElement →
// CategoryCombo → Category → CategoryOption, plus OptionSet for coded DEs)
// is ACL-checked independently. The demo reporter is non-superuser, so we
// grant public rwrw---- on the whole chain rather than rely on server
// defaults, which vary by instance configuration.
const publicRW = Sharing.public(Access.readWrite)

export const malariaCases = defineDataElement({
  code: 'MAL_CASES',
  name: 'Malaria cases',
  shortName: 'Malaria cases',
  valueType: 'NUMBER',
  aggregationType: 'SUM',
  categoryCombo: sexAge,
  sharing: publicRW,
})

export const malariaDeaths = defineDataElement({
  code: 'MAL_DEATHS',
  name: 'Malaria deaths',
  shortName: 'Malaria deaths',
  valueType: 'NUMBER',
  aggregationType: 'SUM',
  categoryCombo: sexAge,
  sharing: publicRW,
})

export const malariaTreated = defineDataElement({
  code: 'MAL_TREATED',
  name: 'Malaria cases treated',
  shortName: 'Malaria treated',
  valueType: 'NUMBER',
  aggregationType: 'SUM',
  categoryCombo: sexAge,
  sharing: publicRW,
})

export const malariaCaseClass = defineDataElement({
  code: 'MAL_CASE_TYPE',
  name: 'Malaria case classification',
  shortName: 'Case class',
  valueType: 'TEXT',
  aggregationType: 'NONE',
  optionSet: caseClassification,
  sharing: publicRW,
})

export const dataElements = [malariaCases, malariaDeaths, malariaTreated, malariaCaseClass]
