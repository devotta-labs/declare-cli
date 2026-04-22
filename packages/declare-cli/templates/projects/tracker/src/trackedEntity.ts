import {
  defineTrackedEntityAttribute,
  defineTrackedEntityType,
} from '@devotta-labs/declare'

export const firstNameTea = defineTrackedEntityAttribute({
  code: 'EX_TEA_FIRST_NAME',
  name: 'First name',
  shortName: 'First name',
  valueType: 'TEXT',
})

export const lastNameTea = defineTrackedEntityAttribute({
  code: 'EX_TEA_LAST_NAME',
  name: 'Last name',
  shortName: 'Last name',
  valueType: 'TEXT',
})

export const trackedEntityAttributes = [firstNameTea, lastNameTea]

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
  ],
})

export const trackedEntityTypes = [personTrackedEntityType]
