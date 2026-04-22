import type { ImportReport } from './report.ts'

export type ImportStrategy = 'CREATE_AND_UPDATE' | 'CREATE' | 'UPDATE' | 'DELETE'
export type ImportIdentifier = 'UID' | 'CODE' | 'AUTO'
export type AtomicMode = 'ALL' | 'NONE'
export type ImportMode = 'COMMIT' | 'VALIDATE'

export type ImportMetadataOptions = {
  importStrategy?: ImportStrategy
  identifier?: ImportIdentifier
  atomicMode?: AtomicMode
  // Default true: master bundle hooks NPE on new objects. Bypassing them still
  // keeps schema/reference/sharing checks intact. See UPSTREAM_BUGS.md.
  skipValidation?: boolean
  importMode?: ImportMode
}

export type MaintenanceOptions = {
  categoryOptionComboUpdate?: boolean
  ouPathsUpdate?: boolean
}

export type Dhis2ClientAuth =
  | { kind: 'token'; token: string }
  | { kind: 'basic'; username: string; password: string }

export type Dhis2ClientConfig = {
  baseUrl: string
  auth: Dhis2ClientAuth
  fetch?: typeof fetch
}

export type Dhis2Client = {
  importMetadata(payload: unknown, options?: ImportMetadataOptions): Promise<ImportReport>
  runMaintenance(options?: MaintenanceOptions): Promise<void>
}

const DEFAULT_IMPORT_OPTIONS: Required<ImportMetadataOptions> = {
  importStrategy: 'CREATE_AND_UPDATE',
  identifier: 'CODE',
  atomicMode: 'ALL',
  skipValidation: true,
  importMode: 'COMMIT',
}

export function createDhis2Client(config: Dhis2ClientConfig): Dhis2Client {
  const fetchImpl = config.fetch ?? fetch
  let parsedBase: URL
  try {
    parsedBase = new URL(config.baseUrl)
  } catch (err) {
    throw new Error(`Invalid DHIS2 base URL: ${config.baseUrl}`, { cause: err })
  }
  const baseUrl = parsedBase.toString().replace(/\/+$/, '')

  const authHeader =
    config.auth.kind === 'token'
      ? `ApiToken ${config.auth.token}`
      : `Basic ${Buffer.from(`${config.auth.username}:${config.auth.password}`).toString('base64')}`

  async function request(
    path: string,
    init: RequestInit,
    params: Record<string, string> = {},
  ): Promise<{ res: Response; text: string }> {
    const url = new URL(path, baseUrl)
    for (const [k, v] of Object.entries(params)) {
      url.searchParams.set(k, v)
    }
    const res = await fetchImpl(url, {
      ...init,
      headers: {
        Authorization: authHeader,
        Accept: 'application/json',
        ...init.headers,
      },
    })
    const text = await res.text()
    return { res, text }
  }

  return {
    async importMetadata(payload, options = {}) {
      const opts = { ...DEFAULT_IMPORT_OPTIONS, ...options }
      const params: Record<string, string> = {
        importStrategy: opts.importStrategy,
        identifier: opts.identifier,
        atomicMode: opts.atomicMode,
        skipValidation: String(opts.skipValidation),
      }
      if (opts.importMode === 'VALIDATE') {
        params.importMode = 'VALIDATE'
      }

      const { res, text } = await request(
        '/api/metadata',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        },
        params,
      )

      let body: unknown
      try {
        body = JSON.parse(text)
      } catch (err) {
        throw new Error(`DHIS2 returned non-JSON (${res.status}):\n${text.slice(0, 500)}`, {
          cause: err,
        })
      }

      if (!res.ok) {
        const obj = body as { message?: string; devMessage?: string }
        const msg =
          obj?.devMessage ?? obj?.message ?? res.statusText ?? `HTTP ${res.status}`
        const detail = text.length < 1000 ? `\n${text}` : `\n${text.slice(0, 1000)}…`
        throw new Error(`DHIS2 ${res.status}: ${msg}${detail}`)
      }

      const envelope = body as { response?: ImportReport } & ImportReport
      return envelope.response ?? envelope
    },

    async runMaintenance(options = {}) {
      const params: Record<string, string> = {}
      if (options.categoryOptionComboUpdate) params.categoryOptionComboUpdate = 'true'
      if (options.ouPathsUpdate) params.ouPathsUpdate = 'true'

      const { res, text } = await request('/api/maintenance', { method: 'POST' }, params)

      if (!res.ok) {
        const detail = text.length < 1000 ? `\n${text}` : `\n${text.slice(0, 1000)}…`
        throw new Error(`DHIS2 maintenance ${res.status}: ${res.statusText}${detail}`)
      }
    },
  }
}
