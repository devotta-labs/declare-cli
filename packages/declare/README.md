# @devotta-labs/declare

Type-safe DHIS2 metadata-as-code framework. Declare categories, data elements, org units, tracker programs, and more in TypeScript; validate them with Zod at load time; serialize to a `/api/metadata` payload.

Usually consumed together with [`@devotta-labs/declare-cli`](https://www.npmjs.com/package/@devotta-labs/declare-cli), which runs a local DHIS2 and applies the schema.

## Install

```bash
pnpm add @devotta-labs/declare
```

## Quick example

```ts
import {
  defineDataElement,
  defineDataSet,
  defineSchema,
} from '@devotta-labs/declare'

const cases = defineDataElement({
  code: 'MAL_CASES',
  name: 'Malaria cases',
  shortName: 'Malaria cases',
  valueType: 'NUMBER',
  aggregationType: 'SUM',
})

const monthlyReport = defineDataSet({
  code: 'DS_MALARIA_MONTHLY',
  name: 'Malaria — monthly reporting',
  shortName: 'Malaria monthly',
  periodType: 'Monthly',
  dataSetElements: [{ dataElement: cases }],
  organisationUnits: [],
})

export default defineSchema({
  dataElements: [cases],
  dataSets: [monthlyReport],
})
```

See the [repository](https://github.com/devotta-labs/declare-cli) for examples and more documentation.
