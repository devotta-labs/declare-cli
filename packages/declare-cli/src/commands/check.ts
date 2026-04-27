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
  // Refresh declare-env.d.ts first so the user's editor TS narrows to the
  // configured target on the next reload. Fast (a single file write that
  // no-ops when unchanged); the runtime parse below still enforces the target
  // regardless of TS state.
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
