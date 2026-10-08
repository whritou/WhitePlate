# Full Stitch redesign handoff

8 October 2026 · branch `feat/stitch-app-redesign` · issue #53.

## Delivered

The real public WhitePlate landing page at `/en` and `/fr` follows the supplied landing export, with working locale/theme navigation, interactive kitchen/customer previews, billing toggle, FAQ and signup links. It is not labeled as a demo.

The `/en/demo` and `/fr/demo` route families implement the supplied menu, checkout, tracking and dashboard designs with an in-memory cart and local controls. Adding products, adjusting quantities, discount calculation, simulated checkout, receipt snapshots, status progression, dashboard tickets, rush/pause controls and theme swatches work locally. Refreshing or changing interface locale resets preview data. The six food products, addresses, prices and analytics are illustrative. No payment or restaurant mutation endpoint is called by these demos.

Existing tenant storefront, checkout, tracking, authentication, catalog, order-ticket and workspace screens adopt the shared visual direction. Real checkout validation, retries, idempotency, tenant routing and authorization, query/cache ownership and tracking capabilities remain in their existing modules. Live checkout payment/scheduling controls are explicitly labeled as visual previews; live kitchen analytics are explicitly labeled as sample figures. Food photos illustrate the design and are not persisted catalog attachments.

The canonical design system is version 2.1.0, with the full export's pale-blue surfaces, obsidian text, tangerine accents, locally bundled variable Inter/Plus Jakarta Sans fonts and font licenses. Both translation catalogs include all new copy.

## Verification

Node v24.19.0 was available; npm was not on PATH, so the installed package CLI entry points were used from `apps/frontend`:

- `node node_modules/vitest/vitest.mjs run`: 58 files, 387 tests passed. Includes five new calculation/receipt tests covering cent rounding, discounts, invalid carts and immutable receipts. The initial run exposed a dashboard locale mock; the mock was updated and the affected eight tests passed.
- `node node_modules/eslint/bin/eslint.js .`: passed after fixing shared-control spacing; no warnings.
- `node node_modules/typescript/bin/tsc --noEmit`: passed. The first run detected stale generated route types and an unavailable Lucide export; `next typegen` regenerated types and the icon was corrected. No generated files were hand-edited.
- Prettier checked all 50 changed TypeScript files successfully. `node node_modules/prettier/bin/prettier.cjs --check "**/*.{ts,tsx}"` still reports 194 pre-existing files outside this change. Unrelated files were not reformatted.
- `node node_modules/next/dist/bin/next build --webpack`: passed, including all eight EN/FR demo routes. Build used inert HTTPS auth/API origins. Non-blocking webpack cache EPERM and existing PostgreSQL SSL-mode deprecation warnings remain.
- `py -3 docs/design-system/verify.py --render`: passed 86 contrast pairs, CSS/token and source-palette parity, and documentation links; preview regenerated.
- `git diff --check`: passed.

Browser review used the existing local development server and a production preview. Checked English/light/dark presentation and French desktop/mobile layouts, public landing copy without a demo banner, menu assets, cart quantity updates, checkout total (two burgers, fries and shake: $41.30 subtotal, $4.13 discount, $2.97 tax, $40.14 total), receipt consistency, Preparing → Ready progression, dashboard test tickets and pause/resume state. At a 390px viewport, the French landing, menu, tracking and dashboard had no horizontal document overflow. Desktop menu images had no failed loads. Temporary viewport overrides were reset.

## Remaining boundaries

Payment processing, scheduled fulfillment, notifications, analytics, product media uploads and persisted tenant customization are future backend work. Wallet, directions and chat actions display local preview feedback. Legal/security footer labels have no published destination yet. These are visual placeholders, not claims that the corresponding services exist. Marketing text/prices follow the supplied export and are not connected to billing.

Authenticated hosted workflows, live payments and production restaurant persistence were not exercised. No API source changed; .NET tests were not run for this frontend-only redesign. Issue #53 should remain In review until broader authenticated/hosted acceptance and visual review are completed.
