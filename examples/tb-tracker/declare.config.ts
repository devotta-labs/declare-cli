import { defineConfig } from '@devotta-labs/declare-cli'

export default defineConfig({
  name: 'tb-tracker',
  schema: './src/schema.ts',
  target: '2.43',
  local: {
    port: 8081,
  },
})
