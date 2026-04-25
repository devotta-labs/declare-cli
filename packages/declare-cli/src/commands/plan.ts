import { loadSchema, type LoadedConfig } from '../config-loader.ts'
import { assertLocalStackRunning, baseUrlFor, localClient } from '../local-stack.ts'
import { printReport } from '../report.ts'
import { pc, ui } from '../ui.ts'
import { expectNoArgs } from './args.ts'

export async function plan(loaded: LoadedConfig, args: readonly string[]): Promise<void> {
  expectNoArgs('plan', args)
  await assertLocalStackRunning(loaded)
  const schema = await loadSchema(loaded)
  const client = localClient(loaded)

  ui.step(`Planning schema against ${pc.cyan(baseUrlFor(loaded))}`)
  const report = await client.importMetadata(schema.serialize(), { importMode: 'VALIDATE' })

  printReport(report, 'Plan (VALIDATE)')

  if (report.status && report.status !== 'OK') {
    process.exit(1)
  }
}
