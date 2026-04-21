# dhis2-metadata-as-code

Declare DHIS2 metadata (categories, data elements, org units, …) in TypeScript, validate it with Zod at load time, and push it to a DHIS2 instance via the `/api/metadata` endpoint.

This repository is a [Turborepo](https://turborepo.com/) monorepo with two packages:

- [`packages/declare`](./packages/declare) — `@devotta-labs/declare`, the reusable framework (metadata builders, schema, CLI entry point).
- [`examples/malaria-monthly-reporting`](./examples/malaria-monthly-reporting) — `@devotta-labs/declare-example-malaria`, a concrete example schema (malaria monthly reporting) that consumes the framework.

## Requirements

- Node 22+
- pnpm 10+

## Setup

```bash
pnpm install

# Option A — target an existing DHIS2 instance (play / staging / prod):
cp .env.example .env   # fill in DHIS2_BASE_URL and DHIS2_TOKEN

# Option B — spin up a local empty DHIS2 in Docker (writes .env.local for you):
pnpm dhis2:up
```

`pnpm dhis2:up` boots `dhis2/core-dev:latest` + Postgres via
[`docker/docker-compose.yml`](./docker/docker-compose.yml), waits for DHIS2 to
finish its first-boot migrations, mints a Personal Access Token for the default
`admin` / `district` user, and writes `DHIS2_BASE_URL=http://localhost:8080`
and `DHIS2_TOKEN=<generated>` to `.env.local`. First cold boot takes several
minutes. The CLI walks up from each package to find the root `.env.local` /
`.env`, so the same file works for every workspace.

## Commands

| Script | What it does |
| --- | --- |
| `pnpm check` | Validate every workspace schema locally (no network). |
| `pnpm plan` | Submit every workspace schema to DHIS2 in dry-run mode. |
| `pnpm apply` | Submit every workspace schema to DHIS2 and commit. |
| `pnpm typecheck` | `tsc --noEmit` in every workspace. |
| `pnpm test` | Run the Vitest suite in every workspace. |
| `pnpm dhis2:up` | Start local empty DHIS2 + auto-generate `.env.local`. |
| `pnpm dhis2:down` | Stop the local stack and wipe its DB volume. |
| `pnpm dhis2:logs` | Dump container logs into `logs/web.log` and `logs/db.log`. |

All workspace-aware scripts (`check`, `plan`, `apply`, `typecheck`, `test`)
delegate to Turbo. To target a single package, use pnpm filters:

```bash
pnpm --filter @devotta-labs/declare-example-malaria check
pnpm --filter @devotta-labs/declare-example-malaria apply
```

`pnpm dhis2:logs` accepts container IDs (handy for agents that want to target a
specific running container):

```bash
scripts/pull-logs.sh --web $(docker compose -f docker/docker-compose.yml ps -q web) \
                     --db  $(docker compose -f docker/docker-compose.yml ps -q db)
```

## Writing your own schema

Copy [`examples/malaria-monthly-reporting`](./examples/malaria-monthly-reporting)
as a template. Each schema package:

1. Declares a workspace dependency on `@devotta-labs/declare`.
2. Builds a schema using the `defineX` helpers and `defineSchema({ … })`.
3. Has a tiny `bin.ts` entry point that wires the schema into the CLI:

```ts
// bin.ts
import { runCli } from '@devotta-labs/declare'
import schema from './src/schema.ts'

await runCli(schema)
```

The CLI entrypoint is [`packages/declare/src/cli/index.ts`](./packages/declare/src/cli/index.ts).
The example schema entrypoint is [`examples/malaria-monthly-reporting/src/schema.ts`](./examples/malaria-monthly-reporting/src/schema.ts).

See [`UPSTREAM_BUGS.md`](./UPSTREAM_BUGS.md) for known DHIS2 master bugs worked around by this client.
