import type { LoadedConfig } from '../config-loader.ts'
import { assertDockerAvailable, composeDownWipe, webContainerState } from '../docker.ts'
import { stackEnvFor } from '../local-stack.ts'
import { ui, pc } from '../ui.ts'
import { expectNoArgs } from './args.ts'

export async function stop(loaded: LoadedConfig, args: readonly string[]): Promise<void> {
  expectNoArgs('stop', args)
  const env = stackEnvFor(loaded)
  await assertDockerAvailable()

  const state = await webContainerState(env)
  if (state === 'missing') {
    ui.info(`Stack ${pc.cyan(env.project)} is not running — nothing to stop.`)
    return
  }

  ui.step(`Stopping ${pc.cyan(env.project)}`)
  await composeDownWipe(env)
  ui.success('Stack stopped, database volume wiped.')
}
