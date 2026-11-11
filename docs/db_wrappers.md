# Database wrappers (`server/db/wrappers`)

Small functions over Drizzle that `genericService` (and a few core services) use. Each takes the database, a table and
a filter, and returns rows typed by the table.

## Filter (`filter.ts`)

One dialect for all wrappers, `{ column: value }`, every entry must hold:

| Value | Means |
|---|---|
| `'x'` | `column = 'x'` |
| `null` | `column IS NULL` |
| `['a', 'b']` | `column IN ('a', 'b')`; an empty list matches nothing |
| `{ notIn: ['a'] }` | every other value, empty (`NULL`) included |
| `undefined` | left out |

A key that isn't a column of the table is an error (400 `db.filter.unknown_column`), never ignored: a typo
(`owner` instead of `owner_id`) must not widen a result.

## Functions

| Function | Does |
|---|---|
| `dbFindAll(db, table, filter, { cols? })` | all matching rows, optionally only some columns; no limit |
| `dbFindOne(db, table, filter)` | the matching row or `null`; throws if more than one matches |
| `dbCount`, `dbExists` | how many rows match, whether any does |
| `dbSearch(db, table, filter, options)` | lists that page: sort, `limit` (default 100), keyset `cursor`, `cols` |
| `dbCreate(db, table, item)` | inserts with a new id, validated |
| `dbFindOneAndUpdate(db, table, filter, updates)` | updates the one matching row (validated) and returns it; one statement when the filter has the id |
| `dbFindOneAndDelete(db, table, filter)` | deletes the one matching row and returns it; one statement when the filter has the id |
| `dbDeleteMany(db, table, ids, filter)` | deletes the rows with these ids that also match the filter (e.g. the owner) |
| `dbJsonFindAllAndDelete(db, table, filter)` | removes values from JSON array columns (roles of accounts) |

For anything else (joins, sums, ranges, JSON functions) use Drizzle directly in the service that owns the table.

## Validation

Writes (insert, update) are checked against the table's zod schema (`server/db/validator`, the app's tables in its
`server/db/validator/validator_app.ts`). Reads are not checked again: what was written was valid, and checking every
row of a list costs time and made one bad old row fail the whole list. `DB_VALIDATE_READS=true` checks reads too
(development). Failed checks are logged with field names and error codes only, never the values.

## Errors

`genericService` passes on errors that already say what went wrong (validation, filter: 4xx with their message) and
turns only unexpected ones into `500 <table>.<operation>_failed`.
