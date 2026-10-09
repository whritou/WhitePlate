# WhitePlate frontend architecture

Status: localized Better Auth flows, server-only API BFF, responsive organization workspace shell, content-matched route loading skeletons, organization signup and rename settings, owner-only team roster/invitation reads and pending-invitation revocation, accessible mutation toasts, and owner/manager catalog and discount management are wired in source. The Better Auth schema is migrated on Neon `test` and Coolify Production; email/password signup plus invitation acceptance were verified on Neon with locally intercepted email. Hosted email/password signup, organization, restaurant creation and owner access are verified through Vercel and Coolify. Configured OAuth/real email delivery, hosted SignalR URL/CORS/TLS and expiry, public tenant DNS/TLS, Preview isolation and operational readiness remain open; see [authentication setup](../development.md#authentication-configuration). Commands are in the [package README](../../apps/frontend/README.md) and [development guide](../development.md).

## Stack and source map

The public tenant storefront reads its restaurant description from the localized menu DTO, displays product cards with a confirmation dialog for option selection, and keeps a desktop cart panel plus a mobile cart entry that opens the same cart and checkout flow. Owners/managers edit the 500-character description by enabled menu locale in the restaurant language workspace. The API resolves description fallback from selected menu locale to default menu locale.

Next.js 16.3.4, React 19.2.8, strict TypeScript, Tailwind CSS 4, `next-intl`, and `next-themes` are wired into the application. shadcn Base UI components implement shared controls, cards and feedback. TanStack Query manages kitchen order reads and mutations. The [implementation conventions](frontend-conventions.md) define module ownership and enforced boundaries. Exact dependencies are recorded in the package manifest and lockfile.

```text
apps/frontend/
  app/
    [locale]/                 # Auth, organization, invitation, settings, and localized pages
      (workspace)/organization/ # Verified-session shell and role-scoped navigation
        (overview)/           # Organization and restaurant overview
        sign-up/              # Authenticated organization setup
        team/                 # Organization team and invitation workflow
        catalog/              # Restaurant catalog management
        restaurant-languages/ # Menu language and translation management
        orders/               # Server page and initial validated tickets
        order-history/        # Owner/manager-only searchable, filtered order history
    api/kitchen/               # Same-origin order reads and SignalR token route
    api/auth/[...all]/        # Better Auth handlers; browser token endpoint blocked
    .well-known/              # API JWT issuer metadata
    globals.css               # Tailwind imports and theme tokens
  components/
    app-providers.tsx         # Query, tenant-selection, and theme providers
    auth/                     # Auth and organization/invitation forms
    storefront/               # Product choices, in-memory cart, checkout and receipt
    query-provider.tsx        # Per-provider TanStack Query client
    tenant-selection-provider.tsx # Request-tree scoped Zustand store
    theme-provider.tsx        # next-themes and keyboard shortcut
    orders/                   # Query-backed dashboard, tickets and connection UI
    organization/             # Workspace shell and page-specific loading layouts
    ui/                       # shadcn Base UI controls, cards and feedback
  hooks/                      # Auth, checkout and order query lifecycle
  actions/                    # Validated organization, order and checkout mutations
  services/                   # Server-only feature reads and operations
  types/                      # Exported named contracts and props
  i18n/
    routing.ts               # en/fr; default en
    request.ts               # Request locale and message loading
    navigation.ts            # Locale-aware navigation exports
  messages/en.json
  messages/fr.json
  lib/auth.ts                # Better Auth, PostgreSQL schema, OAuth, mail and RS256 JWT
  lib/api/                   # Safe API request factory and authenticated server client
  lib/query/                 # Per-instance TanStack Query client factory
  lib/state/                 # Generic vanilla Zustand store factory, tenant selector, and guest checkout state
  lib/validation/            # Runtime input and response parsers
  lib/orders/                # SignalR, navigation and validated kanban drops
  lib/checkout/               # Cart, immutable retry payload and receipt validation
  lib/utils.ts               # Re-exports cn from the cn package
  public/                    # Placeholder
  proxy.ts
  next.config.ts
  postcss.config.mjs
  components.json
```

No `src/` folder exists. The TypeScript alias `@/*` resolves to the frontend root.

## Request and locale lifecycle

1. `next.config.ts` installs the `next-intl` plugin using `i18n/request.ts`.
2. `proxy.ts` delegates to `next-intl/middleware`. The matcher excludes paths beginning with `api`, `_next`, or `_vercel`, and paths containing a dot. It does not resolve tenants.
3. Routing supports `en` and `fr`, with locale prefixes enabled by the library defaults. Locale resolution prefers a supported URL prefix, then the locale cookie, then `Accept-Language`, then `en`. Test header negotiation with a fresh cookie jar.
4. `i18n/request.ts` loads the matching catalog, falling back to the configured default when the requested locale is unsupported.
5. `app/[locale]/layout.tsx` awaits `params`, independently validates the route locale, invokes `notFound()` if invalid, sets the request locale, and supplies messages to `NextIntlClientProvider`. Locale-aware translations, navigation, `useLocale`, and `getLocale` use this request configuration; call sites pass a locale only when deliberately switching languages.
6. `page.tsx` uses server-side `getTranslations` for the page and metadata. Links from `i18n/navigation.ts` switch locale while pointing to `/` within that locale.

`generateStaticParams` enumerates both locales. Localized sign-in/sign-up, email recovery/verification, organization signup/team, and invitation acceptance pages are implemented. Locale segments are not tenant identifiers. Unsupported path behavior should be tested through Proxy, not inferred solely from the layout guard.

`[locale]/not-found.tsx` renders the localized App Router not-found experience, and `[locale]/unauthorized/page.tsx` provides a localized access-denied destination. Workspace return links share the arrow-icon `BackLink` while each page controls its placement.

`app/global-not-found.tsx` handles unmatched URLs outside the dynamic `[locale]` segment with the installed Next.js experimental `globalNotFound` convention. It imports the global stylesheet and provides its own full HTML document because the convention bypasses application layouts; it offers browser-back and home actions and follows the operating-system color preference. The localized `not-found.tsx` handles unknown routes within `/en` and `/fr` and keeps the workspace design-system presentation.

## Rendering and theme

Auth pages keep session checks and protected API access on the server. `lib/api/` provides the shared GET/POST/PUT/PATCH/DELETE request factory, maps failures to safe result codes, and logs only bounded diagnostic metadata. Its authenticated server-only client validates the request origin, requires a verified Better Auth session, obtains a short-lived API JWT, and sends it to `API_BASE_URL`; API calls use `no-store`. Token requests through `/api/auth/token` are blocked from browser HTTP access. A separate same-origin `POST /api/kitchen/signalr-token` route checks a verified session and exact `Origin` before returning a short-lived JWT with no-store headers to the SignalR token factory. The token stays in memory and carries no tenant grant. A separate server-only public menu client sends no credentials and constructs its target from `PUBLIC_TENANT_API_URL_TEMPLATE` after validating the incoming Host against `STOREFRONT_BASE_DOMAIN`; it extracts exactly one tenant label and does not forward raw Host or forwarded-host headers. Restaurant menu language is selected with `menuLocale` independently of the `/en` or `/fr` interface locale. Owners and managers use `/[locale]/organization/restaurant-languages` to configure enabled languages and edit catalog translations. `AppProviders` provides an isolated TanStack Query client used by kitchen orders and a tenant-selection Zustand store; the server-rendered storefront does not consume those client caches. Custom domains remain deferred, and the API still resolves tenant hosts and authorizes all protected operations by membership. Resend delivery remains a separate server-only provider request. `ThemeProvider` is a Client Component using the `dark` class and the system theme by default.

The staff kitchen page first reads the verified user's `/api/v1/me` restaurant memberships on the server. A tenant ID in the page URL is only a selector; a missing membership prevents an order read, and the API independently enforces membership for both order reads and status changes. The paged REST response is authoritative and includes saved product/option labels. The client uses SignalR events only as refresh hints, filters and deduplicates by tenant/event/version, and rejoins the selected restaurant before scoped query invalidation after reconnect. `use-order-dashboard.ts` seeds TanStack Query with the initial server page, reads the authenticated same-origin `/api/kitchen/orders` BFF, polls every 30 seconds, and invalidates account/tenant pages after action-backed status mutations. Authorization failures hide tickets; unavailable reads can show a stale warning. Keys isolate account, tenant, locale, status and cursor. `PUBLIC_API_BASE_URL` supplies the browser-reachable hub origin if it differs from `API_BASE_URL`; deployment must allow the frontend origin for SignalR and provide HTTPS in production.

The public restaurant menu keeps its guest cart, customer fields, idempotency attempt and receipt in a non-persistent Zustand store scoped to the restaurant provider. This lets the cart survive navigation between the shop and checkout while changing restaurants creates a fresh store. Checkout writes go through the server action. The public `/[locale]/order/[orderId]` page only validates the ID and renders the tracker; the tracker reads through `lib/api/order-browser.ts`, which uses the custom browser API factory and same-origin tracking BFF. The API request carries the capability token only in its JSON body. The receipt link stores that token in the URL fragment; it is not sent in page requests. TanStack Query scopes reads by restaurant host and order ID and refreshes until the order is `Completed` or `Cancelled`. See [decision 0006](decisions/0006-public-order-tracking.md).

The orders page renders its empty state without empty Kanban lanes. Completed and cancelled orders stay out of the kitchen list after daily archival; their records and snapshots remain available in `/[locale]/organization/order-history`. That server page checks the signed-in user's current restaurant membership, and the API independently grants history access only to organization owners and restaurant managers. Search, status and inclusive UTC date filters, stable total/date sorting, and bounded server pagination are applied by the API. Table filters and page links retain the verified restaurant selector. Loading uses a route-specific skeleton; access, API failure, and no-match states are distinct.

Its `d` shortcut ignores repeated/prevented events, Ctrl/Alt/Meta combinations, events without a string key, and input, textarea, select, or contenteditable targets. Shift is not excluded. `suppressHydrationWarning` is applied on `<html>` to accommodate theme-class changes; it is not a general hydration-error workaround.

The theme currently changes light/dark appearance only. There is no restaurant-specific branding source. The storefront uses the existing button for cart and checkout actions.

## Organization workspace shell

`/[locale]/(workspace)/organization/layout.tsx` requires a signed-in, verified Better Auth session and reads the user's organizations and restaurant memberships through the existing server-only services. It passes only those display records to `WorkspaceShell`. The client shell shows role-appropriate links in a desktop sidebar and a mobile shadcn-compatible Sheet built on Base UI Dialog. The Sheet contains its own scrolling and uses Base UI's focus containment, Escape dismissal, and focus restoration. Locale links retain the current route and query only when organization or tenant selectors match those verified records; an unknown selector is removed from the locale-switch URL. Pages and API handlers still enforce access independently; layout navigation data is not an authorization grant. Organization signup is inside this shell because it requires the same verified session and shares the workspace navigation; its public URL remains `/[locale]/organization/sign-up`.

## Catalog management

Owners and managers open `/[locale]/organization/catalog?tenantId=...` from restaurant settings. The server checks the verified account's current membership before loading the catalog; the API independently authorizes every read and mutation. A dedicated response parser validates the requested tenant, currency, category and option-group relationships, discount records, selection bounds, amounts, tax, sort order, availability and archive state. Server actions accept validated form fields only, with API DTO-specific create/update payloads. Categories, products, option groups and options support creation and editing; archive dialogs explain descendant effects and preserve order history. Archived items remain visible for management history without edit forms, including when a parent is archived. New products are initially available, and existing products can toggle availability. Option prices use the restaurant's currency and display order; selection bounds follow the API's 0–20 rules. Prices use the restaurant's existing currency; two-decimal amounts, 0–100% tax, field lengths and database precision are checked before requests. Discount codes support fixed-amount and percentage creation, mutable name/type/value edits with immutable codes, localized duplicate feedback, and explicit one-way deactivation; inactive codes remain read-only history. Destructive archive and discount deactivation use localized shadcn AlertDialogs. Escape and Cancel return focus to the trigger; pending mutations prevent duplicate submission and dismissal, safe failures leave the dialog open, and success closes it before refreshing the catalog. The translation editor supports group and option labels. The guarded discount-management browser flow covers owner creation, editing, cancellation and deactivation; real-database checkout redemption and receipt-history acceptance remain to be run.

## Restaurant creation

Organization owners open `/[locale]/organization/restaurants/new?organizationId=...` from their organization or team page. The server reads the verified session and owned organizations before rendering the form. The action validates and normalizes the name, one-label subdomain and EUR/USD/GBP currency, then delegates to the server-only restaurant service and authenticated API client. The API independently checks ownership; a browser organization ID never grants access. Reserved labels fail validation, taken labels produce a localized conflict, and inaccessible organizations receive a safe denial. The created restaurant appears in the team view and the current user's restaurant navigation after server refresh. Domain/DNS setup remains separate: creation does not configure a public domain.

## Organization settings

Organization owners open `/[locale]/organization/settings?organizationId=...` from the organization overview. The page obtains the current owner organization list through the authenticated server-side API client and renders a rename form only when the selected ID appears in that list. The server action validates the organization ID and a trimmed 1–200-character name before calling the existing `PATCH /api/v1/organizations/{organizationId}` API. The API independently enforces ownership; the URL ID selects the organization but grants no access. English and French pending, success, unavailable, validation, and access-denied copy is provided.

The team route loads organization members and invitation summaries through server-only authenticated API reads. It displays only role, optional verified email, restaurant scope, expiry, and server-derived invitation status. The API owner-checks every read and omits OIDC identity keys and token material. Pending invitations have a localized accessible confirmation dialog; a successful revoke announces through the workspace toast and refreshes the lists. Empty/error states and the route skeleton match the roster and invitation sections.

## Workspace mutation feedback

`AppProviders` mounts one shared `WorkspaceToastProvider` built on Base UI Toast and the shadcn button. Successful catalog, translation, menu-language, organization, restaurant, invitation, pending-invitation revocation, and kitchen-order mutations announce localized feedback through a polite notification region. Its name is provided by a visually hidden label, not a visible heading; failures remain inline alerts so they persist for correction. The viewport does not steal focus, and keyboard users can reach the toast and its localized dismiss control. Success copy contains no server error details or private data.

## Workspace loading and refresh states

Each organization route has a localized App Router fallback shaped for that page: the overview reserves restaurant-order, menu-setting, and organization groups; team reserves roster, invitation status, invite-form, and restaurant areas; restaurant creation and organization signup show their forms; catalog and menu-language pages reserve their summary, tabs, filters and saved-item lists; settings shows its rename form; and orders show status tabs and five kanban columns. The overview fallback lives under the `(overview)` route group so it cannot cover its sibling pages. Every fallback uses the shared shadcn-compatible `Skeleton`, exposes one polite localized status and `aria-busy`, hides decorative shapes from assistive technology, and stops pulsing under reduced-motion preferences. Page-level API failures and empty results continue to render their distinct alert or empty state after loading resolves.

Kitchen orders distinguish an initial browser query from a background refresh. The initial query announces loading and shows lane-shaped kanban skeletons while no order data exists. A background query announces that it is checking for updates while keeping the last order page on screen; if refresh fails, the existing stale-data warning remains beside the saved orders.

## Guest cart and checkout

The server loads the tenant menu and renders `RestaurantMenu`, a Client Component keyed by the API tenant ID. Its cart has one line per product with editable quantity and option IDs. It uses component state without browser storage or a persisted cart. Reloading, leaving the page, or changing tenant clears cart/receipt state. A menu-language change uses localized router replacement and retains the same tenant's cart; the interface locale stays independent.

`checkoutGuestOrder` requires an HTTP(S) Origin matching the actual request Host. It ignores forwarded-host and tenant headers, extracts the restaurant slug using the same validation as menu reads, and posts customer name, promo code, selected menu locale, product IDs, quantities, and option IDs to the configured server-only public API template. Browser prices, totals, tenant IDs, credentials, and raw Host are not forwarded. It bounds the payload at 16 KiB, uses a 15-second timeout, and validates receipt JSON.

The browser creates one UUID key and copied, normalized payload per attempt. Unchanged retries reuse both. A definite rejection allows editing and changed content gets a new key. A lost response, timeout, server failure, or malformed receipt leaves the outcome uncertain: editing and language switching are locked, and retry submits the original attempt. The API resolves the submitted menu locale against tenant settings, snapshots localized product and option names with default-language fallback, and includes the effective locale in its receipt. Existing receipts keep their saved names and report their unknown locale as `null`. The receipt displays server totals, tax, discount, snapshot labels, and order reference with the saved menu locale as its language. Starting another order clears it. A synchronous guard prevents rapid double submissions.

Safe errors have English/French messages. The API owns availability, option rules, pricing, tenant ownership, and idempotency. Staff order summaries include the saved locale and display persisted translated product and option labels without catalog lookups. Payment, inventory, pickup scheduling, and public receipt lookup remain outside this feature. Browser acceptance uses a local deterministic API fixture; real database acceptance and deployment routing remain open. See [verification evidence](../documentation-review.md#guest-cart-and-checkout-verification--2026-10-01).

## Styling and UI conventions

The canonical [design system](../design-system/README.md) defines the Culinary Commerce identity, structured light/dark tokens, typography and layout tokens, component guidance, and a static reference overview. Root and frontend AGENTS require reading and following it. Shared runtime colors, font stacks, spacing, radii, and custom responsive/type tokens are exposed through `app/globals.css` and Tailwind 4; Plus Jakarta Sans and Inter load the bundled variable fonts from `public/design` with system fallbacks. The reference JSON is not imported by the client. `app/design-tokens.test.ts` retains the existing color/radius parity contract. Shared controls retain keyboard focus and disabled-state behavior; page-level layout recipes remain guidance for scoped follow-up. The development-only `/[locale]/design-system-test` route exercises actual primitives, WorkspaceShell and OrderTicket without database access; production returns 404. Existing browser coverage includes themes/locales, interaction states, keyboard, responsive widths, text zoom, reduced motion, and separately opted-in fixture checkout. This token migration does not change auth/tenant, query, retry, pricing, or order-transition behavior.

`app/globals.css` imports Tailwind, `tw-animate-css`, and shadcn styles, and maps CSS tokens through `@theme inline`. Body and heading fonts use local variable assets with system fallbacks; production builds do not fetch Google-hosted font files. PostCSS uses `@tailwindcss/postcss`. There is no `tailwind.config.ts`; do not copy Tailwind 3 setup instructions into this app.

Shared controls use Base UI. `components.json` records the `base-lyra` style and aliases. UI modules use `@/lib/utils`, which re-exports `cn`. Inspect each component API before composing it; see [implementation conventions](frontend-conventions.md).

The public landing is composed by `components/marketing/landing-page.tsx`. The illustrative menu uses `components/redesign/demo-menu.tsx` and its focused `demo-menu-cart.tsx` summary. Category controls scroll locally; below 1280px a fixed count/total link focuses and scrolls to the in-page order summary, with bottom space and safe-area padding. Desktop uses the sticky order sidebar. The [responsive audit](../audits/landing-demo-responsive.md) records scoped layout rules and verified EN/FR, light/dark and enlarged-text behavior. These demo controls do not call restaurant or payment mutations.

## Extending the frontend

Kitchen orders render a five-lane kanban through `OrderKanban`, with shadcn-compatible Base UI `Tabs` for status filters. Both initial query and route skeletons reserve the five columns. `use-order-drag` owns only pointer/drag state; `lib/orders/kanban.ts` rejects pending, stale and role-disallowed drops before forwarding the existing versioned mutation. Next-step buttons use the same mutation. Tickets stay in their saved lane until authoritative data refreshes. The board groups the current REST page, preserves server filter/cursor navigation, and labels its counts as loaded-page counts. The orders page uses the available workspace width, and its 18rem-minimum tracks place as many lanes on each row as fit, including `Cancelled`; the lane surface uses the semantic secondary color and tickets use card surfaces. Any non-interactive ticket area starts a mouse/pen drag, while buttons and links remain actionable. Touch requires a 350ms press-and-hold; movement before that threshold remains a normal scroll. The grabbed ticket and valid destination lane are highlighted, Escape cancels, and next-step buttons provide the keyboard alternative with focus restoration after moving a ticket. The development-only kanban test route uses fixed data and no database access.

- Add new pages beneath `app/[locale]/` unless the feature deliberately needs a nonlocalized route.
- Add the same message keys and interpolation variables to both catalogs. Use localized navigation helpers for internal app links.
- Keep Better Auth secrets, provider credentials, Resend key, and API bearer tokens on the server. Use Client Components for interactive forms and call server actions for organization, invitation, and other protected API work.
- TanStack Query manages kitchen order reads and mutations and public order tracking reads. Zustand supplies a per-provider tenant selector and tenant-scoped ephemeral guest checkout state. Public server-rendered pages and client components use the custom API request factories through server actions or same-origin BFF routes; pages do not call APIs directly. SignalR is integrated for the staff kitchen order page; Axios is not part of that flow.
- For future tenant features, include account, tenant, locale and view in authenticated cache keys and isolate cart persistence by tenant. Do not share authenticated data across tenants.

Read `apps/frontend/AGENTS.md` and the relevant installed guide under `node_modules/next/dist/docs/` before Next.js code changes. See [coding standards](../coding-standards.md), [test plan](../functional-test-plan.md), and [system architecture](WHITEPLATE_SYSTEM_ARCHITECTURE.md).

## Catalog and menu editing presentation — 2026-10-07

This describes the earlier presentation, retained in the development fixture for regression coverage. The production route now uses the combined M1 workspace described below. The earlier `CatalogWorkspace` separates Products, Categories and Discounts with Base UI Tabs. Categories, discounts, option groups and options use `EditorDialog`, backed by Base UI Dialog. `useCatalogForm` reports pending state to that dialog. Cancel/Escape discard local modal drafts and restore trigger focus; pending writes block dismissal, rejected writes keep input, and acknowledged writes close before router refresh. Destructive AlertDialogs remain separate.

`MenuLanguageSettings` displays saved language configuration and opens its form in a dialog. `CatalogTranslationsEditor` displays original and saved text, counts only explicit translations in the selected locale, and offers search/type/status filters. `CatalogTranslationForm` edits a draft in a dialog, preserving the existing default-locale fallback when initially populating fields. Interface locale and menu locale remain independent. Server membership checks, action validation and API contracts are unchanged; order history is outside this redesign.

The development-only `catalog-design-test` route mounts actual components with fixed data and a hydration readiness marker. Production returns not-found. The `catalog-design` browser project uses this route without authenticated database writes; save-path checks intercept requests and supply synthetic acknowledgements. This verifies UI behavior, not persistence or deployed access control. Authenticated catalog/discount/staff scenarios are adapted to the modal controls but require the separate guarded acceptance environment.

## Combined Menu Builder & Translations — M1, 2026-10-08

The restaurant catalog page now composes `MenuBuilderWorkspace`: category filtering, a product picker, an inline selected-product form and option panels in the products tab; existing language settings, restaurant descriptions and catalog translation editors in the translations tab. Discounts remain accessible in a dialog. Both tabs stay mounted, as do visited product editors, preserving local drafts when switching selection. Description drafts are stored per language. Product saves are explicit; discard restores the latest server value. Pending product/visibility writes lock selection and reject duplicate submissions. Modal drafts retain the existing Cancel/Escape semantics. Full navigation/reload discards local drafts. The root key includes account and tenant, so drafts cannot cross those boundaries.

`view=products|translations` selects the initial tab; tab switches replace browser history while retaining other query values. Legacy `restaurant-languages` redirects to the localized catalog route with all query values preserved and `view=translations`. Production authentication and membership checks remain on the destination. Menu languages are independent of the app's EN/FR locale. Existing translation validation and fallback display are reused. Language/description read failures have their own retry state without removing the usable catalog. The route skeleton mirrors the category/picker/editor/options composition.

Category visibility uses a new server action/service through the existing HTTP factory; ordering uses the existing numeric display-order inputs. No drag gesture is required. Layout stacks below desktop; workspace-scoped tablet sizing also covers portalled editors. Shared design tokens are unchanged. The development-only fixture supports `view=builder|products|translations` in addition to earlier regression views, and still returns not-found in production. See [design and verification evidence](../audits/menu-builder.md).

## T1 brand asset workspace

`/[locale]/organization/theming?tenantId=…` is a session-guarded owner/manager route in the existing organization shell. `components/organization/brand-assets-*` supplies the Stitch asset card and responsive brand preview; `hooks/use-brand-slot` keeps independent private drafts and retry state. TanStack keys include account, tenant and app locale. Services remain server-only behind `/api/brand-assets`; both translation catalogs include all UI states. Shared HTTP adapters now support bounded binary upload/image responses and real browser-to-BFF upload progress. They retain origin/path/token policy and safe status mapping. Public storefront branding uses `/api/public/brand-assets/{slot}`, whose upstream comes from the validated host and configured tenant template. The image component uses unoptimized same-origin requests so private previews never pass through a shared image optimizer. Development-only `/[locale]/brand-design-test` is a UI fixture and returns 404 in production.
