import { defineCategoryCombo } from '@devotta-labs/declare'
import { captureSharing } from '../sharing.ts'
import { ageGroup, sex } from './categories.ts'

export const sexAge = defineCategoryCombo({
  code: 'SEX_AGE',
  name: 'Sex × Age group',
  categories: [sex, ageGroup],
  sharing: captureSharing,
})

export const categoryCombos = [sexAge]
