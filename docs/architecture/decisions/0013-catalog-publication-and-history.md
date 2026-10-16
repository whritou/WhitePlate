# Catalog publication and history

Date: 16 October 2026. Status: implemented in source; migration rollout and runtime acceptance pending.

M1 currently edits normalized catalog rows directly. M4 adds a guest-visible publication boundary while keeping those rows as the restaurant's editable workspace.

## Decision

- Treat `MenuCategories`, `Products`, `ProductOptionGroups`, `ProductOptions`, `PromotionDiscounts`, and the tenant's menu-language settings as the current draft. Existing catalog commands continue to save draft values; public reads do not use them once a publication head exists.
- Store the published head and full immutable revision snapshots as JSONB in `CatalogPublicationHeads` and `CatalogRevisions`. A publication snapshot contains currency, enabled/default locales, category/product/option data, translations, metadata, prices and discounts. Product photos remain in the separate M5 media lifecycle and are not part of a catalog revision.
- Backfill each existing tenant as version 1 from its current catalog in the `CatalogPublicationHistory` migration. Create the same empty version-1 baseline when a new tenant is provisioned. Apply the migration before deploying the API; migrations do not run at startup.
- Require a strong quoted positive integer `If-Match` version for publish, discard and restore. Publish locks the tenant head, reads and validates the complete draft in a serializable transaction, and advances the head plus a history row atomically. A no-change publish is a no-op. A stale version returns 412; missing `If-Match` returns 428. Any validation or transaction failure leaves the current published snapshot unchanged.
- Public menu, tenant-locale, public establishment-locale and checkout reads use the published snapshot. Checkout remains server-priced and preserves existing idempotency and immutable order snapshots. Public menu responses remain no-store; no separate cache invalidation mechanism is needed in the current runtime.
- Only persisted organization owners and restaurant managers can read history or publish/discard/restore. The existing D4 owner/manager/Kitchen availability operation remains immediate; each changed availability is added to the published snapshot and history with its actor. Ordinary product-form availability remains a draft field until publication.
- History records action, source version, actor issuer/subject, publication time, full snapshot, and a field-level change set. Keep revisions indefinitely until a retention policy is approved. Restoring a revision creates a new publication and never rewrites history; it carries forward current quick-availability flags.
- Discard restores the published snapshot into normalized draft rows. Entries created after publication are soft archived/deactivated, preserving existing references; archived draft-only tombstones are excluded from future publication snapshots and the draft diff. Restaurant description and establishment details stay outside the catalog snapshot; the published menu locale determines guest-side locale fallback.

## Consequences and limits

The API and UI can show a draft-versus-published diff without a second set of mutable catalog tables. Existing order snapshots remain independent. Rollback has an auditable actor and time, and quick availability stays responsive for Kitchen without granting Kitchen catalog or history access.

The `CatalogPublicationHistory` migration is generated but has not been applied to any shared or production database. Source builds do not prove PostgreSQL execution, concurrency behavior, cache behavior, or guest/staff acceptance. M3 assisted-translation review states are not implemented or included in publication gating. See the [API contract](../../api/api-contracts.md#m4-catalog-publication-and-history--2026-10-16), [schema](../../database/database-schema.md#m4-catalog-publication-and-history--2026-10-16), and [acceptance plan](../../functional-test-plan.md#m4-catalog-publication-and-history).
