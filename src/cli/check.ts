import schema from '../metadata/schema.ts'

export async function check(): Promise<void> {
  console.log('Schema validated by Zod at load time — no errors.\n')
  console.log('objects by kind:')
  for (const [kind, items] of Object.entries(schema.byKind)) {
    if (items.length === 0) continue
    console.log(`  ${kind.padEnd(18)} ${items.length}`)
    for (const h of items) {
      console.log(`    • ${h.code}`)
    }
  }
}
