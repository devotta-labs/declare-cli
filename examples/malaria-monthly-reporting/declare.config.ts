import { defineConfig } from '@devotta-labs/declare-cli'

export default defineConfig({
  name: 'malaria-monthly-reporting',
  schema: './src/schema.ts',
  target: '2.43',
  local: {
    port: 8080,
  },
})
