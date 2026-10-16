# M4 catalog publication and history rollout

Date: 16 October 2026

## Coolify Production migration

Migration `20261016155331_CatalogPublicationHistory` was applied to Coolify Production after reviewing the target database and the generated SQL. Post-migration checks confirmed two version-1 publication heads and baseline revisions, plus the required table grants for `whiteplate_api`.

A 72 KiB custom-format dump was validated inside the PostgreSQL container before DDL. It was not copied off-host, so it does not count as a durable backup. Coolify still needs a durable backup and restore drill.

The rollout is recorded in [PR #114](https://github.com/whritou/WhitePlate/pull/114). Its latest PR-triggered CI workflow passed the frontend checks and API tests. The API has not been deployed with M4, and the public readiness request was blocked in the browser with `ERR_BLOCKED_BY_CLIENT`.

## Remaining acceptance

- Deploy the API that contains M4.
- Verify migration backfill and publication behavior against PostgreSQL, including concurrent writes and stale version conflicts.
- Verify guest and staff sessions continue to read the correct published menu and existing order snapshots remain unchanged.
- Capture an off-host database backup and complete a restore drill.
- Complete hosted owner/manager publication, discard, restore, and history checks.

The menu version-manager UI refinement adds no schema changes and requires no additional migration. See the [M4 functional scenarios](../functional-test-plan.md#m4-catalog-publication-and-history).
