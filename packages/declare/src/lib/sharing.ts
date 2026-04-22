import { z } from 'zod'
import { isHandle, refSchema, stableUid } from './core.ts'

// DHIS2 access strings are 8 chars: r/w metadata at 0,1; r/w data at 2,3;
// positions 4-7 unused (always `-`). Examples: "rw------", "r-rw----", "rwrw----".
type R = 'r' | '-'
type W = 'w' | '-'

export type AccessString = `${R}${W}${R}${W}----`

const ACCESS_STRING_RE = /^[r-][w-][r-][w-]----$/

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

export type SharingInput = z.input<typeof SharingSchema>

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

// Wire shape: `public` (not `publicAccess`); users/userGroups keyed by uid.
export type SharingPayload = {
  public?: string
  owner: null
  users: Record<string, { id: string; access: string }>
  userGroups: Record<string, { id: string; access: string }>
}

export function toSharingPayload(sharing: SharingInput | undefined): SharingPayload | undefined {
  if (!sharing) return undefined
  // Idempotent re-parse — callers pass either authoring form or an already-
  // canonicalised value off Handle.input.
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
