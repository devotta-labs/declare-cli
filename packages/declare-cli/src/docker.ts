import { createServer } from 'node:net'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { execa, type ExecaError } from 'execa'

const DOCKER_DIR = resolve(dirname(fileURLToPath(import.meta.url)), '..', 'templates', 'docker')
const COMPOSE_FILE = resolve(DOCKER_DIR, 'docker-compose.yml')

export type StackEnv = {
  project: string
  webPort: number
  image?: string
}

const BASE_COMPOSE_ARGS = ['compose', '-f', COMPOSE_FILE] as const

function envFor(env: StackEnv): NodeJS.ProcessEnv {
  return {
    ...process.env,
    DHIS2_WEB_PORT: String(env.webPort),
    ...(env.image ? { DHIS2_IMAGE: env.image } : {}),
  }
}

function composeArgs(env: StackEnv, ...rest: string[]): string[] {
  return [...BASE_COMPOSE_ARGS, '-p', env.project, ...rest]
}

function rethrowDockerError(err: unknown, op: string): never {
  const execErr = err as ExecaError
  const stderr = typeof execErr.stderr === 'string' ? execErr.stderr.trim() : ''
  const stdout = typeof execErr.stdout === 'string' ? execErr.stdout.trim() : ''
  const detail = stderr || stdout || (err instanceof Error ? err.message : String(err))
  throw new Error(`${op} failed:\n${detail}`)
}

export async function assertDockerAvailable(): Promise<void> {
  try {
    await execa('docker', ['version', '--format', '{{.Server.Version}}'], { timeout: 5_000 })
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    throw new Error(
      `Cannot talk to Docker: ${msg}\n` +
        'Is Docker Desktop / the Docker daemon running?',
    )
  }
}

export type ContainerState = 'running' | 'exited' | 'restarting' | 'paused' | 'created' | 'dead' | 'missing'

export async function webContainerState(env: StackEnv): Promise<ContainerState> {
  try {
    const { stdout } = await execa('docker', composeArgs(env, 'ps', '-q', 'web'), {
      env: envFor(env),
    })
    const id = stdout.trim()
    if (!id) return 'missing'
    const { stdout: state } = await execa('docker', ['inspect', '-f', '{{.State.Status}}', id])
    return (state.trim() as ContainerState) || 'missing'
  } catch (err) {
    rethrowDockerError(err, 'docker compose ps')
  }
}

export async function isPortFree(port: number): Promise<boolean> {
  return new Promise((resolve) => {
    const server = createServer()
    server.once('error', () => resolve(false))
    server.once('listening', () => {
      server.close(() => resolve(true))
    })
    server.listen(port, '127.0.0.1')
  })
}

export async function composeUp(env: StackEnv, opts: { quiet?: boolean } = {}): Promise<void> {
  try {
    await execa('docker', composeArgs(env, 'up', '-d'), {
      env: envFor(env),
      stdio: opts.quiet ? 'pipe' : 'inherit',
    })
  } catch (err) {
    rethrowDockerError(err, 'docker compose up')
  }
}

export async function composeDownWipe(env: StackEnv): Promise<void> {
  try {
    await execa('docker', composeArgs(env, 'down', '--volumes'), {
      env: envFor(env),
      stdio: 'pipe',
    })
  } catch (err) {
    rethrowDockerError(err, 'docker compose down')
  }
}

export async function composeLogs(
  env: StackEnv,
  opts: { service?: 'web' | 'db'; follow?: boolean } = {},
): Promise<void> {
  const args = composeArgs(
    env,
    'logs',
    ...(opts.follow ? ['-f'] : []),
    ...(opts.service ? [opts.service] : []),
  )
  await execa('docker', args, {
    env: envFor(env),
    stdio: 'inherit',
    reject: false,
  })
}

export type ReadinessProgress =
  | { kind: 'pending'; httpCode: number | null }
  | { kind: 'ready' }

export async function waitUntilReady(
  baseUrl: string,
  opts: {
    timeoutMs?: number
    intervalMs?: number
    username?: string
    password?: string
    onProgress?: (p: ReadinessProgress) => void
  } = {},
): Promise<void> {
  const timeoutMs = opts.timeoutMs ?? 15 * 60_000
  const intervalMs = opts.intervalMs ?? 5_000
  const username = opts.username ?? 'admin'
  const password = opts.password ?? 'district'
  const deadline = Date.now() + timeoutMs
  const auth = Buffer.from(`${username}:${password}`).toString('base64')

  while (true) {
    let httpCode: number | null = null
    try {
      const res = await fetch(`${baseUrl.replace(/\/+$/, '')}/api/system/info`, {
        headers: { Authorization: `Basic ${auth}`, Accept: 'application/json' },
        signal: AbortSignal.timeout(5_000),
      })
      httpCode = res.status
      if (res.ok) {
        opts.onProgress?.({ kind: 'ready' })
        return
      }
    } catch {
      httpCode = null
    }

    opts.onProgress?.({ kind: 'pending', httpCode })

    if (Date.now() >= deadline) {
      throw new Error(
        `DHIS2 at ${baseUrl} did not become ready within ${Math.round(timeoutMs / 1000)}s ` +
          `(last HTTP code: ${httpCode ?? 'no response'}).\n` +
          'Run `declare logs --web` to see what went wrong.',
      )
    }

    await new Promise((r) => setTimeout(r, intervalMs))
  }
}
