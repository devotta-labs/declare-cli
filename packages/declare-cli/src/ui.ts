import pc from 'picocolors'

export const ui = {
  info: (msg: string) => console.log(`${pc.cyan('▸')} ${msg}`),
  success: (msg: string) => console.log(`${pc.green('✓')} ${msg}`),
  warn: (msg: string) => console.warn(`${pc.yellow('!')} ${msg}`),
  error: (msg: string) => console.error(`${pc.red('✗')} ${msg}`),
  dim: (msg: string) => console.log(pc.dim(msg)),
  step: (msg: string) => console.log(`${pc.magenta('◆')} ${pc.bold(msg)}`),
  raw: (msg: string) => console.log(msg),
}

export { pc }
