import { loadSchema, type LoadedConfig } from '../config-loader.ts'
import { pc, ui } from '../ui.ts'
import { expectNoArgs } from './args.ts'
import { typegen } from './typegen.ts'

export async function check(loaded: LoadedConfig, args: readonly string[]): Promise<void> {
  expectNoArgs('check', args)
  // Refresh declare-env.d.ts first so the user's editor TS narrows to the
  // configured target on the next reload. Fast (a single file write that
  // no-ops when unchanged); the runtime parse below still enforces the target
  // regardless of TS state.
  await typegen(loaded)
  const schema = await loadSchema(loaded)

  let total = 0
  for (const items of Object.values(schema.byKind)) total += items.length

  ui.success(`Validation passed - ${pc.bold(total)} items checked.`)
}
