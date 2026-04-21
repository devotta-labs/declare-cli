import { config as loadDotenv } from 'dotenv'

loadDotenv({ path: ['.env.local', '.env'], quiet: true })

export type Env = {
  baseUrl: string
  token: string
}

export function loadEnv(): Env {
  const baseUrl = process.env.DHIS2_BASE_URL
  const token = process.env.DHIS2_TOKEN
  if (!baseUrl) throw new Error('DHIS2_BASE_URL is not set (check .env.local / .env or environment)')
  if (!token) throw new Error('DHIS2_TOKEN is not set (check .env.local / .env or environment)')
  return { baseUrl: baseUrl.replace(/\/+$/, ''), token }
}
