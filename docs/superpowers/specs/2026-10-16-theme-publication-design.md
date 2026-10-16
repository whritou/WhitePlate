# T3 theme preview and publication design

Date: 2026-10-16. Status: written spec ready for user review.

## Intent and scope

T3 applies the restaurant's deliberately published T2 appearance and T1 logo, favicon and banner to its real tenant storefront. Theme drafts and saved brand media remain editable independently; neither change affects the public storefront until an owner or manager publishes. The Studio retains its current Lovable composition and sample menu/order previews, with explicit preview-only disclosure.

The connected Studio tabs are named **Design** and **Brand & Details**. These are labels for the existing theme editor and brand-media workspace; they do not introduce duplicate restaurant identity/contact forms. Existing S1 settings remain authoritative for establishment details.

In scope: publication state and concurrency, safe theme validation, T1 media publication/retention, public theme and media reads, the live menu/checkout/tracking presentation and favicon, Studio save/publish/reset/discard states, English/French copy, existing shop URL/copy access, docs, and source-level verification. Custom domains, menu publication, order/payment behavior, real ratings or service promises, and redesigning the existing sample previews are out of scope.

## Current behavior and constraints

T2 stores an owner/manager-authorized `ThemeDraftJson` and `ThemeDraftVersion`; the draft is not public. T1 stores the current saved media slot on `MediaAssets.IsActive`, and the public image route currently reads that slot immediately. Replaced media expires after seven days and `ExpiredMediaCleanup` deletes expired objects. The live customer shell currently uses `DEFAULT_THEME`; public menu metadata uses the restaurant name and current favicon, while tracking uses generic metadata.

The API resolves public tenants from the request host. Browser-provided tenant IDs never authorize access. All public theme/media reads must remain host-resolved and `no-store`; protected publication requests must recheck active owner/manager membership and tenant/organization state.

## Decision: publish one versioned snapshot

Keep the existing theme draft fields. Add nullable JSONB `PublishedThemeJson` and required integer `ThemePublicationVersion` (initially 1) to `Tenant`. The snapshot contains the allowlisted `ThemeAppearance`, nullable saved media asset IDs for logo/favicon/banner, the source draft version, and nullable publication time. A missing snapshot resolves to the existing default appearance, null asset IDs, and no publication time. Add an `IsInPublishedTheme` marker to `MediaAsset` so the cleanup worker can efficiently preserve exactly the images referenced by the active public snapshot.

The management publish operation snapshots the latest **saved** theme draft and current saved T1 slots; it never accepts arbitrary media IDs or an appearance from the browser. The request carries both the expected draft version and expected publication version. The API validates the theme, confirms selected assets are ready and tenant-owned, checks active membership in the conditional write, and commits the new snapshot, publication version, and media publication markers in one database transaction. The marker is true only for assets in the resulting snapshot. On release, a retired asset gets a fresh seven-day expiry so the grace period begins after it leaves the live theme. Missing/stale versions fail with precondition errors. A failure leaves the previous snapshot and its images live. Concurrent T1 saves are linearized against publication by their database transactions.

The initial migration preserves existing live behavior: it backfills each existing tenant with the effective default appearance, source draft version, null publication time, and the current active T1 asset IDs, then marks those referenced assets as in the published theme. New tenants begin with a null snapshot and publication version 1, which resolves to the default appearance and no assets. New media saves after rollout update the editable active slot only. The previously published object remains readable until a later successful publication releases it; the transactional release restarts its seven-day retention window. No startup migration is added.

Add these contracts alongside the existing T2 theme routes:

| Route | Contract |
| --- | --- |
| `GET /api/v1/tenants/{tenantId}/theme/publication` | Protected by active owner/manager membership; returns the published snapshot and quoted publication-version ETag. |
| `POST /api/v1/tenants/{tenantId}/theme/publication` | Protected; body `{ "draftVersion": n }`, `If-Match: "<publicationVersion>"`. The server snapshots the current saved draft and media slots. Returns the new published snapshot and ETag. Missing/invalid version preconditions return 428; stale draft/publication versions return 412; validation failures return 422. |
| `GET /api/v1/theme` | Public; resolves the tenant only from validated request host and returns its published appearance, media IDs, and publication version. No browser tenant selector. |
| `GET /api/v1/brand-assets/{slot}` | Existing public slot route, now reads the matching asset ID from the published snapshot rather than the editable active slot. |

The same-origin Studio BFF adds `/api/theme-publication?tenantId=…` GET/POST and applies the existing authenticated server-only API client, exact-origin mutation check, safe error mapping, and `private, no-store`/`Vary: Cookie` behavior. Public BFF reads continue deriving the upstream solely from the validated incoming host and fixed server configuration, ignoring browser tenant selectors. Include the publication version in storefront media URLs for refresh behavior, and return `Cache-Control: no-store` on public API and BFF responses. Do not use shared CDN/Next caching.

## Publication safety

Saving a draft continues to allow editing combinations that are not ready to publish. The API recomputes publication contrast; it does not trust the frontend's diagnostic. Text/background, primary foreground/background, and text/accent must each meet 4.5:1. When a banner is selected, the white banner heading/description use the existing dark scrim; publication requires at least 65% scrim opacity, which keeps white text legible over the worst-case bright image. With no banner, the identity area uses the theme background and theme text instead of white text over an unbounded surface. These rules preserve the existing T2 slider range for drafts while preventing unsafe publication.

The public menu and checkout use the published theme variables. The order-tracking page uses the same tenant theme and published favicon; its title continues to use server-resolved restaurant identity. The saved logo/banner/favicon are delivered only from the published snapshot. A versioned URL and `no-store` response make a publish visible after refresh without leaking one tenant's values into another tenant's cache.

## Studio behavior

- The existing Appearance tab becomes **Design**; the existing Brand Media tab becomes **Brand & Details**. Keep current `panel=appearance|brand` query values working for existing links.
- The design preview keeps its Store, Checkout, and Order Tracking modes and Desktop/Mobile widths (390px mobile preview). It updates instantly from local edits and continues to disclose sample menu/order data. Preview actions cannot create orders or charge a payment.
- **Save draft** persists the current local appearance using the existing T2 draft version. **Publish** is a separate action, enabled only when the local appearance is saved and the draft/publication versions are current. Successful publication refreshes the Studio's published-state query and storefront URLs. The current tenant's validated shop URL and copy action remain visible.
- **Discard** drops only unsaved browser edits and reloads the server-saved draft. **Reset design** stages the existing built-in default appearance in the editor; it does not remove saved media or change the public snapshot until the default is saved and explicitly published.
- Brand-media save/removal remains per slot, but a localized status explains that those changes are saved for the next publication. Publishing refreshes the saved-media and publication queries. Preserve pending, error, retry, conflict and authorization states; never clear edits after a failed write or publication.
- Stale publication reports a conflict and offers an explicit reload. Publication failure leaves the existing live theme unchanged. Unauthorized/inactive/foreign tenant state hides protected controls as it does today.

The Studio layout remains within the canonical light Lovable workspace recipe and shared WhitePlate tokens. Controls retain keyboard access, visible focus, semantic tab/status roles, 44px desktop and 48px tablet targets, both locales, responsive wrapping, reduced-motion behavior, and 200% text zoom support.

## Alternatives considered

1. **One serialized publication snapshot with referenced media (selected):** one atomic unit for theme and assets, independent optimistic version, and a focused migration. The media marker lets cleanup preserve old published files without reading/parsing JSON in every cleanup query.
2. **Published copies of every appearance/media field:** explicit columns, but duplicates the T2 model and adds synchronization/migration work for each new style field.
3. **Publish T2 styling but keep T1 media immediately public:** smaller change, but permits a partially applied brand and fails the T3 requirement to publish logo, favicon, banner and styling together.

## Verification and rollout

Add domain/application/API and relational persistence coverage for contrast rules, failed/stale publication, concurrent saves, owner/manager access, Kitchen/foreign/revoked denial, atomic theme/media publication, and cleanup retention/release. Frontend coverage must check save versus publish, reset/discard, conflict recovery, EN/FR tab/status copy, preview-only behavior, and public menu/checkout/tracking theme/metadata. Browser acceptance must verify desktop and 390px mobile previews, refresh and a separate guest session, all T1 slots, and tenant/cache isolation. Record exact commands and failures; fixtures are not hosted acceptance.

Generate an additive EF migration and update API contracts, schema, backend/frontend architecture, the T1/T2/T3 documentation, and the functional test plan. Do not apply the migration to a shared database or deploy services as part of source implementation. Production migration/API deployment and hosted acceptance remain separately reported rollout work.

## Scope boundary

Existing restaurant identity, menu, ordering, checkout, discounts, tracking capabilities, media normalization/storage, tenant host resolution, T2 draft contract, and custom-domain policy remain authoritative. Manual/phone orders, payment processing, ratings, fictitious business details, custom DNS/TLS and unrelated workspace changes are excluded.
