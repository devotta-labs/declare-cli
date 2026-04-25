import { loadSchema, type LoadedConfig } from '../config-loader.ts'
import { pc, ui } from '../ui.ts'
import { typegen } from './typegen.ts'

export async function check(loaded: LoadedConfig, _args: readonly string[]): Promise<void> {
  await typegen(loaded)
  const schema = await loadSchema(loaded)

  let total = 0
  for (const items of Object.values(schema.byKind)) total += items.length

  ui.success(`Validation passed - ${pc.bold(total)} items checked.`)
}
