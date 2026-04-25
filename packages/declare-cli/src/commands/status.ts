import type { LoadedConfig } from '../config-loader.ts'
import { assertDockerAvailable, webContainerState } from '../docker.ts'
import {
  LOCAL_CREDENTIALS_LABEL,
  baseUrlFor,
  stackEnvFor,
} from '../local-stack.ts'
import { ui, pc } from '../ui.ts'
import { expectNoArgs } from './args.ts'

export async function status(loaded: LoadedConfig, args: readonly string[]): Promise<void> {
  expectNoArgs('status', args)
  const env = stackEnvFor(loaded)
  await assertDockerAvailable()

  const state = await webContainerState(env)
  const baseUrl = baseUrlFor(loaded)

  ui.raw('')
  ui.raw(`${pc.bold('Project:')}   ${env.project}`)
  ui.raw(`${pc.bold('State:')}     ${formatState(state)}`)
  ui.raw(`${pc.bold('URL:')}       ${baseUrl}`)
  ui.raw(`${pc.bold('Admin:')}     ${LOCAL_CREDENTIALS_LABEL}`)
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
