import { Access, Sharing, defineTrackedEntityAttribute } from '@devotta-labs/declare'
import { sexOptionSet } from '../optionSets.ts'

// TEAs are shared between the TrackedEntityType (the "Person" box visible on
// every programme) and this TB programme's ProgramTrackedEntityAttributes.
// Public rwrw-- keeps the demo unblocked without burying the reader in a
// per-TEA sharing dance.
const publicRW = Sharing.public(Access.readWrite)

export const firstNameTea = defineTrackedEntityAttribute({
  code: 'TEA_FIRST_NAME',
  name: 'First name',
  shortName: 'First name',
  valueType: 'TEXT',
  sharing: publicRW,
})

export const lastNameTea = defineTrackedEntityAttribute({
  code: 'TEA_LAST_NAME',
  name: 'Last name',
  shortName: 'Last name',
  valueType: 'TEXT',
  sharing: publicRW,
})

export const dateOfBirthTea = defineTrackedEntityAttribute({
  code: 'TEA_DATE_OF_BIRTH',
  name: 'Date of birth',
  shortName: 'Date of birth',
  valueType: 'DATE',
  sharing: publicRW,
})

export const sexTea = defineTrackedEntityAttribute({
  code: 'TEA_SEX',
  name: 'Sex',
  shortName: 'Sex',
  valueType: 'TEXT',
  optionSet: sexOptionSet,
  sharing: publicRW,
})

// National ID number. `unique: true` pushes DHIS2's global uniqueness
// constraint onto the attribute — the same national ID cannot be registered
// twice across the instance, which is exactly the semantics a real TB
// surveillance system would want.
export const nationalIdTea = defineTrackedEntityAttribute({
  code: 'TEA_NATIONAL_ID',
  name: 'National ID',
  shortName: 'National ID',
  valueType: 'TEXT',
  unique: true,
  sharing: publicRW,
})

export const phoneNumberTea = defineTrackedEntityAttribute({
  code: 'TEA_PHONE_NUMBER',
  name: 'Phone number',
  shortName: 'Phone number',
  valueType: 'PHONE_NUMBER',
  sharing: publicRW,
})

// Programme-scoped TEAs below — only attached to the TB Program, not to the
// Person TET, because they're clinically meaningful only once someone is
// enrolled for TB screening.
export const hivStatusTea = defineTrackedEntityAttribute({
  code: 'TEA_HIV_STATUS',
  name: 'HIV status',
  shortName: 'HIV status',
  valueType: 'TEXT',
  sharing: publicRW,
})

export const previousTbTreatmentTea = defineTrackedEntityAttribute({
  code: 'TEA_PREV_TB_TREATMENT',
  name: 'Previously treated for TB',
  shortName: 'Prev TB Rx',
  valueType: 'BOOLEAN',
  sharing: publicRW,
})

export const trackedEntityAttributes = [
  firstNameTea,
  lastNameTea,
  dateOfBirthTea,
  sexTea,
  nationalIdTea,
  phoneNumberTea,
  hivStatusTea,
  previousTbTreatmentTea,
]
