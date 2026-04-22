import { loadConfig, type LoadedConfig } from './config-loader.ts'
import { init } from './commands/init.ts'
import { start } from './commands/start.ts'
import { stop } from './commands/stop.ts'
import { reset } from './commands/reset.ts'
import { status } from './commands/status.ts'
import { logs } from './commands/logs.ts'
import { check } from './commands/check.ts'
import { plan } from './commands/plan.ts'
import { apply } from './commands/apply.ts'
import { typegen } from './commands/typegen.ts'
import { ui, pc } from './ui.ts'

const USAGE = `${pc.bold('declare-cli')} — DHIS2 metadata-as-code CLI

${pc.bold('Usage:')} declare-cli <command> [options]

${pc.bold('Project lifecycle:')}
  ${pc.cyan('init')} [name]          scaffold a new DHIS2 metadata project

${pc.bold('Local DHIS2 stack:')}
  ${pc.cyan('start')}                start local DHIS2 and apply the schema
  ${pc.cyan('stop')}                 stop local DHIS2 and wipe its database
  ${pc.cyan('reset')}                alias for ${pc.cyan('stop')} then ${pc.cyan('start')}
  ${pc.cyan('status')}               show whether the local stack is running
  ${pc.cyan('logs')} [--web|--db]    tail container logs (use --follow to stream)

${pc.bold('Schema operations:')}
  ${pc.cyan('typegen')}              generate TypeScript types for the configured DHIS2 version
  ${pc.cyan('check')}                validate the schema locally (no network)
  ${pc.cyan('plan')}                 dry-run the schema against the local stack
  ${pc.cyan('apply')}                push the schema to the local stack

${pc.bold('Options:')}
  -h, --help           show this help
  -v, --version        show the CLI version
`

type CommandHandler = (args: readonly string[]) => Promise<void>

const CONFIGLESS: Record<string, CommandHandler> = {
  init,
}

const CONFIG_REQUIRED: Record<string, (loaded: LoadedConfig, args: readonly string[]) => Promise<void>> = {
  start,
  stop,
  reset,
  status,
  logs,
  typegen,
  check,
  plan,
  apply,
}

async function main(argv: readonly string[]): Promise<void> {
  const [cmd, ...rest] = argv

  if (!cmd || cmd === '-h' || cmd === '--help' || cmd === 'help') {
    process.stdout.write(USAGE)
    return
  }

  if (cmd === '-v' || cmd === '--version') {
    // Read version from the CLI's own package.json at runtime to avoid import assertions.
    const { readFileSync } = await import('node:fs')
    const { fileURLToPath } = await import('node:url')
    const { resolve, dirname } = await import('node:path')
    const pkgPath = resolve(dirname(fileURLToPath(import.meta.url)), '..', 'package.json')
    const pkg = JSON.parse(readFileSync(pkgPath, 'utf8')) as { version?: string }
    process.stdout.write(`${pkg.version ?? '0.0.0'}\n`)
    return
  }

  const configless = CONFIGLESS[cmd]
  if (configless) {
    await configless(rest)
    return
  }

  const withConfig = CONFIG_REQUIRED[cmd]
  if (withConfig) {
    const loaded = await loadConfig()
    await withConfig(loaded, rest)
    return
  }

  ui.error(`Unknown command: ${cmd}\n`)
  process.stdout.write(USAGE)
  process.exit(1)
}

try {
  await main(process.argv.slice(2))
} catch (err) {
  const msg = err instanceof Error ? err.message : String(err)
  ui.error(msg)
  process.exit(1)
}
