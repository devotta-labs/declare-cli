# Program Rules

Program rules add dynamic behavior to data entry forms — hiding fields, showing warnings, assigning calculated values, and more. Rules are defined in TypeScript alongside the rest of your metadata and are validated locally during `declare-cli check`.

## Variables

Before writing rules you need variables that reference the data being collected. Each variable maps a data element or tracked entity attribute to a name you can use in rule expressions.

```ts
import { defineProgramRuleVariable } from '@devotta-labs/declare'

const ageVariable = defineProgramRuleVariable({
  code: 'PRV_AGE',
  name: 'age',
  program,
  programRuleVariableSourceType: 'DATAELEMENT_CURRENT_EVENT',
  dataElement: age,
})
```

### Source Types

| Source type | Reads from | Use case |
| --- | --- | --- |
| `DATAELEMENT_CURRENT_EVENT` | Current event's data element | Most common — reacts to the value being entered right now |
| `DATAELEMENT_NEWEST_EVENT_PROGRAM` | Most recent event across the program | Cross-event lookups |
| `DATAELEMENT_NEWEST_EVENT_PROGRAM_STAGE` | Most recent event in a specific stage (requires `programStage`) | Stage-specific lookups |
| `DATAELEMENT_PREVIOUS_EVENT` | Previous event | Comparing with prior visit |
| `TEI_ATTRIBUTE` | Tracked entity attribute (requires `trackedEntityAttribute`) | Rules based on enrollment data |
| `CALCULATED_VALUE` | No source field — value is assigned by another rule | Intermediate computed values (requires explicit `valueType`) |

## Rules

A rule combines a condition expression with one or more actions:

```ts
import { defineProgramRule, action } from '@devotta-labs/declare'

const minorWarning = defineProgramRule({
  code: 'PR_MINOR_WARNING',
  name: 'Minor warning',
  program,
  condition: '#{age} < 18',
  actions: [action.showWarning({ on: age, content: 'Patient is under 18' })],
})
```

Conditions use DHIS2's expression syntax. Reference variables with `#{variableName}`.

## Actions

The `action` namespace provides type-safe factories for every supported action type:

| Factory | Description |
| --- | --- |
| `action.hideField({ on })` | Hide a data element or TEA |
| `action.hideSection({ section })` | Hide a form section by ID |
| `action.hideProgramStage({ programStage })` | Hide an entire program stage |
| `action.assign({ target, value })` | Assign a computed value to a field or variable |
| `action.showWarning({ on, content })` | Show a non-blocking warning on a field |
| `action.warningOnComplete({ on, content })` | Show a warning when completing the event |
| `action.showError({ on, content })` | Show a blocking error on a field |
| `action.errorOnComplete({ on, content })` | Show an error when completing the event |
| `action.setMandatoryField({ on })` | Make a field mandatory |
| `action.displayText({ content, value })` | Display text in the form |
| `action.displayKeyValuePair({ content, value })` | Display a key/value pair |
| `action.createEvent({ programStage })` | Create a new event in a stage |
| `action.scheduleEvent({ programStage })` | Schedule an event (DHIS2 2.42+) |
| `action.sendMessage({ templateUid })` | Trigger a message notification |
| `action.scheduleMessage({ templateUid })` | Schedule a message notification |
| `action.hideOption({ on, option })` | Hide a specific option in a dropdown |
| `action.showOptionGroup({ on, optionGroup })` | Show an option group |
| `action.hideOptionGroup({ on, optionGroup })` | Hide an option group |

All action factories accept optional `evaluationTime` (`'ON_DATA_ENTRY'`, `'ON_COMPLETE'`, `'ALWAYS'`) and `priority` parameters.

## Testing Rules

declare-cli includes a built-in rule engine bridge that evaluates your rules locally. Define tests with `defineRuleTest` and describe expected outcomes with the `effect` namespace:

```ts
import { defineRuleTest, effect } from '@devotta-labs/declare'

const minorWarningTest = defineRuleTest({
  rule: minorWarning,
  given: { event: [[age, 17]], programStage: stage },
  expect: [effect.showWarning({ on: age, content: 'Patient is under 18' })],
})
```

### The `given` Object

| Field | Type | Description |
| --- | --- | --- |
| `event` | `[DataElement, value][]` | Data element values for the current event |
| `attributes` | `[TrackedEntityAttribute, value][]` | TEA values for the enrolled entity |
| `programStage` | `ProgramStage` | The stage being evaluated |
| `eventDate` | `string` | Event execution date |
| `enrollmentDate` | `string` | Enrollment date |

### The `effect` Namespace

The `effect` namespace mirrors the `action` namespace but describes expected outcomes:

```ts
effect.showWarning({ on: age, content: 'Patient is under 18' })
effect.hideField({ on: reviewField })
effect.assign({ target: calculatedVar, data: '10' })
```

### Running Tests

Rule tests execute automatically during `declare-cli check`. The engine also validates that all variable references in conditions are defined and suggests corrections for typos.

## Wiring into the Schema

Include variables, rules, and tests in `defineSchema`:

```ts
export default defineSchema({
  // ... other metadata
  programRuleVariables: [ageVariable],
  programRules: [minorWarning],
  ruleTests: [minorWarningTest],
})
```
