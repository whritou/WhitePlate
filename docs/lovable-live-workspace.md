# Lovable design on real application routes

10 October 2026. This extends the user-approved [Lovable migration](lovable-migration.md) from the landing/demo to real workspaces and tenant storefronts. It preserves the existing App Router, Better Auth, authorized C# contracts, request adapters, query lifecycle and guest checkout. No API, schema or backend project was changed: existing contracts cover the connected operations. Missing features use clearly identified fictitious data or local drafts, as requested; API failures do not silently become sample data.

## Route mapping and implemented behavior

Paths retain `/en` or `/fr`. Organization context uses `organizationId`; restaurant context uses `tenantId`.

| Lovable screen | Real route | Data and operations |
| --- | --- | --- |
| Dashboard | `/organization/dashboard?tenantId=…` | Authorized current order page, up to 50 unarchived orders. Counts and amounts describe the loaded page, not today's revenue or settled payments. Amounts remain grouped by currency. |
| Orders | `/organization/orders?tenantId=…` | Existing kitchen Kanban, REST transitions, SignalR hints and recovery; operational layout retained with Lovable tokens. |
| History | `/organization/order-history?tenantId=…` | Existing archived order history, filters and pagination; operational layout retained. |
| Analytics | `/organization/analytics?tenantId=…` | Original Lovable charts and fictitious figures, explicitly marked. Owner/manager authorization required. |
| Menu | `/organization/catalog?tenantId=…` | Existing real catalog, categories, extras, translations, discounts, stock and galleries. Editor/table behavior retained with source fonts, borders, colors and scoped overlays. |
| Studio | `/organization/theming?tenantId=…` | Original Lovable appearance editor and sample customer previews; local draft only. Separate brand-media tab preserves actual upload/storage operations. |
| Staff | `/organization/team?organizationId=…` | Existing roster, invitations and revocation. Real roles and API fields retained; source styling applied by shared workspace scope. |
| Settings | `/organization/settings?organizationId=…&section=…` | Original seven-section shell. Actual organization name/archive/restore form; restaurant actions link to real management. Legal information, payments, billing, domains and notifications remain identified placeholders/drafts. |
| Store / checkout | Tenant-host `/` and `/?step=checkout&menuLocale=…` | Real catalog and uploaded assets, source customer header/hero/product grid/basket. Original guest controller, cart validation, authoritative checkout, discounts and idempotency retained. |
| Tracking | Existing tenant-host localized `/order/[orderId]#<trackingToken>` route | Customer shell updated; existing capability token, REST status recovery and order snapshots retained. |

Creation, invitation acceptance and authentication URLs remain available. Auth screens now follow the recovered Lovable split composition, while retaining Better Auth. The horizontal workspace shell replaces the old sidebar, retaining authorized context selection, FR/EN, theme preference, sign-out and skip link. Organization and restaurant menus use actual authorized contexts; kitchen membership only exposes orders. It never navigates to demo pages.

## Design and component ownership

- `components/lovable/lovable.css` and `fonts.css` remain the recovered source reference; local assets/fonts/licenses remain under `public/lovable`.
- `components/lovable/live.css` maps existing shared control aliases onto source tokens within `.lovable-surface.lovable-live`. No global Culinary Commerce palette is replaced. Backoffice surfaces stay light and square; customer scope uses the source default customer theme, including rounded cards.
- `components/organization/workspace-shell.tsx` owns the real horizontal navigation. `lib/live-workspace-navigation.ts` is its pure context-aware URL mapping.
- `components/organization/live-settings.tsx`, `live-studio.tsx`, `live-dashboard.tsx` reuse or adapt recovered source recipes to actual contracts. `missing-feature-notice.tsx` discloses fictitious behavior in both catalogs.
- `components/storefront/live-customer-shell.tsx`, `live-restaurant-identity.tsx` and `live-store-actions.tsx` adapt customer recipes around existing guest controls. Uploaded restaurant/product images remain authoritative; missing assets show neutral fallbacks.
- `components/ui/visual-scope.tsx` carries scoped classes/theme variables through shared Dialog, Sheet and AlertDialog portals. Base UI continues to manage keyboard focus and Escape.
- `services/live-workspace.ts` gates the added dashboard/analytics pages on verified sessions and authorized restaurant memberships. Browser context is never authorization.

Appearance/settings drafts are isolated by account and context: `whiteplate-live-draft:<userId>:<tenantId>:appearance` and `whiteplate-live-draft:<userId>:<organizationId>:settings`. They never publish a restaurant theme and do not reuse demo storage. Drafts remain on the local browser after sign-out but are not loaded for another account/context. Demo storage and routes remain separate.

## Pending backend connections and visual adaptations

| Interface | Remaining connection |
| --- | --- |
| Analytics | Authorized reporting/period aggregates; chart figures are fictitious. |
| Stripe, payments, payouts, invoices and subscriptions | Verified account state, payment/billing integration and authoritative amounts. Connect Stripe is disabled. |
| Legal/company details | Persisted legal name, VAT/SIRET and billing contact; fields are disabled examples. |
| Appearance | Validated tenant theme persistence/publication and theme consumption by the live storefront. Save stores a browser draft only; the Studio preview uses a sample menu. |
| Domains and notification preferences | Actual ownership/DNS/TLS verification, configuration persistence and delivery. No DNS/email operation is performed. |
| Fine-grained custom staff permissions | Lovable permission matrix has no equivalent real contract; existing fixed API roles are preserved. |
| Restaurant contact/service slots and payment-method choices | Live contracts do not provide all original source fields. The live checkout composition disables and discloses unconnected controls; no payment/slot behavior is invented. |

Exact source shells, fonts, tokens and compatible components are reused. Operational catalog/order/history/team compositions now adopt source toolbars, category sidebar, bordered tables, lane headers and compact tickets. Existing contracts and required API/error/retry states remain; differences in real data and supported fields prevent pixel-identical replacement of every sample screen. Tenant identity, text and images reflect actual API data. Additional notices, locale controls and 44px touch targets are intentional. No reference screenshots were supplied, so verification does not claim measured pixel parity.

## Development and verification

Use the package-local commands from [development](development.md): `npm run dev`, `npm run lint`, `npm run typecheck`, `npm test`, `npm run format:check`, `npm run build`. Node 24.19 and npm 11.17 are the declared runtimes. Production builds require valid HTTPS auth/API origins; inert HTTPS overrides can verify compilation without contacting hosted services.

`/[locale]/live-workspace-test?view=settings|studio|dashboard|analytics|store|team` is a development-only presentation fixture, with no production authorization bypass. Like the existing catalog fixture, it returns 404 in production. It does not seed the database.

```sh
WHITEPLATE_ACCEPTANCE_URL=http://localhost:3020 npm run test:browser -- --project=live-workspace
WHITEPLATE_ACCEPTANCE_URL=http://localhost:3020 npm run test:browser -- --project=menu-builder menu-manager.spec.ts
WHITEPLATE_ACCEPTANCE_URL=http://localhost:3015 npm run test:browser -- --project=lovable-migration
```

PowerShell: set `$env:WHITEPLATE_ACCEPTANCE_URL` before the command. Live fixture tests require a development server; public/demo production tests can run on `npm run start -- --port 3015`.

The task handoff records final command results. These checks exercise fixture presentation and client behavior, source guards and existing adapters. They do not prove hosted upload, email, SignalR or checkout acceptance for this migration. Kanban recording is deferred with the user's explicit authorization.

### Verification record — 10 October 2026

Package commands below were executed through the bundled Node 24.19 runtime (the system Node is older), invoking their corresponding local CLI entry points.

| Check | Result |
| --- | --- |
| `npm test` / `vitest run` | 69 files, 438 tests passed. After final context-key changes, the affected settings/shell suites passed again: 9 tests. |
| `npm run typecheck` / `tsc --noEmit` | Passed; final production build also completed TypeScript checking. |
| `npm run lint` / `eslint .` | Exit 0, 0 errors, 19 existing `no-img-element` warnings. |
| `npm run format:check` | Failed on 163 pre-existing untouched TS/TSX files. Targeted Prettier check passed for every changed/new TS/TSX file. No unrelated format rewrite. |
| `npm run build` / `next build --webpack` | Passed with process-only inert HTTPS `BETTER_AUTH_URL` and `API_BASE_URL` overrides; 87 static pages generated. Existing pg SSL-mode notices remain. Environment files were not edited. |
| Playwright `live-workspace` on dev 3020 | 7 passed: FR/EN views at 320/390/768/1440px, context URLs, missing-payment disclosure, draft isolation, real editor portal/Escape, real customer cart quantities/focus without API mutations. |
| Playwright `workspace-locale` | 1 passed: flags and localized route/query preservation. |
| Playwright `menu-manager.spec.ts` | 7 passed: existing real catalog interactions, drafts, categories, extras, translations and failed-write recovery. |
| Playwright responsive existing-live fixture check | 1 passed: catalog/history/orders containment at 320/390/768/1280px. |
| Playwright `lovable-migration` + `public-responsive.spec.ts` on production 3015 | 18 passed: demo/landing regression, navigation, local checkout, Studio fonts, FR/EN, light/dark preferences, breakpoint edges and text zoom. |
| Additional production browser checks | EN/FR live fixture returned 404; anonymous dashboard/analytics/settings/theming visits redirected to sign-in. |
| `python docs/design-system/verify.py` and `git diff --check` | Passed: 119 canonical contrast pairs, CSS/token parity and documentation scan; clean diff whitespace. This is not a pixel-comparison test of every Lovable component. |

Desktop settings screenshots were inspected against the recovered source settings screen at 1440×900, with the real mobile adaptation at 390×900. Context-picker wrapping and unintended source-button typography overrides were corrected. No reference capture supplied by Lovable was available. Backend tests were not rerun because backend code/contracts were unchanged. No hosted restaurant data was modified by acceptance runs.


### Remaining screens and restored source — 10 October 2026

The supplied `C:\Users\whrit\Desktop\whiteplate.zip` is the current visual reference (SHA-256 `44b45d882fb28a4fa520f50bf9ceeea1eab5fe2329e3500d945f9edbcee48e6b`). Every source `src/assets/` file matches its existing `public/lovable` counterpart byte for byte. Archive documentation is reference material, not application-development instructions.

| Source recipe | Current integration |
| --- | --- |
| `AuthPage.tsx`, login/register | `/sign-in`, `/sign-up`, `/forgot-password`, `/reset-password`; source left form/right hero/bottom ink caption, local hero, account header, Space Grotesk, green actions. Verification, unauthorized and invitation acceptance reuse the account frame. Better Auth, actual configured providers, validation and tokens remain authoritative. |
| Menu | Actual catalog toolbar, underline tab strip, category navigation and square editor controls; category/product/extras/translations/photos and ordering saves retained. |
| Orders | Source lane headers, status markers, compact ticket bands and responsive columns. All five real statuses remain, including Cancelled absent from the four-lane source. Drag/keyboard transitions, version checking and SignalR recovery retained. Counts describe loaded real orders, without invented revenue. |
| History | Source heading, table surface and density; existing real filters, mobile Sheet, paging and receipt snapshots retained. |
| Staff | Actual member/invitation tables and summary cells; only pending invitations can be revoked. Source permission matrix is an explicitly fictitious, read-only preview and grants no authorization. |
| Dashboard | Source contiguous metrics strip and recent-order table populated with actual loaded orders. No paid-order claim is inferred from order totals. |
| Studio | Actual logo/favicon/banner editor sidebar and adjacent preview using real media; storage/save/removal remain unchanged. |
| Settings | Actual organization rename/archive form and restaurant cards from the authorized existing restaurant read; original settings navigation and illustrative missing-service panels retained. |
| Organizations/creation | Source square surfaces, spacing, display headings and bordered creation forms, preserving actual creation/archive links and actions. These flows have no exact source counterpart. |
| Customer checkout/tracking | Original two-column pickup/contact/order-summary composition and vertical tracking timeline around real cart, name, discount, receipt and capability tracking. Quantity, remove, uncertainty retry and tenant isolation remain active. |

All routes retain localized existing URLs. No API schema or C# logic was changed. Email/phone, order notes, service slots, payment preferences and custom staff permissions remain disabled or read-only examples pending backend contracts; analytics, billing, domains, notification preferences and theme publication retain their existing clearly marked browser drafts. No example is submitted as a real checkout preference. Additional Microsoft login (when configured), API error states, translation controls, Cancelled lane and identity-dependent content are intentional differences from the ZIP. No original screenshot was supplied, so pixel-perfect parity is not asserted.

New presentation checks live in `tests/browser/lovable-remaining.spec.ts` (`--project=lovable-remaining`), testing FR/EN account pages at 390/1440px, actual team tables/revocation controls and cart-to-checkout quantity/name editing without API writes. `live-workspace-test` remains unavailable in production; fixtures are not real authentication or hosted acceptance.


### Verification of remaining screens — 10 October 2026

| Command/check | Actual result |
| --- | --- |
| `vitest run` | 69 files / 438 tests passed after the final TSX changes. Previous lane-layout assertion was updated to the original two/four-column recipe; roster mocks now include the recovered copy lookup. |
| `tsc --noEmit` | Passed. |
| `eslint . --fix` | Exit 0: 0 errors / 19 existing source-image warnings. |
| `prettier --check "**/*.{ts,tsx}"` | Global check still fails on 155 untouched files; every changed/new TS/TSX file passed the targeted check. |
| `next build --webpack` | Passed with inert process-only HTTPS auth/API overrides, including TypeScript and 87 static pages. Existing PostgreSQL SSL-mode warnings remain; no environment file was edited. |
| Playwright `lovable-remaining` + `live-workspace` + `menu-builder` + `orders-kanban` + `order-history` | All 42 scenarios passed across the combined run and targeted recovery run. The combined run had 37 passes: four ticket-touch-size failures were fixed by retaining 48px actions; one dev-fixture readiness timeout passed on a fresh isolated run. Earlier UTF-8 write and duplicate category-label failures were corrected. |
| Playwright `lovable-remaining` + `brand-assets` after final account/checkout changes | 35 passed, including all 30 brand-media scenarios, FR/EN, 320–1920px, theme preferences, text zoom, reduced motion, upload/save/removal and offline recovery. |
| Production browser smoke on port 3030 | FR/EN live fixture returns 404, sign-in renders the source 36px heading, anonymous dashboard/settings/theming visits redirect to sign-in. |
| Asset comparison | All source assets match existing local assets byte for byte. |
| Visual inspection | Auth captures inspected at 390×900 and 1440×900 against the source composition. Source heading size, green links, left/right ordering and full-opacity original hero corrected. No supplied screenshot/pixel-diff baseline exists. |
| `python docs/design-system/verify.py`, `git diff --check` | Passed (119 canonical contrast pairs, token parity, documentation links and whitespace). |

These runs use local fixtures and mocked network requests where applicable; they do not demonstrate hosted business acceptance. C# and API schemas were unchanged, so backend tests were not rerun. Kanban recording remains deferred by explicit user authorization.

## Workspace regression follow-up — 10 October 2026

The [#65 handoff](audits/workspace-regressions.md) supersedes theme-toggle and duplicated organization-overview behavior described in earlier baselines. Demo and real history now use one table/filter/summary/export implementation. Category creation stays inside the product editor, and Studio cards respond to their available container width. Restaurant settings are entry points to existing actions; theme publication and new settings APIs remain separate roadmap work.
