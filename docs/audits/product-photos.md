# M5 — Product photo galleries

9 October 2026. Source implementation and local verification. Real bucket operations, shared PostgreSQL rollout and hosted acceptance remain open; the project card stays In review.

## Delivered behavior

The product editor supports up to eight ordered images, cover selection, upload, replacement, confirmed removal, processed previews, progress, retry and independent gallery save/discard. Failed uploads and saves preserve the published gallery and unsaved work. Guest cards display the saved cover or localized fallback; the actual product/options dialog displays all saved images. Photos are separate from product metadata saves. M4 publication is still Backlog, so explicit gallery save publishes immediately.

Persisted tenant membership and exact product/media ownership authorize protected operations. Host-derived tenant identity controls public image delivery. Archived products/categories reject mutations, and hidden/archived categories deny public delivery. Ordered expected IDs prevent stale gallery saves. Generated private keys, validated/re-encoded content, bounded payloads and no-store image delivery reuse T1 infrastructure. See [ADR 0008](../architecture/decisions/0008-product-photo-gallery.md) for formats, crop, variants, accessible descriptions, retention and migration downgrade constraints.

## Stitch and responsive comparison

Both `D:/Telechargements/menu-builder.html` and its screenshot were inspected, including inactive translation content and available dialog markup. Reference content was treated as design evidence. The implementation retains WhitePlate's existing organization navigation, category panel, editor hierarchy, photo panel beside product fields and option groups below. The thumbnail strip and ordering controls extend the single-photo export for the user's explicit multiple-image requirement. Shared runtime tokens were not changed.

Editor and guest checks cover 320, 375, 390, 768, 1024, 1440 and 1920px, EN/FR, light/dark editor states, 200% root text sizing, reduced motion, keyboard removal-dialog focus return, touch targets and document overflow. This exercises enlarged text layout rather than asserting browser zoom equivalence. Mixed 1:1 and 4:3 images use reserved square guest canvases and contain framing, preventing distortion or gallery height shifts. The detail gallery sits inside the scrollable body so quantity and footer controls remain accessible.

Visually inspected final captures:

- [French desktop, light](assets/product-photos/fr-light-1440.png)
- [English phone, dark](assets/product-photos/en-dark-390.png)

These use development-only fixtures and simulated browser endpoints. Screenshot review caught an eight-pixel photo column caused by `max-w-sm` resolving against a spacing token; an explicit local maximum and minimum-width assertion corrected it. Narrow option-row wrapping and clipped guest dialog controls at enlarged text were also corrected. These are local responsive corrections within M5, not a main workspace redesign. No global design-system deviation was introduced.

## Exact verification

Commands used bundled Node 24.19 directly because the shell runtime did not expose it consistently. Frontend commands ran from `apps/frontend`; the .NET command ran from the repository root.

- `dotnet test apps/api/WhitePlate.slnx`: **193 passed**. Real SQLite metadata, persisted memberships and native image processing with dictionary object storage. Covers upload/save/read-back, multiple images, reorder/removal, failed replacement, invalid files, stale writes, archived rules, foreign product/media denial, membership revocation, hidden category delivery and cleanup of all variants.
- `node node_modules/vitest/vitest.mjs run`: **66 files, 427 tests passed**. Includes strict gallery parsing, bounded authenticated BFF requests and host-derived public delivery/cache checks.
- `node node_modules/eslint/bin/eslint.js .`: **passed**.
- `node node_modules/typescript/bin/tsc --noEmit`: **passed**.
- `node node_modules/@playwright/test/cli.js test --project product-photos --max-failures 2`: **44 passed** on the final responsive source. Covers editor and actual guest components, progress/error recovery, invalid empty input, failed save, offline behavior, preserved drafts and removal focus return.
- Earlier combined `node node_modules/@playwright/test/cli.js test --project product-photos --project menu-builder --max-failures 2`: **53 passed**, comprising 44 photo checks and nine M1 regressions. This preceded the final local photo-column maximum-width correction; the 44 photo checks were rerun afterward.
- Scoped changed-file `node node_modules/prettier/bin/prettier.cjs --check <changed TypeScript files>`: **passed**.
- Full `node node_modules/prettier/bin/prettier.cjs --check '**/*.{ts,tsx}'`: **failed, 178 existing files** outside this feature. Unrelated formatting differences were preserved.
- `node node_modules/next/dist/bin/next build --webpack`: **passed**, with process-only `BETTER_AUTH_URL=https://whiteplate-build.invalid` and `API_BASE_URL=https://whiteplate-api-build.invalid`. Environment files were not edited. Existing PostgreSQL SSL-mode deprecation warnings remain.
- `git diff --check`: **passed**.

Test-first checks initially failed on missing routes/modules and then passed after implementation. A public hidden-category test exposed inappropriate image access before its ownership/visibility predicate was corrected. Responsive tests exposed narrow overflow and inaccessible guest footer controls; final checks passed after correction. Fixture selectors and a stopped development server required test-harness corrections and are not counted as persistence evidence.

## Persistence and hosted verification still required

Migration `20261009112850_ProductPhotoGallery` was generated with EF tooling after T1's migrations using a dummy design-time connection. It was not applied to a shared database. Existing user-owned `apps/api/brand-media-migrations.sql` was preserved and excluded from this change.

No bucket was provisioned or contacted here. Real S3 upload/read/delete, PostgreSQL migration/concurrency, interrupted-upload cleanup, Linux native image-library packaging, two-tenant hosted delivery and membership revocation remain required. Browser API mocks and dictionary storage do not establish those results. Follow the [functional test plan](../functional-test-plan.md) and rollout guidance in [development](../development.md); keep M5 In review until this evidence is recorded.
