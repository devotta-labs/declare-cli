import { readFile, writeFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import type { Target } from '@devotta-labs/declare'
import type { LoadedConfig } from '../config-loader.ts'
import { pc, ui } from '../ui.ts'
import { expectNoArgs } from './args.ts'

const ENV_FILE = 'declare-env.d.ts'

/**
 * Write the declare-env.d.ts that narrows @devotta-labs/declare's
 * `ConfiguredTargets` interface to the single target configured in
 * declare.config.ts. Authoring types in defineX() resolve via CurrentTarget,
 * so `valueType: 'TRACKER_ASSOCIATE'` now fails `tsc --noEmit` on a 2.42
 * project without needing to run `declare-cli check` first.
 *
 * Safe to run on every invocation: we read the existing file and skip writing
 * if the contents are unchanged, so TS's incremental build isn't invalidated.
 */
export async function typegen(loaded: LoadedConfig, args: readonly string[] = []): Promise<void> {
  expectNoArgs('typegen', args)
  await writeDeclareEnv(loaded.projectRoot, loaded.config.target)
}

/**
 * Lower-level form used by `init`, which already knows the target and hasn't
 * installed dependencies yet (so loadConfig would fail to import declare-cli).
 */
export async function writeDeclareEnv(projectRoot: string, target: Target): Promise<void> {
  const outPath = resolve(projectRoot, ENV_FILE)
  const contents = render(target)

  const existing = await readIfExists(outPath)
  if (existing === contents) return

  await writeFile(outPath, contents, 'utf8')
  ui.success(`Types generated for DHIS2 ${pc.bold(target)} ${pc.dim(`(${ENV_FILE})`)}`)
}

function render(target: string): string {
  return [
    '// Auto-generated — do not edit by hand.',
    '//',
    '// This file tells TypeScript which DHIS2 version your project targets,',
    '// so your editor and `tsc` catch fields and values that don\'t exist on',
    '// that version.',
    '//',
    '// It is refreshed whenever you run `declare-cli init`, `typegen`,',
    '// or `check`. Commit it alongside declare.config.ts so',
    '// everyone on the team compiles against the same DHIS2 version.',
    '',
    "import '@devotta-labs/declare'",
    '',
    "declare module '@devotta-labs/declare' {",
    `  interface ConfiguredTargets { '${target}': true }`,
    '}',
    '',
  ].join('\n')
}

async function readIfExists(path: string): Promise<string | null> {
  try {
    return await readFile(path, 'utf8')
  } catch (err) {
    if ((err as NodeJS.ErrnoException).code === 'ENOENT') return null
    throw err
  }
}
