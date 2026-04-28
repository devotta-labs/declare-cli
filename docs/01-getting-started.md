# Getting Started

declare-cli lets you define DHIS2 metadata in TypeScript, validate it with Zod at load time, and push it to a local DHIS2 instance running in Docker.

## Requirements

- Node 22+
- pnpm 10+
- Docker

## Quickstart

Scaffold a new project with the interactive init command:

```bash
npx @devotta-labs/declare-cli init
```

You'll be prompted for a project name, starter template (blank, aggregate, or tracker), local DHIS2 port, and target DHIS2 version. Once scaffolded:

```bash
cd <project-name>
pnpm install
pnpm start        # boots local DHIS2, waits for readiness, applies your schema
```

## Building Blocks

DHIS2 metadata falls into three program types. Each requires a different set of metadata objects.

**Aggregate** — periodic data collection forms (e.g. monthly facility reports). Typical objects: option sets, category options, categories, category combos, data elements, data sets, organisation units, user roles, and user groups.

**Tracker** (`WITH_REGISTRATION`) — longitudinal case tracking where individuals are enrolled and followed over time. Typical objects: tracked entity types, tracked entity attributes, program stages with data elements, the program itself (with enrollment attributes), organisation units, user roles, and user groups.

**Event** (`WITHOUT_REGISTRATION`) — one-off anonymous data capture events with no enrollment or tracked entity. Typical objects: program stages with data elements, the program itself, organisation units, user roles, and user groups.

Tracker and event programs can use **program rules** to add dynamic form behavior such as hiding fields, showing warnings, or assigning calculated values. See [04-program-rules.md](./04-program-rules.md).

## Project Structure

Every project has two key files:

**`declare.config.ts`** — tells the CLI where to find your schema and how to run the local stack:

```ts
import { defineConfig } from '@devotta-labs/declare-cli'

export default defineConfig({
  name: 'my-project',
  schema: './src/schema.ts',
  target: '2.42',
  local: {
    port: 8080,
  },
})
```

**`src/schema.ts`** — assembles all metadata and exports it via `defineSchema`:

```ts
import { defineSchema } from '@devotta-labs/declare'

export default defineSchema({
  categoryOptions,
  categories,
  categoryCombos,
  optionSets,
  dataElements,
  dataSets,
  organisationUnits,
  userRoles,
  userGroups,
  users,
})
```

## CLI Commands

Run from any directory with a `declare.config.ts`:

| Command | Description |
| --- | --- |
| `declare-cli start` | Boot local DHIS2, wait until ready, apply the schema. |
| `declare-cli stop` | Stop the stack and wipe its DB volume. |
| `declare-cli reset` | Stop then start. |
| `declare-cli status` | Show whether the local stack is running. |
| `declare-cli logs` | Tail container logs (`--web`, `--db`, `--follow`). |
| `declare-cli check` | Validate the schema locally (no network). |
| `declare-cli plan` | Submit the schema in VALIDATE mode against the local stack. |
| `declare-cli apply` | Submit the schema in COMMIT mode against the local stack. |

Projects expose these as npm scripts too, so `pnpm start`, `pnpm check`, etc. work from inside a project directory.

## Examples

The repo ships two complete examples you can use as reference:

- [`examples/malaria-monthly-reporting`](../examples/malaria-monthly-reporting) — aggregate data set with categories and disaggregation.
- [`examples/tb-tracker`](../examples/tb-tracker) — tracker program with tracked entity types, attributes, and program stages.
