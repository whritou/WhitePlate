# T3 Theme Preview and Publication Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. This task is executing inline because the user requested implementation in this session.

**Goal:** Publish the saved tenant theme and saved T1 logo, favicon, and banner as one atomic snapshot that drives the real tenant storefront, while the Studio keeps preview and publication separate.

**Architecture:** Store the published appearance and media IDs as a versioned `Tenant` snapshot, with a media marker protecting referenced objects from cleanup. An owner/manager-only API publishes the latest saved draft and current saved media slots; public reads resolve the tenant from the validated host. Next server components pass the published theme into the menu, checkout, tracking, and metadata, while the Studio adds a separate publish workflow and corrected tab labels.

**Tech Stack:** .NET 10, EF Core/PostgreSQL, ASP.NET Core, Next.js 16.3.4 App Router, React 19, TanStack Query, next-intl, existing JSON request clients and media storage.

---

## File map

### API and persistence

- Modify `apps/api/WhitePlate.Domain/Tenants/Tenant.Theme.cs` to add snapshot state and publication-version transitions.
- Add `apps/api/WhitePlate.Domain/Tenants/ThemePublicationSnapshot.cs` for the persisted appearance, nullable T1 asset IDs, source draft version, and publication time.
- Modify `apps/api/WhitePlate.Domain/Media/MediaAsset.cs` to mark snapshot references and restart the retention clock when a retired asset is released.
- Modify `apps/api/WhitePlate.Infrastructure/Persistence/Configurations/TenantConfiguration.cs` and `MediaAssetConfiguration.cs` for JSONB/version/marker persistence and a cleanup-friendly marker index.
- Generate an additive migration under `apps/api/WhitePlate.Infrastructure/Persistence/Migrations/` and refresh `WhitePlateDbContextModelSnapshot.cs` through the EF CLI.
- Modify `apps/api/WhitePlate.Application/Tenants/ThemeSettings.cs` or add focused publication records and a repository interface under `apps/api/WhitePlate.Application/Tenants/`.
- Add a transactional repository under `apps/api/WhitePlate.Infrastructure/Persistence/Repositories/` for publication and public snapshot reads; keep T2 draft writes in `ThemeSettingsRepository` unless a shared transaction boundary is required.
- Modify `apps/api/WhitePlate.Application/Common/Errors/ErrorCode.cs` and `apps/api/WhitePlate.Api/Errors/ApiErrorMapper.cs` to expose publication validation as HTTP 422 without changing existing T2 validation mappings.
- Add `apps/api/WhitePlate.Api/Controllers/ThemePublicationController.cs` and `PublicThemeController.cs` for protected management routes and host-resolved public reads.
- Modify `apps/api/WhitePlate.Application/Media/MediaPorts.cs`, `BrandMediaService.cs`, `MediaRepository.cs`, `PublicBrandAssetsController.cs`, and `ExpiredMediaCleanup.cs` so public asset reads use the snapshot and cleanup preserves its assets.
- Register new application/repository services in `apps/api/WhitePlate.Api/Program.cs` using the existing registration conventions.

### Frontend

- Modify `apps/frontend/types/theme.ts`; add `apps/frontend/lib/validation/theme-publication.ts` to parse untrusted publication responses.
- Add `apps/frontend/services/theme-publication.ts` for protected server reads and writes; add `apps/frontend/app/api/theme-publication/route.ts` for the authenticated same-origin BFF.
- Modify `apps/frontend/lib/api/theme-browser.ts` for browser queries and publish mutation; modify `apps/frontend/lib/api/public-storefront.ts` for validated-host public theme reads.
- Modify `apps/frontend/app/[locale]/page.tsx`, `apps/frontend/components/storefront/restaurant-menu.tsx`, `live-customer-shell.tsx`, and `live-restaurant-identity.tsx` to render the published values on both shop and checkout.
- Modify `apps/frontend/app/[locale]/order/[orderId]/page.tsx` and `components/storefront/order-tracking.tsx` to apply the same tenant theme and restaurant favicon/title.
- Modify `apps/frontend/app/api/public/brand-assets/[slot]/route.ts` only if its existing response headers or version query handling need adjustment; public tenant resolution remains host-only.
- Modify `apps/frontend/hooks/use-tenant-theme.ts`, `types/theme.ts`, `components/organization/live-theme-studio.tsx`, `live-studio.tsx`, `brand-assets-workspace.tsx`, and `components/lovable/pages/studio-StudioPage-view.tsx` for separate save/publish/discard states and translated publication feedback.
- Modify `apps/frontend/messages/en.json` and `fr.json` with matching Studio tab labels, publish states, and the notice that saved media is staged until publication.
- Keep the existing preview sample data and shop URL/copy controls. Keep `panel=appearance|brand` query values for old links.

### Documentation

- Update `docs/api/api-contracts.md`, `docs/database/database-schema.md`, `docs/architecture/WHITEPLATE_BACKEND_ARCHITECTURE.md`, `docs/architecture/WHITEPLATE_FRONTEND_ARCHITECTURE.md`, `docs/functional-test-plan.md`, and the T3 entry in `docs/planning/restaurant-management-backlog.md` after implementation.

## Task 1: Persist a backwards-compatible published snapshot

**Files:** domain theme/media entities, EF configurations, generated migration and model snapshot.

- [ ] Add `ThemePublicationSnapshot` with `Appearance`, nullable `LogoAssetId`, `FaviconAssetId`, and `BannerAssetId`, `SourceDraftVersion`, and nullable `PublishedAt`.
- [ ] Add nullable `Tenant.PublishedThemeJson` and independent `Tenant.ThemePublicationVersion` defaulting to 1. Null reads as `new ThemeAppearance()`, no selected assets, and null publication time.
- [ ] Add domain operations that reject non-current draft/publication versions, version overflow, and invalid appearances; do not let a publish operation change `ThemeDraftJson` or `ThemeDraftVersion`.
- [ ] Add `MediaAsset.IsInPublishedTheme`. Publishing replaces the complete marker set; releasing a retired marker sets `ExpiresAt = now.AddDays(7)` so a long-lived published asset receives seven full retention days after release.
- [ ] Generate the migration with `dotnet ef migrations add ThemePublication --project apps/api/WhitePlate.Infrastructure/WhitePlate.Infrastructure.csproj --startup-project apps/api/WhitePlate.Api/WhitePlate.Api.csproj --context WhitePlateDbContext --output-dir Persistence/Migrations`.
- [ ] Backfill existing tenants to default public appearance, their existing `ThemeDraftVersion`, null `PublishedAt`, and their current active saved T1 asset IDs. Mark exactly those assets as published. Leave new tenants at null snapshot/version 1. Do not apply the migration to a shared database.
- [ ] Confirm the EF model snapshot contains the two tenant columns and media marker/index; do not manually edit generated model files.

## Task 2: Publish atomically and resolve public theme/assets by host

**Files:** Application publication contracts/handler/repository, persistence repositories, API controllers, media service and cleanup.

- [ ] Define management DTO `ThemePublicationDto(ThemeAppearance Theme, Guid? LogoAssetId, Guid? FaviconAssetId, Guid? BannerAssetId, int SourceDraftVersion, DateTimeOffset? PublishedAt, int Version)` and request `PublishThemeRequest(int DraftVersion)`.
- [ ] Implement `GET /api/v1/tenants/{tenantId}/theme/publication` for current publication state and `POST` on the same route with `{ "draftVersion": n }` and `If-Match: "<publicationVersion>"`.
- [ ] In the publish transaction, recheck active tenant/organization and owner/manager membership, require both versions to match, read the current saved draft and current ready tenant-owned T1 slots, validate allowlisted appearance and publication contrast, write the snapshot/version, switch `IsInPublishedTheme`, and commit once. The request never supplies appearance or asset IDs.
- [ ] Enforce 4.5:1 for text/background, primary/background, and text/accent. If a banner asset is selected, reject `BannerOverlay < 65`; if no banner is selected, the identity header renders against theme background/text. Add an `UnprocessableEntity` application error mapped to HTTP 422 for unsafe saved-draft/asset publication state without changing existing 400 theme-save errors. Missing preconditions map to 428 and stale versions to 412. Failed writes leave prior JSON, version, and markers untouched.
- [ ] Implement host-resolved `GET /api/v1/theme` with `RequireTenant`; it must not accept a tenant ID in query/body. Return default values and version 1 when the snapshot is null. Apply no-store headers.
- [ ] Change `BrandMediaService.PublicAsync` to resolve the slot asset ID from the tenant snapshot, verify tenant ownership/readiness, and read that exact asset. Keep management listing and preview reads on the editable T1 slot behavior.
- [ ] Exclude `IsInPublishedTheme` rows from cleanup and include the marker in the conditional claim. Keep the existing favicon fallback when the published snapshot has no favicon.

## Task 3: Add tenant-safe frontend publication and storefront reads

**Files:** types/parsers, services/BFFs, storefront server pages and client shells.

- [ ] Add parsed `ThemePublication` and public `PublishedTheme` types. Validate enum, color, numeric, version, and nullable asset-ID fields before the values reach React.
- [ ] Add authenticated server service and same-origin `GET/POST /api/theme-publication?tenantId=…`. Enforce a single valid tenant selector, strict request shape, exact configured `Origin` for POST, existing server-only auth client, and `private, no-store`/`Vary: Cookie` responses.
- [ ] Add `getPublicTheme(hostHeader)` using the existing `getTenantSlug` and `getTenantApiBaseUrl` functions, `GET /api/v1/theme`, and the public request factory. Do not pass a browser tenant selector or use shared Next/CDN caching.
- [ ] Convert the allowlisted API appearance into the existing `StoreTheme` CSS-variable shape; use server-resolved restaurant name for `name`, use published asset slot URLs with `?v=<publicationVersion>`, and never expose IDs as a tenant authorization mechanism.
- [ ] Fetch theme on the real storefront page and pass it through `RestaurantMenu` to `LiveCustomerShell` and `LiveRestaurantIdentity`. Apply colors, fonts, weights, spacing, radius, image ratio, banner height/alignment/overlay, banner visibility, and layout. Preserve the current 65% minimum scrim for a published banner.
- [ ] Set the versioned published favicon in root metadata. On tracking, use the validated host to fetch the menu identity and published theme, set the restaurant title/favicon, and pass the theme into its customer shell.
- [ ] Keep menu data, checkout behavior, tracking token handling, sample previews, and menu-locale selection unchanged.

## Task 4: Separate Studio draft save from publication and correct navigation labels

**Files:** Studio hook/controller/components, brand workspace, EN/FR catalogs.

- [ ] Keep the current T2 Save draft action. Add a distinct Publish action that is enabled only when the local appearance is saved, both query versions are current, and publication is not pending.
- [ ] On successful publish, refresh published-theme, publication-status, and saved-brand query data; on failure or conflict, retain the old live state and all browser edits. Offer explicit reload for stale publication.
- [ ] Add Discard to clear only local unsaved edits and reload server-saved theme; keep Reset design as a local stage-default action that still requires save and publish. Do not reset/remove brand slots.
- [ ] Add a localized next-publication notice after saved brand asset changes. Keep brand slot save/removal scoped per slot.
- [ ] Change the tab values in `messages/en.json` and `messages/fr.json` to “Design” and “Brand & Details”; preserve internal state and `panel=appearance|brand` deep links.
- [ ] Keep sample preview disclosure and the existing validated storefront URL/copy action; do not introduce order/payment side effects into preview.
- [ ] Confirm both tabs and actions use shared design-system controls, semantic selected/status state, visible keyboard focus, responsive wrapping, reduced-motion handling, and the existing accessibility targets.

## Task 5: Update contracts/docs and perform non-test verification

**Files:** API/database/frontend docs, T3 backlog card, source branches.

- [ ] Document routes, ETags, error statuses, snapshot/null defaults, migration backfill, media release retention, host-only tenant resolution, and current deployment boundary in the API, database, and architecture references.
- [ ] Add T3 acceptance steps for desktop, 390px preview, 320/375/390/768/1024/1440/wide viewport checks, EN/FR, keyboard/focus, reduced motion, 200% zoom, a fresh guest session, refresh, all three media slots, and tenant/cache isolation to `docs/functional-test-plan.md`.
- [ ] Update the backlog entry to the implemented source state and keep production migration/deployment/hosted acceptance separate from local implementation.
- [ ] Run `dotnet build apps/api/WhitePlate.Api/WhitePlate.Api.csproj` from the repository root.
- [ ] From `apps/frontend`, run `npm run lint`, `npm run typecheck`, `npm run format:check`, and `npm run build` when the locked frontend dependencies are available. Record unavailable commands and exact failures.
- [ ] Run `git diff --check`, inspect the complete diff, and commit the feature with a Conventional Commit message. Do not run or add tests unless the user asks for verification.

## Plan self-review

- Spec coverage maps to Tasks 1–4; API, database, frontend, and T1 media docs map to Task 5.
- The plan uses one JSON snapshot for appearance and media, one independent publication version, and no browser-provided media selectors.
- No deployment or shared database migration is included. Automated tests are excluded by the active instruction; the plan records this as a verification limitation.
