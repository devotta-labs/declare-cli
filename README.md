# dhis2-metadata-as-code

Declare DHIS2 metadata (categories, data elements, org units, programs, …) in TypeScript, validate it with Zod at load time, and push it to a local DHIS2 via the `/api/metadata` endpoint.

This repository is a [Turborepo](https://turborepo.com/) monorepo with these packages:

- [`packages/declare`](./packages/declare) — `@devotta-labs/declare`, the reusable framework (metadata builders, schema, Zod validation).
- [`packages/declare-cli`](./packages/declare-cli) — `@devotta-labs/declare-cli`, a Supabase-style CLI (`declare-cli`) that runs a local DHIS2 in Docker and applies your schema.
- [`examples/malaria-monthly-reporting`](./examples/malaria-monthly-reporting) — aggregate example schema.
- [`examples/tb-tracker`](./examples/tb-tracker) — tracker example schema.

## Requirements

- Node 22+
- pnpm 10+
- Docker (for the local DHIS2 stack)

## Quickstart

```bash
pnpm install

# From an example (or your own project):
cd examples/malaria-monthly-reporting
pnpm start    # boot local DHIS2, wait for readiness, apply schema
```

On first boot the stack pulls ~1 GB of images and runs Flyway migrations — expect several minutes. Subsequent `start` calls are fast.

The stack uses the DHIS2 defaults (`admin` / `district`) on `http://localhost:<local.port>`.

## Project config

Each project declares a `declare.config.ts` at its root:

```ts
import { defineConfig } from '@devotta-labs/declare-cli'

export default defineConfig({
  name: 'malaria-monthly-reporting',
  schema: './src/schema.ts',
  local: {
    port: 8080,
  },
})
```

- `name` is used as the Docker Compose project name, so each project's containers and DB volume are isolated.
- `schema` points at a module whose default export is a `defineSchema(…)` result.
- `local.port` is the host port the local DHIS2 binds to on `127.0.0.1`.

## Commands

Run these from a project directory (any directory with a `declare.config.ts`):

| Command | What it does |
| --- | --- |
| `declare-cli start` | Boot the local DHIS2 stack, wait until ready, apply the schema, run post-import maintenance. |
| `declare-cli stop` | Stop the stack and wipe its DB volume. Code is the single source of truth — the next `start` rebuilds from scratch. |
| `declare-cli reset` | `stop` then `start`. Use after breaking schema changes. |
| `declare-cli status` | Show whether the local stack is running. |
| `declare-cli logs [--web\|--db] [--follow\|-f]` | Tail container logs. |
| `declare-cli check` | Validate the schema locally (no network). |
| `declare-cli plan` | Submit the schema in VALIDATE mode against the local stack. |
| `declare-cli apply` | Submit the schema in COMMIT mode against the local stack. |

The example packages expose the same commands as npm scripts, so `pnpm start` / `pnpm stop` / `pnpm check` / … work from inside an example.

## Running across the whole monorepo

Root-level Turbo scripts run a task across every workspace:

| Script | What it does |
| --- | --- |
| `pnpm check` | `declare-cli check` in every example. |
| `pnpm typecheck` | `tsc --noEmit` in every workspace. |
| `pnpm test` | Run the Vitest suite in every workspace. |

To target a single project, use pnpm filters:

```bash
pnpm --filter malaria-monthly-reporting start
pnpm --filter tb-tracker reset
```

## Writing your own schema

Copy [`examples/malaria-monthly-reporting`](./examples/malaria-monthly-reporting) or [`examples/tb-tracker`](./examples/tb-tracker) as a template. Each schema package:

1. Declares workspace dependencies on `@devotta-labs/declare` (builders) and `@devotta-labs/declare-cli` (CLI).
2. Builds a schema using the `defineX` helpers and `defineSchema({ … })`.
3. Has a `declare.config.ts` pointing the CLI at that schema.

See [`UPSTREAM_BUGS.md`](./UPSTREAM_BUGS.md) for known DHIS2 master bugs worked around by this client.
