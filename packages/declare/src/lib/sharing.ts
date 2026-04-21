import { z } from 'zod'
import { isHandle, refSchema, stableUid } from './core.ts'

// DHIS2 access strings are 8 chars: r/w metadata at positions 0,1 and r/w
// data at positions 2,3; positions 4-7 are unused. See
// org.hisp.dhis.security.acl.AccessStringHelper.
//
// Examples:
//   "--------"  AccessStringHelper.DEFAULT  (no access)
//   "rw------"  read + write metadata
//   "r-rw----"  metadata read + data read/write
//   "rwrw----"  full metadata + data read/write
//   "--rw----"  data read/write only
type R = 'r' | '-'
type W = 'w' | '-'

// Template-literal type — TS rejects typos like 'rwrs----' or 'rwrw---' at
// authoring time, before the zod regex runs.
export type AccessString = `${R}${W}${R}${W}----`

const ACCESS_STRING_RE = /^[r-][w-][r-][w-]----$/

// Structured form. Each axis can be read-only, read-write, or absent (no
// access). Serializes to the 8-char wire string via `toAccessString`.
export type AccessLevel = 'r' | 'rw'
export type AccessDescriptor = {
  metadata?: AccessLevel | undefined
  data?: AccessLevel | undefined
}

export type AccessInput = AccessString | AccessDescriptor

function levelChars(level: AccessLevel | undefined): string {
  if (level === 'rw') return 'rw'
  if (level === 'r') return 'r-'
  return '--'
}

export function toAccessString(access: AccessInput): AccessString {
  if (typeof access === 'string') return access
  return `${levelChars(access.metadata)}${levelChars(access.data)}----` as AccessString
}

// Named presets for the combinations that actually come up. Everything else —
// e.g. `{ metadata: 'rw', data: 'r' }` — is clearer spelled out inline.
export const Access = {
  none: {} satisfies AccessDescriptor,
  metadataRead: { metadata: 'r' } satisfies AccessDescriptor,
  metadataReadWrite: { metadata: 'rw' } satisfies AccessDescriptor,
  dataRead: { data: 'r' } satisfies AccessDescriptor,
  dataReadWrite: { data: 'rw' } satisfies AccessDescriptor,
  readOnly: { metadata: 'r', data: 'r' } satisfies AccessDescriptor,
  readWrite: { metadata: 'rw', data: 'rw' } satisfies AccessDescriptor,
} as const

const AccessLevelSchema = z.enum(['r', 'rw'])

const AccessDescriptorSchema = z
  .object({
    metadata: AccessLevelSchema.optional(),
    data: AccessLevelSchema.optional(),
  })
  .strict()

const AccessStringSchema = z
  .string()
  .regex(
    ACCESS_STRING_RE,
    'access string must be 8 chars of r/w/- with positions 4-7 all "-"',
  )

// Accept either the raw 8-char form or the structured descriptor, canonicalise
// to the wire string so everything downstream handles a single shape.
export const AccessSchema = z
  .union([AccessStringSchema, AccessDescriptorSchema])
  .transform((v): AccessString =>
    typeof v === 'string' ? (v as AccessString) : toAccessString(v),
  )

export const SharingSchema = z.object({
  publicAccess: AccessSchema.optional(),
  users: z
    .array(
      z.object({
        user: refSchema('User'),
        access: AccessSchema,
      }),
    )
    .optional(),
  userGroups: z
    .array(
      z.object({
        group: refSchema('UserGroup'),
        access: AccessSchema,
      }),
    )
    .optional(),
})

// The authoring shape — what users pass into `defineXxx({ sharing })`. Each
// access field can be the raw string or the structured descriptor.
export type SharingInput = z.input<typeof SharingSchema>

// Ergonomic wrappers. `Sharing.private()` makes the "no public access, only
// these groups" pattern one line instead of three.
type SharingTargets = {
  users?: SharingInput['users']
  userGroups?: SharingInput['userGroups']
}

export const Sharing = {
  public(access: AccessInput, extras: SharingTargets = {}): SharingInput {
    return { publicAccess: access, ...extras }
  },
  private(targets: SharingTargets = {}): SharingInput {
    return { publicAccess: Access.none, ...targets }
  },
} as const

// DHIS2's Sharing JSON shape (`public` key, not `publicAccess`, and maps
// keyed by uid — see org.hisp.dhis.user.sharing.Sharing).
export type SharingPayload = {
  public?: string
  owner: null
  users: Record<string, { id: string; access: string }>
  userGroups: Record<string, { id: string; access: string }>
}

export function toSharingPayload(sharing: SharingInput | undefined): SharingPayload | undefined {
  if (!sharing) return undefined
  // Re-parse: callers may pass either the authoring form (raw string or
  // descriptor) or the already-canonicalised form off a parsed Handle.input.
  // The union+transform is idempotent on strings, so this is safe and lets
  // us have a single normalisation site.
  const parsed = SharingSchema.parse(sharing)

  const users: SharingPayload['users'] = {}
  for (const entry of parsed.users ?? []) {
    if (!isHandle(entry.user)) continue
    const id = stableUid(`${entry.user.kind}:${entry.user.code}`)
    users[id] = { id, access: entry.access }
  }
  const userGroups: SharingPayload['userGroups'] = {}
  for (const entry of parsed.userGroups ?? []) {
    if (!isHandle(entry.group)) continue
    const id = stableUid(`${entry.group.kind}:${entry.group.code}`)
    userGroups[id] = { id, access: entry.access }
  }
  return {
    ...(parsed.publicAccess ? { public: parsed.publicAccess } : {}),
    owner: null,
    users,
    userGroups,
  }
}
