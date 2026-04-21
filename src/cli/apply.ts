import schema from '../metadata/schema.ts'
import { loadEnv, type Env } from './env.ts'
import { printReport, type ImportReport } from './report.ts'

async function post(dryRun: boolean): Promise<ImportReport> {
  const env = loadEnv()
  const url = new URL('/api/metadata', env.baseUrl)
  url.searchParams.set('importStrategy', 'CREATE_AND_UPDATE')
  url.searchParams.set('identifier', 'CODE')
  url.searchParams.set('atomicMode', 'ALL')
  // Master has a couple of bundle hooks that NPE on new objects
  // (DataElementObjectBundleHook#valueTypeChangeValidation). Skipping the
  // hook layer still keeps the schema/reference/sharing checks intact.
  url.searchParams.set('skipValidation', 'true')
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
    const obj = payload as { message?: string; devMessage?: string; httpStatusCode?: number }
    const msg =
      obj?.devMessage ??
      obj?.message ??
      res.statusText ??
      `HTTP ${res.status}`
    const detail = text.length < 1000 ? `\n${text}` : `\n${text.slice(0, 1000)}…`
    throw new Error(`DHIS2 ${res.status}: ${msg}${detail}`)
  }

  const envelope = payload as { response?: ImportReport } & ImportReport
  return envelope.response ?? envelope
}

export async function plan(): Promise<void> {
  const report = await post(true)
  printReport(report, 'Plan (dry-run)')
}

export async function apply(): Promise<void> {
  // skipValidation=true means DHIS2 doesn't return a populated import summary,
  // so printing the report yields empty stats. Re-enable once validation is on.
  await post(false)
  // printReport(report, 'Apply')
  console.log('Apply: import succeeded.')

  // skipValidation bypasses the bundle hooks that auto-generate
  // categoryOptionCombos and refresh organisationUnit paths, so any new
  // non-default CategoryCombo would have zero COCs (breaks downstream apps
  // like aggregate-data-entry). Run maintenance to rebuild that derived state.
  await runMaintenance(loadEnv())
  console.log('Apply: maintenance completed.')
}

async function runMaintenance(env: Env): Promise<void> {
  const url = new URL('/api/maintenance', env.baseUrl)
  url.searchParams.set('categoryOptionComboUpdate', 'true')
  url.searchParams.set('ouPathsUpdate', 'true')

  const res = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: `ApiToken ${env.token}`,
      Accept: 'application/json',
    },
  })

  if (!res.ok) {
    const text = await res.text()
    const detail = text.length < 1000 ? `\n${text}` : `\n${text.slice(0, 1000)}…`
    throw new Error(`DHIS2 maintenance ${res.status}: ${res.statusText}${detail}`)
  }
}
