import { existsSync } from 'node:fs'
import { mkdir, readFile, readdir, stat, writeFile } from 'node:fs/promises'
import { basename, dirname, relative, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { cancel, confirm, intro, isCancel, outro, select, text } from '@clack/prompts'
import { DEFAULT_TARGET, TARGETS, type Target } from '@devotta-labs/declare'
import { pc, ui } from '../ui.ts'
import { writeDeclareEnv } from './typegen.ts'

type Template = 'blank' | 'aggregate' | 'tracker'

type Substitutions = {
  name: string
  port: number
  target: Target
  declareDep: string
}

const TEMPLATES_ROOT = resolve(
  dirname(fileURLToPath(import.meta.url)),
  '..',
  '..',
  'templates',
  'projects',
)

type Flags = {
  name?: string
  template?: Template
  port?: number
  target?: Target
  yes: boolean
  positional: string[]
}

function parseFlags(args: readonly string[]): Flags {
  const flags: Flags = { yes: false, positional: [] }
  for (let i = 0; i < args.length; i++) {
    const a = args[i]!
    if (a === '--yes' || a === '-y') flags.yes = true
    else if (a === '--name') {
      const v = args[++i]
      if (v === undefined) throw new Error('--name requires a value')
      flags.name = v
    } else if (a === '--template') {
      const v = args[++i]
      if (v === undefined) throw new Error('--template requires a value')
      flags.template = v as Template
    } else if (a === '--port') {
      const v = args[++i]
      if (v === undefined) throw new Error('--port requires a value')
      flags.port = Number(v)
    } else if (a === '--target') {
      const v = args[++i]
      if (v === undefined) throw new Error('--target requires a value')
      flags.target = v as Target
    }
    else if (!a.startsWith('-')) flags.positional.push(a)
    else throw new Error(`Unknown argument for \`init\`: ${a}`)
  }
  return flags
}

export async function init(args: readonly string[]): Promise<void> {
  const flags = parseFlags(args)
  const cwd = process.cwd()
  const initialName = flags.name ?? flags.positional[0] ?? basename(cwd)

  if (flags.yes) {
    const name = initialName
    const template = flags.template ?? 'blank'
    const port = flags.port ?? 8080
    const target = flags.target ?? DEFAULT_TARGET
    validateName(name)
    validateTemplate(template)
    validatePort(port)
    validateTarget(target)
    await runScaffold(cwd, name, template, port, target)
    return
  }

  intro(pc.bgCyan(pc.black(' declare-cli init ')))

  const nameAnswer = await text({
    message: 'Project name',
    placeholder: 'dhis2',
    validate: (v) => {
      if (!v) return undefined
      if (!/^[a-z0-9][a-z0-9-]*$/.test(v)) {
        return 'Use lowercase letters, digits, and hyphens only (must start with a letter or digit)'
      }
      return undefined
    },
  })
  if (isCancel(nameAnswer)) cancelAndExit()
  const name = (nameAnswer as string) || 'dhis2'

  const templateAnswer = await select({
    message: 'Choose a starter template',
    options: [
      { value: 'blank', label: 'Blank', hint: 'empty schema' },
      { value: 'aggregate', label: 'Aggregate', hint: 'data element + data set + org units' },
      { value: 'tracker', label: 'Tracker', hint: 'program + program stage + TET/TEAs' },
    ],
  })
  if (isCancel(templateAnswer)) cancelAndExit()
  const template = templateAnswer as Template

  const portAnswer = await text({
    message: 'Local DHIS2 port',
    placeholder: String(flags.port ?? 8080),
    initialValue: String(flags.port ?? 8080),
    validate: (v) => {
      const n = Number(v)
      if (!Number.isInteger(n) || n < 1 || n > 65535) return 'Enter a port between 1 and 65535'
      return undefined
    },
  })
  if (isCancel(portAnswer)) cancelAndExit()
  const port = Number(portAnswer)

  const targetAnswer = await select<Target>({
    message: 'DHIS2 target version',
    options: TARGETS.map((t) =>
      t === DEFAULT_TARGET
        ? { value: t, label: t, hint: 'default' }
        : { value: t, label: t },
    ),
    initialValue: flags.target ?? DEFAULT_TARGET,
  })
  if (isCancel(targetAnswer)) cancelAndExit()
  const target = targetAnswer

  const projectDir = resolveProjectDir(cwd, name)
  if (projectDir !== cwd && existsSync(projectDir)) {
    const entries = (await stat(projectDir)).isDirectory() ? await readdir(projectDir) : []
    if (entries.length > 0) {
      const ok = await confirm({
        message: `${relative(cwd, projectDir)} is not empty. Continue?`,
        initialValue: false,
      })
      if (isCancel(ok) || !ok) cancelAndExit()
    }
  }

  ui.raw('')
  await runScaffold(cwd, name, template, port, target)

  outro(pc.green('Project scaffolded.'))

  ui.raw(pc.bold('Next steps:'))
  if (projectDir !== cwd) ui.raw(`  cd ${relative(cwd, projectDir)}`)
  ui.raw('  pnpm install')
  ui.raw('  pnpm start')
  ui.raw('')
}

function resolveProjectDir(cwd: string, name: string): string {
  return name === basename(cwd) ? cwd : resolve(cwd, name)
}

async function runScaffold(
  cwd: string,
  name: string,
  template: Template,
  port: number,
  target: Target,
): Promise<void> {
  const projectDir = resolveProjectDir(cwd, name)
  const declareDep = (await detectMonorepo(cwd)) ? 'workspace:*' : '^0.1.0'
  await scaffold(template, projectDir, { name, port, target, declareDep })

  // Avoid loadConfig here: the scaffolded project may not have installed dependencies yet.
  await writeDeclareEnv(projectDir, target)
}

function validateName(name: string): void {
  if (!/^[a-z0-9][a-z0-9-]*$/.test(name)) {
    throw new Error(
      `Invalid project name '${name}'. Use lowercase letters, digits, and hyphens only.`,
    )
  }
}

function validateTemplate(template: string): asserts template is Template {
  if (!['blank', 'aggregate', 'tracker'].includes(template)) {
    throw new Error(`Unknown template '${template}'. Choose: blank, aggregate, tracker.`)
  }
}

function validatePort(port: number): void {
  if (!Number.isInteger(port) || port < 1 || port > 65535) {
    throw new Error(`Invalid port '${port}'. Enter a port between 1 and 65535.`)
  }
}

function validateTarget(target: string): asserts target is Target {
  if (!(TARGETS as readonly string[]).includes(target)) {
    throw new Error(`Invalid target '${target}'. Choose: ${TARGETS.join(', ')}.`)
  }
}

function cancelAndExit(): never {
  cancel('Cancelled.')
  process.exit(0)
}

async function detectMonorepo(dir: string): Promise<boolean> {
  let cur = resolve(dir)
  while (true) {
    if (existsSync(resolve(cur, 'pnpm-workspace.yaml'))) return true
    const parent = dirname(cur)
    if (parent === cur) return false
    cur = parent
  }
}

async function scaffold(
  template: Template,
  target: string,
  subs: Substitutions,
): Promise<void> {
  const src = resolve(TEMPLATES_ROOT, template)
  if (!existsSync(src)) throw new Error(`Template '${template}' not found at ${src}`)

  await mkdir(target, { recursive: true })
  await copyDir(src, target, subs)
}

async function copyDir(src: string, dst: string, subs: Substitutions): Promise<void> {
  const entries = await readdir(src, { withFileTypes: true })
  for (const entry of entries) {
    const s = resolve(src, entry.name)
    const d = resolve(dst, entry.name)
    if (entry.isDirectory()) {
      await mkdir(d, { recursive: true })
      await copyDir(s, d, subs)
    } else if (entry.isFile()) {
      const raw = await readFile(s, 'utf8')
      const rendered = renderTemplate(raw, subs)
      await writeFile(d, rendered, 'utf8')
    }
  }
}

function renderTemplate(source: string, subs: Substitutions): string {
  return source
    .replace(/\{\{name\}\}/g, subs.name)
    .replace(/\{\{port\}\}/g, String(subs.port))
    .replace(/\{\{target\}\}/g, subs.target)
    .replace(/\{\{declareDep\}\}/g, subs.declareDep)
}
