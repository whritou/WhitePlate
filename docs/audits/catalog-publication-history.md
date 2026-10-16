# M4 catalog publication and history rollout

**Applied:** 16 October 2026  
**Target:** Coolify Production, project `whiteplate`, PostgreSQL database `whiteplate`  
**Migration:** `20261016155331_CatalogPublicationHistory`

## Application

The migration DDL and baseline backfill from the checked-in migration were applied in one PostgreSQL transaction through the Coolify database terminal. The EF migration history row was recorded with product version `10.0.12`. This was completed before deploying the API; the API was not restarted or deployed as part of the database change.

Preflight found the preceding migration `20261016132000_ThemePublication`, two tenants, and no M4 tables. The existing catalog contained 3 categories, 4 products, 2 option groups, 4 options, and 1 discount.

## Backup and verification

Before the DDL, a custom-format `pg_dump` was created at `/tmp/whiteplate-before-catalog-publication-history-20261016.dump` inside the PostgreSQL container. It was 72.0 KiB and `pg_restore --list` recognized 162 table-of-contents entries. This was an in-container, temporary backup only; it was not copied off-host, and a restore was not tested. It is not evidence of a durable off-host backup.

Post-migration checks confirmed the EF history row, two publication heads, two version-1 baseline revisions, and matching head/revision snapshots for both tenants. Each snapshot is a JSON object with 9 top-level keys. The migration role `whiteplate_api` was granted `SELECT`, `INSERT`, `UPDATE`, and `DELETE` on both new tables; the grants were verified.

## Remaining runtime work

The API deployment and hosted M4 acceptance are pending. The browser request to the public `/health/ready` endpoint was blocked with `ERR_BLOCKED_BY_CLIENT`, so readiness was not verified. After deployment, verify published menu and locale reads, draft changes, publish/version conflict behavior, history, discard, restore, availability changes, and tenant authorization. Catalog revision retention has no approved automatic deletion policy yet.

See the [database schema](../database/database-schema.md#m4-catalog-publication-and-history--2026-10-16), [API contract](../api/api-contracts.md#m4-catalog-publication-and-history--2026-10-16), and [decision 0013](../architecture/decisions/0013-catalog-publication-and-history.md).
