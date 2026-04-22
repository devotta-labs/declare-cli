// Generator entrypoint. Reads committed /api/schemas.json snapshots from
// packages/declare/snapshots/, derives per-target Zod base schemas + shared
// enums, and writes everything under packages/declare/src/generated/.
//
//     pnpm --filter @devotta-labs/declare gen:schemas
//
// The output is fully deterministic: the same snapshots produce the same
// output, so re-running after a snapshot refresh either produces a no-op
// diff or a minimal, reviewable delta.

import { readFile, rm, writeFile, mkdir } from 'node:fs/promises'
import { existsSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { TARGETS, type Target } from './generate/config.ts'
import { collectEntities } from './generate/collect.ts'
import { collectEnums } from './generate/enums.ts'
import {
  emitEntity,
  emitEnums,
  emitIndex,
  emitRuntime,
  emitTargets,
} from './generate/emit.ts'
import { ENTITY_SCHEMAS } from './generate/config.ts'
import type { MetadataKind } from '../src/lib/core.ts'
import type { Snapshot } from './generate/snapshot.ts'

const HERE = dirname(fileURLToPath(import.meta.url))
const PKG_ROOT = resolve(HERE, '..')
const SNAPSHOT_DIR = resolve(PKG_ROOT, 'snapshots')
const OUT_DIR = resolve(PKG_ROOT, 'src/generated')

async function loadSnapshots(): Promise<Record<Target, Snapshot>> {
  const out = {} as Record<Target, Snapshot>
  for (const target of TARGETS) {
    const path = resolve(SNAPSHOT_DIR, `schemas-${target}.json`)
    if (!existsSync(path)) {
      throw new Error(
        `Missing snapshot ${path}. Run \`declare-cli sync-schemas --target ${target}\` first.`,
      )
    }
    const raw = await readFile(path, 'utf8')
    out[target] = JSON.parse(raw) as Snapshot
  }
  return out
}

async function writeOut(filename: string, contents: string): Promise<void> {
  const path = resolve(OUT_DIR, filename)
  await writeFile(path, contents.replace(/\n{3,}/g, '\n\n').trimEnd() + '\n', 'utf8')
}

async function main(): Promise<void> {
  const snapshots = await loadSnapshots()

  // Fresh output dir — prevents stale per-entity files from sticking around if
  // we ever remove an entity from ENTITY_SCHEMAS.
  if (existsSync(OUT_DIR)) await rm(OUT_DIR, { recursive: true, force: true })
  await mkdir(OUT_DIR, { recursive: true })

  const collection = collectEntities(snapshots, TARGETS)
  const enums = collectEnums(collection, TARGETS)

  await writeOut('targets.ts', emitTargets())
  await writeOut('runtime.ts', emitRuntime())
  await writeOut('enums.ts', emitEnums(enums))

  const kinds = Object.values(ENTITY_SCHEMAS) as readonly MetadataKind[]
  for (const kind of kinds) {
    const { filename, contents } = emitEntity(kind, collection[kind])
    await writeOut(filename, contents)
  }

  await writeOut('index.ts', emitIndex())

  const counts = kinds.map((k) => `${k}:${collection[k]['2.42'].length}`).join(' ')
  process.stdout.write(`Generated ${kinds.length} entities into ${OUT_DIR}\n`)
  process.stdout.write(`Field counts (2.42): ${counts}\n`)
}

main().catch((err: unknown) => {
  process.stderr.write(`generate failed: ${err instanceof Error ? err.stack ?? err.message : String(err)}\n`)
  process.exit(1)
})
