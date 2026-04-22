import { defineTrackedEntityType } from '@devotta-labs/declare'
import { captureSharing } from '../sharing.ts'
import {
  dateOfBirthTea,
  firstNameTea,
  lastNameTea,
  nationalIdTea,
  phoneNumberTea,
  sexTea,
} from './trackedEntityAttributes.ts'

// "Person" TrackedEntityType — a reusable container for human TEIs. Attaching
// the core demographic TEAs here (instead of only on the Program) means any
// future programme for the same person (e.g. HIV, maternal health) can enrol
// the same TEI without duplicating registration state.
//
// `displayInList` governs which attributes appear as columns in the Capture
// app's TEI search results; `searchable` surfaces the attribute on the
// search form. `mandatory` here is the TET-level guarantee that registration
// cannot complete without the value.
export const personTrackedEntityType = defineTrackedEntityType({
  code: 'TET_PERSON',
  name: 'Person',
  shortName: 'Person',
  description: 'A human being enrolled in one or more DHIS2 tracker programmes.',
  featureType: 'NONE',
  minAttributesRequiredToSearch: 1,
  trackedEntityTypeAttributes: [
    {
      trackedEntityAttribute: firstNameTea,
      displayInList: true,
      mandatory: true,
      searchable: true,
    },
    {
      trackedEntityAttribute: lastNameTea,
      displayInList: true,
      mandatory: true,
      searchable: true,
    },
    {
      trackedEntityAttribute: dateOfBirthTea,
      displayInList: true,
      mandatory: false,
      searchable: true,
    },
    {
      trackedEntityAttribute: sexTea,
      displayInList: true,
      mandatory: false,
      searchable: false,
    },
    {
      trackedEntityAttribute: nationalIdTea,
      displayInList: true,
      mandatory: false,
      searchable: true,
    },
    {
      trackedEntityAttribute: phoneNumberTea,
      displayInList: false,
      mandatory: false,
      searchable: false,
    },
  ],
  sharing: captureSharing,
})

export const trackedEntityTypes = [personTrackedEntityType]
