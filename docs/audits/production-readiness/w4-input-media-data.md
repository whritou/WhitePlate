# W4 — Input, media and data

## Scope and method

Audit date 2026-10-25. Audited code is `origin/main` `55f31a5`; this file was written on the audit branch at `8a11be6`, which changes only documentation. W4 covers upload handling, request binding and length limits, optimistic concurrency on management writes, background dispatchers, and schema/migration state. Tenant authorization of the media routes is W1's (`w1-tenant-authz.md`, matrix rows `BrandAssetsController.*`, `ProductPhotosController.*`, `PublicBrandAssetsController.*`, `PublicProductPhotosController.Get`); checkout request contracts are W3's (`w3-public-surface.md`, "Server price authority"). Neither is repeated here.

Source reviewed:

- API host: `Controllers/BrandAssetsController.cs`, `ProductPhotosController.cs`, `PublicBrandAssetsController.cs`, `PublicProductPhotosController.cs`, `ThemeSettingsController.cs`, `ThemePublicationController.cs`, `PublicThemeController.cs`, every mutating action in `TenantCatalogController.cs`, `OrganizationsController.cs`, `EstablishmentSettingsController.cs`, `OrderingOperationsController.cs`, `OrderEmailSettingsController.cs` and `OrdersController.cs`; every file in `Contracts/`; `Configuration/MediaRegistration.cs`, `RequestBodySizeLimitMiddleware.cs`, `DatabaseReadinessHealthCheck.cs`, `ServiceRegistration.cs`; `Program.cs`; `Realtime/OrderOutboxDispatcher.cs`, `OrderEmailOutboxDispatcher.cs`, `OrderArchiveDispatcher.cs`.
- Application, domain and infrastructure: `Media/BrandMediaService.cs`, `ProductPhotoService.cs`, `Domain/Media/MediaAsset.cs`, `Domain/Tenants/ThemeAppearance.cs`, `Infrastructure/Media/*` (`BrandImageProcessor`, `ProductImageProcessor`, `LogoPaletteExtractor`, `S3MediaStorage`, `ExpiredMediaCleanup`), `MediaRepository.cs`, `ProductPhotoRepository.cs`, the public-menu photo queries in `CatalogRepository.cs`, `OutboxStore.cs`, `OutboxMessage.cs`, `OrderEmailDelivery.cs`, every `HasMaxLength` in `Persistence/Configurations/` against the domain validators, and the 40 EF migrations plus `WhitePlateDbContextModelSnapshot.cs`.
- Frontend: `app/api/brand-assets/route.ts`, `app/api/product-photos/route.ts` (upload size limits) and `next.config.ts` (no `images.remotePatterns`).
- Docs: `docs/database/database-schema.md`, `docs/deployment/coolify.md`, `docs/api/api-contracts.md`, decision 0013, `WHITEPLATE_BACKEND_ARCHITECTURE.md`, and the migration notes in `docs/audits/*.md`.

Probes (raw output in the session scratchpad):

1. **In-process SQLite test host, not PostgreSQL.** Following the controller ruling, the brief's probes ran in the API's own harness (`WebApplicationFactory<Program>`, SQLite in memory, `Production` environment, the in-memory `TestStorage` and test authentication of `BrandAssetsEndpointTests.MediaFactory`). The probe file lived only in a `git archive` copy of `apps/api` under the session scratchpad and was deleted after the run; nothing was added to the repository's test suite. Fixtures: renamed HTML, PDF and ZIP headers, a 512×512 GIF, an SVG containing `<script>`, polyglots (PNG, JPEG and ICO signatures followed by HTML or SVG), a forged PNG header declaring 100,000×100,000 and another declaring 4000×4000 over 1 MiB of zero pixel data, real PNGs of 4097×600, 4096×3906 and 4000×4000, an APNG with an `acTL` chunk, and a 600×600 JPEG carrying an EXIF profile (artist and GPS reference) and a comment. Results are quoted in the findings and under Checked, no finding. In the same copy, the existing media, theme and dispatcher tests ran with `dotnet test --project apps/api/tests/WhitePlate.Tests/WhitePlate.Tests.csproj --filter-class "*BrandAssetsEndpointTests" --filter-class "*OrderOutboxDispatcherTests" --filter-class "*ThemeSettingsEndpointTests" --filter-class "*OrderArchiveDispatcherTests"`: 13 total, 13 passed.
2. **Migration comparison.** A scratchpad script compared every operation name (`name:` and `table:` arguments of `Up`) of each EF migration with the corresponding `IF NOT EXISTS … MigrationId` blocks of `apps/api/brand-media-migrations.sql`. `dotnet-ef` is not installed, so no regenerated script was diffed.
3. **Neon `test` and Coolify Production:** not probed. Neon `test` is 13 migrations behind this code (controller ruling: no migration, no probe). The production API returns 503 (HOST-01), and the production database was not queried; its migration state below comes from documentation only.

## Findings

### DATA-01 — Production and Neon `test` schemas lag the code, and readiness cannot detect it

- **Workstream:** W4
- **Location:** `apps/api/WhitePlate.Api/Configuration/DatabaseReadinessHealthCheck.cs:15`; `apps/api/WhitePlate.Infrastructure/Persistence/Migrations/20261019082708_OrderCustomerDetails.cs:13-21`; `apps/api/WhitePlate.Infrastructure/Persistence/Repositories/StaffMembershipRepository.cs:38`, `:51`; `apps/api/WhitePlate.Infrastructure/Persistence/Repositories/OrderRepository.cs:656`; `apps/api/WhitePlate.Api/Realtime/OrderOutboxDispatcher.cs:27-36`, `:66-76`; `docs/api/api-contracts.md:22`; `docs/audits/storefront-studio-renderer-parity.md:39`; `docs/deployment/coolify.md:7-9`
- **Evidence:** The source holds 40 migrations. Per environment:
  - **Coolify Production (documentation only):** the latest recorded rollout applied `20261017184500_AnalyticsLive` and `20261017201650_AnalyticsRepeatLinks` (`coolify.md:7-9`). Three later migrations are recorded as unapplied: `20261017222900_OrganizationRoleGrants` and `20261018103516_CustomOrganizationRoles` (`api-contracts.md:22`) and `20261019082708_OrderCustomerDetails` (`storefront-studio-renderer-parity.md:39`). Production may be fewer than three behind: DATA-02 shows two migrations that were applied while docs still called them unapplied. Only a read-only query of `__EFMigrationsHistory` will settle it.
  - **Neon `test`:** latest applied is `20261014150246_OrderingOperations` (read-only query recorded in W1 and W3), so 13 are missing, from `20261014211126_DiscountMinimumAndExpiration` to `20261019082708_OrderCustomerDetails`. W1's count of 11 is superseded by this list.
  The certain failure is `OrderCustomerDetails`. It adds `Orders.CustomerPhone` and `Orders.OrderNotes` (`20261019082708_OrderCustomerDetails.cs:13-21`), and EF selects or inserts every mapped column whenever it materializes or saves an `Order` entity. Without them, every guest checkout insert fails, as does every order read that loads entities: staff order lists and history, the kitchen board, tracking and dashboards. The kitchen outbox stalls as well. Its loop runs `CleanExpiredOrderEmailDataAsync`, which loads full `Order` entities (`OrderRepository.cs:656`), before `claim_batch` (`OrderOutboxDispatcher.cs:27-36`). The failure is caught (`:66-70`) and the cleanup time is never advanced, so the next loop fails at the same step and no kitchen event is dispatched. W3 saw this signature on Neon `test`: `Kitchen outbox polling failed during idempotency_cleanup (PostgresException)`. The two role migrations hit a narrower set. `HasPermissionAsync` returns `true` for organization owners at `StaffMembershipRepository.cs:38`, before the grants query at `:51`. Non-owner staff (manager, kitchen, custom roles) and role-management routes fail on the missing `OrganizationRoleGrants` table and membership columns. Migrations do not run at startup (`Program.cs` has no `Migrate`), and `/health/ready` only checks `Database.CanConnectAsync` (`DatabaseReadinessHealthCheck.cs:15`). A container built from `main` would therefore pass Coolify's readiness gate and replace the old one.
  **Suspected link to HOST-01 (controller question, source refutes the host-stop path):** no code sets `HostOptions.BackgroundServiceExceptionBehavior` (`Program.cs`, `ServiceRegistration.cs`), so the .NET default `StopHost` applies. However, every `BackgroundService` catches all non-cancellation exceptions inside its loop: `OrderOutboxDispatcher.cs:19-70`, `OrderArchiveDispatcher.cs:16-33`, `OrderEmailOutboxDispatcher.cs:27-46` (its pre-`try` `IsConfiguredAsync` only reads configuration, `ResendOrderEmailSender.cs:9`), and `MediaCleanupDispatcher` (`MediaRegistration.cs:36-42`). A missing column therefore logs an error every second but does not stop the host, and readiness stays Healthy. Source does not support "a post-migration image crashed and restart-looped, leaving Traefik with no backend" as the cause of HOST-01's 503. The deployed SHA and the production migration state are unknown (HOST-05), so the link stays Suspected and other causes are open.
  This is a hard precondition for HOST-01 recovery: apply and verify the pending migrations before, or together with, any redeploy of `main`.
- **Impact:** Deploying current `main` to production before applying the pending migrations would break guest checkout, tracking and every order view, and silently stop kitchen realtime events. Non-owner staff would also be locked out of permission-checked routes. Health checks would still report Healthy and nothing in the deployment path stops it. The outage is recoverable by applying the migrations, and no data is lost.
- **Severity:** Should
- **Fix direction:** Before the next production deployment, query `__EFMigrationsHistory`, apply the missing migrations with the existing guarded procedure, and record the rollout in `coolify.md`. Make readiness fail when `Database.GetPendingMigrationsAsync()` is non-empty (or compare against a pinned latest migration ID). Record the deployed commit with the migration state (see HOST-05).
- **Regression test:** Sketch below
- **Status:** Confirmed

```text
Setup:    database migrated only to 20261017201650_AnalyticsRepeatLinks; API built from main
Request:  GET /health/ready; POST /api/v1/orders (valid guest checkout); GET /api/v1/tenants/{id}/orders as owner
Expected: /health/ready is Unhealthy while migrations are pending
Actual:   (by source) /health/ready Healthy (CanConnectAsync only); checkout and order list fail with 500
on missing Orders.CustomerPhone/OrderNotes; kitchen outbox loop fails at idempotency_cleanup every second
```

### DATA-02 — Two production migrations were applied without a rollout record, and docs still call them unapplied

- **Workstream:** W4
- **Location:** `docs/api/api-contracts.md:347`, `docs/architecture/WHITEPLATE_BACKEND_ARCHITECTURE.md:141`, `docs/planning/restaurant-management-backlog.md:97` (`ThemePublication`); `docs/database/database-schema.md:27`, `docs/architecture/WHITEPLATE_BACKEND_ARCHITECTURE.md:72`, `docs/audits/live-orders.md:38`, `:61` (`OrderCancellationReason`)
- **Evidence:** `20261016132000_ThemePublication` is described as "generated source only and has not been applied" (`api-contracts.md:347`). Yet the M4 preflight on Coolify Production "found the preceding migration `20261016132000_ThemePublication`" (`docs/audits/catalog-publication-history.md:11`), and the backlog summary says T3 is applied (`restaurant-management-backlog.md:24`). Likewise `20261017170519_OrderCancellationReason` "is source-only and has not been applied to a shared database" (`database-schema.md:27`), while the D5 preflight found it as production's latest migration (`coolify.md:7`). `coolify.md` has no rollout section for either one: no backup, preflight or post-check record.
- **Impact:** The documented production schema cannot be trusted. Operators deciding which migrations to apply (DATA-01) would work from contradictory sources. Two DDL changes reached production with no recorded backup or verification.
- **Severity:** Could
- **Fix direction:** Query production `__EFMigrationsHistory` read-only once the database is reachable, add a dated rollout note for both migrations (or record that evidence is missing), and correct the five stale "unapplied" statements. Keep one per-environment migration table in `coolify.md`.
- **Regression test:** None
- **Status:** Confirmed

### DATA-03 — Upload bodies are read and buffered before authentication

- **Workstream:** W4
- **Location:** `apps/api/WhitePlate.Api/Program.cs:52-56`; `apps/api/WhitePlate.Api/Configuration/RequestBodySizeLimitMiddleware.cs:24-37`; `apps/api/WhitePlate.Api/Controllers/BrandAssetsController.cs:32`, `ProductPhotosController.cs:31`
- **Evidence:** `RequestBodySizeLimitMiddleware` runs before `UseAuthentication` and `UseAuthorization`. For any endpoint with `[RequestSizeLimit]` it calls `EnableBuffering` (memory up to 30 KiB, then a temporary file) and reads the whole body to count it. Only then does the request reach authorization. W1's statement that an unauthorized upload is refused "before the body is read" (`w1-tenant-authz.md:632`) holds for the BFF routes, which call the list endpoint first. On the API itself the middleware has already buffered the body, up to 4 MiB, into memory or a temporary file, and the API host is reachable directly (`sslip.io` origin, W8), not only through the BFF. In the in-process probe, an anonymous chunked 5 MiB `POST /api/v1/tenants/{id}/brand-assets/banner/uploads` returned `413`, which the middleware can only produce after counting more than 4 MiB of an unauthenticated body. The same anonymous body sent to `POST /api/v1/tenants/{id}/categories` (no size metadata) returned `401`. The test host consumes the client stream in both cases, so byte counts cannot tell them apart: the status difference is the evidence of pre-authentication buffering. No rate limiter applies to the upload routes.
- **Impact:** Anyone can make the API buffer up to 4 MiB per request into memory or a temporary file on the upload routes, with no credentials and no rate limit. The 2 MB Stripe webhook limit is anonymous by design and not counted here. This is cheap memory and disk amplification against a single small VPS. No data is exposed.
- **Severity:** Could
- **Fix direction:** Move the middleware after `UseAuthentication`/`UseAuthorization`, or let it count bytes while the action streams the body instead of pre-buffering. Leave Kestrel's `MaxRequestBodySize` (set from the same metadata) to reject oversize bodies. Consider a per-account upload rate limit and an explicit `[RequestSizeLimit]` on the authenticated JSON endpoints that currently fall back to Kestrel's 30 MB default. That covers most actions of `TenantCatalogController` and `OrganizationsController`; `catalog/reorder` already has `[RequestSizeLimit(65536)]` (`TenantCatalogController.cs:300`).
- **Regression test:** Sketch below
- **Status:** Confirmed

```text
Request:  POST /api/v1/tenants/{id}/brand-assets/banner/uploads, no Authorization,
Transfer-Encoding: chunked, 5 MiB body
Expected: 401 without reading the body
Actual:   413 (body read past 4 MiB before authentication) — in-process SQLite test host
```

### DATA-04 — Public product photos follow draft catalog visibility while the menu follows the published snapshot

- **Workstream:** W4
- **Location:** `apps/api/WhitePlate.Infrastructure/Persistence/Repositories/ProductPhotoRepository.cs:11-14`; `apps/api/WhitePlate.Application/Media/ProductPhotoService.cs:62-63`; `apps/api/WhitePlate.Infrastructure/Persistence/Repositories/CatalogRepository.cs:617-630`
- **Evidence:** Once a publication head exists, the public menu lists products from the published snapshot and attaches their active photos (`CatalogRepository.cs:617-630`). The anonymous photo route instead allows a product only if the draft `Products` row is not archived and its draft category is visible (`PublicProductExistsAsync`). Decision 0013 keeps photos out of the revision (`0013-catalog-publication-and-history.md:10`) but does not say which visibility should gate them. So an owner who archives a published product, or hides its category, in the draft gets `404` for that product's photos on the live menu until the next publish. In the other direction, photos of a product that exists only in the draft are served anonymously to anyone who has the random asset ID. The probe confirmed the draft-path behaviour (`200` for a visible product, `404` through another tenant's host or slug, `404` for size `641`). The published-path mismatch is from source, because the test host has no publication head.
- **Impact:** Broken images on the live storefront during ordinary draft editing, and a minor leak of draft photos. It is not cross-tenant.
- **Severity:** Could
- **Fix direction:** Gate anonymous photo reads on the published snapshot (product present, not archived, in a visible category) when a head exists, and keep the draft rule only for tenants without a head. Record the choice in decision 0013.
- **Regression test:** Sketch below
- **Status:** Confirmed

```text
Setup:    product P published with active photo A; owner archives P in the draft (no publish)
Request:  GET /api/v1/menu (host bistro), then GET /api/v1/products/P/photos/A/640
Expected: menu lists P with photo A, and A returns 200 (or both hide P)
Actual:   (by source) menu lists P and A; photo request returns 404
```

### DATA-05 — Catalog drafts and several management settings are last-writer-wins

- **Workstream:** W4
- **Location:** `apps/api/WhitePlate.Api/Contracts/UpdateCatalogRequests.cs:3-21`; `apps/api/WhitePlate.Api/Controllers/TenantCatalogController.cs:44-57`, `:59-71`, `:124`, `:176-188`, `:345`, `:419-435`, `:453`, `:493`, `:548`, `:613`; `apps/api/WhitePlate.Api/Controllers/OrganizationsController.cs:179-191`, `:193`
- **Evidence:** No request record for category, product, option group, option or discount updates, menu languages, catalog translations, the glossary or the restaurant description carries a version, and these actions read no `If-Match`. None of the catalog entities has an EF concurrency token. The tokens that exist are on `CatalogPublicationHead`, `Order`, `Organization` (legal profile), `OrganizationRoleGrantSet`, `OutboxMessage`, `StaffInvitation` and the tenant theme/email versions (`Persistence/Configurations/*`). Organization rename and member role changes are unversioned too. The versioned writes are: theme draft and publication, establishment settings, opening hours, pickup scheduling, legal profiles, ordering operations, order-email settings, order status, catalog publish/discard/restore, role grants and archive, brand-asset slots (asset-ID `If-Match`), product photo galleries (`expectedIds`), and translation review approve/reject (body `ExpectedVersion`, `TenantCatalogController.cs:88-159`). `PUT catalog/reorder` (`TenantCatalogController.cs:299`) is partly guarded. It has no version, but the repository rejects a request whose ID list is not exactly the current non-archived set (`CatalogRepository.cs:357`, `:373`). That catches added or removed items, though two concurrent reorders of the same set still overwrite each other.
- **Impact:** Two managers editing the same product, discount or translation overwrite each other without any warning. The publish `If-Match` protects only the publication step, so the lost edit can then be published. This is an integrity issue, not a security boundary.
- **Severity:** Could
- **Fix direction:** Add a per-entity `Version` concurrency token to catalog rows and require a quoted `If-Match` on their `PUT`/`DELETE`, returning 412 or 428 as the other versioned routes do. Alternatively, document last-writer-wins for draft editing as an accepted decision in `api-contracts.md`.
- **Regression test:** Sketch below
- **Status:** Confirmed

```text
Request:  two managers GET product P, then each PUT /api/v1/tenants/{id}/products/P with different names
Expected: second PUT returns 412 (stale) or 428 (missing If-Match)
Actual:   (by source) both return 200; the second silently overwrites the first
```

### DATA-06 — Kitchen outbox retries forever and never purges dispatched rows

- **Workstream:** W4
- **Location:** `apps/api/WhitePlate.Api/Realtime/OrderOutboxDispatcher.cs:51-58`; `apps/api/WhitePlate.Infrastructure/Persistence/Repositories/OutboxStore.cs:11-12`; `apps/api/WhitePlate.Infrastructure/Persistence/OutboxMessage.cs:25-30`
- **Evidence:** Each failure (including an undeserializable payload) schedules a retry with a delay capped at 300 s. The attempt counter is never compared with a limit, and there is no failed or dead-letter state. The claim query selects only `DispatchedAt == null && AvailableAt <= now`, so a poison row cannot block the batch, but it is re-claimed every five minutes indefinitely. No code deletes `OrderOutboxMessages` rows: the only uses are add, claim, mark dispatched and schedule retry. By contrast, the e-mail outbox stops at 10 attempts (`OrderEmailDelivery.cs:65`) and uses the delivery ID as the provider idempotency key (`ResendOrderEmailSender.cs:22`). Delivery is at-least-once with a stable event ID, which the realtime client handles as a refresh hint, so duplicates are harmless.
- **Impact:** Operational: a malformed or permanently failing event produces a warning every five minutes for ever, and the outbox table grows with every order status change. No data is exposed or lost.
- **Severity:** Could
- **Fix direction:** Add a maximum attempt count with a terminal `Failed` state and alert, and a retention job that deletes dispatched rows after a fixed period (for example 7 days), similar to the idempotency cleanup already run by the same dispatcher.
- **Regression test:** Sketch below
- **Status:** Confirmed

```text
Setup:    OrderOutboxMessages row with PayloadJson "{" (invalid)
Action:   run the dispatcher for N > max attempts, advancing the clock past each retry
Expected: row ends Failed after the configured maximum; dispatched rows older than retention are deleted
Actual:   (by source) row is retried every 300 s without end; dispatched rows are never deleted
```

### DATA-07 — Production database has no documented off-host backup or restore test

- **Workstream:** W4
- **Location:** `docs/deployment/coolify.md:253-255`, `:83`, `:89`, `:97`; `docs/audits/catalog-publication-history.md:15`
- **Evidence:** The runbook records "As of 2026-10-08, Coolify reports zero scheduled backups" and lists "encrypted off-VPS backups with retention" and a restore drill as open operational work (`coolify.md:253-255`). Every later migration rollout (through 2026-10-17) made only a temporary `pg_dump` in the container's `/tmp`. Each one explicitly says it is "not an off-host backup or restore test" (for example `coolify.md:7`, `catalog-publication-history.md:15`). The database port is also reachable from the Internet (HOST-02). The current Coolify backup configuration was not observed, so this rests on documentation only.
- **Impact:** Losing the VPS or its volume, or making an operator error during one of the manual DDL rollouts (DATA-01), would lose all tenants, catalogs, orders and the audit history, with no tested way back.
- **Severity:** Should
- **Fix direction:** Configure Coolify scheduled backups to off-VPS storage with encryption and retention, run and record a restore into a disposable database, and require a fresh verified backup before each production migration.
- **Regression test:** None
- **Status:** Suspected

## Checked, no finding

- **Type detection by content:** the upload format comes from magic bytes (PNG, JPEG, ICO, RIFF/WEBP), never from a file name or client content type. The decoder is pinned to that format (`BrandImageProcessor.cs:26`, `:41-42`, `:74-81`), and favicons accept only PNG/ICO while other slots accept PNG/JPEG/WebP (`:28-29`). Probe: renamed HTML, PDF header, ZIP header and a 512×512 GIF each returned `400 validation_failed`.
- **SVG and script content:** no SVG, MSVG or URL coder can be selected, because the format is pinned before decoding ("Never let content select SVG/URL/delegates", `BrandImageProcessor.cs:41`). Probe: an SVG containing `<script>`, and polyglots with PNG, JPEG or ICO signatures followed by HTML or SVG, all returned `400`. The existing test `BrandAssetsEndpointTests.InvalidContentCannotReplaceAnAssetAndCleanupDeletesOnlyExpiredPrivateObjects` covers `<svg/>`.
- **Decoding limits and decompression bombs:** `Ping` reads only headers, and frames above 4096 px or 16,000,000 pixels are rejected before the full decode (`BrandImageProcessor.cs:44-47`). There is a single frame (ICO up to 32), `ResourceLimits` caps memory at 128 MiB with no disk spill, one thread, 15 s and 4096×4096 (`:12-17`), and at most two decodes run at once (`:9`, `:30`). Animation chunks `acTL`/`ANIM`/`ANMF` are rejected and chunk lengths are bounds-checked (`:83-96`). Probe: forged headers of 100,000×100,000 (1,096-byte file) and 4000×4000 (1 MiB of zero data) returned `400` in 7 and 141 ms; 4097×600 returned `400` in 9 ms; APNG returned `400`; real 4096×3906 and 4000×4000 PNGs (16.0 M pixels) were accepted in 1462 and 1017 ms (timings from the last of three runs, retained in the scratchpad; earlier runs differed by under 0.4 s) and normalized to 1600×900 WebP.
- **Re-encoding strips metadata:** each upload is decoded, auto-oriented, `Strip()`-ed and re-encoded as PNG (logo, favicon) or WebP (banner, product) at a fixed size (`BrandImageProcessor.cs:52-71`). Product variants are re-encoded from that output and stripped again (`ProductImageProcessor.cs:18-22`). Probe: a JPEG with EXIF artist, GPS reference and a comment became a 139-byte PNG with no `Exif`/`eXIf`/text chunk and none of the marker strings.
- **Object keys:** keys are generated on the server as `tenants/{tenantId:N}/media/{assetId:N}`, plus `/{size}` for product variants (`MediaAsset.cs:30-32`; `ProductPhotoService.cs:31`), and `ObjectKey` has a unique index (`brand-media-migrations.sql:750`). The asset ID is `Guid.NewGuid()` (version 4, 122 random bits; the probe saw version nibble `4`). No client value reaches a key: slots are allowlisted (`MediaAsset.cs:23`), sizes are restricted to 320/640/1200 (`ProductPhotoService.cs:61`), and the probe's encoded `../` slot returned `400`.
- **Public delivery isolation:** brand assets are served only when they are the published theme's asset for the host- or slug-resolved tenant, ready and marked `IsInPublishedTheme` (`MediaRepository.cs:14-23`). Product photos need the same tenant and product and `IsActive` for anonymous readers (`ProductPhotoService.cs:62-66`). Drafts are readable only through the `storefront.manage` preview (`BrandMediaService.cs:61-66`). Probe: bistro's published logo returned `200` on its own host and slug and `404` through `other.example.test` and `/public/restaurants/other/…`; bistro's photo returned `200` on its host and `404` through the other tenant's host and slug; the private preview path called anonymously through another host returned `401`. Responses carry a stored content type (`image/png` or `image/webp`), `X-Content-Type-Options: nosniff` and `no-store`. DATA-04 covers the draft-versus-published visibility gap.
- **Upload quotas and sizes:** limits are 1, 2 and 4 MiB per slot and 4 MiB for photos (`BrandAssetsController.cs:40-49`, `ProductPhotosController.cs:38-47`), with matching limits in the BFF (`app/api/brand-assets/route.ts:82-85`, `app/api/product-photos/route.ts:92`). At most 20 unpublished assets per tenant (`MediaRepository.cs:32`), 8 photos per product (`ProductPhotoService.cs:43`), and a 24-hour expiry for unused drafts with hourly cleanup (`MediaAsset.cs:33`, `ExpiredMediaCleanup.cs:13-29`). Storage reads are capped at 8 MiB (`S3MediaStorage.cs:92-99`).
- **SSRF and the private endpoint:** the S3 endpoint, bucket, credentials, `AllowLocalHttp` and `AllowPrivateHttp` come only from server configuration (`MediaRegistration.cs:11-15`). The endpoint is rejected unless it is HTTPS, loopback HTTP with `AllowLocalHttp`, or RFC 1918, link-local or single-label HTTP with `AllowPrivateHttp`, and it may not carry user info, a path, a query or a fragment. Cloudflare Access headers are refused over private HTTP (`S3MediaStorage.cs:24-35`, `:54-70`). No request contract has a URL field, theme values are allowlisted (`ThemeAppearance.cs:36-56`; `UpdateThemeRequest` disallows unknown members), and `next.config.ts` defines no `images.remotePatterns`. No user-supplied URL is fetched on the server.
- **Request contracts bind only intended fields:** every write binds an explicit `record` from `Contracts/`, never a domain entity. Tenant and entity IDs come from the route, and server-owned fields (IDs, versions, timestamps, tenant, prices) are absent from request types. `SaveBrandAssetRequest` takes only `AssetId` and `SaveProductPhotosRequest` only ID lists. W3 verified that extra checkout fields are ignored.
- **String lengths versus schema:** the domain limits match the columns: category name 120 (`MenuCategory.cs:7`), product name 160, description 1000, SKU 64 (`Product.cs:8-10`), option and group names 120, discount code 32 and name 120 (`PromotionDiscount.cs:31-33`), customer name 160, phone 40, notes 500, email 254 (`Order.cs:64-72`, `:230`), glossary terms 120, translation name 160 and description 1000, role display name 60 (`OrganizationRoleGrantSet.cs:198`), organization and tenant names 200, matching `HasMaxLength` in `ProductConfiguration.cs`, `OrderConfiguration.cs`, `PromotionDiscountConfiguration.cs`, `CatalogTranslation*Configuration.cs` and `OrganizationRoleGrantSetConfiguration.cs`. Order snapshot columns equal their sources: `ProductName` 160 and option `Name` 120 (`OrderConfiguration.cs:103`, `:124`). .NET checks UTF-16 length, which is never less than PostgreSQL's character count, so the domain is the stricter side. The SQLite test host does not enforce `varchar(n)`, so this rests on source comparison.
- **Optimistic concurrency where present:** versioned routes return 428 on a missing or malformed `If-Match` and 412 on a stale one (for example `OrdersController.cs:203-209`, `TenantCatalogController.cs:282-295`, `ThemeSettingsController.cs:31`, `BrandAssetsController.cs:82-89`); the existing test `BrandAssetsEndpointTests.DraftIsPrivateUntilSavedAndFailedReplacementPreservesActiveAsset` covers the brand-slot 412. The gaps are DATA-05.
- **E-mail outbox and order archive:** e-mail rows are claimed with a conditional update and a 2-minute lease, retried with capped exponential delay and marked `Failed` after 10 attempts (`OrderEmailOutboxDispatcher.cs:69-92`, `:128-133`; `OrderEmailDelivery.cs:65`), and sent with `Idempotency-Key: order-event/{id}` (`ResendOrderEmailSender.cs:22`). The nightly archive is one set-based idempotent `UPDATE` of closed orders before the UTC day start (`OrderRepository.cs:534-541`), retried after a minute on failure (`OrderArchiveDispatcher.cs:30-37`). Kitchen-event claims use a `LeaseVersion` concurrency token (`OutboxMessageConfiguration.cs:19`). Remaining gap: DATA-06.
- **`brand-media-migrations.sql` against EF migrations:** the script is EF's idempotent output for the first 15 migrations (`20260928213141_InitialTenants` to `20261008210000_BrandMediaPublicationState`), all recorded with product version `10.0.12`. Every table, column and index name in each of those 15 `Up` methods appears inside that migration's guarded block. The remaining 25 migrations are absent, which is what `database-schema.md:275` and `coolify.md:79` describe: an empty-database bootstrap ending at T1, not a production script. Because each block is guarded by `__EFMigrationsHistory`, running it and then `dotnet ef database update` would apply the rest. The comparison checked names only, since no regenerated script could be diffed (no `dotnet-ef`).

## Not covered

- **Neon `test` and production runtime:** Neon `test` is 13 migrations behind (DATA-01), and the controller ruled out applying migrations or probing it. The production API is down (HOST-01) and its database was not queried, so production migration state comes from documentation only (DATA-01, DATA-02, DATA-07). PostgreSQL-specific behaviour (serializable media and photo transactions, `varchar(n)` enforcement, `ExecuteUpdate` claim races) was not exercised. The in-process host uses SQLite.
- **Real object storage:** no MinIO/S3 endpoint was used. `S3MediaStorage` endpoint validation is reviewed from source plus the existing `Infrastructure/S3MediaStorageTests.cs`, which was not run here.
- **Antivirus scanning (ASVS 12.4.2):** not implemented. Uploads are always decoded and re-encoded into a new PNG or WebP, so stored bytes are never the client's bytes. No finding is raised.
- **Magick.NET native library advisories:** `Magick.NET-Q8-AnyCPU` 14.17.2 was not checked beyond the NuGet audit in `README.md` (clean). Reachability belongs to W5.
- **Frontend upload UI and BFF runtime:** source only; `npm` was not run for W4.
- **E-mail outbox crash loop:** a delivery whose processing crashes the process every time stays `Sending`, and its expired lease is reclaimed without checking `AttemptCount` (`OrderEmailOutboxDispatcher.cs:74-86`). This was not reproduced and is noted only for W7.

## ASVS / WCAG coverage

| Requirement | Coverage | Result |
| --- | --- | --- |
| ASVS V5.1 Input validation | Covered (source + in-process probes) | Explicit request records, allowlisted slots, aspects, sizes and theme values, length limits aligned with schema; no finding |
| ASVS V5.2 Sanitization and sandboxing | Covered (source + probes) | No SVG or delegate coder; uploads re-encoded and stripped; no server-side URL fetch (SSRF); no finding |
| ASVS V5.3 Output encoding and injection | Partial (source) | Media served with a stored content type and `nosniff`; EF parameterized queries; HTML/e-mail output encoding belongs to W3/W7 |
| ASVS V12.1 File upload | Covered (probes) | Per-slot size limits, pixel and frame limits, tenant quota of 20 drafts; DATA-03 (pre-auth buffering) |
| ASVS V12.2 File integrity | Covered (probes) | Magic-byte detection plus a pinned decoder; non-images and polyglots rejected |
| ASVS V12.3 File execution | Covered (source + probe) | Server-generated object keys; no client file name or path used; traversal slot rejected |
| ASVS V12.4 File storage | Partial | Private S3 bucket, tenant-prefixed random keys; no antivirus (mitigated by re-encoding) |
| ASVS V12.5 File download | Covered (probes) | Published or active assets only, tenant-scoped, `nosniff`, `no-store`; DATA-04 (draft visibility gate) |
| ASVS V8.1 General data protection | Partial (docs + source) | `no-store` on media and management responses; DATA-07 (no off-host backup), DATA-01/DATA-02 (schema state) |
| WCAG 2.2 | Not applicable | Owned by W6 |
