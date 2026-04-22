import { defineCategory } from '@devotta-labs/declare'
import { captureSharing } from '../sharing.ts'
import { age15plus, age5to14, female, male, under5 } from './categoryOptions.ts'

export const sex = defineCategory({
  code: 'SEX',
  name: 'Sex',
  categoryOptions: [male, female],
  sharing: captureSharing,
})

export const ageGroup = defineCategory({
  code: 'AGE_GROUP',
  name: 'Age group',
  categoryOptions: [under5, age5to14, age15plus],
  sharing: captureSharing,
})

export const categories = [sex, ageGroup]
