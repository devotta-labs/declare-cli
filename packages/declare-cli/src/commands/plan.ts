import { loadSchema, type LoadedConfig } from '../config-loader.ts'
import { printReport } from '../report.ts'
import { pc, ui } from '../ui.ts'
import { assertLocalStackRunning, localClient } from './_local-client.ts'
import { baseUrlFor } from './start.ts'

export async function plan(loaded: LoadedConfig, _args: readonly string[]): Promise<void> {
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
