# DHIS2 `/api/schemas.json` snapshots

Committed snapshots used as the input to `pnpm --filter @devotta-labs/declare gen:schemas`.

One file per supported DHIS2 stable target: `schemas-<target>.json`. The generator
reads these at build time; no network access is needed to regenerate
`packages/declare/src/generated/`.

## Refreshing

Run the pinned stable Docker image listed below in a throwaway stack, wait for
DHIS2 to become ready, then capture its schema response:

```bash
curl --fail --user admin:district \
  http://localhost:8080/api/schemas.json \
  --output packages/declare/snapshots/schemas-2.43.json
```

Tear down the stack and its database volume after capturing the snapshot.

Re-run `pnpm --filter @devotta-labs/declare gen:schemas` after any snapshot
refresh to keep the generated code in sync.

## Target matrix (stable only)

| Target | Docker image          |
| ------ | --------------------- |
| 2.40   | `dhis2/core:2.40.11`  |
| 2.41   | `dhis2/core:2.41.8`   |
| 2.42   | `dhis2/core:2.42.4`   |
| 2.43   | `dhis2/core:2.43.0.1` |
