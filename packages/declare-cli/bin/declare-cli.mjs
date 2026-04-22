#!/usr/bin/env node
import { createJiti } from 'jiti'

const jiti = createJiti(import.meta.url, { interopDefault: true })
await jiti.import('../src/bin.ts')
