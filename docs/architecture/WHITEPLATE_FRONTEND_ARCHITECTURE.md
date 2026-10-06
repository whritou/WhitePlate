# WhitePlate frontend architecture

Status: localized Better Auth flows, server-only API BFF, organization signup and rename settings, email-bound staff invitation UI, and owner/manager catalog and discount management are wired in source. The Better Auth schema is migrated on Neon `test` and Coolify Production; email/password signup plus invitation acceptance were verified on Neon with locally intercepted email. Hosted email/password signup, organization, restaurant creation and owner access are verified through Vercel and Coolify. Configured OAuth/real email delivery, hosted SignalR URL/CORS/TLS and expiry, public tenant DNS/TLS, Preview isolation and operational readiness remain open; see [authentication setup](../development.md#authentication-configuration). Commands are in the [package README](../../apps/frontend/README.md) and [development guide](../development.md).

## Stack and source map

Next.js 16.3.4, React 19.2.8, strict TypeScript, Tailwind CSS 4, `next-intl`, and `next-themes` are wired into the application. shadcn Base UI components implement shared controls, cards and feedback. TanStack Query manages kitchen order reads and mutations. The [implementation conventions](frontend-conventions.md) define module ownership and enforced boundaries. Exact dependencies are recorded in the package manifest and lockfile.

```text
apps/frontend/
  app/
    [locale]/                 # Auth, organization, invitation, settings, and localized pages
      organization/orders/    # Server page and initial validated tickets
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
  lib/state/                 # Generic vanilla Zustand store factory and tenant selection state
  lib/validation/            # Runtime input and response parsers
  lib/orders/                # SignalR lifecycle and navigation helpers
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

## Rendering and theme

Auth pages keep session checks and protected API access on the server. `lib/api/` provides the shared GET/POST/PUT/PATCH/DELETE request factory, maps failures to safe result codes, and logs only bounded diagnostic metadata. Its authenticated server-only client validates the request origin, requires a verified Better Auth session, obtains a short-lived API JWT, and sends it to `API_BASE_URL`; API calls use `no-store`. Token requests through `/api/auth/token` are blocked from browser HTTP access. A separate same-origin `POST /api/kitchen/signalr-token` route checks a verified session and exact `Origin` before returning a short-lived JWT with no-store headers to the SignalR token factory. The token stays in memory and carries no tenant grant. A separate server-only public menu client sends no credentials and constructs its target from `PUBLIC_TENANT_API_URL_TEMPLATE` after validating the incoming Host against `STOREFRONT_BASE_DOMAIN`; it extracts exactly one tenant label and does not forward raw Host or forwarded-host headers. Restaurant menu language is selected with `menuLocale` independently of the `/en` or `/fr` interface locale. Owners and managers use `/[locale]/organization/restaurant-languages` to configure enabled languages and edit catalog translations. `AppProviders` provides an isolated TanStack Query client used by kitchen orders and a tenant-selection Zustand store; the server-rendered storefront does not consume those client caches. Custom domains remain deferred, and the API still resolves tenant hosts and authorizes all protected operations by membership. Resend delivery remains a separate server-only provider request. `ThemeProvider` is a Client Component using the `dark` class and the system theme by default.

The staff kitchen page first reads the verified user's `/api/v1/me` restaurant memberships on the server. A tenant ID in the page URL is only a selector; a missing membership prevents an order read, and the API independently enforces membership for both order reads and status changes. The paged REST response is authoritative and includes saved product/option labels. The client uses SignalR events only as refresh hints, filters and deduplicates by tenant/event/version, and rejoins the selected restaurant before scoped query invalidation after reconnect. `use-order-dashboard.ts` seeds TanStack Query with the initial server page, reads the authenticated same-origin `/api/kitchen/orders` BFF, polls every 30 seconds, and invalidates account/tenant pages after action-backed status mutations. Authorization failures hide tickets; unavailable reads can show a stale warning. Keys isolate account, tenant, locale, status and cursor. `PUBLIC_API_BASE_URL` supplies the browser-reachable hub origin if it differs from `API_BASE_URL`; deployment must allow the frontend origin for SignalR and provide HTTPS in production.

Its `d` shortcut ignores repeated/prevented events, Ctrl/Alt/Meta combinations, events without a string key, and input, textarea, select, or contenteditable targets. Shift is not excluded. `suppressHydrationWarning` is applied on `<html>` to accommodate theme-class changes; it is not a general hydration-error workaround.

The theme currently changes light/dark appearance only. There is no restaurant-specific branding source. The storefront uses the existing button for cart and checkout actions.

## Catalog management

Owners and managers open `/[locale]/organization/catalog?tenantId=...` from restaurant settings. The server checks the verified account's current membership before loading the catalog; the API independently authorizes every read and mutation. A dedicated response parser validates the requested tenant, currency, category and option-group relationships, discount records, selection bounds, amounts, tax, sort order, availability and archive state. Server actions accept validated form fields only, with API DTO-specific create/update payloads. Categories, products, option groups and options support creation, editing and explicit archive confirmation; category and group archival includes descendants. Archived items remain visible for management history without edit forms, including when a parent is archived. New products are initially available, and existing products can toggle availability. Option prices use the restaurant's currency and display order; selection bounds follow the API's 0–20 rules. Prices use the restaurant's existing currency; two-decimal amounts, 0–100% tax, field lengths and database precision are checked before requests. Discount codes support fixed-amount and percentage creation, mutable name/type/value edits with immutable codes, localized duplicate feedback, and explicit one-way deactivation; inactive codes remain read-only history. Form state is local and successful actions refresh the server-rendered catalog. English and French copy includes pending, success, safe error, confirmation and empty states. The existing translation editor supports group and option labels. The guarded discount-management browser flow covers owner creation, editing, cancellation and deactivation; real-database checkout redemption and receipt-history acceptance remain to be run.

## Restaurant creation

Organization owners open `/[locale]/organization/restaurants/new?organizationId=...` from their organization or team page. The server reads the verified session and owned organizations before rendering the form. The action validates and normalizes the name, one-label subdomain and EUR/USD/GBP currency, then delegates to the server-only restaurant service and authenticated API client. The API independently checks ownership; a browser organization ID never grants access. Reserved labels fail validation, taken labels produce a localized conflict, and inaccessible organizations receive a safe denial. The created restaurant appears in the team view and the current user's restaurant navigation after server refresh. Domain/DNS setup remains separate: creation does not configure a public domain.

## Organization settings

Organization owners open `/[locale]/organization/settings?organizationId=...` from the organization overview. The page obtains the current owner organization list through the authenticated server-side API client and renders a rename form only when the selected ID appears in that list. The server action validates the organization ID and a trimmed 1–200-character name before calling the existing `PATCH /api/v1/organizations/{organizationId}` API. The API independently enforces ownership; the URL ID selects the organization but grants no access. English and French pending, success, unavailable, validation, and access-denied copy is provided.

## Workspace loading and refresh states

`/[locale]/organization/loading.tsx` provides a localized App Router fallback for organization overview, team, restaurant creation, catalog, menu-language settings, organization settings, and kitchen orders. It uses the shared shadcn-compatible `Skeleton` primitive, reserves the workspace/card layout, exposes one polite localized status, hides decorative shapes from assistive technology, and stops pulsing under reduced-motion preferences. Page-level API failures and empty results continue to render their distinct alert or empty state after loading resolves.

Kitchen orders distinguish an initial browser query from a background refresh. The initial query announces loading and shows ticket-shaped skeletons while no order data exists. A background query announces that it is checking for updates while keeping the last order page on screen; if refresh fails, the existing stale-data warning remains beside the saved orders.

## Guest cart and checkout

The server loads the tenant menu and renders `RestaurantMenu`, a Client Component keyed by the API tenant ID. Its cart has one line per product with editable quantity and option IDs. It uses component state without browser storage or a persisted cart. Reloading, leaving the page, or changing tenant clears cart/receipt state. A menu-language change uses localized router replacement and retains the same tenant's cart; the interface locale stays independent.

`checkoutGuestOrder` requires an HTTP(S) Origin matching the actual request Host. It ignores forwarded-host and tenant headers, extracts the restaurant slug using the same validation as menu reads, and posts customer name, promo code, selected menu locale, product IDs, quantities, and option IDs to the configured server-only public API template. Browser prices, totals, tenant IDs, credentials, and raw Host are not forwarded. It bounds the payload at 16 KiB, uses a 15-second timeout, and validates receipt JSON.

The browser creates one UUID key and copied, normalized payload per attempt. Unchanged retries reuse both. A definite rejection allows editing and changed content gets a new key. A lost response, timeout, server failure, or malformed receipt leaves the outcome uncertain: editing and language switching are locked, and retry submits the original attempt. The API resolves the submitted menu locale against tenant settings, snapshots localized product and option names with default-language fallback, and includes the effective locale in its receipt. Existing receipts keep their saved names and report their unknown locale as `null`. The receipt displays server totals, tax, discount, snapshot labels, and order reference with the saved menu locale as its language. Starting another order clears it. A synchronous guard prevents rapid double submissions.

Safe errors have English/French messages. The API owns availability, option rules, pricing, tenant ownership, and idempotency. Staff order summaries include the saved locale and display persisted translated product and option labels without catalog lookups. Payment, inventory, pickup scheduling, and public receipt lookup remain outside this feature. Browser acceptance uses a local deterministic API fixture; real database acceptance and deployment routing remain open. See [verification evidence](../documentation-review.md#guest-cart-and-checkout-verification--2026-10-01).

## Styling and UI conventions

`app/globals.css` imports Tailwind, `tw-animate-css`, and shadcn styles, and maps CSS tokens through `@theme inline`. Body and heading fonts use local system stacks; production builds do not fetch Google-hosted font files. PostCSS uses `@tailwindcss/postcss`. There is no `tailwind.config.ts`; do not copy Tailwind 3 setup instructions into this app.

Shared controls use Base UI. `components.json` records the `base-lyra` style and aliases. UI modules use `@/lib/utils`, which re-exports `cn`. Inspect each component API before composing it; see [implementation conventions](frontend-conventions.md).

## Extending the frontend

- Add new pages beneath `app/[locale]/` unless the feature deliberately needs a nonlocalized route.
- Add the same message keys and interpolation variables to both catalogs. Use localized navigation helpers for internal app links.
- Keep Better Auth secrets, provider credentials, Resend key, and API bearer tokens on the server. Use Client Components for interactive forms and call server actions for organization, invitation, and other protected API work.
- TanStack Query manages kitchen order reads and mutations; Zustand supplies a per-provider tenant selector. The public menu is server-rendered and checkout uses ephemeral local state. SignalR is integrated for the staff kitchen order page; Axios is not part of that flow.
- For future tenant features, include account, tenant, locale and view in authenticated cache keys and isolate cart persistence by tenant. Do not share authenticated data across tenants.

Read `apps/frontend/AGENTS.md` and the relevant installed guide under `node_modules/next/dist/docs/` before Next.js code changes. See [coding standards](../coding-standards.md), [test plan](../functional-test-plan.md), and [system architecture](WHITEPLATE_SYSTEM_ARCHITECTURE.md).
