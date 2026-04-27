import { existsSync } from 'node:fs'
import { dirname, isAbsolute, resolve } from 'node:path'
import { pathToFileURL } from 'node:url'
import { createJiti } from 'jiti'
import { withTarget, type Schema } from '@devotta-labs/declare'
import { ConfigSchema, type DeclareConfig } from './config.ts'

const CONFIG_FILENAMES = ['declare.config.ts', 'declare.config.mjs', 'declare.config.js']

export type LoadedConfig = {
  config: DeclareConfig
  configPath: string
  projectRoot: string
}

export function findConfigFile(start: string = process.cwd()): string | null {
  let dir = resolve(start)
  while (true) {
    for (const name of CONFIG_FILENAMES) {
      const candidate = resolve(dir, name)
      if (existsSync(candidate)) return candidate
    }
    const parent = dirname(dir)
    if (parent === dir) return null
    dir = parent
  }
}

const jiti = createJiti(import.meta.url, { interopDefault: true })

export async function loadConfig(cwd: string = process.cwd()): Promise<LoadedConfig> {
  const configPath = findConfigFile(cwd)
  if (!configPath) {
    throw new Error(
      'No declare.config.ts found in this or any parent directory.\n' +
        'Run `declare-cli init` to scaffold a new project.',
    )
  }

  const mod = await jiti.import<unknown>(pathToFileURL(configPath).href)
  const raw =
    mod && typeof mod === 'object' && 'default' in mod
      ? (mod as { default: unknown }).default
      : mod

  const parsed = ConfigSchema.safeParse(raw)
  if (!parsed.success) {
    const issues = parsed.error.issues
      .map((issue) => `  • ${issue.path.join('.') || '(root)'}: ${issue.message}`)
      .join('\n')
    throw new Error(`Invalid ${configPath}:\n${issues}`)
  }

  return {
    config: parsed.data,
    configPath,
    projectRoot: dirname(configPath),
  }
}

export async function loadSchema(loaded: LoadedConfig): Promise<Schema> {
  const schemaPath = isAbsolute(loaded.config.schema)
    ? loaded.config.schema
    : resolve(loaded.projectRoot, loaded.config.schema)

  if (!existsSync(schemaPath)) {
    throw new Error(
      `Schema file not found: ${schemaPath}\n` +
        `Fix the 'schema' field in ${loaded.configPath}.`,
    )
  }

  // The schema import must happen inside withTarget so defineX uses target-specific validators.
  return await withTarget(loaded.config.target, async () => {
    const mod = await jiti.import<unknown>(pathToFileURL(schemaPath).href)
    const schema =
      mod && typeof mod === 'object' && 'default' in mod
        ? (mod as { default: unknown }).default
        : mod

    if (!schema || typeof schema !== 'object' || typeof (schema as Schema).serialize !== 'function') {
      throw new Error(
        `Schema module at ${schemaPath} must have a default export created by \`defineSchema(...)\`.`,
      )
    }

    return schema as Schema
  })
}
