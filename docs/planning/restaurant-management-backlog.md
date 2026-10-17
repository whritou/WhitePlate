# Restaurant management backlog and historical Stitch references

11 October 2026. The approved [Lovable real-workspace recipes](../lovable-live-workspace.md), [design system](../design-system/README.md) and [latest rendered parity audit](../audits/live-demo-parity.md) are the current visual authority. The Stitch exports preserved below are historical feature provenance and do not define current routes, layouts or runtime behavior. The GitHub project cards T2–T3, S1–S5, D1–D4, M2–M4 and K1–K3 were aligned to the Lovable design on 11 October; their feature work and acceptance remain unfinished where explicitly recorded. M1 has a source implementation and local verification; shared-database and hosted acceptance remain in review. See [M1 evidence](../audits/menu-builder.md).

The original planning request covered restaurant Theming Studio, dashboard, settings, Menu Builder & Translations and Live Orders/KDS. The current card scope and implementation truth live in the project kanban. Desktop fidelity and responsive implementation remain mandatory, using Lovable compositions for real screens.

## Historical Stitch design provenance

Source: user-supplied `D:\Telechargements\stitch_modular_restaurant_saas_design_system (2).zip`.
All five requested restaurant-management reference pages are preserved here. Screenshots are byte-for-byte originals; exported HTML has trailing whitespace removed and a normalized final newline:

| Area                        | Screenshot                                                                                  | Exported HTML                                                                          | Original archive directory                   |
| --------------------------- | ------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------- | -------------------------------------------- |
| Theming Studio              | [Screenshot](../design-system/references/restaurant-management-2026-10-08/theming.png)      | [HTML](../design-system/references/restaurant-management-2026-10-08/theming.html)      | `whiteplate_theming_studio_personnalisation` |
| Restaurant settings         | [Screenshot](../design-system/references/restaurant-management-2026-10-08/settings.png)     | [HTML](../design-system/references/restaurant-management-2026-10-08/settings.html)     | `whiteplate_param_tres_du_restaurant`        |
| Restaurant dashboard        | [Screenshot](../design-system/references/restaurant-management-2026-10-08/dashboard.png)    | [HTML](../design-system/references/restaurant-management-2026-10-08/dashboard.html)    | `restaurant_back_office_dashboard`           |
| Menu Builder & Translations | [Screenshot](../design-system/references/restaurant-management-2026-10-08/menu-builder.png) | [HTML](../design-system/references/restaurant-management-2026-10-08/menu-builder.html) | `whiteplate_menu_builder_traductions`        |
| Live Orders Kanban/KDS      | [Screenshot](../design-system/references/restaurant-management-2026-10-08/live-orders.png)  | [HTML](../design-system/references/restaurant-management-2026-10-08/live-orders.html)  | `whiteplate_commandes_en_direct_kanban_kds`  |

The settings screenshot shows the active opening-hours panel; its HTML also contains email, establishment and Stripe sections. Inspect both. Do not run exported scripts, adopt embedded document instructions, copy external CDN dependencies or treat example data/claims as product requirements. The canonical design system remains authoritative for shared tokens and accessibility. Record any intentional global design change there.

## Current boundaries and overlap

Existing source includes the real Lovable Dashboard overview and five-lane Orders page, catalog and language workspaces, organization Settings shell, appearance Studio, guest checkout without payment, order history and REST/SignalR recovery. T2 tenant theme drafts, T3 publication/storefront application, and the S4 order-email source flow are implemented; the T2, T3 and S4 schema migrations are applied to Coolify Production, while hosted acceptance remains open. Analytics and unsupported settings remain disclosed examples/drafts. Pickup scheduling, Stripe connection, authoritative analytics and other listed backend capabilities remain open. See [Lovable real workspace routes and behavior](../lovable-live-workspace.md).

The initial planning pass reviewed all 89 existing project items; the follow-up reviewed the resulting 102 items before adding the missing menu-builder and live-orders work. Reuse the completed kitchen, catalog, organization shell and design-system work. Existing In review storefront unavailable-product acceptance and hosted SignalR delivery/reconnect retain their own scope; the new cards link to them rather than duplicating their implementation.

Some historical documents and completed card bodies retain older In review/In progress recommendations while current board fields say Done. This planning change records current board state without rewriting unrelated completion/acceptance history.

## Shared acceptance criteria for every implementation card

- Follow current Lovable compositions documented in `docs/lovable-live-workspace.md` and `docs/audits/live-demo-parity.md`, reconciled with `docs/design-system/README.md` and `tokens.json`. Stitch screenshots and HTML below are historical provenance only. Correct responsive overflow, alignment, padding and focus defects rather than reproducing export artifacts. Keep WhitePlate branding and do not turn example content into implementation requirements.
- Preserve actual routes, workspace shell, controls, current operations and customer previews. Verify phone, tablet, desktop and wide layouts at 320, 375, 390, 768, 1024 and 1440px; keep controls usable without overflow, clipping, or save bars covering inputs/safe areas.
- Verify EN/FR, light-only runtime, keyboard/focus/dialog return, 200% text zoom, reduced motion, readable contrast and semantic status labels. Use at least 44px touch targets and 48px tablet back-office actions. Keep both translation catalogs complete.
- Include matching route/query skeletons and distinct loading, empty, pending, validation, failure/retry, success and unavailable/offline states. Preserve unsaved input on errors and prevent duplicate mutations.
- Enforce persisted tenant membership for every protected API/storage read/write, aggregate, cache and subscription; browser tenant IDs never authorize. Verify cross-tenant denial and membership revocation. Keep keys/credentials server-side.
- Reuse shared Base UI controls, the existing HTTP factory, server actions/services and tenant/account/locale query boundaries. Read scoped AGENTS.md and installed Next.js docs before implementation.
- Update API contracts, schema/migration documentation, architecture and functional test plan for actual behavior. Run applicable frontend tests, lint, typecheck, format checks and build; run `dotnet test apps/api/WhitePlate.slnx` for API changes. Record exact results, screenshot comparisons and actual persistence/hosted verification separately. Do not mark simulated or unverified services complete.

## Suggested implementation order

The Lovable Menu workspace (M1) and existing five-lane Orders screen (K1) provide the implemented foundations. Product metadata (M2) depends on M1; product photos are a separate task (M5), depending on M1 and T1; human translation review (M3) and catalog publication/history (M4) build on M1 after their decisions. KDS operational features (K2) and cancellation/payment details (K3) extend existing Orders behavior, with scheduling, media, metrics, notification and financial dependencies gated to actual runtime support.

Start remaining establishment identity (S1) and hosted media acceptance (T1); the Lovable Dashboard overview exists, while any remaining D1 gaps must be confirmed against source. Follow with persistent theme controls (T2), opening hours (S2), theme preview/publication (T3), slot enforcement (S3), metrics (D2) and availability (D4). Rush/pause (D3) depends on slot enforcement. S4 transactional email has a source implementation, resolved consent/event/provider decisions and an applied Coolify Production migration; provider and hosted acceptance remain open. S5 Stripe Connect is implemented and its Coolify Production schema is applied; test credentials and hosted OAuth/webhook acceptance remain open.

All feature cards start in Backlog. Move a card to Ready when its listed decisions and dependencies are settled; completion requires implementation and verification.

Manual/phone order entry is explicitly excluded by the user, even though the live-orders export includes that form. Product photos are scoped separately in M5; they are not bundled into product metadata.

## Future implementation tasks

### T1 — Theming Studio: upload restaurant logo, favicon and banner

Reference: theming. Dependencies: none.

Build tenant-owned brand media upload, replacement and removal using the supplied Brand Identity Assets card.

Implementation update (2026-10-08): T1 is implemented in source with private S3-compatible storage and individual asset saves. Shared migration application, actual provider and hosted two-tenant acceptance remain pending; see [T1 evidence](../audits/brand-assets.md). The checklist below retains the complete acceptance scope.

Acceptance criteria:

- [ ] Support logo, favicon and hero banner with previews, fallback assets, upload progress and recoverable errors; document accepted formats, byte/dimension limits and crop behavior before implementation.
- [ ] Use the reference logo guidance (transparent square, 512px target), favicon ICO/PNG and 16:9 / 21:9 banner framing; validate actual file content and reject unsafe uploads; sanitize or rasterize SVG if supported.
- [ ] Persist tenant-owned media and metadata through authenticated operations; prevent foreign-tenant overwrite/read access to private drafts and define cleanup for replaced/unpublished assets.
- [ ] Keep the last published asset usable after a failed replacement; verify actual storage and storefront delivery with two tenants.

Decisions and limits:

- Choose media storage/delivery, retention, allowed types and concrete limits before coding; no storage provider is selected by the mockup.

### T2 — Theming Studio: logo-derived palettes, presets and style controls

15 October 2026: implemented and merged in PR #110 using the user-approved unchanged Lovable Studio styling, authorized versioned backend drafts, saved-logo suggestions, real contrast diagnostics, ambiance presets and existing radius/font controls. Production migration is applied; API deployment and hosted two-tenant acceptance remain unverified. Low-contrast drafts are recoverable; safe publication is T3. The reference radius sliders supersede separate historical Stitch radius buttons. See [decision 0012](../architecture/decisions/0012-tenant-theme-drafts.md) and [evidence](../audits/theme-controls.md). The user is handling the board update.

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

Implementation update (16 October 2026): T3 publication and real storefront application are implemented in source. Studio keeps saved drafts separate from publication, adds explicit Publish/Discard actions, and uses one “Design” / “Brand & Details” tablist above Presets to switch between the real theme controls and brand asset workspace. The published appearance and asset IDs apply to the host-resolved menu, checkout, tracking, page title, and favicon. API build, frontend lint/typecheck/build, focused Prettier checks, and migration SQL generation passed. Lint reports 19 existing image-element warnings; repository-wide Prettier still flags 651 files. The generated `20261016132000_ThemePublication` migration preserves current default appearance and active brand slots but has not been applied. Production rollout, fresh guest-session/browser visual acceptance, and hosted tenant isolation remain pending. No automated tests were run. The approved design and implementation details are in [T3 spec](../superpowers/specs/2026-10-16-theme-publication-design.md), [plan](../superpowers/plans/2026-10-16-theme-publication.md), [API contract](../api/api-contracts.md#t3-theme-publication), and [schema note](../database/database-schema.md#t3-published-theme-snapshot).

Acceptance criteria:

- [ ] Match the supplied two-column editor/preview hierarchy on desktop; provide usable stacked or switchable controls/preview on mobile, including 390px preview and desktop mode.
- [ ] Separate editable drafts from the published theme. Define reset/discard semantics, dirty-state feedback, save/publish errors and stale concurrent edits; failed publication preserves the current live storefront.
- [ ] Publish validated logo/favicon/banner/palette/ambiance/radius/fonts together and apply them on the correct tenant storefront and browser metadata; handle cache refresh without tenant contamination.
- [ ] Verify changes after refresh and in a separate guest session; preview must not create orders, charge payments or present sample ratings/times as real data.
- [ ] Show the existing validated subdomain/copy link where appropriate. Custom-domain DNS/TLS provisioning remains deferred under decision 0003.

Decisions and limits:

- Draft persistence, reset/discard semantics, publication concurrency, snapshot backfill and safe publication thresholds are recorded in the approved [T3 spec](../superpowers/specs/2026-10-16-theme-publication-design.md).

### S1 — Restaurant Settings: establishment identity and pickup information

Reference: settings. Dependencies: none.

Implementation update (12 October 2026): identity, address, IANA timezone, localized pickup details and safe directions are implemented. The legal profile follow-up has an approved [specification](../superpowers/specs/2026-10-12-legal-settings-design.md); source implementation and verification are in progress. S1 migration, deployment and hosted acceptance remain In review. Email delivery remains separate backlog scope.

Add the establishment-information settings section with public/legal identity, address, phone, pickup instructions and location links from the reference.

Acceptance criteria:

- [x] Implement trade name, phone, address, coordinates, IANA timezone and localized pickup instructions with validation and authorized persistence; local relational/UI verification complete, hosted acceptance pending.
- [x] Reuse existing description/language management and fallback; integrate current pickup details into storefront/checkout/receipt/tracking. Email integration stays S4.
- [x] Generate saved-data Google Maps/Waze directions and handle missing coordinates/address.
- [x] Support France, Germany, UK and US legal profiles; validate identifier syntax/checksums without registry claims. France uses organization SIREN and restaurant SIRET. Do not add a default tax rate; retain product rates and historical order amounts.
- [x] Keep organization/restaurant settings separate and independently authorize reads/mutations; local HTTP membership/role/active/revocation coverage.

Decisions and limits:

- Clarify legal-field applicability beyond France and any default-tax precedence; currency/subdomain changes and NFC/kiosk behavior are not implicitly authorized.

### S2 — Restaurant Settings: weekly opening hours and service windows

Design, written specification and implementation plan approved 2026-10-12: [S2 weekly opening hours design](../superpowers/specs/2026-10-12-opening-hours-design.md), [implementation plan](../superpowers/specs/2026-10-12-opening-hours-implementation-plan.md). Source implementation is complete; local full verification and board acceptance are in progress. The additive migration is not applied to shared environments.

Reference: settings. Dependencies: S1.

Build the opening-hours editor with seven days, closed-day toggles, lunch/evening or continuous service and copy-day-to-week controls.

Acceptance criteria:

- [x] Support multiple opening windows per day, continuous service, closed days and explicit copy/apply behavior that does not silently overwrite unsaved work.
- [x] Validate time formats, ordering and overlapping windows server-side; store the restaurant time zone and handle DST and midnight boundaries according to a recorded policy.
- [x] Persist hours with localized feedback, recoverable failures and concurrency protection; expose authoritative public opening information.
- [x] Match the current settings editor and reflow weekly rows into readable mobile cards.
- [ ] Verify hosted persistence and two-tenant authorization. Distinguish saved hours from enforced checkout scheduling until S3 is complete.

Decisions and limits:

- Approved: use the saved S1 IANA timezone (UTC fallback), disallow overnight windows, and exclude holidays/date exceptions. See the written design for DST and midnight boundaries. Do not infer these rules from the example Paris schedule.

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

Build Notifications & Emails for order-received, preparing and ready notifications with subject, greeting/body, branding and mobile/desktop previews.

Acceptance criteria:

- [x] Edit and persist localized template content with an allowlisted variable set and escaped output; support preview, reset/discard, validation and pending/error states.
- [x] Reuse published restaurant identity/logo/banner/colors when available, and include saved order summary, tracking link, pickup instructions and pickup time.
- [x] Trigger sends from committed authoritative order events; optional email requires explicit consent. The independent delivery outbox records pending/sending/accepted/failed state, retries with event-ID deduplication, and never equates a saved template with a sent email.
- [x] Keep provider credentials and the tracking signing key in the API runtime; retain the verified platform sender and keep the existing auth/invitation email flow distinct.
- [ ] Verify actual provider test delivery, duplicate-event retry, unavailable provider, locale fallback and cross-tenant templates/recipients with a controlled mailbox and without contacting real guests.

Decisions and limits:

- Resolved 2026-10-17: optional email with explicit order-update opt-in; send on committed creation, Preparing and Ready events; use Resend with the verified platform sender and published restaurant identity. Clear the order email on close or 30-day tracking expiry, and clear delivery recipients/content after provider acceptance/final failure or expiry. Sender-domain/reply-to customization, after-payment notices, marketing and SMS remain out of scope.
- Remaining: configure the API-side Resend sender, HTTPS storefront template and stable signing key; deploy the API; then verify real provider delivery and hosted tenant acceptance. The schema migration is applied to Coolify Production. See [decision 0015](../architecture/decisions/0015-transactional-order-email.md), [S4 contract](../api/api-contracts.md#s4-transactional-order-email), and [S4 schema](../database/database-schema.md#s4-transactional-order-email--2026-10-17).

### S5 — Restaurant Settings: Stripe Connect onboarding and connection status

Reference: settings. Dependencies: S1.

Implemented in source: the Payments settings section connects each restaurant's Standard account through server-side OAuth in a server-selected Stripe test/live mode. Owners can select an existing account or create one during OAuth; owners manage the connection and owners/managers read Stripe-sourced connection/readiness status. WhitePlate adds no application fee and S5 does not create payments or charges.

Acceptance criteria:

- [x] Use Standard OAuth to connect the selected Standard account, whether it existed before OAuth or was created during setup; persist one account per tenant and mode; bind one-use state to tenant, initiating owner, mode and locale; recheck owner membership before code exchange.
- [x] Show connection and Stripe readiness states from live Stripe account fields and signed webhooks; a callback redirect never proves connection or verification.
- [x] Verify webhook signatures, deduplicate events, ignore stale updates and prevent account.updated from restoring a disconnected connection. Deny foreign-tenant access and keep secrets, tokens, bank data and requirement details server-side.
- [x] Provide a fixed mode-correct Stripe Dashboard link for owners; managers receive read-only status. Do not show balances, bank data or payment methods.
- [x] Add localized EN/FR Payments settings and document test/live server configuration. S5 does not activate checkout or create charges.
- [x] Apply the reviewed additive migration to Coolify Production before merging/deploying the connected API version; verify history, tables, indexes, empty rows and API-role grants. See [S5 rollout evidence](../deployment/coolify.md#s5-stripe-connect-schema-rollout--2026-10-17).
- [ ] Complete manual OAuth/webhook acceptance with a configured Stripe test client, `sk_test_…` key, `whsec_…` secret and reachable callback.

Decisions and limits:

- Resolved for S5: Standard account via OAuth (existing or created during setup); Stripe processing fees remain with the restaurant; WhitePlate takes no application fee; no in-app unlink or active-account replacement; no payment execution.
- Guest checkout, direct-charge execution, refunds, reconciliation, paid-order semantics, countries/currencies and live deployment require separate implementation and acceptance before WhitePlate processes payments.

### D1 — Restaurant Dashboard: live operations overview from existing orders

Reference: dashboard. Dependencies: none.

Build the real restaurant back-office dashboard using the supplied overview design while reusing the implemented kitchen Kanban, order lifecycle and REST/SignalR recovery.

Acceptance criteria:

- [ ] Provide restaurant context, role-aware navigation, live storefront link and a compact responsive summary of Pending/Preparing/Ready/Completed/Cancelled counts from the currently loaded order page.
- [ ] Keep ticket details and authoritative status actions on the dedicated Orders board; preserve its existing If-Match, pending, conflict, cancellation-role and revocation behavior without creating a second workflow.
- [ ] Distinguish full-tenant server counts from loaded-page counts; show refresh/offline/stale/empty/error states and recover through REST after reconnect.
- [ ] Show paid, pickup countdown, email-delivered, station or shelf labels only when their supporting data exists; preserve the separate demo route and clearly mark unavailable future widgets.
- [ ] Test owner/manager/kitchen visibility, foreign-tenant denial, revoked membership, keyboard/touch actions and actual server persistence. Coordinate hosted SignalR checks with the existing In review card rather than duplicating that scope.

Decisions and limits:

- Resolved 13 October 2026: keep the dedicated responsive overview separate from the Live Orders Kanban; show loaded-page aggregate order value to owners/managers only, while Kitchen still sees operational counts and existing per-ticket totals. No full-tenant aggregate is implied.
- Remaining verification: confirm owner/manager/Kitchen visibility, foreign-tenant denial, revoked membership, keyboard/touch behavior and persistence against authenticated runtime fixtures. Coordinate hosted SignalR checks with K1 rather than duplicating that scope.

### D2 — Restaurant Dashboard: authoritative metrics, rush pacing and top sellers

Reference: dashboard. Dependencies: D1.

Replace illustrative dashboard KPIs and insight widgets with tenant-scoped server aggregates for order value, active queue, preparation time, hourly order volume and top-selling items.

Acceptance criteria:

- [x] Document each metric's source, time window, restaurant time zone, included order statuses, tax/discount treatment and historical-snapshot semantics before computing it.
- [x] Return server-side aggregates across all matching orders including retained history; provide real queue breakdowns, hourly volume and product rankings with accessible text alternatives.
- [x] Calculate average preparation time only when lifecycle timestamps support it; distinguish order value from captured payment revenue until verified payments exist.
- [x] Show meaningful empty/insufficient-data states and comparison periods; never retain sample growth percentages, expected-volume forecasts or repeat-diner rates as real metrics.
- [x] Verify aggregate accuracy using deterministic multi-day and two-tenant fixtures, authorization/cache isolation and currency formatting. PostgreSQL/hosted verification remains open.

Source decisions and limits:

- New status transitions capture `PreparingAt` and `ReadyAt`; legacy rows remain null and never receive inferred times. Preparation samples are nonnegative intervals whose `ReadyAt` is within the business date.
- Compare the restaurant-local calendar day with the previous local calendar day using the saved IANA time zone. Use all still-retained orders, including archived history. Order counts/hourly volume count all statuses including later cancellations; order value and top sellers exclude currently cancelled orders. Saved `Order.Total` includes discounts and tax; payment settlement remains outside this API.
- Repeat-diner percentage requires a defined guest identity/privacy model; expected-volume forecasting needs a separate data/model decision. PostgreSQL rollout/query-plan and hosted real-data acceptance remain open.

### D3 — Restaurant Dashboard: rush hold and emergency ordering pause

Reference: dashboard. Dependencies: S3, D1.

Implemented in source; migration applied to Coolify Production and Neon `test`. The Neon rollout happened before Coolify was clarified as the target. PR #92 remains open; hosted acceptance is still outstanding. The approved operating policy is in [decision 0011](../architecture/decisions/0011-dashboard-ordering-operations.md).

Acceptance criteria:

- [x] Show current accepting-orders state and explicit rush/pause/resume feedback. Owners/managers confirm changes; Kitchen can view only. Rush adds ten minutes to newly offered pickup times and stays active until manually cleared.
- [x] Apply rush buffer and pause on the server; API tests verify hidden slots, rejection of a stale-cart checkout, and a ten-minute shift to new pickup times.
- [x] Keep accepted orders, reservations, slot capacity and successful idempotent retries unchanged when service is paused; API coverage verifies an existing receipt is still replayed while a new checkout is rejected.
- [x] Keep updates tenant-bound and role-authorized with versioned conditional writes. PostgreSQL checkout row locking gives pause and new order creation a serialization point; failed dashboard saves retain the last confirmed state.
- [ ] Verify multiple staff browser sessions against the migrated PostgreSQL runtime. API fixtures already cover pause/resume, a stale guest cart, successful idempotent replay and unchanged prior reservations. No automatic expiry was selected. Do not equate service pause with destructive organization archive/deactivation.

Decisions and limits:

- Resolved 14 October 2026: owner/manager writes and Kitchen read-only; fixed +10-minute rush lead buffer with manual clearing and no timer expiry; pause blocks new checkouts and hides public slots while existing orders, reservations and idempotency receipts stay unchanged. See [decision 0011](../architecture/decisions/0011-dashboard-ordering-operations.md).
- Remaining rollout: after PR #92 is merged, deploy the API/frontend; run independent-connection PostgreSQL concurrency checks and complete hosted multi-session/browser acceptance. `20261014150246_OrderingOperations` is already applied to Coolify Production and Neon `test`. See [D3 evidence](../audits/dashboard-rush-pause.md).

### D4 — Restaurant Dashboard: quick availability and storefront shortcuts

Reference: dashboard. Dependencies: D1.

Add the Quick 86 availability panel and live storefront copy/open/QR shortcuts without inventing a stock-quantity inventory system.

Acceptance criteria:

- [ ] Reuse existing owner/manager product availability operations and catalog validation; show real saved product covers to photo-authorized owners/managers, pending/rollback feedback for mutations, and a read-only availability view for Kitchen.
- [ ] Reflect saved availability in the dashboard and tenant storefront; checkout must revalidate unavailable items while preserving existing order snapshots.
- [ ] Prevent archived products/categories from being reactivated through the shortcut; handle concurrent changes and stale cached menu data safely.
- [ ] Create public storefront links/QR codes from the validated tenant domain and locale policy; do not include auth/session/tracking secrets.
- [ ] Verify the unavailable-product guest presentation with the existing storefront In review card, plus two-tenant mutation denial and responsive keyboard/touch controls.

Decisions and limits:

- Resolved 14 October 2026: Kitchen can view saved product availability but remains read-only, matching the API's existing authorization; product photos use a neutral fallback because the private photo endpoint is restricted to owners/managers. Numerical stock, station/shelf assignments, printer/POS integrations and kiosk/NFC mode remain separate optional work.

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

- Define navigation migration and per-product editing/save semantics. Product metadata, human translation review, publication history and product photos are tracked in M2–M5; do not show their controls as operational before they are wired.

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

### M3 — Menu Builder: human translation review and glossary

Reference: menu-builder. Dependencies: M1.

Add a human-entered translation review workflow and tenant-owned glossary to the existing manual catalog translations. AI, machine and automatic translation are out of scope.

Acceptance criteria:

- [x] Keep existing saved translations unchanged; only an explicit new or changed human submission creates a versioned review candidate. Unchanged submissions are no-ops and existing translations receive no backfill.
- [x] Restrict submission, review queue, decisions and glossary management to persisted tenant owners/managers; prevent authors from reviewing their own candidates and reject stale source/saved-text versions.
- [x] Keep candidate text separate until approval; approval updates the editable draft, rejection preserves saved text, and M4 publication remains required for guest visibility.
- [x] Keep the tenant glossary advisory: validate locale pairs and normalized duplicates, but never insert or rewrite translation text.
- [x] Apply the additive empty-table migration to Coolify Production and verify migration history, empty review/glossary tables, API-role CRUD grants and unchanged tenant/publication counts.
- [ ] Deploy the API and complete hosted PostgreSQL concurrency plus manager/guest acceptance.

Decisions and limits:

- No translation provider or AI behavior is approved or implemented. Hosted API/runtime acceptance is still required before the M3 workflow is complete.

### M4 — Menu Builder: catalog draft publication and change history

Implementation update (2026-10-16): source now uses normalized management rows as the draft and immutable JSON snapshots as the guest/checkout publication. Owner/manager publish, discard, restore and history endpoints carry optimistic version preconditions; validation and publication are transactional, and D4 availability remains immediate with actor-attributed revision history. Decision 0013 records migration, retention and rollback scope. Migration `20261016155331_CatalogPublicationHistory` was applied to Coolify Production; baseline rows and API table grants were checked. API deployment and database/guest/staff runtime acceptance remain outstanding.

Reference: menu-builder. Dependencies: M1.

Define and implement the Publish changes and History controls shown in the Stitch Menu Builder without confusing them with the existing immediate-save catalog or order history.

Acceptance criteria:

- [x] Record the draft/published catalog model and migration path from current immediate writes before changing behavior; keep existing restaurants usable during rollout.
- [x] Track changes and reviewable publication scope across categories, products, options, pricing and translations, with dirty-state feedback and explicit publish/discard behavior.
- [x] Validate completeness, availability, locale fallback and all relevant price/option rules on the server before atomic publication; reject stale concurrent publishes and retain the last valid storefront version on failure.
- [x] Provide tenant-authorized catalog change history with actor/time/version and useful diffs; define retention and rollback scope rather than reusing the unrelated order-history page.
- [ ] Verify publication/cache refresh across guest and staff sessions while preserving checkout pricing/idempotency and immutable historical order snapshots.

Decisions and limits:

- Decision 0013 settles immediate D4 availability bypass, Owner/Manager publication permissions, indefinite history retention and rollback as a new version. M3 human review and glossary remain separate from publication; saved translations are captured as-is. M5 photos remain independently saved and are not part of catalog snapshots.

### M5 — Menu Builder: upload and manage product photos

Implementation update (2026-10-09): the user approved the image policies and required several images per product. Source supplies an ordered gallery of up to eight photos, separate private drafts/save/discard, cover selection, replacement/removal, guest rendering and tenant-owned storage reuse. Shared migration/provider/hosted acceptance remain pending; see [M5 evidence](../audits/product-photos.md) and [ADR 0008](../architecture/decisions/0008-product-photo-gallery.md). The checklist below retains the full rollout scope.

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

### K1 — Live Orders: extend the Lovable five-lane Kanban

Reference: current `/[locale]/organization/orders` screen and [Lovable real-workspace notes](../lovable-live-workspace.md). The older live-orders screenshot is historical provenance; the current Lovable screen and WhitePlate design tokens are authoritative.

Implementation update (2026-10-13): the real five-lane page now searches the current loaded order page by reference, customer, saved item or modifier, and filters by saved ASAP/scheduled intent. A nullable `Orders.PickupMode` snapshot distinguishes the guest's original checkout choice from the concrete slot assigned to ASAP; legacy orders with no saved intent remain unrecorded. Ticket badges show recorded intent, filters survive status/cursor navigation, and lane tracks auto-fit the available workspace width at the documented 18rem minimum. Existing REST status writes, If-Match guards, role checks, drag/keyboard actions, SignalR refresh/reconnect, stale/offline feedback and history archival remain the source of truth. See [K1 evidence](../audits/live-orders.md).

Resolved presentation decisions:

- Start with all pickup modes selected; group orders by their persisted lifecycle status across Pending, Preparing, Ready, Completed and Cancelled lanes.
- Keep Completed and Cancelled in the live list until the existing daily archival moves them to order history.
- Search and pickup filters apply to the current REST page. The UI labels the result count as loaded-page data and preserves filters when the user changes status or loads an older cursor page.
- Treat old orders without recorded intent as unrecorded. Do not infer ASAP from `PickupAt`, since ASAP resolves to a real pickup instant.

Remaining acceptance and limits:

- The additive `20261013191310_OrderPickupMode` migration is generated but has not been applied to shared PostgreSQL. Existing orders therefore remain unrecorded until rollout; no migration is applied automatically at startup.
- Local browser coverage for the new controls, full EN/FR responsive/keyboard/zoom acceptance, API tests, and hosted migration/SignalR acceptance remain open. Keep the K1 project card in review until that evidence is recorded.
- K2 timers/sound/stations and K3 cancellation reasons/payment/refund state remain separate. Manual/phone entry, mock payment claims and fabricated notification state are excluded.

### K2 — Live Orders: KDS timers, urgency, sound and preparation metadata

Reference: live-orders. Dependencies: K1.

Add the reference operational KDS features: elapsed/remaining times, urgency cues, sound controls and real preparation-stage/station/pickup-location metadata where supported.

Acceptance criteria:

- [x] Derive elapsed timers from saved `createdAt` and remaining pickup time from saved `pickupAt`, with a server snapshot clock advanced monotonically on the client. A preparation countdown remains deferred because there is no authoritative preparation target; M2 minutes are guidance.
- [x] Set due-soon at five minutes or less and overdue at/past pickup time. Show semantic text, icon and color together; no motion or fabricated progress is added.
- [x] Provide explicit user-controlled, session-scoped sound enable/mute and accessible new-order alerts. Ignore duplicate/replayed events and only alert for a creation newer than the API snapshot, including after reconnect.
- [ ] Persist preparation stages, station and pickup-shelf assignments with tenant-authorized updates and concurrency control, then render actual stage/progress data on tickets. Deferred: the order model has no stage/assignment fields or approved edit-role/concurrency policy.
- [x] Integrate available S3 pickup times and M2 saved preparation guidance. D3 rush status is not available in the live order/API runtime, so no rush-adjusted deadline is inferred. Local focused tests cover timing boundaries and alert deduplication; keyboard/touch browser acceptance remains open.

Decisions and limits:

- Resolved 2026-10-14: use API `serverTime`, saved UTC `createdAt`, and S3 `pickupAt`; mark due soon at five minutes or less and overdue at/past pickup; keep sound preference for the mounted board session and default it to muted. M2 preparation minutes remain guidance, not a deadline. See [K2 verification and remaining acceptance](../audits/kds-operational-features.md).
- Deferred: introduce preparation stages and station/shelf assignment only after an order model, tenant-authorized update contract, edit roles and concurrency policy are approved. D3 rush state is also unavailable to the live order runtime; external courier/POS integration is not established by a badge.

### K3 — Live Orders: cancellation reasons and authoritative payment/refund status

Reference: live-orders. Dependencies: K1, S5.

Implemented in source: terminal ticket details record new cancellation reasons, display only actual S4 email-delivery states, and state clearly that WhitePlate has no online payment record and does not track offline settlement/refunds. The nullable reason migration is generated but unapplied; hosted PostgreSQL/browser/provider acceptance remains open.

Acceptance criteria:

- [x] Record validated cancellation reasons through the existing permitted lifecycle transition, preserving role restrictions, concurrency checks and legacy null history.
- [x] Show notification status only from actual S4 delivery records; distinguish provider acceptance from inbox delivery and avoid exposing recipient/provider details.
- [x] When no guest-payment/refund ledger exists, state that no online payment record exists and offline activity is untracked; do not emit payment status claims.
- [ ] Define and approve the guest-payment/refund ledger and webhook reconciliation before any future financial mutation; a Stripe Connect account connection alone is insufficient to charge or refund.
- [ ] Complete hosted PostgreSQL/browser acceptance, including two-tenant role/privacy checks and delivery-event retry states.

Decisions and limits:

- Actual guest payments/refunds require a separately approved payment-flow design, capture/cancel/refund policy, liability model and test-mode verification. Until then show only the not-supported capability disclosure and reason storage; do not claim an order is unpaid or fabricate refunds, credits, Stripe voids, SMS or card settlement.

## Verification of this planning change

Reviewed repository docs/manifests and representative tenant, product, catalog/language, live dashboard and demo source. Visually inspected all five screenshots and read their HTML feature lists, including inactive-tab content. The follow-up preserves two more references, adds M1–M5 and K1–K3 (20 implementation cards total), and requires correcting Stitch offsets, overflow, centering, padding and margins on every implementation card. Manual/phone orders are excluded; product photos have their own task. No application behavior, dependencies or environment configuration changed. Reference integrity, Markdown links, board creation/status/content read-back and Git whitespace checks are verified in the planning-card handoff. Application tests are not required for these documentation/reference and kanban changes.
