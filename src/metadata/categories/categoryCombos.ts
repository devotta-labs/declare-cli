import { Access, Sharing, defineCategoryCombo } from '../../lib/index.ts'
import { ageGroup, sex } from './categories.ts'

export const sexAge = defineCategoryCombo({
  code: 'SEX_AGE',
  name: 'Sex × Age group',
  categories: [sex, ageGroup],
  // Demo-wide public access — see dataElements.ts for the rationale.
  sharing: Sharing.public(Access.readWrite),
})

export const categoryCombos = [sexAge]
