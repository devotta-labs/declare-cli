# declare-cli

> **⚠️ Experimental.** This project is an early prototype and may not receive regular updates. Expect breaking changes and gaps in coverage.

Declare DHIS2 metadata (categories, data elements, org units, programs, …) in TypeScript, validate it with Zod at load time, and push it to a local DHIS2.

Packages:

- [`packages/declare`](./packages/declare) — `@devotta-labs/declare`, the schema framework.
- [`packages/declare-cli`](./packages/declare-cli) — `@devotta-labs/declare-cli`, the CLI that runs a local DHIS2 in Docker and applies your schema.
- [`examples/malaria-monthly-reporting`](./examples/malaria-monthly-reporting) — aggregate example.
- [`examples/tb-tracker`](./examples/tb-tracker) — tracker example.

## Requirements

- Node 22+
- pnpm 10+
- Docker

## Quickstart

```bash
pnpm install
cd examples/malaria-monthly-reporting
pnpm start    # boot local DHIS2, wait for readiness, apply schema
```

First boot pulls ~1 GB of images and runs Flyway migrations — expect several minutes. Subsequent `start` calls are fast. The stack uses `admin` / `district` on `http://localhost:<local.port>`.

## Project config

Each project has a `declare.config.ts`:

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

- `name` — Docker Compose project name; isolates each project's containers and DB volume.
- `schema` — module whose default export is a `defineSchema(…)` result.
- `local.port` — host port the local DHIS2 binds to on `127.0.0.1`.

## Commands

Run from any directory with a `declare.config.ts`:

| Command | What it does |
| --- | --- |
| `declare-cli start` | Boot local DHIS2, wait until ready, apply the schema, run post-import maintenance. |
| `declare-cli stop` | Stop the stack and wipe its DB volume. |
| `declare-cli reset` | `stop` then `start`. |
| `declare-cli status` | Show whether the local stack is running. |
| `declare-cli logs [--web\|--db] [--follow\|-f]` | Tail container logs. |
| `declare-cli check` | Validate the schema locally (no network). |
| `declare-cli plan` | Submit the schema in VALIDATE mode against the local stack. |
| `declare-cli apply` | Submit the schema in COMMIT mode against the local stack. |

Examples expose the same commands as npm scripts, so `pnpm start` / `pnpm stop` / `pnpm check` work from inside them.

## Writing your own schema

Copy one of the examples or run `declare-cli init` to scaffold a project. Each schema package:

1. Depends on `@devotta-labs/declare` and `@devotta-labs/declare-cli`.
2. Builds a schema with the `defineX` helpers and `defineSchema({ … })`.
3. Has a `declare.config.ts` pointing the CLI at the schema.

See [`UPSTREAM_BUGS.md`](./UPSTREAM_BUGS.md) for known DHIS2 master bugs worked around by this client.
