import { defineConfig } from '@devotta-labs/declare-cli'

const targets = ['2.40', '2.41', '2.42', '2.43'] as const
const target = targets.find((candidate) => candidate === process.env.DECLARE_INTEGRATION_TARGET)

if (!target) {
  throw new Error('DECLARE_INTEGRATION_TARGET must be one of 2.40, 2.41, 2.42, or 2.43')
}

const port = Number(process.env.DECLARE_INTEGRATION_PORT)
if (!Number.isInteger(port)) {
  throw new Error('DECLARE_INTEGRATION_PORT must be an integer')
}

export default defineConfig({
  name: process.env.DECLARE_INTEGRATION_PROJECT ?? `declare-integration-${target.replace('.', '')}`,
  schema: './schema.ts',
  target,
  local: { port },
})
