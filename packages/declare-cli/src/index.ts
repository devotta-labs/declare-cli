export { defineConfig, ConfigSchema } from './config.ts'
export type { DeclareConfig, DeclareConfigInput } from './config.ts'

export { createDhis2Client } from './client.ts'
export type {
  Dhis2Client,
  Dhis2ClientAuth,
  Dhis2ClientConfig,
  ImportMetadataOptions,
  MaintenanceOptions,
  ImportStrategy,
  ImportIdentifier,
  AtomicMode,
  ImportMode,
} from './client.ts'
export type { ImportReport } from './report.ts'
export {
  ProgramRuleValidationError,
  buildRuleEngine,
  checkProgramRules,
  evaluateRule,
  formatRuleDiagnostics,
} from './rules.ts'
export type { EvaluatedRuleEffect, RuleDiagnostic, RuleEvaluator } from './rules.ts'
