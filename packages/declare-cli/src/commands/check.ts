import { loadSchema, type LoadedConfig } from '../config-loader.ts'
import { pc, ui } from '../ui.ts'
import { typegen } from './typegen.ts'
import type { Schema } from '@devotta-labs/declare'

function hasProgramRuleContent(schema: Schema): boolean {
  return (
    schema.byKind.ProgramRuleVariable.length > 0 ||
    schema.byKind.ProgramRule.length > 0 ||
    schema.ruleTests.length > 0
  )
}

export async function check(loaded: LoadedConfig, _args: readonly string[]): Promise<void> {
  await typegen(loaded)
  const schema = await loadSchema(loaded)
  if (hasProgramRuleContent(schema)) {
    const { checkProgramRules } = await import('../rules.ts')
    checkProgramRules(schema)
  }

  let total = 0
  for (const items of Object.values(schema.byKind)) total += items.length
  total += schema.ruleTests.length

  ui.success(`Validation passed - ${pc.bold(total)} items checked.`)
}
