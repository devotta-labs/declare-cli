import { Access, Sharing, defineCategory } from '@devotta-labs/declare'
import { age15plus, age5to14, female, male, under5 } from './categoryOptions.ts'

// Demo-wide public access — see dataElements.ts for the rationale.
const publicRW = Sharing.public(Access.readWrite)

export const sex = defineCategory({
  code: 'SEX',
  name: 'Sex',
  categoryOptions: [male, female],
  sharing: publicRW,
})

export const ageGroup = defineCategory({
  code: 'AGE_GROUP',
  name: 'Age group',
  categoryOptions: [under5, age5to14, age15plus],
  sharing: publicRW,
})

export const categories = [sex, ageGroup]
