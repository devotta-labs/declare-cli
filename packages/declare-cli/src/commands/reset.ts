import type { LoadedConfig } from '../config-loader.ts'
import { start } from './start.ts'
import { stop } from './stop.ts'

export async function reset(loaded: LoadedConfig, args: readonly string[]): Promise<void> {
  await stop(loaded, args)
  await start(loaded, args)
}
