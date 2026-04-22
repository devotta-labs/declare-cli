import { defineDataElement } from '@devotta-labs/declare'
import { captureSharing } from './sharing.ts'

export const visitNotes = defineDataElement({
  code: 'EX_DE_NOTES',
  name: 'Visit notes',
  shortName: 'Notes',
  valueType: 'TEXT',
  aggregationType: 'NONE',
  domainType: 'TRACKER',
  sharing: captureSharing,
})

export const dataElements = [visitNotes]
