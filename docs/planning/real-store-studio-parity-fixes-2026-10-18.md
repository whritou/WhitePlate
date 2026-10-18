# Real store matches Studio: proposed fix plan

Date: 18 October 2026. Status: proposed implementation sequence following the [code/UX review](../audits/storefront-studio-parity-2026-10-18.md); no product implementation in this documentation branch.

## Required outcome and boundaries

After the owner publishes, the real store must reproduce Studio's styling at the same content width: fonts/weights/scale, colors, button treatment, card/button radii, density, menu layout, image ratio and banner settings. Real data and supported operations remain authoritative. Compare the published appearance with the corresponding Studio appearance; unpublished drafts are allowed to differ.

**Only fix the real customer store and its live adapters/presentation.** Demo and Studio are read-only visual references. No editor redesign, sample-menu replacement, preset changes, new payment system, database migration, custom domain project or speculative tracking DTO expansion is included. Shared controls may gain an opt-in live behavior only if existing demo/Studio rendering is unchanged and tested. Use both FR/EN catalogs for new real-store copy.

Base implementation on current main, not the pre-existing local task branch. Preserve user work. Main advanced during the audit from `4543323` to `88de2e3` (PR #136), incorporating the partial customer-theme fixes previously inspected at `b89f0b3`. The documentation branch is updated onto `88de2e3`. Preserve those merged fixes rather than reimplementing or cherry-picking them.

## Approach decision

Recommended: adapt the real customer presentation to the unchanged Studio recipes and consolidate live customer styling/components across menu, overlays, checkout, receipt and tracking. Keep live controllers, service adapters and server authorization intact. This gives one coherent real customer surface without coupling production to demo storage, simulated checkout or navigation.

Two alternatives were considered: scattered CSS overrides are quicker for a single screenshot but leave duplicated behavior and incomplete controls; replacing the live store wholesale with the demo controller gives closer initial screenshots but would import fictional operations and incompatible cart models. Neither satisfies the intended outcome safely.

## Batch 1 — restore existing capabilities and reliable media (F3/F4)

1. In `live-checkout.tsx`/`live-checkout-details.tsx`, reuse the existing consented email controls and pickup selector/controller. Present one real pickup choice in the reference's pickup section. Restore rush/paused/unconfigured/unavailable explanations and confirmation privacy/withdrawal access. Remove duplicate disabled sample controls from the real flow; retain supported name/contact/consent behavior and honest payment capability copy.
2. Pass `restaurantSlug` from the real card through ProductOrdering and ProductPhotoGallery to cover, full image and thumbnails. Keep the public target resolver, supported sizes and no-store/security behavior unchanged.
3. Preserve PR #136's empty-gallery and missing-required-option behavior. Keep real minimum/maximum guards and clear unavailable states while changing presentation.

Acceptance: an image-bearing path storefront loads cover and all gallery sizes; host storefronts still work; invalid selectors stay denied. Email/analytics consent is visible, unchecked initially and transmitted only as contracted. Pickup occurs once, and paused/rush/failure states are explicit. Cart/checkout retry still reuses the immutable idempotency attempt. Tests must exercise the active `LiveCheckout`, not only the older CheckoutPanel.

## Batch 2 — make the real appearance complete (F2/F7)

1. Complete the live customer appearance mapping/scope with reference-compatible surface, popup, foreground, control, focus and density tokens. Preserve PR #136's opt-in outline/solid portal propagation instead of adding another mechanism.
2. Apply selected heading/body families, weights, text scale and line height consistently to real names, descriptions, headings, prices, fields and dialogs. Replace fixed live padding where the Studio spacing control is meant to apply. Keep explicit error/status contrast.
3. Make grid/list covers and full galleries use the selected ratio with intentional cover cropping/fallback behavior. Preserve PR #136's gallery-ratio fix and verify the complete live media presentation without distorting images.

Acceptance: computed style and screenshots match the unchanged reference for published light and dark appearances, outline/solid, distinct font pairs, scale endpoints, all radii, densities and ratios. Open actual product and basket portals while asserting colors, fonts, radii and mode; root custom-property assertions alone are insufficient. Demo/Studio screenshots must remain unchanged.

## Batch 3 — match the real menu composition (F1/F5/F6)

1. Match the reference's header, title hierarchy, hero content placement and compact category/details strip within live customer components. Apply banner height/alignment/overlay only as supported by actual published assets. For absent images, use a deliberate neutral text treatment; never copy sample restaurant imagery or open/preparation promises.
2. Bound sparse real card widths and media dimensions. A category with one dish must not produce a viewport-sized photo. Use a live-scoped responsive grid policy; keep Studio/demo untouched. At equivalent widths/dense content, match the reference's card proportions and gaps.
3. Match photo/name/description/price/action placement. Let image/name open the same live product details. Add the reference-style quick-add/quantity treatment where compatible with the real cart; required choices always go through validated selection. Keep allergens/availability/preparation facts truthful and accessible.
4. Compact the real establishment summary, with a clear way to read the full weekly schedule and pickup details. Keep country/timezone/address facts; do not silently change saved restaurant settings or derive an open-now promise from display hours.

Acceptance: 0/1/2/many items; no-photo/single/multiple photos; long translated names/descriptions; missing restaurant media/details; grid/list; all supported ratios. On 390px, the page gives clear access to dishes and ordering without oversized decorative or fallback blocks. Reference visual hierarchy is reproduced with real data.

## Batch 4 — finish live dialogs, basket and post-order screens (F6/F8)

1. Match reference modal geometry, gallery/header/options/footer layout and visible close action while preserving Base UI focus/Escape behavior. Show a localized configured price estimate and quantity beside add/save. Do not change backend option-selection rules.
2. Match the reference basket and checkout two-column/single-column composition using the live order model. Keep meaningful empty/error/pending/uncertain states and supported customer fields. Use the API currency and actual tax/discount semantics; do not copy sample tax-included/free-pickup/payment claims.
3. Apply the same live theme/layout recipes to receipt and capability tracking, including refresh/unavailable/expired/terminal/cancelled states. Render only fields available to those contracts. Tracking item totals, customer names or payment settlement must not be fabricated to imitate the sample summary.
4. Verify FR/EN interface copy and menu-language selection independently, including catalog fallback and accessible action names.

Acceptance: reference-shaped real journey from product to basket to checkout to receipt/tracking; keyboard focus is recoverable, validation is visible and announced, totals stay server-authoritative, tenant/cart isolation and capability secrecy remain intact. No real order is necessary for visual fixtures; successful hosted acceptance uses an explicitly authorized test order later.

## Batch 5 — prove parity and close acceptance (F9)

- Add deterministic real-store fixtures with the same theme/content as the unchanged reference solely for comparison. Do not modify production demo/Studio. Compare component geometry and computed styling, then maintain screenshots for live menu/product/basket/checkout/receipt/tracking. Use representative controlled datasets, not hardcoded class names as visual evidence.
- Cover widths 320, 390, 768, 1024, 1440 and a wide desktop (1920), EN/FR, long content, 200% zoom, keyboard/focus, reduced motion, missing/error states and valid dark/light/custom published themes. Keep narrow-container behavior equivalent to Studio preview widths.
- Run package-local tests, lint, typecheck, format check and build; record exact commands/failures. Read installed Next.js docs before editing relevant Next code. Backend tests are required if API behavior changes; none is expected for the planned frontend fixes.
- On the deployed real store, verify published appearance after refresh and a separate guest session, real photo delivery on path and host routing, and two-tenant isolation. Use existing saved/publication states; a new save/publish or test order requires task authorization at execution. Do not mark hosted success from fixture results.
- Update the existing T3 card with actual completed scope/evidence. Keep In review until its real-store acceptance is complete. Track excluded editor/preset questions separately only if subsequently requested.

## Delivery checkpoints

Deliver batches as focused conventional commits on a new task branch from main; use small reviewable changes and existing dependencies. Confirm every live-only fix preserves the unchanged reference surfaces. Update affected current-behavior documentation as fixes land, then push and report verification plus remaining hosted checks. This plan does not authorize implementing the unrelated restaurant roadmap.
