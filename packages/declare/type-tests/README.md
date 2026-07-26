# DHIS2 target type contracts

These compile-only tests are semantic contracts, not snapshots of generated
TypeScript. Expectations come first from the committed raw
`snapshots/schemas-<target>.json` responses captured from the pinned stable
DHIS2 Docker images documented in `snapshots/README.md`.

| Boundary | Contract and rationale |
| --- | --- |
| 2.40 → 2.41 | `Program.enrollmentLabel` and `ProgramStage.eventLabel` become persisted, owned, writable `TEXT` properties in the raw 2.41 schema. |
| 2.41 → 2.42 | `DataSet.displayOptions` becomes a persisted, owned, writable `TEXT` property; `SCHEDULEEVENT` enters `ProgramRuleActionType`; and `TRACKER_ASSOCIATE` leaves `ValueType`. |
| 2.41 → 2.42 | `TrackedEntityAttribute.blockedSearchOperators` becomes a persisted, owned, writable collection whose item class is `org.hisp.dhis.common.QueryOperator`. DHIS2's official 2.42 and 2.43 Tracker API documentation further states that blocked operators are configured per attribute and identifies `sw`, `ew`, and `like` as blockable. |
| 2.42 → 2.43 | The raw 2.43 snapshot retains the tested 2.42 contracts, so the 2.43 suite asserts both the positive surface and the removed/invalid cases rather than inventing a version difference. |

Official Tracker API references:

- <https://docs.dhis2.org/en/develop/using-the-api/dhis-core-version-242/tracker.html>
- <https://docs.dhis2.org/en/develop/using-the-api/dhis-core-version-243/tracker.html>
