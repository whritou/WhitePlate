# M3 catalog translation workflow rollout

**Applied:** 17 October 2026
**Target:** Coolify Production, resource `whiteplate-postgresql-main`, PostgreSQL database `whiteplate`
**Migration:** `20261016222355_M3CatalogTranslationWorkflow`
**Implementation PR:** [#116](https://github.com/whritou/WhitePlate/pull/116), merged as `36da90c`

## Preflight and backup

Before applying the migration, preflight confirmed the database was `whiteplate`, the latest applied migration was `20261016155331_CatalogPublicationHistory`, there were two tenants and two publication heads, and neither M3 table existed. The `whiteplate_api` role existed.

A custom-format dump was created inside the PostgreSQL container at `/tmp/whiteplate-before-m3-translation-20261017.dump` (81,505 bytes). `pg_restore --list` read the dump successfully and produced an 11,841-byte table-of-contents file. This is a temporary container-local backup only; it was not copied off-host and no restore was tested.

## Application and verification

The reviewed additive migration DDL and EF history row were applied in one PostgreSQL transaction through the Coolify terminal. The history row records product version `10.0.12`. The migration creates `CatalogTranslationReviews`, `CatalogTranslationGlossaryTerms`, and their keys/indexes; it contains no legacy translation update or backfill.

Post-checks confirmed:

- The M3 migration row is present in `__EFMigrationsHistory`.
- Both M3 tables are present and contain zero rows.
- `whiteplate_api` has `SELECT`, `INSERT`, `UPDATE`, and `DELETE` on both tables.
- The database still contains two tenants and two catalog publication heads.

The API was not deployed or restarted. Existing saved translations were not changed. API deployment, PostgreSQL concurrency checks through the application, and hosted manager/guest acceptance remain open.

## Source verification

For PR #116, the direct API test runner reported 291 passed and 0 failed; `dotnet test` built the solution but reported zero discovered tests with the current Microsoft.Testing.Platform integration. The frontend suite reported 589 passed. All six GitHub checks passed before merge. These checks do not replace hosted acceptance.
