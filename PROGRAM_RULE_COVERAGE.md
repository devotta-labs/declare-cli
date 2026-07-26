# Program-rule coverage

This report records the focused Vitest coverage work for the program-rules
workflow. Generated sources are excluded from coverage because they are derived
artifacts rather than maintained behavior.

## Environment and commands

- Source revision: `b9588db3625ddfa542ea17deceddaad3e35429ca`
- Platform: Darwin 25.5.0 arm64
- Node.js: 24.13.1
- pnpm: 10.0.0
- Vitest and V8 provider: 4.1.4
- Existing suite before test changes: `pnpm test` (10 files, 46 tests passed)
- Coverage: `pnpm test:coverage`
- Included production sources: `packages/declare/src/**/*.ts` and
  `packages/declare-cli/src/**/*.ts`
- Exclusions: test files, generated declare sources, and CLI declaration-only
  types

## Results

| Scope | Run | Statements | Branches | Functions | Lines |
| --- | --- | ---: | ---: | ---: | ---: |
| Included sources | Baseline | 47.60% (526/1105) | 31.85% (201/631) | 54.78% (143/261) | 48.54% (485/999) |
| `packages/declare/src/lib/programRule.ts` | Baseline | 62.16% (69/111) | 29.41% (15/51) | 46.77% (29/62) | 61.90% (65/105) |
| `packages/declare-cli/src/rules.ts` | Baseline | 78.41% (178/227) | 54.42% (80/147) | 91.93% (57/62) | 85.79% (157/183) |
| Included sources | Final | 54.93% (607/1105) | 43.58% (275/631) | 68.96% (180/261) | 54.95% (549/999) |
| `packages/declare/src/lib/programRule.ts` | Final | 99.09% (110/111) | 78.43% (40/51) | 100.00% (62/62) | 99.04% (104/105) |
| `packages/declare-cli/src/rules.ts` | Final | 96.03% (218/227) | 87.75% (129/147) | 98.38% (61/62) | 99.45% (182/183) |
| Included sources | Delta | +7.33 pp (+81) | +11.73 pp (+74) | +14.18 pp (+37) | +6.41 pp (+64) |
| `packages/declare/src/lib/programRule.ts` | Delta | +36.93 pp (+41) | +49.02 pp (+25) | +53.23 pp (+33) | +37.14 pp (+39) |
| `packages/declare-cli/src/rules.ts` | Delta | +17.62 pp (+40) | +33.33 pp (+49) | +6.45 pp (+4) | +13.66 pp (+25) |

The final run passed 10 files and 88 tests. The delta comes entirely from
tests: no production code or testability seam was added.

## Covered behavior

- All public program-rule action and expected-effect factories, including data
  element and tracked-entity-attribute targets, stage and section targets,
  options, option groups, messages, priorities, and evaluation-time metadata.
- Variable source variants and inferred value types, plus invalid names and
  missing source-specific fields.
- Target gating for `SCHEDULEEVENT` and collision-resistant generated action
  codes.
- Real DHIS2 rule-engine evaluation across event and enrollment values, null
  input omission, full date and organisation-unit context, and supported action
  effects.
- Duplicate and unknown variables, suggestions, constants, malformed
  expressions, invalid action references, missing rules, and failed declared
  rule tests.

## Remaining focused gaps

- The schema-validated variable transform has one defensive fallthrough line
  that cannot be reached through a valid public input.
- The CLI bridge has one defensive guard for an effect with an unknown rule ID;
  the real engine cannot produce that state without replacing or mocking the
  dependency.
- `@dhis2/rule-engine` does not emit `DISPLAYKEYVALUEPAIR` or
  `SETMANDATORYFIELD` effects from event evaluation in the exercised version.
  Their declaration and translation contracts are covered, but end-to-end
  emitted effects are not.
- Completion-specific lifecycle semantics for `ON_COMPLETE` actions require an
  engine input other than the active event used by the current bridge. The
  metadata value is covered, but that lifecycle behavior remains out of scope.
