import type { LoadedConfig } from '../config-loader.ts'
import { expectNoArgs } from './args.ts'
import { start } from './start.ts'
import { stop } from './stop.ts'

export async function reset(loaded: LoadedConfig, args: readonly string[]): Promise<void> {
  expectNoArgs('reset', args)
  await stop(loaded, [])
  await start(loaded, [])
}
