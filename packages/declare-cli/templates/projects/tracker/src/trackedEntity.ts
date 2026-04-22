import {
  defineTrackedEntityAttribute,
  defineTrackedEntityType,
} from '@devotta-labs/declare'
import { sexOptionSet } from './optionSets.ts'
import { captureSharing } from './sharing.ts'

export const firstNameTea = defineTrackedEntityAttribute({
  code: 'EX_TEA_FIRST_NAME',
  name: 'First name',
  shortName: 'First name',
  valueType: 'TEXT',
  sharing: captureSharing,
})

export const lastNameTea = defineTrackedEntityAttribute({
  code: 'EX_TEA_LAST_NAME',
  name: 'Last name',
  shortName: 'Last name',
  valueType: 'TEXT',
  sharing: captureSharing,
})

export const sexTea = defineTrackedEntityAttribute({
  code: 'EX_TEA_SEX',
  name: 'Sex',
  shortName: 'Sex',
  valueType: 'TEXT',
  optionSet: sexOptionSet,
  sharing: captureSharing,
})

export const trackedEntityAttributes = [firstNameTea, lastNameTea, sexTea]

export const personTrackedEntityType = defineTrackedEntityType({
  code: 'EX_TET_PERSON',
  name: 'Person',
  shortName: 'Person',
  description: 'Example tracked entity type.',
  featureType: 'NONE',
  minAttributesRequiredToSearch: 1,
  trackedEntityTypeAttributes: [
    { trackedEntityAttribute: firstNameTea, displayInList: true, mandatory: true, searchable: true },
    { trackedEntityAttribute: lastNameTea, displayInList: true, mandatory: true, searchable: true },
    { trackedEntityAttribute: sexTea, displayInList: true, mandatory: false, searchable: true },
  ],
  sharing: captureSharing,
})

export const trackedEntityTypes = [personTrackedEntityType]
