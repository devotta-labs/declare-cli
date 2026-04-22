# Agent guide

This project declares DHIS2 metadata in TypeScript with `@devotta-labs/declare` and uses `@devotta-labs/declare-cli` to validate and apply it against a local DHIS2.

## Library source

Both libraries ship their TypeScript sources with the published package — read them directly when you need ground truth on what's exported and how validation is wired:

- `node_modules/@devotta-labs/declare/src` — schema framework (`defineSchema`, `defineDataElement`, `defineProgram`, value types, Zod schemas).
- `node_modules/@devotta-labs/declare-cli/src` — CLI commands and `defineConfig` (`commands/check.ts`, `commands/plan.ts`, `commands/apply.ts`, `commands/start.ts`, `commands/typegen.ts`, …).

The generated `declare-env.d.ts` at the project root holds the target-versioned DHIS2 enums and ID types the builders consume; it is rewritten every time `declare-cli check` runs.

## Validate before handing work back

After changing the schema or `declare.config.ts`, always run:

```
pnpm check
```

That invokes `declare-cli check` locally — no network, no Docker. It loads `declare.config.ts`, regenerates `declare-env.d.ts` for the declared `target`, and validates the schema with Zod. Treat a clean `pnpm check` as the gate for "done".

`pnpm plan` and `pnpm apply` then talk to the local DHIS2 stack started with `pnpm start`.
