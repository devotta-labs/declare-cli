export function expectNoArgs(command: string, args: readonly string[]): void {
  if (args.length === 0) return
  throw new Error(`Unknown argument for \`${command}\`: ${args[0]}`)
}
