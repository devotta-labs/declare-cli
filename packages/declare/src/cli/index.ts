import type { Schema } from '../lib/schema.ts'
import { check } from './check.ts'
import { apply, plan } from './apply.ts'

const USAGE = `Usage: dhis2 <command>

Commands:
  check   Validate the schema locally (no network)
  plan    Submit the schema to DHIS2 in dry-run mode
  apply   Submit the schema to DHIS2 and commit
`

export async function runCli(schema: Schema, argv: readonly string[] = process.argv.slice(2)): Promise<void> {
  const cmd = argv[0]
  try {
    switch (cmd) {
      case 'check':
        await check(schema)
        break
      case 'plan':
        await plan(schema)
        break
      case 'apply':
        await apply(schema)
        break
      case undefined:
      case '-h':
      case '--help':
        process.stdout.write(USAGE)
        break
      default:
        process.stderr.write(`Unknown command: ${cmd}\n\n${USAGE}`)
        process.exit(1)
    }
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    process.stderr.write(`\nError: ${msg}\n`)
    process.exit(1)
  }
}
