import { execFileSync } from 'node:child_process'
import { describe, expect, it } from 'vitest'
import schema from './schema.ts'

describe('metadata schema smoke', () => {
  it('loads with Zod validation and exposes handles grouped by kind', () => {
    expect(schema.byKind.DataElement.length).toBeGreaterThan(0)
    expect(schema.byKind.OrganisationUnit.length).toBeGreaterThan(0)

    const payload = schema.serialize()
    expect(payload).toHaveProperty('dataElements')
    expect(payload).toHaveProperty('organisationUnits')
  })

  it('runs `pnpm check` end-to-end against the real schema', () => {
    const out = execFileSync('pnpm', ['run', '--silent', 'check'], {
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'pipe'],
    })
    expect(out).toContain('Schema validated by Zod at load time')
    expect(out).toContain('DataElement')
  })
})
