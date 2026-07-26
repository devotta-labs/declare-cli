import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    testTimeout: 30_000,
    coverage: {
      provider: 'v8',
      include: ['packages/declare/src/**/*.ts', 'packages/declare-cli/src/**/*.ts'],
      exclude: [
        '**/*.test.ts',
        'packages/declare/src/generated/**',
        'packages/declare-cli/src/types/**',
      ],
      reporter: ['text', 'json-summary', 'html'],
      reportsDirectory: 'coverage',
    },
  },
})
