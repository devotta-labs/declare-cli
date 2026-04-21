import schema from '../metadata/schema.ts'
import { loadEnv } from './env.ts'
import { printReport, type ImportReport } from './report.ts'

async function post(dryRun: boolean): Promise<ImportReport> {
  const env = loadEnv()
  const url = new URL('/api/metadata', env.baseUrl)
  url.searchParams.set('importStrategy', 'CREATE_AND_UPDATE')
  url.searchParams.set('identifier', 'CODE')
  url.searchParams.set('atomicMode', 'ALL')
  if (dryRun) url.searchParams.set('importMode', 'VALIDATE')

  const body = JSON.stringify(schema.serialize())

  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `ApiToken ${env.token}`,
      Accept: 'application/json',
    },
    body,
  })

  const text = await res.text()
  let payload: unknown
  try {
    payload = JSON.parse(text)
  } catch {
    throw new Error(`DHIS2 returned non-JSON (${res.status}):\n${text.slice(0, 500)}`)
  }

  if (!res.ok) {
    const msg = (payload as { message?: string })?.message ?? res.statusText
    throw new Error(`DHIS2 ${res.status}: ${msg}`)
  }

  const envelope = payload as { response?: ImportReport } & ImportReport
  return envelope.response ?? envelope
}

export async function plan(): Promise<void> {
  const report = await post(true)
  printReport(report, 'Plan (dry-run)')
}

export async function apply(): Promise<void> {
  const report = await post(false)
  printReport(report, 'Apply')
}
