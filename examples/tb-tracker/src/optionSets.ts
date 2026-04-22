import { defineOptionSet } from '@devotta-labs/declare'
import { captureSharing } from './sharing.ts'

// Standard ISO-5218 style sex option set. Used both by the Person TEI's `sex`
// attribute and downstream in the screening event if we ever wanted to capture
// it per visit.
export const sexOptionSet = defineOptionSet({
  code: 'OS_SEX',
  name: 'Sex',
  valueType: 'TEXT',
  options: [
    { code: 'MALE', name: 'Male' },
    { code: 'FEMALE', name: 'Female' },
    { code: 'OTHER', name: 'Other' },
    { code: 'UNKNOWN', name: 'Unknown' },
  ],
  sharing: captureSharing,
})

// Yes / No / Unknown — used by several screening data elements (cough > 2 weeks,
// known TB contact, etc.). Keeping a single reusable set avoids the Capture
// form rendering three different Yes/No dropdowns with subtly different codes.
export const ynuOptionSet = defineOptionSet({
  code: 'OS_YES_NO_UNKNOWN',
  name: 'Yes / No / Unknown',
  valueType: 'TEXT',
  options: [
    { code: 'YES', name: 'Yes' },
    { code: 'NO', name: 'No' },
    { code: 'UNKNOWN', name: 'Unknown' },
  ],
  sharing: captureSharing,
})

// TB screening outcome. The WHO TB knowledge-sharing platform recommends four
// canonical screen results; we mirror those codes so the resulting events can
// be analytics-joined against WHO-published TB datasets without recoding.
export const tbScreeningResult = defineOptionSet({
  code: 'OS_TB_SCREEN_RESULT',
  name: 'TB screening result',
  valueType: 'TEXT',
  options: [
    { code: 'NOT_PRESUMPTIVE', name: 'Not presumptive' },
    { code: 'PRESUMPTIVE', name: 'Presumptive TB' },
    { code: 'CONFIRMED', name: 'Bacteriologically confirmed' },
    { code: 'REFERRED', name: 'Referred for further investigation' },
  ],
  sharing: captureSharing,
})

export const optionSets = [sexOptionSet, ynuOptionSet, tbScreeningResult]
