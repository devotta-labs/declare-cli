import { createDhis2Client, type Dhis2Client } from '../client.ts'
import type { LoadedConfig } from '../config-loader.ts'
import { webContainerState } from '../docker.ts'
import { baseUrlFor, stackEnvFor } from './start.ts'

export async function assertLocalStackRunning(loaded: LoadedConfig): Promise<void> {
  const env = stackEnvFor(loaded)
  const state = await webContainerState(env)
  if (state !== 'running') {
    throw new Error(
      'Local DHIS2 stack is not running.\n' +
        'Run `declare-cli start` first.',
    )
  }
}

export function localClient(loaded: LoadedConfig): Dhis2Client {
  return createDhis2Client({
    baseUrl: baseUrlFor(loaded),
    auth: { kind: 'basic', username: 'admin', password: 'district' },
  })
}
