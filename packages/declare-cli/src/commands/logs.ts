import type { LoadedConfig } from '../config-loader.ts'
import { assertDockerAvailable, composeLogs } from '../docker.ts'
import { stackEnvFor } from './start.ts'

export async function logs(loaded: LoadedConfig, args: readonly string[]): Promise<void> {
  await assertDockerAvailable()

  let service: 'web' | 'db' | undefined
  let follow = false

  for (const arg of args) {
    if (arg === '--web') service = 'web'
    else if (arg === '--db') service = 'db'
    else if (arg === '--follow' || arg === '-f') follow = true
    else throw new Error(`Unknown argument for \`logs\`: ${arg}`)
  }

  await composeLogs(stackEnvFor(loaded), { ...(service ? { service } : {}), follow })
}
