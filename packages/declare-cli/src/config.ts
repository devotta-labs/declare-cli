import { z } from 'zod'
import { TARGETS } from '@devotta-labs/declare'

export const ConfigSchema = z
  .object({
    name: z
      .string()
      .min(1, 'name is required')
      .regex(
        /^[a-z0-9][a-z0-9-]*$/,
        'name must be lowercase alphanumeric with dashes (used as Docker compose project name)',
      ),
    schema: z.string().min(1, 'schema path is required'),
    // Required: the DHIS2 version this schema targets. Drives both the per-
    // version Zod validators at runtime and the TS narrowing via the
    // declare-env.d.ts written by `declare-cli typegen`.
    target: z.enum(TARGETS),
    local: z
      .object({
        port: z
          .number()
          .int()
          .min(1)
          .max(65535)
          .default(8080),
      })
      .default({}),
  })
  .strict()

export type DeclareConfig = z.infer<typeof ConfigSchema>
export type DeclareConfigInput = z.input<typeof ConfigSchema>

export function defineConfig(config: DeclareConfigInput): DeclareConfigInput {
  return config
}
