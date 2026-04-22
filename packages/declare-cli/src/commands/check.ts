import { loadSchema, type LoadedConfig } from '../config-loader.ts'
import { pc, ui } from '../ui.ts'

export async function check(loaded: LoadedConfig, _args: readonly string[]): Promise<void> {
  const schema = await loadSchema(loaded)

  ui.success('Schema validated by Zod at load time — no errors.')
  ui.raw('')
  ui.raw(pc.bold('objects by kind:'))

  let total = 0
  for (const [kind, items] of Object.entries(schema.byKind)) {
    if (items.length === 0) continue
    total += items.length
    ui.raw(`  ${pc.cyan(kind.padEnd(24))} ${items.length}`)
    for (const h of items) {
      ui.raw(`    ${pc.dim('•')} ${h.code}`)
    }
  }

  ui.raw('')
  ui.raw(`${pc.bold('total:')} ${total}`)
}
