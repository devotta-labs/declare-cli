import { defineConfig } from '@devotta-labs/declare-cli'

export default defineConfig({
  name: '{{name}}',
  schema: './src/schema.ts',
  local: {
    port: {{port}},
  },
})
