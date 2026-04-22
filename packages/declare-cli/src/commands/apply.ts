import { loadSchema, type LoadedConfig } from '../config-loader.ts'
import { printReport } from '../report.ts'
import { pc, ui } from '../ui.ts'
import { assertLocalStackRunning, localClient } from './_local-client.ts'
import { baseUrlFor } from './start.ts'

export async function apply(loaded: LoadedConfig, _args: readonly string[]): Promise<void> {
  await assertLocalStackRunning(loaded)
  await applyLoaded(loaded)
}

export async function applyLoaded(loaded: LoadedConfig): Promise<void> {
  const schema = await loadSchema(loaded)
  const client = localClient(loaded)

  ui.step(`Applying schema to ${pc.cyan(baseUrlFor(loaded))}`)
  const report = await client.importMetadata(schema.serialize(), { importMode: 'COMMIT' })

  printReport(report, 'Apply (COMMIT)')

  if (report.status && report.status !== 'OK') {
    throw new Error(`Apply failed with status: ${report.status}`)
  }

  ui.step('Running post-import maintenance')
  await client.runMaintenance({ categoryOptionComboUpdate: true, ouPathsUpdate: true })
  ui.success('Maintenance complete.')
}
