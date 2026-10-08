# Frontend implementation conventions

Status: implemented and enforced in the frontend cleanup of 2026-10-01. Read this document together with [frontend architecture](WHITEPLATE_FRONTEND_ARCHITECTURE.md), [coding standards](../coding-standards.md), and `apps/frontend/AGENTS.md`. These conventions describe the existing application, rather than a new product roadmap.

## Module ownership

| Directory | Owns | Must not own |
| --- | --- | --- |
| `app/` | Route composition, metadata, session redirects, HTTP request/response adapters | Large interactive forms or duplicate API request logic |
| `components/ui/` | Installed shadcn Base UI primitives and common variants | Feature authorization or data fetching |
| `components/<feature>/` | Accessible presentation and user interaction | Credentials, raw HTTP calls, server services |
| `hooks/` | Feature interaction state and TanStack Query lifecycle | Server credentials or a second copy of authoritative server state |
| `actions/` | Exported async mutation entry points, input validation, delegation | Provider HTTP, email templates, repeated status mapping |
| `services/` | Server-only feature operations and reads through the request factory | Browser imports or React presentation |
| `lib/api/` | HTTP adapters, authentication/token boundary, error mapping | Feature UI |
| `lib/validation/` | Pure runtime parsing of untrusted inputs and JSON | Fetching or React state |
| `lib/query/` | Query-client factory and scoped key builders | Module-global authenticated caches |
| `lib/orders/`, `lib/checkout/` | Focused domain helpers and external connection lifecycle | Route composition |
| `types/` | Exported named interfaces, aliases, DTOs and component contracts | Runtime implementations or side effects |

Keep named `type` and `interface` declarations in a focused `types/<area>.ts` file and use `import type`. Small inline prop shapes and inferred local values are permitted; avoid a single catch-all type file. Types describe contracts; runtime parsers prove that external values satisfy them. Do not use an assertion as a replacement for validation.

Split modules by responsibility, rather than by arbitrary line count. Auth request state, form fields and page framing are separate; checkout state, menu display and receipt display are separate; orders have separate query, ticket and connection modules. ESLint caps application files at 350 nonblank, noncomment lines. Tests are exempt. Prefer early returns and readable named operations; avoid nested ternaries for substantial behavior, compressed validation expressions, exposed state setters, and speculative generic factories.

ESLint also limits non-UI functions in `lib/`, `actions/` and `services/` to 80 nonblank, noncomment lines (tests exempt). Separate validation, configuration and response handling into focused operations. Add blank lines between declarations and behavior, before returns, after blocks, and between standalone JSX child blocks. Consecutive declarations can remain grouped. The autofixable JSX rule preserves inline text and explicit spaces; Prettier retains the blank lines. Formatting alone does not add these logical separations.

## UI and accessibility

Read and follow the canonical [Culinary Commerce design system](../design-system/README.md) for all UI work. Shared palette, font stacks, spacing, radius, responsive tokens, focus, and semantic variants are exposed through `app/globals.css` and the shared UI primitives. The existing Vitest check verifies color/radius parity against the canonical JSON. Keep using the installed Base UI primitives and follow the implementation guidance below. Existing style overrides do not take precedence over the reference.

Use the checked-in shadcn components for visible buttons, inputs, textareas, labels, selects/options, checkboxes and radio groups, and for matching UI surfaces: `Card`, `CardHeader`, `CardTitle`, `CardDescription`, `CardContent`, `CardFooter`, `Badge`, `Alert`/`AlertDescription` and `Separator`. Compose complete cards, rather than only replacing their inputs. Keep real `h1`/`h2` headings inside `CardTitle` because this Base UI style renders titles as divs. Use a Button rendering a Link for button-shaped navigation; use ordinary links for text navigation. Semantic HTML such as forms, lists, tables and fieldsets remains appropriate JSX. TypeScript and shadcn serve different purposes: shadcn supplies reusable UI implementations within TypeScript/React components.

`components.json` selects **base-lyra**. Read the installed component before using its API: the Button uses `render={<Link ... />}`, rather than a Radix `asChild` prop. Controlled Checkbox uses `onCheckedChange`; RadioGroup uses `onValueChange`. Use `NativeSelect` for a standard native select. `className` styles its wrapper; `selectClassName` styles the select itself. Reuse `@/lib/utils` for `cn` and semantic Tailwind theme tokens.

Give every control an accessible name and maintain label associations, keyboard focus, disabled state and status/error announcements. Custom Base UI controls need explicit names when a wrapping label does not name their rendered element. Lock editable fields while their save is pending; handle rejected action promises so a transport failure does not leave a form pending forever. Match visible copy and interpolation keys in both `messages/en.json` and `messages/fr.json`.

The custom ESLint `shared-controls` rule rejects raw visible controls outside `components/ui/`. Hidden form inputs are allowed. This rule enforces reuse; it does not replace browser accessibility checks.

## Server rendering and request boundaries

Default to Server Components. Read initial server data through services directly; do not call this application's Route Handlers from its Server Components. Await Next.js request APIs and async route parameters. Add `"use client"` only to interactive boundaries. Keep `server-only` on credential-bearing modules and services. A provider can receive server-rendered children without converting their source modules into client code.

Treat a Server Action as a reachable mutation endpoint. An action parses `unknown` or `FormData`, delegates to a server-only operation, and returns a small serializable safe result. Validation includes actual value types, supported enums, UUIDs, bounded strings and integer versions. Organization mutations use `actions/organization.ts`; order mutations use `actions/orders.ts`; guest checkout uses `actions/checkout.ts`. Never fetch reads through Server Actions merely to integrate a query library.

Authenticated services use `whitePlateApi` from `lib/api/index.ts`, which requires the current verified session and obtains the API token server-side. The request factory owns method/header construction, no-store behavior and safe error mapping. A status update sends a quoted version in `If-Match`; HTTP 409 and 412 both mean conflict. The API independently authorizes the tenant and role on every operation. A browser tenant ID is a selector, never an authorization grant.

The public storefront and checkout retain their separate credential-free host-derived API client. They must not use a browser-selected tenant ID or authenticated API token. Checkout owns a bounded request, immutable idempotency attempt and receipt parser. Resend HTTP lives in `lib/api/email-delivery.ts`; templates live in `lib/email.ts`. Provider and checkout requests have 15-second deadlines. Do not claim that every factory request has a deadline when it does not.

All application HTTP now shares `createJsonRequestClient` in `lib/api/json-request-client.ts`. It delegates default headers and JSON serialization to `request-options.ts`, parsing/status mapping and sanitized diagnostics to `request-result.ts`, and forwards cancellation. It defaults to omitted credentials, no-store and rejected redirects. A failed diagnostic sink cannot change the request result. A generic result type is a compile-time contract, not runtime JSON validation: request unknown data and parse it at feature boundaries. Use `responseType: "none"` only when the operation needs an HTTP acknowledgement and no response data, as with email delivery; an unused malformed body must not turn an accepted email into a failure.

`createApiRequestFactory` is a small method composer. Preparation resolves and restricts API URLs through `request-url.ts`, obtains the current server token, then delegates HTTP to the JSON client. `browserRequest` uses that same transport with same-origin credentials and accepts only relative paths that remain inside `/api/` after URL normalization. Kitchen reads and SignalR token acquisition no longer repeat header/cache/redirect construction. Resend and public checkout also use the shared transport through their adapters; provider credentials remain server-only.

For example, a browser read is `browserRequest("/api/kitchen/orders?" + query, { signal })`. An API status mutation is `whitePlateApi.patch(path, { status }, { ifMatch: '\"3\"' })`. Callers supply operation-specific data, not repeated fetch policies. Feature adapters still own response parsing and feature-specific errors; the transport does not own tenant authorization or query state.

ESLint rejects raw `fetch` calls outside the central transport, direct fetch references in components/hooks/actions/services, and server-module imports from components/hooks. HTTP adapters live in `lib/api/` or the existing checkout client. An exception needs a concrete documented boundary, not an alternative unreviewed helper in a component.

## TanStack Query and local state

The kitchen dashboard now uses TanStack Query for client server state. Its server page validates the session and restaurant membership and passes a parsed initial order page. `use-order-dashboard.ts` seeds `useQuery` with that page, then reads `GET /api/kitchen/orders` through the browser adapter. This avoids a second immediate initial request while retaining background refresh. The BFF validates query input, rechecks the current user's memberships before reading orders, and returns `private, no-store` with `Vary: Cookie`. It never returns a bearer token.

Keys include **account, normalized tenant, interface locale, status and cursor**. Invalidation uses the account/tenant prefix to refresh every affected view without invalidating other accounts or restaurants. The provider creates an isolated QueryClient; do not put a shared authenticated instance at module scope. Polling and freshness use 30 seconds. Reads support AbortSignal. Query retries are disabled for this feature.

Status changes use `useMutation` with no automatic retry and no optimistic transition. Success, conflict and forbidden results invalidate the relevant tenant pages. A synchronous guard prevents duplicate clicks before React renders the pending state. Conflict refreshes the authoritative version. SignalR events are deduplicated refresh hints and coalesce into query invalidation; reconnect rejoins the restaurant before refetching REST.

On an unavailable refetch, the dashboard may show its last successful snapshot with a stale warning. Forbidden, unauthorized and invalid results hide tickets; authentication/authorization failures disable further automatic reads, stop the live connection and remove inactive cached pages for that scope. The failed active entry remains until it becomes inactive or the client is cleared, and must never be rendered as a fallback. Explicit Retry invokes refetch even when automatic reads are disabled. Sign-out clears the QueryClient; account and tenant changes use distinct keys. Live membership revocation, two-tenant switching and reconnection still need the separately tracked authenticated browser acceptance.

Keep ephemeral guest cart, form fields, receipt and retry attempt in feature-local state. TanStack Query is not needed for every form or server-rendered page. Do not duplicate its order cache in Zustand. The existing tenant-selection store is isolated per provider and is a convenience selector only.

## Verification and maintenance

From `apps/frontend`, run `npm run test`, `npm run lint`, `npm run typecheck`, `npm run format:check` and `npm run build`. `npm run format` rewrites source; the check is read-only. CI runs the formatting check alongside tests, lint, types and build. Use deterministic tests for boundary validation, authorization, request/error behavior, retry safety and cache isolation. Browser checks verify rendered controls and complete user flows. Tests alone do not prove live OAuth, email delivery, database or SignalR deployment behavior.

Read the relevant **installed** Next.js documentation at `node_modules/next/dist/docs/` before changing Next code. Verify current external guidance against official sources when researching it. Keep the installed framework and existing Base UI style; a cleanup is not authorization to upgrade dependencies or adopt experimental caching features.

Primary references consulted for this cleanup:

- [Next.js data security](https://nextjs.org/docs/app/guides/data-security)
- [Next.js fetching data](https://nextjs.org/docs/app/getting-started/fetching-data)
- [Next.js updating data](https://nextjs.org/docs/app/getting-started/updating-data)
- [Next.js backend for frontend](https://nextjs.org/docs/app/guides/backend-for-frontend)
- [TanStack Query advanced server rendering](https://tanstack.com/query/latest/docs/framework/react/guides/advanced-ssr)
- [shadcn Native Select](https://ui.shadcn.com/docs/components/base/native-select)

Record the actual commands and limits in [verification evidence](../documentation-review.md). Do not mark live acceptance or production configuration complete based on source wiring.
