import type { Target } from '../generated/runtime.ts'

// Module-augmentation slot. Users thread their configured target in via a
// generated `declare-env.d.ts` (written by `declare-cli typegen`) that merges
// a literal key into this interface. Empty by default → CurrentTarget falls
// back to the full `Target` union, so in-repo tests and non-CLI consumers
// aren't narrowed.
export interface ConfiguredTargets {}

type Configured = keyof ConfiguredTargets & Target
export type CurrentTarget = [Configured] extends [never] ? Target : Configured
