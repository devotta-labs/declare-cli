import { check } from './check.ts'
import { apply, plan } from './apply.ts'

const USAGE = `Usage: dhis2 <command>

Commands:
  check   Validate the schema locally (no network)
  plan    Submit the schema to DHIS2 in dry-run mode
  apply   Submit the schema to DHIS2 and commit
`

async function main(): Promise<void> {
  const cmd = process.argv[2]
  try {
    switch (cmd) {
      case 'check':
        await check()
        break
      case 'plan':
        await plan()
        break
      case 'apply':
        await apply()
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

await main()
