import { Access, Sharing, defineCategoryOption } from '@devotta-labs/declare'

// CategoryOption ACL gates per-disaggregation data capture — the demo
// reporter needs rwrw---- on every option in every combo they submit
// values for. See dataElements.ts for the broader rationale.
const sharing = Sharing.public(Access.readWrite)

export const male = defineCategoryOption({ code: 'MALE', name: 'Male', sharing })
export const female = defineCategoryOption({ code: 'FEMALE', name: 'Female', sharing })
export const under5 = defineCategoryOption({ code: 'AGE_UNDER5', name: 'Under 5', sharing })
export const age5to14 = defineCategoryOption({ code: 'AGE_5_14', name: '5 – 14', sharing })
export const age15plus = defineCategoryOption({ code: 'AGE_15PLUS', name: '15+', sharing })

export const categoryOptions = [male, female, under5, age5to14, age15plus]
