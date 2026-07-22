import { describe, expect, it } from 'vitest'
import { ConfigSchema } from './config.ts'

const config = {
  name: 'target-test',
  schema: './src/schema.ts',
  local: { port: 8080 },
}

describe('ConfigSchema target', () => {
  it.each(['2.40', '2.41', '2.42', '2.43'] as const)('accepts DHIS2 %s', (target) => {
    expect(ConfigSchema.parse({ ...config, target }).target).toBe(target)
  })

  it('rejects unsupported targets', () => {
    expect(ConfigSchema.safeParse({ ...config, target: '2.44' }).success).toBe(false)
  })
})
