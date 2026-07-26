#!/usr/bin/env node

import { spawn } from 'node:child_process'
import { mkdir, writeFile } from 'node:fs/promises'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const VERSIONS = {
  '2.40': { image: 'dhis2/core:2.40.11', port: 8040 },
  '2.41': { image: 'dhis2/core:2.41.8', port: 8041 },
  '2.42': { image: 'dhis2/core:2.42.4', port: 8042 },
  '2.43': { image: 'dhis2/core:2.43.0.1', port: 8043 },
}

const METADATA_CODE = 'DECLARE_CLI_INTEGRATION_VALUE'
const AUTHORIZATION = `Basic ${Buffer.from('admin:district').toString('base64')}`
const SCRIPT_DIR = dirname(fileURLToPath(import.meta.url))
const REPOSITORY_ROOT = resolve(SCRIPT_DIR, '..', '..', '..')
const FIXTURE_DIR = resolve(SCRIPT_DIR, 'fixture')
const CLI_PATH = resolve(SCRIPT_DIR, '..', 'bin', 'declare-cli.mjs')
const COMPOSE_FILE = resolve(SCRIPT_DIR, '..', 'templates', 'docker', 'docker-compose.yml')

function usage() {
  console.log(`Usage: pnpm integration:dhis2 -- <version> [options]

Versions: 2.40, 2.41, 2.42, 2.43

Options:
  --image <image>              pinned DHIS2 image (must match the version)
  --port <port>                host port (default: version-specific 8040-8043)
  --project <name>             Docker Compose project name
  --artifacts-dir <directory>  diagnostic output directory
  -h, --help                   show this help`)
}

function parseArgs(argv) {
  const normalizedArgv = argv[0] === '--' ? argv.slice(1) : argv

  if (normalizedArgv.includes('-h') || normalizedArgv.includes('--help')) {
    usage()
    process.exit(0)
  }

  const [version, ...rest] = normalizedArgv
  if (!version || !(version in VERSIONS)) {
    throw new Error(`Expected one supported DHIS2 version; received ${version ?? 'nothing'}`)
  }

  const options = {}
  for (let index = 0; index < rest.length; index += 2) {
    const key = rest[index]
    const value = rest[index + 1]
    if (!key?.startsWith('--') || value === undefined) {
      throw new Error(`Invalid option near ${key ?? '(end of arguments)'}`)
    }
    options[key.slice(2)] = value
  }

  const pinned = VERSIONS[version]
  const image = options.image ?? pinned.image
  if (image !== pinned.image) {
    throw new Error(`DHIS2 ${version} must use pinned image ${pinned.image}; received ${image}`)
  }

  const port = Number(options.port ?? pinned.port)
  if (!Number.isInteger(port) || port < 1 || port > 65535) {
    throw new Error(`Invalid port: ${options.port}`)
  }

  const project = options.project ?? `declare-integration-${version.replace('.', '')}-${process.pid}`
  if (!/^[a-z0-9][a-z0-9-]*$/.test(project)) {
    throw new Error(`Invalid Docker Compose project name: ${project}`)
  }

  const artifactsDir = resolve(
    REPOSITORY_ROOT,
    options['artifacts-dir'] ?? 'packages/declare-cli/integration/artifacts',
  )

  return { version, image, port, project, artifactsDir }
}

async function runCommand(label, command, args, options) {
  const timeoutMs = options.timeoutMs
  const logPath = resolve(options.artifactsDir, `${label}.log`)
  const chunks = []
  const child = spawn(command, args, {
    cwd: options.cwd ?? REPOSITORY_ROOT,
    env: options.env,
    stdio: ['ignore', 'pipe', 'pipe'],
  })

  let timedOut = false
  let forceKillTimer
  const timer = setTimeout(() => {
    timedOut = true
    child.kill('SIGTERM')
    forceKillTimer = setTimeout(() => child.kill('SIGKILL'), 5_000)
  }, timeoutMs)

  child.stdout.on('data', (chunk) => {
    chunks.push(chunk)
    if (!options.quiet) process.stdout.write(chunk)
  })
  child.stderr.on('data', (chunk) => {
    chunks.push(chunk)
    if (!options.quiet) process.stderr.write(chunk)
  })

  const result = await new Promise((resolvePromise, rejectPromise) => {
    child.once('error', rejectPromise)
    child.once('close', (code, signal) => resolvePromise({ code, signal }))
  }).finally(() => {
    clearTimeout(timer)
    clearTimeout(forceKillTimer)
  })

  const output = Buffer.concat(chunks).toString('utf8')
  await writeFile(logPath, output, 'utf8')

  if (timedOut) {
    throw new Error(`${label} timed out after ${Math.round(timeoutMs / 1000)} seconds`)
  }
  if (result.code !== 0) {
    throw new Error(
      `${label} failed with ${result.signal ? `signal ${result.signal}` : `exit code ${result.code}`}`,
    )
  }
  return output
}

async function waitUntilReady(baseUrl, artifactsDir) {
  const deadline = Date.now() + 15 * 60_000
  const statuses = []

  while (Date.now() < deadline) {
    try {
      const response = await fetch(`${baseUrl}/api/system/info`, {
        headers: { Authorization: AUTHORIZATION, Accept: 'application/json' },
        signal: AbortSignal.timeout(5_000),
      })
      statuses.push(`${new Date().toISOString()} HTTP ${response.status}`)
      if (response.ok) {
        await writeFile(resolve(artifactsDir, 'readiness.log'), `${statuses.join('\n')}\n`)
        return
      }
    } catch (error) {
      statuses.push(
        `${new Date().toISOString()} ${error instanceof Error ? error.message : String(error)}`,
      )
    }
    await new Promise((resolvePromise) => setTimeout(resolvePromise, 5_000))
  }

  await writeFile(resolve(artifactsDir, 'readiness.log'), `${statuses.join('\n')}\n`)
  throw new Error(`DHIS2 did not become ready at ${baseUrl} within 15 minutes`)
}

async function fetchMetadataMatches(baseUrl, label, artifactsDir) {
  const url = new URL('/api/dataElements', baseUrl)
  url.searchParams.set('filter', `code:eq:${METADATA_CODE}`)
  url.searchParams.set('fields', 'id,code')
  url.searchParams.set('paging', 'false')

  const response = await fetch(url, {
    headers: { Authorization: AUTHORIZATION, Accept: 'application/json' },
    signal: AbortSignal.timeout(15_000),
  })
  const text = await response.text()
  await writeFile(resolve(artifactsDir, `${label}.json`), text, 'utf8')

  if (!response.ok) {
    throw new Error(`Metadata verification returned HTTP ${response.status}: ${text.slice(0, 500)}`)
  }

  const body = JSON.parse(text)
  if (!Array.isArray(body.dataElements)) {
    throw new Error(`Metadata verification for ${METADATA_CODE} returned an invalid response`)
  }
  return body.dataElements
}

function parseImportStats(output) {
  const match =
    /totals:\s+created=(\d+)\s+updated=(\d+)\s+deleted=(\d+)\s+ignored=(\d+)\s+total=(\d+)/.exec(
      output,
    )
  if (!match) return null
  const [, created, updated, deleted, ignored, total] = match
  return { created, updated, deleted, ignored, total }
}

function assertSafeSecondApply(firstOutput, secondOutput) {
  const first = parseImportStats(firstOutput)
  const second = parseImportStats(secondOutput)

  // Some supported DHIS2 versions return OK with empty import counters. Only
  // assert counter-level idempotency after the first response proves that its
  // counters reflect the object we observed being created.
  if (!first || Number(first.created) < 1) {
    console.log(
      'DHIS2 did not expose populated import counters; using metadata count and UID for safety',
    )
    return
  }
  if (!second) {
    throw new Error('Second apply omitted import statistics after the first response populated them')
  }
  if (second.created !== '0' || second.deleted !== '0') {
    throw new Error(
      `Second apply was not safe: response reported created=${second.created}, deleted=${second.deleted}`,
    )
  }
}

const config = parseArgs(process.argv.slice(2))
await mkdir(config.artifactsDir, { recursive: true })

const baseUrl = `http://127.0.0.1:${config.port}`
const environment = {
  ...process.env,
  DHIS2_IMAGE: config.image,
  DHIS2_WEB_PORT: String(config.port),
  DECLARE_INTEGRATION_TARGET: config.version,
  DECLARE_INTEGRATION_PORT: String(config.port),
  DECLARE_INTEGRATION_PROJECT: config.project,
  FORCE_COLOR: '0',
}
const composeArgs = ['compose', '-f', COMPOSE_FILE, '-p', config.project]
const commandOptions = {
  artifactsDir: config.artifactsDir,
  env: environment,
}

console.log(
  `Running declare-cli integration against DHIS2 ${config.version} (${config.image}) at ${baseUrl}`,
)

let scenarioError
let cleanupError
try {
  await runCommand('docker-up', 'docker', [...composeArgs, 'up', '-d'], {
    ...commandOptions,
    timeoutMs: 10 * 60_000,
  })
  await waitUntilReady(baseUrl, config.artifactsDir)

  const runCli = (label, command) =>
    runCommand(label, process.execPath, [CLI_PATH, command], {
      ...commandOptions,
      cwd: FIXTURE_DIR,
      timeoutMs: 5 * 60_000,
    })

  await runCli('check', 'check')
  await runCli('plan', 'plan')
  const before = await fetchMetadataMatches(
    baseUrl,
    'metadata-before-first-apply',
    config.artifactsDir,
  )
  if (before.length !== 0) {
    throw new Error(`Expected a clean DHIS2, but ${before.length} matching data elements exist`)
  }

  const firstOutput = await runCli('apply-first', 'apply')
  const afterFirst = await fetchMetadataMatches(
    baseUrl,
    'metadata-after-first-apply',
    config.artifactsDir,
  )
  if (afterFirst.length !== 1) {
    throw new Error(`Expected one matching data element after first apply; received ${afterFirst.length}`)
  }

  const secondOutput = await runCli('apply-second', 'apply')
  const afterSecond = await fetchMetadataMatches(
    baseUrl,
    'metadata-after-second-apply',
    config.artifactsDir,
  )
  if (afterSecond.length !== 1) {
    throw new Error(
      `Expected one matching data element after second apply; received ${afterSecond.length}`,
    )
  }
  if (afterFirst[0].id !== afterSecond[0].id) {
    throw new Error(
      `Second apply replaced metadata UID ${afterFirst[0].id} with ${afterSecond[0].id}`,
    )
  }
  assertSafeSecondApply(firstOutput, secondOutput)

  console.log(`DHIS2 ${config.version} integration scenario passed`)
} catch (error) {
  scenarioError = error
} finally {
  try {
    await runCommand('docker-compose', 'docker', [...composeArgs, 'ps', '-a'], {
      ...commandOptions,
      timeoutMs: 30_000,
    })
    await runCommand('docker-logs', 'docker', [...composeArgs, 'logs', '--no-color'], {
      ...commandOptions,
      quiet: true,
      timeoutMs: 60_000,
    })
  } catch (error) {
    console.error(`Could not collect all Docker diagnostics: ${error}`)
  }

  try {
    await runCommand(
      'docker-cleanup',
      'docker',
      [...composeArgs, 'down', '--volumes', '--remove-orphans'],
      {
        ...commandOptions,
        timeoutMs: 2 * 60_000,
      },
    )
  } catch (error) {
    cleanupError = error
  }
}

if (scenarioError) throw scenarioError
if (cleanupError) throw cleanupError
