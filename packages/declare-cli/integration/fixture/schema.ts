import { defineDataElement, defineSchema } from '@devotta-labs/declare'

const integrationValue = defineDataElement({
  code: 'DECLARE_CLI_INTEGRATION_VALUE',
  name: 'Declare CLI integration value',
  valueType: 'INTEGER',
})

export default defineSchema({
  dataElements: [integrationValue],
})
