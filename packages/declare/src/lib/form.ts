import { z } from 'zod'

export const FormType = z.enum(['DEFAULT', 'SECTION'])
export type FormType = z.infer<typeof FormType>

type SectionFormValue = {
  readonly formType?: FormType | undefined
} & Readonly<Record<string, unknown>>

export function validateSectionForm(
  value: SectionFormValue,
  ctx: z.RefinementCtx,
  sectionsKey: string,
): void {
  const sections = value[sectionsKey]
  const hasSections = Array.isArray(sections) && sections.length > 0

  if (value.formType === 'SECTION' && !hasSections) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: `SECTION forms must declare at least one ${sectionsKey} entry`,
      path: [sectionsKey],
    })
  }

  if (value.formType === 'DEFAULT' && hasSections) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: `DEFAULT forms cannot declare ${sectionsKey}; use formType: 'SECTION'`,
      path: ['formType'],
    })
  }
}
