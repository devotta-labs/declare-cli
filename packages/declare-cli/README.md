# @devotta-labs/declare-cli

CLI for DHIS2 metadata-as-code. Scaffold a project, run a local empty DHIS2 in Docker, and apply a TypeScript-declared metadata schema.

Pairs with [`@devotta-labs/declare`](https://www.npmjs.com/package/@devotta-labs/declare), the schema framework.

## Requirements

- Node 22+
- Docker

## Scaffold a new project

```bash
mkdir my-program && cd my-program
pnpm dlx @devotta-labs/declare-cli init
pnpm install
pnpm start
```

Non-interactive form:

```bash
pnpm dlx @devotta-labs/declare-cli init \
  --yes --name my-program --template aggregate --port 8080
```

Templates: `blank`, `aggregate` (data element + data set + org units), `tracker` (program + program stage + TET/TEAs).

## Commands

Run from any directory inside a project (the CLI walks up to find `declare.config.ts`):

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

## Project config

```ts
import { defineConfig } from '@devotta-labs/declare-cli'

export default defineConfig({
  name: 'my-program',        // Docker project name — isolates containers/volume
  schema: './src/schema.ts', // default export must be a defineSchema(...) result
  target: '2.43',            // supported: 2.40, 2.41, 2.42, 2.43
  local: { port: 8080 },     // host port on 127.0.0.1
})
```

New projects default to DHIS2 2.43.

Pick different `local.port` values across projects to run multiple DHIS2 stacks side-by-side.

See the [repository](https://github.com/devotta-labs/declare-cli) for examples and more documentation.

## Real DHIS2 integration matrix

The repository exercises the CLI against the pinned stable DHIS2 2.40, 2.41,
2.42, and 2.43 Docker images before Changesets can publish. Each matrix job
starts an isolated empty DHIS2, runs `check`, sends a real `plan` (VALIDATE),
verifies that planning made no changes, applies one representative data
element, and applies it again. The second response must be successful, exactly
one object with the fixture code must remain, and its UID must be unchanged.
When a DHIS2 version exposes populated import counters, the second response
must also report no creates or deletes.

Run one version locally from the repository root (Docker and Node 22+ required):

```bash
pnpm install --frozen-lockfile
pnpm integration:dhis2 -- 2.43
```

The accepted versions are `2.40`, `2.41`, `2.42`, and `2.43`. The runner uses
the exact pinned image documented in
[`packages/declare/snapshots/README.md`](../declare/snapshots/README.md), waits
up to 15 minutes for authenticated API readiness, captures diagnostics under
`packages/declare-cli/integration/artifacts/`, and always removes the Compose
containers and database volume. Use `--port` and `--project` to avoid conflicts
with another local stack:

```bash
pnpm integration:dhis2 -- 2.40 --port 18040 --project declare-integration-local
```
