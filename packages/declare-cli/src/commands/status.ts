import type { LoadedConfig } from '../config-loader.ts'
import { assertDockerAvailable, webContainerState } from '../docker.ts'
import { ui, pc } from '../ui.ts'
import { baseUrlFor, stackEnvFor } from './start.ts'

export async function status(loaded: LoadedConfig, _args: readonly string[]): Promise<void> {
  const env = stackEnvFor(loaded)
  await assertDockerAvailable()

  const state = await webContainerState(env)
  const baseUrl = baseUrlFor(loaded)

  ui.raw('')
  ui.raw(`${pc.bold('Project:')}   ${env.project}`)
  ui.raw(`${pc.bold('State:')}     ${formatState(state)}`)
  ui.raw(`${pc.bold('URL:')}       ${baseUrl}`)
  ui.raw(`${pc.bold('Admin:')}     admin / district`)
  ui.raw('')

  if (state !== 'running') {
    ui.dim('Run `declare-cli start` to bring the stack up.')
  }
}

function formatState(state: string): string {
  switch (state) {
    case 'running':
      return pc.green('running')
    case 'missing':
      return pc.dim('not started')
    default:
      return pc.yellow(state)
  }
}
