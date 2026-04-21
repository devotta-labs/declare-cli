import { execFileSync } from 'node:child_process'
import { describe, expect, it } from 'vitest'
import schema from './schema.ts'

describe('tb-tracker metadata schema smoke', () => {
  it('loads with Zod validation and exposes tracker handles grouped by kind', () => {
    expect(schema.byKind.TrackedEntityType.length).toBeGreaterThan(0)
    expect(schema.byKind.TrackedEntityAttribute.length).toBeGreaterThan(0)
    expect(schema.byKind.Program.length).toBeGreaterThan(0)
    expect(schema.byKind.ProgramStage.length).toBeGreaterThan(0)
    expect(schema.byKind.DataElement.length).toBeGreaterThan(0)
    expect(schema.byKind.OrganisationUnit.length).toBeGreaterThan(0)

    const payload = schema.serialize()
    expect(payload).toHaveProperty('programs')
    expect(payload).toHaveProperty('programStages')
    expect(payload).toHaveProperty('trackedEntityTypes')
    expect(payload).toHaveProperty('trackedEntityAttributes')
  })

  it('auto-injects the program back-ref on each ProgramStage payload', () => {
    const payload = schema.serialize() as Record<string, Record<string, unknown>[]>
    const stages = payload.programStages
    expect(stages.length).toBeGreaterThan(0)
    for (const stage of stages) {
      expect(stage.program).toMatchObject({ code: 'PRG_TB_TRACKER' })
    }
  })

  it('runs `pnpm check` end-to-end against the real schema', () => {
    const out = execFileSync('pnpm', ['run', '--silent', 'check'], {
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'pipe'],
    })
    expect(out).toContain('Schema validated by Zod at load time')
    expect(out).toContain('Program')
  })
})
