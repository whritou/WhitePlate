# Store, checkout and tracking renderer parity — 19 October 2026

Status: shared-renderer implementation locally verified; exact full-journey and hosted acceptance remain open. This is not a declaration of exact hosted parity. It supersedes the narrower token-only findings in [the earlier audit](storefront-studio-theme-parity.md).

## Reference and implementation

The authenticated Chrome Studio at `https://white-plate.vercel.app/fr/organization/theming?tenantId=caf82471-099c-444f-87a1-89246edbef29` was inspected before replacing the real page composition. The real restaurant URL is `https://white-plate.vercel.app/fr/acceptance-check-20261006`. The saved appearance observed there uses Space Grotesk, primary `#1f7a4d`, accent `#c8f04a`, background `#f7f8f4`, text `#14201a`, airy spacing, grid cards, wide images and a 4px surface radius. The deployed sample menu and actual restaurant catalog are different, so their full screenshots alone cannot establish equivalent-data parity.

The real store now renders `demo/storefront/StorefrontView`, its cards, `ProductModal`, floating basket trigger and basket sheet. The real guest controller supplies cart state, option IDs, availability, currency and navigation through an explicit presentation binding. A real viewport-height parent also reproduces the Studio canvas height; short menus no longer leave an unthemed strip or shorten the basket sheet. Studio and real customer pages share `themeVariables`, `CustomerShell`, the checkout summary and `CustomerTracking`; they no longer maintain separate customer card/dialog recipes. `CustomerContactFields`, `CustomerPickupChoices`, `CustomerPickupLocation` and `CustomerRestaurantInfo` centralize their respective layouts.

The user approved four contract/presentation changes during this work:

- Secret tracking links may reveal immutable articles and monetary totals, but no customer contact details or order notes.
- The backend may persist the phone number and order notes. These are sent to authorized staff reads and remain absent from public tracking.
- Studio displays the same optional email-update and analytics consent controls as checkout. Preview controls remain local and do not subscribe anyone or send an order.
- A non-persisting quote calculates real checkout amounts before submission; the Studio sample aligns discount allocation and tax rounding with the order rules.

Different selections of one product now remain separate cart and order lines, matching Studio's variant behavior. Quantities update the selected variant in place. Duplicate identical product/option combinations are rejected at the API boundary; the UI combines their quantities. The API still prices every line against the published restaurant catalog, checks option constraints, and performs idempotent order creation. No client price becomes authoritative.

## Comparison method

Interaction correction approved during browser review: all shared source customer buttons now have visible hover feedback. Outline primary actions, including the header basket, become filled using the theme primary/foreground; the border does not thicken. Category, card/image, option, quantity, close and floating-basket actions receive tint/darkening without geometry changes. Pressed feedback is stronger, disabled controls are excluded, and reduced motion suppresses transitions. Dedicated browser scenarios exercise the Studio and real controllers separately.

`/[locale]/studio-parity-test` is development-only and returns not-found in production. It runs the actual Studio renderers and the real customer components with one controlled theme and the same restaurant/product data. Two products, a real image response, required options and independently priced variants are provided. The browser project compares 390×900 and 1024×900 captures; the existing theme test also checks EN/FR at 320, 390, 768, 1024, 1440 and 1920px.

The image comparison records dimensions, channel differences and absolute element bounds. It requires zero changed pixels, with no image tolerance. Store cards, selected-option modals, the floating trigger, two-product basket and three-line variant basket are compared both as cropped elements and as complete 390×900 / 1024×900 viewports. Only the Next.js development indicator is hidden in captures; no product content is masked. Both sides receive the same PNG photo bytes. Earlier separate element/viewport paints exposed one-unit edge-color differences; crops now come from the same viewport frame where the element fits, with a neutral pointer on both sides. A software-rendering experiment was removed. All 42 final raw-pixel reports are zero; neither image tolerance nor pixel masking was introduced.

Checkout captures include identical name, phone, notes and checked consent state. The shared header, collection block, complete contact block and order-item list are compared directly. Tracking compares its header, timeline and item list, then exercises Pending, Ready, Completed and Cancelled against the actual tracking controller. Confirmation uses the same controlled Pending state and receipt data through the Studio renderer binding; its header and item list are compared against the real receipt composition. Network-error/retry captures complement the API receipt tests and verify identical submitted attempts after an uncertain response. Controlled browser requests do not create hosted orders or charge payments.

## Remaining differences and acceptance limits

| Area | Exact remaining difference or unverified boundary |
| --- | --- |
| Checkout pickup copy | Studio describes a sample preparation duration. The real checkout displays the API's available date, time and time zone, and rejects unavailable slots. The radio/select recipe is shared, but these descriptions are different data/copy. |
| Checkout action | Studio offers a demo-order action. The real button sends an order and uses truthful payment/notification copy. These action text blocks and their wrapping are not certified identical. |
| Quote integration | The user approved a non-persisting API quote. The real checkout now loads authoritative subtotal, discount, tax and total before submission, blocks submission while unresolved, and offers retry on failure. Quote and order share catalog validation and discount calculation; tax allocation uses the same Domain operation. Studio's local sample calculation now applies the same per-line rounding and tax rules. Desktop/mobile totals before and after promotion have zero changed pixels. Hosted quote and successful submission remain unverified. |
| Payment and delivery | The implemented order flow is click-and-collect without an online charge. Payment copy describes that actual capability. This change does not implement card processing or delivery options. |
| Tracking and confirmation | Actual status, confirmation copy, refresh/menu/tracking actions, current collection information, and any tax line come from real order data. Studio's fixed preview badge/status and demo copy differ. Customer identity and order notes remain excluded from secret-link tracking; local confirmation may retain the submitted notes. Whole-page pixel equality is not asserted for these differing states. |
| Migration and deployment | `20261019082708_OrderCustomerDetails` is generated and reviewed locally, not applied to a shared database. The API and frontend changes have not been deployed by this task. Existing status-only APIs retain a truthful summary-unavailable fallback. |
| Hosted acceptance | Publication, separate guest session, refresh, a real successful checkout, stage transitions and desktop/mobile screenshots on the supplied URLs remain required after rollout. No local fixture result is presented as proof of them. |

Keep T3 open until the remaining acceptance is resolved. Source reuse and passing region comparisons are evidence for the implemented layouts, not proof that the three complete deployed journeys already match exactly.

## Verification record

- API: `dotnet test apps/api/WhitePlate.slnx --no-restore` — 372 passed, including invalid quote code/quantity/options, exact receipt amounts, foreign-product denial and no order/outbox/idempotency/reservation writes.
- EF: `dotnet ef migrations has-pending-model-changes --project apps/api/WhitePlate.Infrastructure --no-build` — no pending changes after migration generation. The migration adds only nullable bounded phone/notes columns.
- Frontend with Node 24.19.0: `node node_modules/typescript/bin/tsc --noEmit` passed; `node node_modules/vitest/vitest.mjs run` — 116 files / 727 tests passed, including quote tenant routing/data allowlisting and preview tax allocation. The receipt test subsequently passed with a distinct real restaurant phone and a missing-phone case; confirmation browser comparisons passed again on both widths. Confirmation help never falls back to the sample theme phone.
- Browser: `WHITEPLATE_ACCEPTANCE_URL=http://localhost:3010 node node_modules/@playwright/test/cli.js test --project=storefront-customer-parity` — 23/23 passed. Forty-two final raw-pixel reports record zero changed channels: twenty store region/viewport reports, eighteen checkout/confirmation/tracking region reports, and four quote-total reports. Store geometry, filled multi-product/variant baskets, checked consent fields and all implemented hover feedback also passed. Forms explicitly report hydration readiness before comparison input is filled and its values are checked.
- ESLint: 0 errors, 19 existing image-performance warnings in the full package run; focused changed-file checks passed. Changed-file Prettier passed. The latest package-wide `prettier --check .` reports 675 files outside the changed source set, including generated browser outputs; these were preserved. The earlier global run reported 658. No global formatting failure is waived or presented as passing.
- Production build with Node 24: compiled, typechecked and generated all pages successfully. The command supplied temporary HTTPS auth/API origins to meet production configuration validation without editing environment files. Existing PostgreSQL SSL-mode warnings and unavailable `/api/v1/me` reads appeared during generation; this compilation result does not verify API connectivity or a hosted session.
- Sharp 0.35.5 was declared explicitly for pixel decoding; the lock-only update retained the already installed version and introduced no dependency upgrade.
- Earlier sandbox attempts to run API tests and a production build hit Windows access errors on generated artifacts; escalated local checks were used. No shared database was modified to work around these errors.

Evidence: [side-by-side capture index](evidence/storefront-studio-parity-2026-10-19/comparison-index.md) and [all captures](evidence/storefront-studio-parity-2026-10-19/).
