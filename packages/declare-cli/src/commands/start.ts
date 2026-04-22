import type { LoadedConfig } from '../config-loader.ts'
import {
  assertDockerAvailable,
  composeUp,
  isPortFree,
  type StackEnv,
  waitUntilReady,
  webContainerState,
} from '../docker.ts'
import { ui, pc } from '../ui.ts'
import { applyLoaded } from './apply.ts'

export function stackEnvFor(loaded: LoadedConfig): StackEnv {
  return {
    project: loaded.config.name,
    webPort: loaded.config.local.port,
  }
}

export function baseUrlFor(loaded: LoadedConfig): string {
  return `http://localhost:${loaded.config.local.port}`
}

export async function start(loaded: LoadedConfig, _args: readonly string[]): Promise<void> {
  const env = stackEnvFor(loaded)
  const baseUrl = baseUrlFor(loaded)

  await assertDockerAvailable()

  const state = await webContainerState(env)
  const alreadyRunning = state === 'running'

  if (alreadyRunning) {
    ui.info(`Stack ${pc.cyan(env.project)} already running — waiting for readiness.`)
  } else {
    const portFree = await isPortFree(env.webPort)
    if (!portFree) {
      throw new Error(
        `Port ${env.webPort} is already in use on 127.0.0.1, and it's not this project's DHIS2.\n` +
          `Change \`local.port\` in declare.config.ts, or free the port.`,
      )
    }
    ui.step(`Starting local DHIS2 stack (${pc.cyan(env.project)})`)
    ui.dim('  first boot pulls ~1 GB of images and runs Flyway migrations (can take several minutes)')
    await composeUp(env)
    ui.success('Containers are up.')
  }

  ui.step(`Waiting for DHIS2 at ${baseUrl}`)
  const started = Date.now()
  await waitUntilReady(baseUrl, {
    onProgress: (p) => {
      if (p.kind === 'ready') return
      const secs = Math.round((Date.now() - started) / 1000)
      const code = p.httpCode == null ? 'no response' : `HTTP ${p.httpCode}`
      process.stdout.write(pc.dim(`  still waiting (${code}, ${secs}s)\n`))
    },
  })
  ui.success(`DHIS2 is ready at ${pc.cyan(baseUrl)}`)

  await applyLoaded(loaded)

  ui.raw('')
  ui.raw(`${pc.bold('Credentials:')} admin / district`)
  ui.raw(`${pc.bold('URL:')}         ${baseUrl}`)
}
