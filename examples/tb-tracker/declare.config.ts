import { defineConfig } from '@devotta-labs/declare-cli'

export default defineConfig({
  name: 'tb-tracker',
  schema: './src/schema.ts',
  local: {
    port: 8081,
  },
})
