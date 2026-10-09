# T1 — Brand asset uploads

9 October 2026. Source implementation with local verification. Live bucket configuration, shared PostgreSQL migration rollout and hosted acceptance remain open; the project card stays In review.

## Implemented behavior

`/[locale]/organization/theming?tenantId=…` provides the restaurant's logo, favicon and banner editor. Uploads remain private drafts until the user explicitly saves that slot. Each slot supports processed preview, upload progress, save/discard, replacement, confirmed removal, fallback, validation, retry, offline and unavailable states. Failed requests preserve drafts and the active asset; synchronous mutation guards prevent duplicate writes. Drafts are held in memory, warn before page unload and reset on account/tenant changes. App EN/FR remains separate from restaurant menu languages.

Persisted owner/manager membership authorizes every protected operation. The shared HTTP factory and authenticated BFF mediate binary requests. API-mediated preview and host-resolved public delivery expose no bucket credentials or object URLs. Only active assets are publicly readable. Expected-current-asset preconditions reject stale replacements. Metadata uses EF; object bytes use the private S3-compatible adapter. An hourly cleanup worker claims expired, inactive rows before deleting objects and metadata, retaining failed deletions for retry.

The implementation decision, formats, dimensions, crop behavior and retention are documented in [ADR 0007](../architecture/decisions/0007-brand-media-storage.md). Pending drafts expire after 24 hours; retired assets after seven days. SVG and animated images are rejected, accepted inputs are decoded and re-encoded with metadata stripped, and image resource limits apply. Bucket provisioning and server credentials are operator configuration described in [development](../development.md).

## Stitch comparison and accessibility

Reference: checked-in [theming screenshot](../design-system/references/restaurant-management-2026-10-08/theming.png) and companion HTML, treated as design evidence. The implementation retains the organization sidebar, title, Brand Identity Assets card with paired logo/favicon tiles and a full-width banner, and the separate phone/desktop preview. It uses WhitePlate branding and the canonical tokens. Cards and preview stack on narrow screens; container-based tile layout prevents desktop column overflow. Header wrapping and 200% text-layout failures found during verification were corrected. Phone actions have at least 44px targets; tablet editor, preview, retry and dialog actions have at least 48px height.

Only T1 is operational. Palette, typography, custom domains and whole-theme publication remain separate tasks. The preview displays restaurant identity and asset state without fabricated products or synchronization claims. Shared runtime tokens were not changed. The light-mode eyebrow initially measured 2.97:1 contrast; switching its local text token produced 8.94:1 in light and 6.47:1 in dark. This measurement is for the corrected text against its rendered background, not a certification of every possible uploaded image.

Visually inspected captures:

- [French desktop, light](assets/brand-assets/desktop-fr-light.png)
- [English phone, dark](assets/brand-assets/mobile-en-dark.png)

These use a development-only fixture and mocked browser storage responses; their empty/fallback state is deliberate. They are design evidence, not proof of hosted persistence.

## Verification

Frontend commands ran from `apps/frontend` with bundled Node 24.19; API commands ran from the repository root.

- `dotnet test apps/api/WhitePlate.slnx`: 189 passed. Tests use real SQLite metadata, persisted memberships and the image processor; API storage is a test dictionary. Covers cross-tenant denial, membership revocation, incomplete identities, save/read-back, stale preconditions, public draft denial, failed storage and cleanup. S3 adapter configuration tests do not contact a bucket.
- `npm test`: 63 files, 415 tests passed. Includes shared binary transport, validation/parsers, authenticated BFF and host-derived public delivery.
- `npm run lint`: passed.
- `npm run typecheck`: passed.
- `node node_modules/@playwright/test/cli.js test --project brand-assets --max-failures 1`: 30 passed. Covers EN/FR, light/dark at 320, 375, 390, 768, 1024, 1440 and 1920px, 200% root text size, reduced motion, document overflow, upload targets, retry/save draft retention, offline save, preview recovery and keyboard dialog focus return. Browser saves are simulated.
- Changed frontend files: scoped Prettier check passed. `npm run format:check` failed on 178 existing files outside T1. Those unrelated formatting differences were retained; the count fell from the earlier baseline after formatting the touched files.
- `npm run build`: passed with process-only `BETTER_AUTH_URL=https://whiteplate-build.invalid` and `API_BASE_URL=https://whiteplate-api-build.invalid`; environment files were not edited. Existing PostgreSQL connection-string SSL-mode deprecation warnings remain.
- `git diff --check`: passed.

The test-first pass exposed missing media types/transport, animated PNG acceptance, lost removal focus, offline mutation behavior and narrow/zoomed layout failures; each was corrected and the affected checks passed. A screenshot rerun after the session interruption failed with connection refused because the local server had stopped; it passed after restarting. Temporary contrast scripts were corrected to wait for the hidden fixture marker to attach. An initial browser command through npm ignored project flags and was stopped; it is not counted as acceptance evidence.

## Persistence and deployment limits

Generated migrations: `20261008205518_BrandMediaAssets` and `20261008210000_BrandMediaPublicationState`. Neither was applied to a shared database. Design-time generation used a dummy connection; a migration-removal attempt tried that connection and failed authentication without modifying a database. The final additive migration model passed API tests.

The S3 provider, private bucket, encryption/lifecycle policy and server credentials have not been provisioned or verified here. Real SDK upload/read/delete, PostgreSQL concurrency, cleanup after interrupted uploads, Linux native image-library packaging, public logo/banner/favicon delivery and two-tenant hosted checks remain required. Follow the [functional test plan](../functional-test-plan.md). Do not treat SQLite tests, dictionary storage or browser mocks as those results.
