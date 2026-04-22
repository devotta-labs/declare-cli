import { defineDataElement } from '@devotta-labs/declare'

export const visitNotes = defineDataElement({
  code: 'EX_DE_NOTES',
  name: 'Visit notes',
  shortName: 'Notes',
  valueType: 'TEXT',
  aggregationType: 'NONE',
  domainType: 'TRACKER',
})

export const dataElements = [visitNotes]
