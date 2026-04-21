# dhis2-metadata-as-code

Declare DHIS2 metadata (categories, data elements, org units, …) in TypeScript, validate it with Zod at load time, and push it to a DHIS2 instance via the `/api/metadata` endpoint.

## Requirements

- Node 22+
- pnpm 10+

## Setup

```bash
pnpm install
cp .env.example .env   # fill in DHIS2_BASE_URL and DHIS2_TOKEN before plan/apply
```

## Commands

| Script | What it does |
| --- | --- |
| `pnpm check` | Validate the schema locally (no network). |
| `pnpm plan` | Submit the schema to DHIS2 in dry-run mode. |
| `pnpm apply` | Submit the schema to DHIS2 and commit. |
| `pnpm typecheck` | `tsc --noEmit`. |
| `pnpm test` | Run the Vitest suite. |

The schema entrypoint is [`src/metadata/schema.ts`](./src/metadata/schema.ts); the CLI entrypoint is [`src/cli/index.ts`](./src/cli/index.ts).

See [`UPSTREAM_BUGS.md`](./UPSTREAM_BUGS.md) for known DHIS2 master bugs worked around by this client.
