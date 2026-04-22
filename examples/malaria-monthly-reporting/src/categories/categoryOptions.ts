import { defineCategoryOption } from '@devotta-labs/declare'
import { captureSharing } from '../sharing.ts'

// CategoryOption ACL gates per-disaggregation data capture — the data-entry
// user group needs data rw on every option in every combo they submit values
// for. See ../sharing.ts for the broader rationale.
const sharing = captureSharing

export const male = defineCategoryOption({ code: 'MALE', name: 'Male', sharing })
export const female = defineCategoryOption({ code: 'FEMALE', name: 'Female', sharing })
export const under5 = defineCategoryOption({ code: 'AGE_UNDER5', name: 'Under 5', sharing })
export const age5to14 = defineCategoryOption({ code: 'AGE_5_14', name: '5 – 14', sharing })
export const age15plus = defineCategoryOption({ code: 'AGE_15PLUS', name: '15+', sharing })

export const categoryOptions = [male, female, under5, age5to14, age15plus]
