import { existsSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { config as loadDotenv } from 'dotenv'

// Walk up from `start` looking for any of `names`; return absolute paths in
// priority order. First `.env.local` found wins over later `.env`s.
function findDotenvFiles(names: readonly string[], start: string = process.cwd()): string[] {
  const hits: string[] = []
  let dir = resolve(start)
  while (true) {
    for (const name of names) {
      const candidate = resolve(dir, name)
      if (existsSync(candidate)) hits.push(candidate)
    }
    const parent = dirname(dir)
    if (parent === dir) break
    dir = parent
  }
  return hits
}

// `.env.local` wins over `.env`, and a file closer to cwd wins over one higher
// up the tree. dotenv keeps the first definition it sees, so we pass the most
// specific path first.
loadDotenv({ path: findDotenvFiles(['.env.local', '.env']), quiet: true })

export type Env = {
  baseUrl: string
  token: string
}

export function loadEnv(): Env {
  const baseUrl = process.env.DHIS2_BASE_URL
  const token = process.env.DHIS2_TOKEN
  if (!baseUrl) throw new Error('DHIS2_BASE_URL is not set (check .env.local / .env or environment)')
  if (!token) throw new Error('DHIS2_TOKEN is not set (check .env.local / .env or environment)')
  return { baseUrl: baseUrl.replace(/\/+$/, ''), token }
}
