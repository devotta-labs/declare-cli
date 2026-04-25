import { spinner } from '@clack/prompts'
import { loadSchema, type LoadedConfig } from '../config-loader.ts'
import { assertLocalStackRunning, baseUrlFor, localClient } from '../local-stack.ts'
import { printReport } from '../report.ts'
import { pc, ui } from '../ui.ts'
import { expectNoArgs } from './args.ts'

export async function apply(loaded: LoadedConfig, args: readonly string[]): Promise<void> {
  expectNoArgs('apply', args)
  await assertLocalStackRunning(loaded)
  await applyLoaded(loaded)
}

export async function applyLoaded(
  loaded: LoadedConfig,
  opts: { silent?: boolean } = {},
): Promise<void> {
  const schema = await loadSchema(loaded)
  const client = localClient(loaded)

  if (opts.silent) {
    const s = spinner()
    s.start('Applying schema')
    let report
    try {
      report = await client.importMetadata(schema.serialize(), { importMode: 'COMMIT' })
    } catch (err) {
      s.stop('Apply failed', 1)
      throw err
    }

    if (report.status && report.status !== 'OK') {
      s.stop(`Apply failed (${report.status})`, 1)
      printReport(report, 'Apply (COMMIT)')
      throw new Error(`Apply failed with status: ${report.status}`)
    }

    s.stop('Schema applied')

    s.start('Running post-import maintenance')
    try {
      await client.runMaintenance({ categoryOptionComboUpdate: true, ouPathsUpdate: true })
    } catch (err) {
      s.stop('Maintenance failed', 1)
      throw err
    }
    s.stop('Maintenance complete')
    return
  }

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
