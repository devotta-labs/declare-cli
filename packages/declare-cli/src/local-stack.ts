import { createDhis2Client, type Dhis2Client } from './client.ts'
import type { LoadedConfig } from './config-loader.ts'
import { webContainerState, type StackEnv } from './docker.ts'

export const LOCAL_CREDENTIALS = {
  username: 'admin',
  password: 'district',
} as const

export const LOCAL_CREDENTIALS_LABEL = `${LOCAL_CREDENTIALS.username} / ${LOCAL_CREDENTIALS.password}`

export function stackEnvFor(loaded: LoadedConfig): StackEnv {
  return {
    project: loaded.config.name,
    webPort: loaded.config.local.port,
  }
}

export function baseUrlFor(loaded: LoadedConfig): string {
  return `http://localhost:${loaded.config.local.port}`
}

export async function assertLocalStackRunning(loaded: LoadedConfig): Promise<void> {
  const state = await webContainerState(stackEnvFor(loaded))
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
    auth: { kind: 'basic', ...LOCAL_CREDENTIALS },
  })
}
