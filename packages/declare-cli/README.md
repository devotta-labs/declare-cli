# @devotta-labs/declare-cli

Supabase-style CLI for DHIS2 metadata-as-code. Scaffold a project, run a local empty DHIS2 in Docker, and apply your TypeScript-declared metadata schema with a single command.

Pairs with [`@devotta-labs/declare`](https://www.npmjs.com/package/@devotta-labs/declare), the schema framework.

## Requirements

- Node 22+
- pnpm (or npm / yarn)
- Docker

## Scaffold a new project

```bash
mkdir my-program && cd my-program
pnpm dlx @devotta-labs/declare-cli init
pnpm install
pnpm start
```

`init` is an interactive wizard. Non-interactive form:

```bash
pnpm dlx @devotta-labs/declare-cli init \
  --yes --name my-program --template aggregate --port 8080
```

Templates: `blank` (empty schema), `aggregate` (data element + data set + org units), `tracker` (program + program stage + TET/TEAs).

## Commands

Run from any directory inside a project (the CLI walks up to find `declare.config.ts`):

| Command | What it does |
| --- | --- |
| `declare-cli start` | Boot local DHIS2, wait until ready, apply the schema, run post-import maintenance. |
| `declare-cli stop` | Stop the stack and wipe its DB volume. Code is the single source of truth. |
| `declare-cli reset` | `stop` then `start`. |
| `declare-cli status` | Show whether the local stack is running. |
| `declare-cli logs [--web\|--db] [--follow\|-f]` | Tail container logs. |
| `declare-cli check` | Validate the schema locally (no network). |
| `declare-cli plan` | Submit the schema in VALIDATE mode against the local stack. |
| `declare-cli apply` | Submit the schema in COMMIT mode against the local stack. |

## Project config

`declare.config.ts` at the project root:

```ts
import { defineConfig } from '@devotta-labs/declare-cli'

export default defineConfig({
  name: 'my-program',        // Docker project name — isolates containers/volume
  schema: './src/schema.ts', // default export must be a defineSchema(...) result
  local: { port: 8080 },     // host port on 127.0.0.1
})
```

Pick different `local.port` values across projects to run multiple DHIS2 stacks side-by-side.

See the [repository](https://github.com/devotta-labs/declare-cli) for full documentation and example schemas.
