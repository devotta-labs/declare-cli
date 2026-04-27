import type { Target } from '../generated/runtime.ts'

// Filled by generated declare-env.d.ts files; empty means "all supported targets".
export interface ConfiguredTargets {}

type Configured = keyof ConfiguredTargets & Target
export type CurrentTarget = [Configured] extends [never] ? Target : Configured
