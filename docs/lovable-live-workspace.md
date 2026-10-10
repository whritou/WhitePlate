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

Creation, invitation acceptance and authentication URLs remain available. Auth screens keep their existing design. The horizontal workspace shell replaces the old sidebar, retaining authorized context selection, FR/EN, theme preference, sign-out and skip link. Organization and restaurant menus use actual authorized contexts; kitchen membership only exposes orders. It never navigates to demo pages.

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
| Restaurant contact/service slots and payment-method choices | Live contracts do not provide all original source fields. Existing checkout illustration identifies unconnected controls; no payment/slot behavior is invented. |

Exact source shells, fonts, tokens and compatible components are reused. Operational catalog/order/history/team forms retain their existing structures and required API/error/retry states; they are styled adaptations, not pixel-identical replacements of the sample screens. Tenant identity, text and images reflect actual API data. Additional notices, locale controls and 44px touch targets are intentional. No reference screenshots were supplied, so verification does not claim measured pixel parity.

## Development and verification

Use the package-local commands from [development](development.md): `npm run dev`, `npm run lint`, `npm run typecheck`, `npm test`, `npm run format:check`, `npm run build`. Node 24.19 and npm 11.17 are the declared runtimes. Production builds require valid HTTPS auth/API origins; inert HTTPS overrides can verify compilation without contacting hosted services.

`/[locale]/live-workspace-test?view=settings|studio|dashboard|analytics|store` is a development-only presentation fixture, with no production authorization bypass. Like the existing catalog fixture, it returns 404 in production. It does not seed the database.

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
