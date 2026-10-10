# Lovable visual migration

9 October 2026. Initial scope: public landing and localized demonstration pages. The approved 10 October continuation is documented in [real workspace migration](lovable-live-workspace.md).

## Reference and routes

The user supplied `D:\Telechargements\whiteplate.zip`, a TanStack Start/Router export. Its code, styles and images are the visual reference. The application remains Next.js App Router, React 19, Tailwind 4, next-intl and Base UI. Lovable Supabase/Drizzle, authentication and server logic were not imported. Existing tenant host resolution, Better Auth and C# API/business behavior remain intact.

All paths have the existing `/en` or `/fr` prefix:

| Lovable | Next.js |
| --- | --- |
| `/` | `/[locale]` (existing tenant-host storefront branch retained) |
| `/store` | `/[locale]/demo` |
| `/checkout` | `/[locale]/demo/checkout` |
| `/track/$orderId` | `/[locale]/demo/tracking?orderId=…` |
| `/dashboard` | `/[locale]/demo/dashboard` |
| `/orders`, `/history`, `/analytics` | Corresponding `/[locale]/demo/*` pages |
| `/menu`, `/studio`, `/staff`, `/settings` | Corresponding `/[locale]/demo/*` pages |
| `/login`, `/register` | Existing localized `/sign-in`, `/sign-up` |

The four original demo URLs remain. Additional pages make the export's navigation usable. Older Stitch components are retained because shared use by live screens must not be assumed absent.

## Design, assets and implementation

The canonical [design system](design-system/README.md) now includes a scoped Lovable reference. `.lovable-surface` preserves Space Grotesk, kelp green/lime/ink, square backoffice borders, original hero overlay and source spacing/layout. The real workspace/customer extension is documented separately; Culinary Commerce remains the default for authentication and unscoped screens. The source is light: these scoped pages stay light even when the application theme is dark; restaurant presets can supply their own dark palette.

- `components/lovable/lovable.css`: scoped source tokens/component/customer CSS, plus explicit container widths to avoid existing Tailwind spacing alias collisions.
- `components/lovable/fonts.css`: local font faces for all twelve original Studio families and presets. Google font binaries were recovered because the archive includes font URLs but no binaries. OFL licenses accompany them.
- `public/lovable/`: original hero/restaurant assets and bundled fonts. Rendering/build do not fetch Google Fonts. Studio uploads remain browser data URLs.
- `components/lovable/landing-*`: original marketing sections, pricing/FAQ and interactive previews.
- `components/lovable/pages/`: original backoffice designs split into model/context/view/section files to satisfy the repository's file-size limit.
- CustomerShell, Storefront, CustomerCheckout, CustomerTracking and ProductThemePreview are shared with Studio.
- `components/ui/lovable-*`: Base UI adapters preserving original classes and existing control conventions. Dialogs add focus/Escape behavior; 44px touch targets can enlarge source controls.
- `navigation.tsx` maps source navigation to localized routes. `copy.tsx` resolves original phrases through `LovableOriginal`/`Lovable` in both catalogs.
- Product/category/option translations and editor content use the original menu language resolver directly. The customer menu initially follows the interface locale when available; its language selector then controls menu content independently. It waits for hydration before accepting changes.
- `lib/lovable`, `hooks/lovable`, `types/lovable`: isolated sample data, browser drafts, hydration and types. Storage keys start with `whiteplate-lovable-demo-`.

Recharts 2.15.4, matching the export, is the only added runtime dependency. No Radix or TanStack Router dependency was added. Existing locale controls and demo notice are intentional additions to the visual reference.

## Backend connections

No demo action is an authoritative restaurant operation. Checkout saves a local receipt and explicitly takes no payment and sends nothing to a restaurant. “Save demo” saves in this browser, without publishing a live store. DNS verification is disabled; displayed records are examples, not deployment instructions.

| Interface | Current state | Connection needed |
| --- | --- | --- |
| Menu/options/allergens/translations/stock | Local sample editor | Authorized catalog persistence and authoritative pricing/stock |
| Studio/restaurant identity/uploads | Local theme draft | Brand media storage and catalog design services |
| Checkout/payment/slots/discounts | Local demo validation/receipt | Real checkout, payment, availability, discounts and idempotency |
| Tracking/order board/history | Sample/local status and receipts | Authorized orders, public tracking capability and SignalR |
| Analytics/billing/payouts | Sample figures; payment disconnected | Tenant reporting and verified payment/billing state |
| Staff/invitations/permissions | Local roster; no email sent | Existing staff/invitation services and delivery |
| Domains/DNS/TLS | Examples; verification unavailable | Ownership verification, real records and certificate provisioning |
| Account links | Existing sign-in/signup | No auth migration |

Browser tenant identity is never authorization. Demo behavior remains separate; the real extension reuses existing contracts and explicitly identifies missing capabilities.

## Development and checks

From `apps/frontend`, with Node `^24.19.0` and npm `^11.17.0`:

```sh
npm ci
npm run dev
npm run lint
npm run typecheck
npm run format:check
npm test
npm run build
npm run start -- --port 3015
```

Run `npm run test:browser -- --project lovable-migration` with `WHITEPLATE_ACCEPTANCE_URL=http://localhost:3015`. PowerShell: `$env:WHITEPLATE_ACCEPTANCE_URL='http://localhost:3015'`. Production builds require the existing HTTPS auth/API configuration. Inert HTTPS origins can validate a build without exercising remote services.

The migration suite covers original assets, landing pricing/FAQ, FR/EN, route rendering, navigation, responsive containment and a local checkout journey without API writes. Backend integration acceptance is separate. No screenshots were included in the archive: local screenshots are checked against source/assets, without claiming measured pixel parity. Final results and remaining visual differences appear in the task handoff.

### Verification record — 9 October 2026

- `npm run lint`: exit 0, no errors; 19 `no-img-element` warnings for original asset rendering. These warnings remain visible.
- `npm run typecheck`: passed. `npm test`: 67 files, 432 tests passed, including the JSX spacing rule tests.
- `npm run build`: passed with inert HTTPS `BETTER_AUTH_URL` and `API_BASE_URL` overrides; 81 static pages generated. The first build with existing HTTP development values failed the existing production HTTPS validation. No environment files were changed. Existing PostgreSQL SSL-mode warnings remain.
- Prettier check of changed/new TypeScript files: passed. Full `npm run format:check` still reports 166 files outside this migration; unrelated files were not reformatted.
- `python docs/design-system/verify.py`: passed 119 contrast pairs, default CSS/token palette parity and 10 documentation link scans. This verifies the existing canonical palette, not a complete accessibility audit of the new scoped source palette.
- Eleven original images checked by SHA-256 against the export: identical. Local French landing captures inspected at 390 and 1440 pixels. The archive has no screenshot baselines, so pixel-perfect comparison cannot be measured.
- Playwright `--project=lovable-migration`: 11 passed on the final production build, covering all eleven demo routes in both locales at 320/390/768/1440 pixels, independent menu language selection, landing previews/pricing/FAQ, Studio fonts, dialogs and checkout without API writes. Earlier failures exposed and corrected narrow French layout overflow, dialog stacking, theme font overrides and the menu selector hydration race.
- Playwright `--project=responsive-layout public-responsive.spec.ts`: 7 passed; EN/FR and light/dark application settings at eleven breakpoint edges from 320 to 1536 pixels, 44px locale controls and doubled root text size. Customer checkout/basket subset: 2 passed.
- Existing live-screen fixture containment: 1 passed at 320/390/768/1280 pixels on the development server. Total browser checks: 21 passed across these suites/subsets. Development-only fixtures were not tested against production, where they intentionally return 404.
- C# solution tests were not rerun: no backend source, contracts, authentication implementation or business logic was changed.

The package-local CLI equivalents above were run using the bundled Node 24.19 runtime because the system PATH supplied Node 20.18.3. Browser testing used local Chrome through Playwright; the native browser connector was unavailable. Dependency installation reported 11 audit findings (10 high, 1 critical); dependency remediation was not included in this visual migration and existing dependencies were not upgraded.

Known intentional visual differences: existing localized demo navigation/notice, 44px interaction targets, keyboard/focus-capable dialogs and truthful demo/backend connection labels. Layouts wrap at narrow widths and at doubled text size. The original light visual reference is preserved; no extra dark marketing design was invented. Existing authentication screens retain their current design.

## Kanban

GitHub returned 404; `gh` was unavailable and the browser connector failed to start. The user explicitly authorized the migration with the kanban update deferred. No card is claimed created, updated or completed. The later card update must record actual checks and remaining backend connections.
