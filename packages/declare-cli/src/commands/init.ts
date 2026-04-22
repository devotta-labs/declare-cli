import { existsSync } from 'node:fs'
import { mkdir, readFile, readdir, stat, writeFile } from 'node:fs/promises'
import { basename, dirname, relative, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { cancel, confirm, intro, isCancel, outro, select, text } from '@clack/prompts'
import { pc, ui } from '../ui.ts'

type Template = 'blank' | 'aggregate' | 'tracker'

type Substitutions = {
  name: string
  port: number
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
    validateName(name)
    validateTemplate(template)
    validatePort(port)
    await runScaffold(cwd, name, template, port)
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

  const target = resolveTarget(cwd, name)
  if (target !== cwd && existsSync(target)) {
    const entries = (await stat(target)).isDirectory() ? await readdir(target) : []
    if (entries.length > 0) {
      const ok = await confirm({
        message: `${relative(cwd, target)} is not empty. Continue?`,
        initialValue: false,
      })
      if (isCancel(ok) || !ok) cancelAndExit()
    }
  }

  await runScaffold(cwd, name, template, port)

  outro(pc.green('Project scaffolded.'))

  ui.raw(pc.bold('Next steps:'))
  if (target !== cwd) ui.raw(`  cd ${relative(cwd, target)}`)
  ui.raw('  pnpm install')
  ui.raw('  pnpm start')
  ui.raw('')
}

function resolveTarget(cwd: string, name: string): string {
  return name === basename(cwd) ? cwd : resolve(cwd, name)
}

async function runScaffold(
  cwd: string,
  name: string,
  template: Template,
  port: number,
): Promise<void> {
  const target = resolveTarget(cwd, name)
  const declareDep = (await detectMonorepo(cwd)) ? 'workspace:*' : '^0.0.1'
  await scaffold(template, target, { name, port, declareDep })
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
    .replace(/\{\{declareDep\}\}/g, subs.declareDep)
}
