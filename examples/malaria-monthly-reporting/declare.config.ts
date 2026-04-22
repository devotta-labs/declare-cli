import { defineConfig } from '@devotta-labs/declare-cli'

export default defineConfig({
  name: 'malaria-monthly-reporting',
  schema: './src/schema.ts',
  local: {
    port: 8080,
  },
})
