# WhitePlate frontend architecture

Status: localized Better Auth flows, server-only API BFF, organization signup, and email-bound staff invitation UI are wired in source. The Better Auth schema is migrated on Neon `test`, and email/password signup plus invitation acceptance were verified there with locally intercepted email. OAuth/real email credentials and production schema setup remain; see [authentication setup](../development.md#authentication-configuration). Commands are in the [package README](../../apps/frontend/README.md) and [development guide](../development.md).

## Stack and source map

Next.js 16.3.4, React 19.2.8, strict TypeScript, Tailwind CSS 4, `next-intl`, and `next-themes` are wired into the application. Base UI and `class-variance-authority` implement the existing button. Exact dependencies are recorded in the package manifest and lockfile.

```text
apps/frontend/
  app/
    [locale]/                 # Auth, organization, invitation, and localized pages
    api/auth/[...all]/        # Better Auth handlers; browser token endpoint blocked
    .well-known/              # API JWT issuer metadata
    globals.css               # Tailwind imports and theme tokens
  components/
    app-providers.tsx         # Query, tenant-selection, and theme providers
    auth/                     # Auth and organization/invitation forms
    query-provider.tsx        # Per-provider TanStack Query client
    tenant-selection-provider.tsx # Request-tree scoped Zustand store
    theme-provider.tsx        # next-themes and keyboard shortcut
    ui/button.tsx             # Base UI button and style variants
  hooks/                     # Placeholder
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
  lib/organization-actions.ts # Organization, invitation, and acceptance actions
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

Auth pages keep session checks and protected API access on the server. `lib/api/` provides the shared GET/POST/PUT/DELETE request factory, maps failures to safe result codes, and logs only bounded diagnostic metadata. Its authenticated server-only client validates the request origin, requires a verified Better Auth session, obtains a short-lived API JWT, and sends it to `API_BASE_URL`; token requests through `/api/auth/token` are blocked from browser HTTP access. API calls use `no-store`. A separate server-only public menu client sends no credentials and constructs its target from `PUBLIC_TENANT_API_URL_TEMPLATE` after validating the incoming Host against `STOREFRONT_BASE_DOMAIN`; it extracts exactly one tenant label and does not forward raw Host or forwarded-host headers. Restaurant menu language is selected with `menuLocale` independently of the `/en` or `/fr` interface locale. Owners and managers use `/[locale]/organization/restaurant-languages` to configure enabled languages and edit catalog translations. `AppProviders` still provides isolated TanStack Query and tenant-selection Zustand primitives; the server-rendered storefront does not consume those client caches. Custom domains remain deferred, and the API still resolves tenant hosts and authorizes all protected operations by membership. Resend delivery remains a separate server-only provider request. `ThemeProvider` is a Client Component using the `dark` class and the system theme by default.

Its `d` shortcut ignores repeated/prevented events, Ctrl/Alt/Meta combinations, events without a string key, and input, textarea, select, or contenteditable targets. Shift is not excluded. `suppressHydrationWarning` is applied on `<html>` to accommodate theme-class changes; it is not a general hydration-error workaround.

The theme currently changes light/dark appearance only. There is no restaurant-specific branding source. The sample button has no checkout or other business action.

## Styling and UI conventions

`app/globals.css` imports Tailwind, `tw-animate-css`, and shadcn styles, and maps CSS tokens through `@theme inline`. PostCSS uses `@tailwindcss/postcss`. There is no `tailwind.config.ts`; do not copy Tailwind 3 setup instructions into this app.

The button uses Base UI, not a Radix component API. `components.json` records the `base-lyra` style and aliases. `lib/utils.ts` re-exports `cn`; the button currently imports it directly from the package. Reuse existing utilities rather than adding another class-merging implementation.

## Extending the frontend

- Add new pages beneath `app/[locale]/` unless the feature deliberately needs a nonlocalized route.
- Add the same message keys and interpolation variables to both catalogs. Use localized navigation helpers for internal app links.
- Keep Better Auth secrets, provider credentials, Resend key, and API bearer tokens on the server. Use Client Components for interactive forms and call server actions for organization, invitation, and other protected API work.
- TanStack Query and Zustand providers/factories remain available for future tenant-aware client features; the public menu is server-rendered. Axios and SignalR remain unintegrated.
- For future tenant features, include tenant and locale in relevant cache keys and isolate cart persistence by tenant. Do not share authenticated data across tenants.

Read `apps/frontend/AGENTS.md` and the relevant installed guide under `node_modules/next/dist/docs/` before Next.js code changes. See [coding standards](../coding-standards.md), [test plan](../functional-test-plan.md), and [system architecture](WHITEPLATE_SYSTEM_ARCHITECTURE.md).
