# Restaurant management backlog and Stitch references

8 October 2026. Planning only: none of the future features below is implemented by this change.

The user requested kanban work for restaurant Theming Studio, a real restaurant dashboard, restaurant settings (opening hours, pickup-slot intervals, buffer time, Stripe connection, email and establishment details), a combined Menu Builder & Translations workspace, and a redesigned Live Orders Kanban/KDS with the additional features in those exports. Desktop visual fidelity and responsive implementation are mandatory.

## Design provenance

Source: user-supplied `D:\Telechargements\stitch_modular_restaurant_saas_design_system (2).zip`.
All five requested restaurant-management reference pages are preserved here. Screenshots are byte-for-byte originals; exported HTML has trailing whitespace removed and a normalized final newline:

| Area | Screenshot | Exported HTML | Original archive directory |
| --- | --- | --- | --- |
| Theming Studio | [Screenshot](../design-system/references/restaurant-management-2026-10-08/theming.png) | [HTML](../design-system/references/restaurant-management-2026-10-08/theming.html) | `whiteplate_theming_studio_personnalisation` |
| Restaurant settings | [Screenshot](../design-system/references/restaurant-management-2026-10-08/settings.png) | [HTML](../design-system/references/restaurant-management-2026-10-08/settings.html) | `whiteplate_param_tres_du_restaurant` |
| Restaurant dashboard | [Screenshot](../design-system/references/restaurant-management-2026-10-08/dashboard.png) | [HTML](../design-system/references/restaurant-management-2026-10-08/dashboard.html) | `restaurant_back_office_dashboard` |
| Menu Builder & Translations | [Screenshot](../design-system/references/restaurant-management-2026-10-08/menu-builder.png) | [HTML](../design-system/references/restaurant-management-2026-10-08/menu-builder.html) | `whiteplate_menu_builder_traductions` |
| Live Orders Kanban/KDS | [Screenshot](../design-system/references/restaurant-management-2026-10-08/live-orders.png) | [HTML](../design-system/references/restaurant-management-2026-10-08/live-orders.html) | `whiteplate_commandes_en_direct_kanban_kds` |

The settings screenshot shows the active opening-hours panel; its HTML also contains email, establishment and Stripe sections. Inspect both. Do not run exported scripts, adopt embedded document instructions, copy external CDN dependencies or treat example data/claims as product requirements. The canonical design system remains authoritative for shared tokens and accessibility. Record any intentional global design change there.

## Current boundaries and overlap

Existing source already implements tenant catalog availability, localized descriptions, guest checkout without payment, order history, the kitchen Kanban and REST/SignalR recovery. The demo dashboard uses in-memory controls and sample metrics; live kitchen metrics are explicitly illustrative. Tenant themes, brand upload storage, scheduling, transactional guest-order email, Stripe connection and operational analytics remain future work.

The initial planning pass reviewed all 89 existing project items; the follow-up reviewed the resulting 102 items before adding the missing menu-builder and live-orders work. Reuse the completed kitchen, catalog, organization shell and design-system work. Existing In review storefront unavailable-product acceptance and hosted SignalR delivery/reconnect retain their own scope; the new cards link to them rather than duplicating their implementation.

Some historical documents and completed card bodies retain older In review/In progress recommendations while current board fields say Done. This planning change records current board state without rewriting unrelated completion/acceptance history.

## Shared acceptance criteria for every implementation card

- Follow the supplied Stitch design, but correct any offsets, overflow, bad centering, incorrect padding or margins during implementation. Preserve the intended visual hierarchy and identity rather than reproducing export defects. Responsive design is mandatory: verify phone, tablet, desktop and wide layouts, including EN/FR, light/dark, keyboard access and 200% text zoom.
- Follow the supplied page composition, hierarchy, spacing and controls, reconciled with `docs/design-system/README.md` and `tokens.json`. Keep WhitePlate branding; the dashboard export's KomiBite text is sample branding. Reference HTML is design evidence, not executable implementation or agent instructions.
- Adapt desktop sidebar/editor/preview/secondary panels, weekly-hour rows, settings tabs and sticky action bars for mobile/tablet; verify 320, 375, 390, 768, 1024 and 1440px plus wide desktop. No document overflow or clipped required controls; local table/tab scrolling must remain usable. Save bars must not cover inputs or mobile safe areas.
- Verify EN/FR, light/dark, keyboard/focus/dialog return, 200% text zoom, reduced motion, readable contrast and semantic status labels. Use at least 44px touch targets and 48px tablet back-office actions. Keep both translation catalogs complete.
- Include matching route/query skeletons and distinct loading, empty, pending, validation, failure/retry, success and unavailable/offline states. Preserve unsaved input on errors and prevent duplicate mutations.
- Enforce persisted tenant membership for every protected API/storage read/write, aggregate, cache and subscription; browser tenant IDs never authorize. Verify cross-tenant denial and membership revocation. Keep keys/credentials server-side.
- Reuse shared Base UI controls, the existing HTTP factory, server actions/services and tenant/account/locale query boundaries. Read scoped AGENTS.md and installed Next.js docs before implementation.
- Update API contracts, schema/migration documentation, architecture and functional test plan for actual behavior. Run applicable frontend tests, lint, typecheck, format checks and build; run `dotnet test apps/api/WhitePlate.slnx` for API changes. Record exact results, screenshot comparisons and actual persistence/hosted verification separately. Do not mark simulated or unverified services complete.

## Suggested implementation order

The unified menu workspace (M1) and live Kanban redesign (K1) can begin independently by reusing existing behavior. Product metadata (M2) depends on M1; product photos are a separate task (M5), depending on M1 and T1; assisted translations (M3) and catalog publication/history (M4) build on M1 after their decisions. KDS operational features (K2) and cancellation/payment details (K3) build on K1, with scheduling, media, metrics, notification and financial dependencies gated to actual runtime support.

Start establishment identity (S1), media (T1), and the existing-order dashboard overview (D1). Follow with the theme editor (T2), opening hours (S2), then preview/publication (T3), slot enforcement (S3), metrics (D2) and availability (D4). Rush/pause (D3) depends on slot enforcement. Email (S4) and Stripe connection (S5) follow establishment identity and their explicit product/provider decisions; pickup fields and branding integrate only when their dependencies exist.

All feature cards start in Backlog. Move a card to Ready when its listed decisions and dependencies are settled; completion requires implementation and verification.

Manual/phone order entry is explicitly excluded by the user, even though the live-orders export includes that form. Product photos are scoped separately in M5; they are not bundled into product metadata.

## Future implementation tasks

### T1 — Theming Studio: upload restaurant logo, favicon and banner

Reference: theming. Dependencies: none.

Build tenant-owned brand media upload, replacement and removal using the supplied Brand Identity Assets card.

Acceptance criteria:

- [ ] Support logo, favicon and hero banner with previews, fallback assets, upload progress and recoverable errors; document accepted formats, byte/dimension limits and crop behavior before implementation.
- [ ] Use the reference logo guidance (transparent square, 512px target), favicon ICO/PNG and 16:9 / 21:9 banner framing; validate actual file content and reject unsafe uploads; sanitize or rasterize SVG if supported.
- [ ] Persist tenant-owned media and metadata through authenticated operations; prevent foreign-tenant overwrite/read access to private drafts and define cleanup for replaced/unpublished assets.
- [ ] Keep the last published asset usable after a failed replacement; verify actual storage and storefront delivery with two tenants.

Decisions and limits:

- Choose media storage/delivery, retention, allowed types and concrete limits before coding; no storage provider is selected by the mockup.

### T2 — Theming Studio: logo-derived palettes, presets and style controls

Reference: theming. Dependencies: T1.

Implement the Color Palette & Surface, ambiance, radius and typography editor, including the user's requested logo-derived color suggestions and manual presets.

Acceptance criteria:

- [ ] Generate editable palette suggestions from the uploaded logo; support manual color entry and named presets, with a clear fallback when extraction fails or produces unusable colors.
- [ ] Provide Crisp Light, Warm Cream and Bistro Noir ambiance choices, sharp/medium/pill radius presets, and the reference font choices Plus Jakarta Sans, Playfair Display and Inter or a documented approved alternative.
- [ ] Use an allowlisted theme schema and safe semantic CSS variables scoped to the restaurant storefront; prevent arbitrary CSS/font URLs and theme leakage into another tenant or the WhitePlate admin shell.
- [ ] Calculate real text/control contrast and handle invalid combinations before publication. Do not repeat the mockup's hard-coded 4.8:1 compliance claim.
- [ ] Persist validated theme configuration with defaults for existing tenants; use locally bundled licensed fonts and maintain the canonical system for shared admin components.

Decisions and limits:

- Define palette roles and accessible fallback/blocking policy; agree exact preset values and font licensing/bundling. The mockup locks the slate secondary tone: make its editability explicit.

### T3 — Theming Studio: live preview, publish and storefront application

Reference: theming. Dependencies: T1, T2.

Deliver the complete Studio layout with instant mobile/desktop storefront preview, reset and deliberate publication of restaurant branding.

Acceptance criteria:

- [ ] Match the supplied two-column editor/preview hierarchy on desktop; provide usable stacked or switchable controls/preview on mobile, including 390px preview and desktop mode.
- [ ] Separate editable drafts from the published theme. Define reset/discard semantics, dirty-state feedback, save/publish errors and stale concurrent edits; failed publication preserves the current live storefront.
- [ ] Publish validated logo/favicon/banner/palette/ambiance/radius/fonts together and apply them on the correct tenant storefront and browser metadata; handle cache refresh without tenant contamination.
- [ ] Verify changes after refresh and in a separate guest session; preview must not create orders, charge payments or present sample ratings/times as real data.
- [ ] Show the existing validated subdomain/copy link where appropriate. Custom-domain DNS/TLS provisioning remains deferred under decision 0003.

Decisions and limits:

- Record draft persistence, reset/default behavior and publication concurrency/versioning before implementation.

### S1 — Restaurant Settings: establishment identity and pickup information

Reference: settings. Dependencies: none.

Add the establishment-information settings section with public/legal identity, address, phone, pickup instructions and location links from the reference.

Acceptance criteria:

- [ ] Provide trade name, phone, postal address, optional GPS coordinates and localized pickup instructions; validate and persist tenant-owned fields with dirty-state save/cancel behavior.
- [ ] Reuse existing restaurant description/menu-language management and its locale fallback; do not duplicate or silently replace it. Apply appropriate localized pickup details to storefront, receipt/tracking and email only through their approved contracts.
- [ ] Generate safe Google Maps/Waze directions from saved location data with an optional test-link action; handle missing or invalid coordinates.
- [ ] Decide required jurisdiction-specific legal identifiers, SIRET validation and whether a default tax rate is actually needed; preserve existing per-product tax rules and historical order amounts.
- [ ] Keep organization settings separate from restaurant settings; independently authorize every server/API read and mutation.

Decisions and limits:

- Clarify legal-field applicability beyond France and any default-tax precedence; currency/subdomain changes and NFC/kiosk behavior are not implicitly authorized.

### S2 — Restaurant Settings: weekly opening hours and service windows

Reference: settings. Dependencies: S1.

Build the opening-hours editor with seven days, closed-day toggles, lunch/evening or continuous service and copy-day-to-week controls.

Acceptance criteria:

- [ ] Support multiple opening windows per day, continuous service, closed days and explicit copy/apply behavior that does not silently overwrite unsaved work.
- [ ] Validate time formats, ordering and overlapping windows server-side; store the restaurant time zone and handle DST and midnight boundaries according to a recorded policy.
- [ ] Persist hours with localized feedback, recoverable failures and concurrency protection; expose authoritative public opening information.
- [ ] Match the settings tab/navigation and sticky save/cancel pattern; reflow weekly rows into readable mobile cards without hiding required controls.
- [ ] Verify closed days, split shifts, copy behavior, boundary times and two-tenant authorization. Distinguish saved hours from enforced checkout scheduling until S3 is complete.

Decisions and limits:

- Choose time-zone defaults, overnight-window semantics and first-release holiday/exception scope. Do not infer these rules from the example Paris schedule.

### S3 — Restaurant Settings: pickup slots, buffer time and capacity

Reference: settings. Dependencies: S2.

Implement slot interval, preparation/buffer time and per-slot order capacity with server-backed pickup availability and checkout enforcement.

Acceptance criteria:

- [ ] Expose interval choices illustrated by 10/15/20/30 minutes, minimum preparation/buffer minutes and per-slot capacity; validate chosen ranges and defaults on the server.
- [ ] Generate available pickup times from opening windows, restaurant-local time, buffer and capacity; omit closed, past or full slots and explain no-availability states.
- [ ] Integrate ASAP/scheduled selection in the real storefront/checkout and snapshot the accepted pickup time on orders, receipts, tracking and staff tickets.
- [ ] Enforce capacity atomically under concurrent checkouts; preserve existing pricing and idempotency so retries do not consume duplicate capacity. Define stale/full-slot recovery.
- [ ] Cover slot boundaries, DST, closing time, concurrent capacity, cancellation releases and tenant isolation with actual persistence tests; review and verify any migration rollout.

Decisions and limits:

- Resolve scheduling horizon (including J+1/J+2), slot alignment, buffer meaning, capacity reservation/payment timing, release rules and treatment of existing orders before implementation. Displayed saturation forecasts are not operational data yet.

### S4 — Restaurant Settings: transactional email templates and delivery

Reference: settings. Dependencies: S1.

Build Notifications & Emails for order-confirmed, preparing and ready notifications with subject, greeting/body, branding and mobile/desktop previews.

Acceptance criteria:

- [ ] Edit and persist localized template content with an allowlisted variable set and escaped/sanitized output; support preview, reset/discard, validation and pending/error states.
- [ ] Reuse published restaurant identity/banner when available, and include accurate order summary, tracking link, pickup instructions and pickup time only when backed by the relevant feature.
- [ ] Trigger sends from committed authoritative order events; define verified recipient collection/consent, retry, deduplication and safe delivery status rather than claiming Email Sent from a UI action.
- [ ] Keep sender/provider credentials server-side and sender domains verified; distinguish existing auth/invitation email from this new guest-order notification flow.
- [ ] Verify actual provider test delivery, duplicate-event retry, unavailable provider, locale fallback and cross-tenant templates/recipients without contacting real guests.

Decisions and limits:

- Decide recipient collection/privacy, event timing, editable sender/reply-to scope and provider configuration. The design's after-payment trigger depends on a future payment integration; SMS remains optional backlog scope, not automatically included.

### S5 — Restaurant Settings: Stripe Connect onboarding and connection status

Reference: settings. Dependencies: S1.

Add the Payments & Stripe Connect section for connecting a restaurant account, completing onboarding and viewing authoritative capability/status information.

Acceptance criteria:

- [ ] Record the Connect account/ownership and permission model before coding; create tenant-bound onboarding/resume links server-side with validated return/refresh routes.
- [ ] Show unconnected, onboarding, action-required/restricted and active states derived from verified Stripe data; never infer readiness from the browser redirect alone.
- [ ] Verify webhook signatures and deduplicate/reconcile account status events. Reject connecting or viewing another tenant's account; keep secret keys and bank details out of client configuration and logs.
- [ ] Provide an authorized Stripe dashboard link where the account model supports it. Show balance/payout/payment-method information only if genuinely available and approved; do not copy mock fees, balances, IBAN or J+1 promises.
- [ ] Verify the connection lifecycle with test-mode accounts and document production configuration separately. Connecting an account does not activate card charging in the current no-payment checkout.

Decisions and limits:

- Choose Connect onboarding/account configuration, charge and liability model, account replacement/disconnection and supported countries/currencies. Guest payment, refunds, reconciliation and paid-order semantics require separately scoped decisions before charging.

### D1 — Restaurant Dashboard: live operations overview from existing orders

Reference: dashboard. Dependencies: none.

Build the real restaurant back-office dashboard using the supplied overview design while reusing the implemented kitchen Kanban, order lifecycle and REST/SignalR recovery.

Acceptance criteria:

- [ ] Provide restaurant context, role-aware navigation, live storefront link and operational order summary/ticket list with status filters and responsive secondary panels.
- [ ] Reuse authoritative Pending/Preparing/Ready/Completed/Cancelled actions and existing If-Match, pending, conflict, cancellation-role and revocation behavior; do not create a second incompatible workflow.
- [ ] Distinguish full-tenant server counts from loaded-page counts; show refresh/offline/stale/empty/error states and recover through REST after reconnect.
- [ ] Show paid, pickup countdown, email-delivered, station or shelf labels only when their supporting data exists; preserve the separate demo route and clearly mark unavailable future widgets.
- [ ] Test owner/manager/kitchen visibility, foreign-tenant denial, revoked membership, keyboard/touch actions and actual server persistence. Coordinate hosted SignalR checks with the existing In review card rather than duplicating that scope.

Decisions and limits:

- Provide a dedicated dashboard overview while retaining the distinct Live Orders page tracked by K1; define financial-metric visibility by role before implementation.

### D2 — Restaurant Dashboard: authoritative metrics, rush pacing and top sellers

Reference: dashboard. Dependencies: D1.

Replace illustrative dashboard KPIs and insight widgets with tenant-scoped server aggregates for order value, active queue, preparation time, hourly order volume and top-selling items.

Acceptance criteria:

- [ ] Document each metric's source, time window, restaurant time zone, included order statuses, tax/discount treatment and historical-snapshot semantics before computing it.
- [ ] Return server-side aggregates across all matching orders including retained history; provide real queue breakdowns, hourly volume and product rankings with accessible text alternatives.
- [ ] Calculate average preparation time only when lifecycle timestamps support it; distinguish order value from captured payment revenue until verified payments exist.
- [ ] Show meaningful empty/insufficient-data states and comparison periods; never retain sample growth percentages, expected-volume forecasts or repeat-diner rates as real metrics.
- [ ] Verify aggregate accuracy using deterministic multi-day and two-tenant fixtures, authorization/cache isolation and currency formatting.

Decisions and limits:

- Resolve event/timestamp collection, comparison baselines and retention needs. Repeat-diner percentage requires a defined guest identity/privacy model; expected-volume forecasting needs a separate data/model decision.

### D3 — Restaurant Dashboard: rush hold and emergency ordering pause

Reference: dashboard. Dependencies: S3, D1.

Implement the reference rush-hold and emergency-pause controls as persisted operational settings shared by dashboard, storefront and checkout.

Acceptance criteria:

- [ ] Show current accepting-orders state and explicit rush/pause/resume feedback; define hold duration/expiration and confirmation for service-impacting changes.
- [ ] Apply additional rush buffer and paused ordering on the server; reject forged or stale checkout requests even when a guest already has a cart.
- [ ] Propagate updated state across staff views and public availability while preserving in-flight order handling and the documented reservation/idempotency rules.
- [ ] Keep changes tenant-bound, role-authorized and concurrency-aware; failed saves must not suggest that a restaurant is paused when it is still accepting orders.
- [ ] Verify multiple staff sessions, stale guest carts, automatic expiry if selected, resume and existing-order behavior. Do not equate service pause with destructive organization archive/deactivation.

Decisions and limits:

- Decide allowed roles, fixed versus configurable rush delay, expiry behavior and treatment of existing slots/orders before implementation; +10m is a mockup example, not an approved rule.

### D4 — Restaurant Dashboard: quick availability and storefront shortcuts

Reference: dashboard. Dependencies: D1.

Add the Quick 86 availability panel and live storefront copy/open/QR shortcuts without inventing a stock-quantity inventory system.

Acceptance criteria:

- [ ] Reuse existing owner/manager product availability operations and catalog validation; show pending state, rollback/failure feedback and correct authorization for kitchen users.
- [ ] Reflect saved availability in the dashboard and tenant storefront; checkout must revalidate unavailable items while preserving existing order snapshots.
- [ ] Prevent archived products/categories from being reactivated through the shortcut; handle concurrent changes and stale cached menu data safely.
- [ ] Create public storefront links/QR codes from the validated tenant domain and locale policy; do not include auth/session/tracking secrets.
- [ ] Verify the unavailable-product guest presentation with the existing storefront In review card, plus two-tenant mutation denial and responsive keyboard/touch controls.

Decisions and limits:

- Confirm whether kitchen staff may toggle availability; existing management rights must not silently expand. Numerical stock, station/shelf assignments, printer/POS integrations and kiosk/NFC mode remain separate optional work.

### M1 — Menu Builder & Translations: unify catalog, pricing and menu languages in Stitch workspace

Reference: menu-builder. Dependencies: none.

Combine the actual Products and pricing and Menu languages and translations screens in one restaurant Menu Builder & Translations workspace following the supplied Stitch page.

Acceptance criteria:

- [ ] Provide Carte & Produits and Traductions & Langues tabs in the shared workspace, with the category sidebar/filter, selected-product editor and option/modifier group panels from the reference; reflow these panels for mobile rather than reproducing clipping.
- [ ] Reuse all current category/product/option/discount CRUD, price/tax/availability, archive/restore and confirmation behavior; keep discounts discoverable even though the reference emphasizes products.
- [ ] Integrate enabled-menu-language/default-language management and category/product/option translations in this same workspace; keep original, saved, missing and fallback text distinguishable and preserve per-locale validation.
- [ ] Keep app EN/FR locale separate from enabled menu languages; the reference FR/EN/ES/DE set is illustrative. Preserve pending/error handling, unsaved drafts and accessible keyboard tab/focus behavior when switching product/category/language.
- [ ] Consolidate workspace navigation and migrate or redirect existing catalog/language URLs without losing tenant/query context or breaking bookmarks. Verify real save/read-back, archived controls, tenant isolation and public locale fallback.
- [ ] Support category/product ordering and the reference category hide/show controls with a keyboard alternative. Reuse current sort-order operations where possible; implement temporary visibility as an explicit server-backed feature, distinct from archive, with consistent public-menu and checkout availability enforcement.

Decisions and limits:

- Define navigation migration and per-product editing/save semantics. Product metadata, assisted translation, publication history and product photos are tracked in M2–M5; do not show their controls as operational before they are wired.

### M2 — Menu Builder: allergens, SKU and preparation metadata

Reference: menu-builder. Dependencies: M1.

Add the product metadata fields shown in the Stitch editor: SKU/reference, preparation time and declared allergens/dietary labels. Product photos are a separate task, M5.

Acceptance criteria:

- [ ] Persist and validate product SKU/reference and preparation duration, and define a controlled allergen/dietary vocabulary with explicit owner-entered declarations and localized display.
- [ ] Expose verified metadata on the correct guest menu and KDS surfaces where useful, with clear distinction between preparation guidance and an authoritative pickup promise.
- [ ] Define safe localized allergen/warning fields and preserve historical disclosures relevant to submitted orders if those are added to snapshots; never infer allergen-free guarantees from photos or AI output.
- [ ] Update management/public contracts and additive schema with actual metadata persistence, cross-tenant denial, clearing/fallback and invalid-input coverage.

Decisions and limits:

- Decide SKU uniqueness/integration scope, supported allergen/dietary vocabulary, snapshot requirements and preparation-duration semantics. SKU does not establish a POS integration; sample stock quantities are not inventory.

### M3 — Menu Builder: assisted translation, glossary and human review workflow

Reference: menu-builder. Dependencies: M1.

Implement the reference translation studio's generate-all/retranslate, glossary validation, locale review and explicit save/approval workflow as a separate feature from existing manual translations.

Acceptance criteria:

- [ ] Retain fully working manual translation when assistance is unavailable; generate drafts only for explicitly selected enabled menu locales and supported fields.
- [ ] Provide source/target-language panels, missing/review/approved state, per-locale save and safe retranslation confirmation so existing human edits are not silently overwritten.
- [ ] Define tenant-owned glossary terms and human approval/version metadata, showing actual reviewer information only when persisted and authorized.
- [ ] Use a server-side provider adapter with timeouts, bounded usage/cost controls and secret protection; preserve source text and show retryable failures without fabricating a gastronomic quality score.
- [ ] Require human review of allergen/safety wording and keep unapproved drafts out of published guest content; verify locale fallback, glossary application, concurrent edits, provider failures and cross-tenant isolation.

Decisions and limits:

- Select translation provider and usage/cost policy, glossary scope and approval permissions. AI/DeepL labels and 98% quality claims in the reference are examples, not an approved provider or validated metric.

### M4 — Menu Builder: catalog draft publication and change history

Reference: menu-builder. Dependencies: M1.

Define and implement the Publish changes and History controls shown in the Stitch Menu Builder without confusing them with the existing immediate-save catalog or order history.

Acceptance criteria:

- [ ] Record the draft/published catalog model and migration path from current immediate writes before changing behavior; keep existing restaurants usable during rollout.
- [ ] Track changes and reviewable publication scope across categories, products, options, pricing and translations, with dirty-state feedback and explicit publish/discard behavior.
- [ ] Validate completeness, availability, locale fallback and all relevant price/option rules on the server before atomic publication; reject stale concurrent publishes and retain the last valid storefront version on failure.
- [ ] Provide tenant-authorized catalog change history with actor/time/version and useful diffs; define retention and rollback scope rather than reusing the unrelated order-history page.
- [ ] Verify publication/cache refresh across guest and staff sessions while preserving checkout pricing/idempotency and immutable historical order snapshots.

Decisions and limits:

- Decide whether immediate availability/86 changes bypass drafts, publication permissions, version retention and rollback guarantees. Coordinate with M3 review states and D4 quick availability so emergency changes remain coherent.

### M5 — Menu Builder: upload and manage product photos

Reference: menu-builder. Dependencies: M1, T1.

Implement product photography as a separate product feature, following the Stitch editor photo panel. This is independent from product metadata and the main workspace redesign.

Acceptance criteria:

- [ ] Reuse tenant-owned media storage/validation from T1 for product photos, with upload, replacement, removal, progress, recoverable errors and an accessible fallback; keep the existing published image after a failed replacement.
- [ ] Support the reference 1:1 / 4:3 framing and preview with a consistent crop/focal-point policy. Decide concrete accepted formats, byte/dimension limits and thumbnail variants; the example 1200px recommendation is not an approved hard limit.
- [ ] Associate photos only with an authorized tenant-owned product; verify product/media ownership, actual file content and safe delivery URLs, plus cleanup/retention for replaced or removed assets.
- [ ] Render the saved product image and fallback on the actual guest product cards and product/options detail view; avoid stretched images, layout shifts, clipped controls and cross-tenant cache leakage.
- [ ] Verify actual storage and product save/read-back, replacement/removal, failed upload recovery, invalid files, archived-product rules, foreign-product/media denial and responsive image framing. Coordinate draft/live image behavior with M4 if publication is implemented.

Decisions and limits:

- Decide storage variants, crop/focal-point behavior, accessible image-description policy and retention using T1 infrastructure. This task adds product photos, not order attachments or a numeric inventory system.

### K1 — Live Orders: redesign the real five-lane Kanban/KDS from Stitch

Reference: live-orders. Dependencies: none.

Redesign the real Live Orders page using the supplied five-lane KDS reference, distinct from the restaurant dashboard overview.

Acceptance criteria:

- [ ] Match the KDS service header, filter/action toolbar and Pending/New, Preparing, Ready, Completed and Cancelled lane/ticket hierarchy, including references, saved item/modifier details, status labels and next-step actions.
- [ ] Preserve existing mouse/touch drag behavior, keyboard button alternatives, role-valid transitions/cancellation, If-Match/version conflicts, pending guards, pagination, loaded-page count labels and focus restoration.
- [ ] Reuse existing REST authority, SignalR refresh/reconnect recovery, stale/offline feedback and revoked-membership cache removal; coordinate hosted delivery acceptance with its existing card.
- [ ] Use readable responsive lane layouts with contained scrolling or stacking; fix the supplied screenshot's clipped toolbar action and lane/header/ticket alignment, spacing and overflow instead of copying them.
- [ ] Wire ASAP/scheduled filters and pickup information to S3 only when available; use K2–K3 for operational metadata and cancellation/payment behaviors; manual/phone order entry is explicitly excluded by the user. Preserve the order-history boundary and don't display mock sent/refunded claims as real state.

Decisions and limits:

- Define initial filter/default grouping and completed/cancelled retention presentation consistently with existing archival. The distinct dashboard D1 may reuse components but does not replace this live Kanban.

### K2 — Live Orders: KDS timers, urgency, sound and preparation metadata

Reference: live-orders. Dependencies: K1.

Add the reference operational KDS features: elapsed/remaining times, urgency cues, sound controls and real preparation-stage/station/pickup-location metadata where supported.

Acceptance criteria:

- [ ] Derive elapsed timers and remaining pickup/preparation time from authoritative timestamps and the agreed target; recover correctly after refresh/reconnect and account for clock skew.
- [ ] Define urgency thresholds and use text/icon labels alongside color; respect reduced motion and do not fake step percentages or average cooking times from sample values.
- [ ] Provide explicit user-controlled KDS sound enable/mute and accessible new-order alerts; handle browser audio permission, deduplicate repeated/replayed events and avoid replay storms after reconnect.
- [ ] If included after the decisions below, persist preparation stages, station and pickup-shelf assignments with tenant-authorized updates and concurrency control, then render actual stage/progress data on tickets.
- [ ] Integrate S3 pickup times, D3 rush status and M2 preparation guidance when available; verify deterministic timer boundaries, lifecycle changes, sound deduplication, reconnect and keyboard/touch controls.

Decisions and limits:

- Decide timing source/targets, urgency rules, session versus device sound preferences and who may edit stages/stations/shelves. Preparation stages require an explicit model; external courier/POS integration is not established by a badge.

### K3 — Live Orders: cancellation reasons and authoritative payment/refund status

Reference: live-orders. Dependencies: K1, S5.

Extend cancelled/completed KDS ticket details with recorded cancellation reasons and accurate notification/payment/refund information shown in the Stitch reference.

Acceptance criteria:

- [ ] Record validated cancellation reasons through the existing permitted lifecycle transition, preserving role restrictions, concurrency checks and historical ticket details.
- [ ] Show notification status only from actual delivery records from S4, and payment/refund status only from verified provider-backed records; no hard-coded sent, paid or 100%-refunded labels.
- [ ] Define the guest-payment/refund ledger and webhook reconciliation before any financial mutation; a Stripe Connect account connection alone is insufficient to charge or refund.
- [ ] Keep order cancellation and payment refund as distinct authoritative outcomes with safe pending/failed/partial states, audit evidence and tenant/account binding.
- [ ] Verify cancelled/unpaid orders without Stripe, provider event retries, duplicate/partial/failed refunds where implemented, role permissions and two-tenant isolation; protect financial/recipient details from unauthorized viewers.

Decisions and limits:

- Actual guest payments/refunds require a separately approved payment-flow design, capture/cancel/refund policy, liability model and test-mode verification. Until then implement truthful unpaid/not-supported states and reason storage only; don't fabricate refunds, credits, Stripe voids, SMS or card settlement.

## Verification of this planning change

Reviewed repository docs/manifests and representative tenant, product, catalog/language, live dashboard and demo source. Visually inspected all five screenshots and read their HTML feature lists, including inactive-tab content. The follow-up preserves two more references, adds M1–M5 and K1–K3 (20 implementation cards total), and requires correcting Stitch offsets, overflow, centering, padding and margins on every implementation card. Manual/phone orders are excluded; product photos have their own task. No application behavior, dependencies or environment configuration changed. Reference integrity, Markdown links, board creation/status/content read-back and Git whitespace checks are verified in the planning-card handoff. Application tests are not required for these documentation/reference and kanban changes.
