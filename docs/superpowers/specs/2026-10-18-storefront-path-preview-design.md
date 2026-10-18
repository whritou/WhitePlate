# Temporary path-based restaurant storefront preview

**Date:** 2026-10-18

**Status:** Draft for written-spec review

**Conversational design:** Approved 2026-10-18

**Related work:** [Build localized restaurant storefront and menu browsing](https://github.com/users/whritou/projects/1/views/1?pane=issue&itemId=257764842)

## Intent

Let a tester open a restaurant's real public storefront at `https://white-plate.vercel.app/{locale}/{restaurantSlug}` while restaurant-specific frontend DNS is unavailable. The locale is always part of the path, matching the rest of the Next.js app; supported storefront routes are `/en/{restaurantSlug}` and `/fr/{restaurantSlug}`. Preserve the existing final storefront address on the restaurant subdomain. The preview must carry the selected restaurant through published menu and theme reads, public media, establishment and pickup information, checkout, receipt, and capability-based order tracking.

The route locale controls WhitePlate interface copy. The restaurant's menu-language selector remains independent and continues to control menu content and order snapshots.

## Current behavior and constraint

- The Next.js public root renders a restaurant storefront only when the request host contains exactly one tenant label under `STOREFRONT_BASE_DOMAIN`; otherwise it renders the marketing page.
- The frontend public API client constructs a tenant API host from `PUBLIC_TENANT_API_URL_TEMPLATE`. The API's `[RequireTenant]` middleware resolves that tenant from `Request.Host`.
- Public menu, theme, brand media, product photos, establishment, pickup, order creation, and tracking requests follow this host-based tenant selection. Checkout is server-priced and tracking requires its capability token.
- The central API origin is already configured as server-only `API_BASE_URL`. The deployment guide records public tenant wildcard DNS/TLS and storefront acceptance as outstanding. Reusing the current tenant-host API template for the path preview could therefore leave the preview dependent on the DNS setup it is meant to bypass.

## Goals

- Serve a real restaurant storefront at the exact shared Vercel host and localized paths `white-plate.vercel.app/en/{restaurantSlug}` and `white-plate.vercel.app/fr/{restaurantSlug}` without a restaurant-specific frontend hostname.
- Resolve the slug on the central API origin for explicitly public storefront operations, without tenant wildcard DNS/TLS.
- Keep all current public API behavior, validation, server-side price calculation, rate limiting, idempotency, media checks, and tracking-capability checks.
- Preserve the existing restaurant-subdomain frontend route and its host-based API flow without redirecting or removing it.
- Keep tenant selection separate from authorization: a slug selects public restaurant data and never grants staff access.

## Non-goals

- Changing restaurant DNS, custom-domain ownership, TLS, Vercel domain assignments, or deployment traffic.
- Replacing the current restaurant-subdomain route or its API host-resolution behavior.
- Adding anonymous access to staff, organization, catalog-management, or other protected endpoints.
- Changing the database schema, tenant slug rules, published catalog/theme behavior, checkout pricing, payments, or order tracking capabilities.
- Adding a storefront design refresh; the existing menu, checkout, and receipt components are reused.

## URL and locale behavior

Enable the alias only when the request hostname exactly matches the server-only `STOREFRONT_PATH_BASE_DOMAIN` setting. Production sets it to `white-plate.vercel.app`; without the setting, path-alias routing is disabled. The alias parser accepts one normalized tenant slug and the one explicit tracking path described below; it does not proxy arbitrary subpaths.

| Browser URL | Internal localized destination | Behavior |
| --- | --- | --- |
| `/en/{restaurantSlug}` | `/en/storefront-preview/{restaurantSlug}` | Load that tenant's public menu and theme in English. Keep `menuLocale` and `step` query state on the visible alias URL. |
| `/fr/{restaurantSlug}` | `/fr/storefront-preview/{restaurantSlug}` | Load that tenant's public menu and theme in French. Keep `menuLocale` and `step` query state on the visible alias URL. |
| `/en/{restaurantSlug}/order/{orderId}` | `/en/storefront-preview/{restaurantSlug}/order/{orderId}` | Render and refresh the existing capability-protected order status page in English for that tenant. Keep the tracking token in the URL fragment and submit it only in the tracking request body. |
| `/fr/{restaurantSlug}/order/{orderId}` | `/fr/storefront-preview/{restaurantSlug}/order/{orderId}` | Render and refresh the existing capability-protected order status page in French for that tenant. Keep the tracking token in the URL fragment and submit it only in the tracking request body. |

The rewrite is internal so customers continue to see the localized slug-prefixed URL. Dedicated internal preview routes keep the restaurant selector out of the shared marketing page and its query string. The route locale controls interface copy; `menuLocale` remains the separate restaurant-menu locale. Menu navigation, checkout/back actions, receipt links, and tracking refreshes preserve both the locale and alias slug. No alias URL redirects to a restaurant subdomain. Alias slugs use the existing tenant-subdomain rule: one to 63 lowercase ASCII letters or digits, with internal hyphens only.

The alias parser accepts only the two supported locale prefixes (`en` and `fr`), a valid restaurant slug, and the explicitly supported order-tracking suffix. `/en` and `/fr` on the shared Vercel host continue to render localized marketing pages. Framework/API paths and file-like paths remain outside alias routing. Requests on restaurant subdomain hosts do not enter the path-alias branch and retain current locale and tenant behavior.

## API contract and tenant resolution

Add public path-scoped route variants on the central API origin. Existing host-based routes remain available with the same request and response contracts.

| Method | New public route |
| --- | --- |
| `GET` | `/api/v1/public/restaurants/{restaurantSlug}/menu?locale={menuLocale}` |
| `GET` | `/api/v1/public/restaurants/{restaurantSlug}/theme` |
| `GET` | `/api/v1/public/restaurants/{restaurantSlug}/brand-assets/{slot}` |
| `GET` | `/api/v1/public/restaurants/{restaurantSlug}/products/{productId}/photos/{assetId}/{size}` |
| `GET` | `/api/v1/public/restaurants/{restaurantSlug}/establishment?locale={interfaceLocale}` |
| `GET` | `/api/v1/public/restaurants/{restaurantSlug}/pickup-slots` |
| `POST` | `/api/v1/public/restaurants/{restaurantSlug}/orders` |
| `POST` | `/api/v1/public/restaurants/{restaurantSlug}/orders/{orderId}/tracking` |

Each route variant resolves the normalized slug through the existing active-tenant query, sets the request-scoped tenant context, and invokes the same public handler/use case as its host-based counterpart. Invalid, unknown, and inactive slugs return the established generic not-found response; no default-tenant fallback is allowed. Responses retain current no-store behavior. Checkout keeps the existing body limit, validation, authoritative catalog/pricing, idempotency, and per-tenant rate-limit rules. Tracking continues to require a valid capability and returns status-only data.

Slug resolution is attached explicitly to these public route variants. It does not change the default host-based `[RequireTenant]` behavior and is never attached to protected tenant or organization operations. The slug resolves a server-loaded tenant ID; the browser never supplies a tenant ID as authority. Existing membership and role checks remain mandatory for every protected operation.

## Frontend request flow

1. The Next.js proxy recognizes the alias only on the exact configured path host, validates the locale (`en` or `fr`), slug, and route shape, and internally rewrites the four supported URL forms (menu and order tracking for both locales). It preserves unrelated marketing, localized, API, framework, and file paths.
2. The dedicated localized preview page receives `locale` and `restaurantSlug` as route parameters and calls the public storefront service. Path-preview requests use server-only `API_BASE_URL` and the new slug-scoped API paths. Tenant-host requests continue to derive the slug from the validated host and use `PUBLIC_TENANT_API_URL_TEMPLATE` as they do now. The ordinary `/en` and `/fr` marketing pages do not accept a restaurant selector from query parameters.
3. The menu receives an optional preview slug as public routing context. Existing public BFF requests for brand assets, product photos, establishment details, pickup slots, and tracking carry one optional `restaurantSlug` query parameter to the same-origin BFF. The BFF accepts this selector only on the exact configured path host; duplicate selector parameters are rejected. On tenant subdomains it derives the tenant from Host and rejects a supplied selector that does not match. The selector scopes only these public operations and is not an authorization credential.
4. The checkout server action accepts the preview slug as an untrusted selector, validates the same-origin request, and uses the new central API checkout route only when the request host is the configured path host. On tenant subdomains it continues to use the host-derived route. The API remains responsible for tenant ownership of the order and all prices.
5. The receipt creates a slug-prefixed tracking link. The order page and its same-origin tracking BFF carry the slug to the public slug-scoped API route; the tracking token remains in the fragment until the browser submits it in the JSON body.

All public BFF responses remain `no-store`. The BFF does not forward a browser-supplied Host, forwarded-host, tenant ID, or tenant header to select the API tenant. On the path host, the validated slug is included in an explicit API route; on the final subdomain host, the existing Host-derived flow is retained.

## Configuration and deployment

- Add server-only `STOREFRONT_PATH_BASE_DOMAIN` as an exact hostname allowlist. Set it to `white-plate.vercel.app` in the environment intended for the preview. Do not expose it as `NEXT_PUBLIC_*`.
- Use the existing server-only `API_BASE_URL` for slug-scoped central API calls. Do not add a new public API hostname or require `PUBLIC_TENANT_API_URL_TEMPLATE` for the preview path.
- Keep `STOREFRONT_BASE_DOMAIN`, `PUBLIC_TENANT_API_URL_TEMPLATE`, and API `Tenancy:BaseDomain` behavior for the final restaurant-subdomain route.
- No Vercel dashboard domain assignment, DNS change, migration, or production deployment is part of the code change. The path becomes available on `white-plate.vercel.app` only when a deployment containing this change is live and its server environment has the exact allowlist configured.

## Error and cache behavior

- Invalid route shapes and reserved segments continue through existing localized routing or the current not-found behavior; they are never treated as arbitrary tenant paths.
- Invalid, unknown, or inactive restaurant slugs produce the generic not-found/unavailable experience without exposing registry details or falling back to another tenant.
- Central API connection failures use the existing safe unavailable response. They do not silently retry against the host-based template.
- Media, public data, checkout failures, and tracking keep existing status/error mapping and no-store headers. Tenant-specific responses are never placed in a shared cache.
- A mismatched preview selector on a tenant subdomain is rejected rather than switching to another public tenant.

## Acceptance criteria

1. With `STOREFRONT_PATH_BASE_DOMAIN=white-plate.vercel.app` and the existing central API reachable, `/en/{activeRestaurantSlug}` renders that restaurant's published menu and theme in English, and `/fr/{activeRestaurantSlug}` renders it in French, without restaurant wildcard DNS.
2. Menu-language selection, cart editing, checkout, pickup availability, establishment information, brand assets, and product photos remain scoped to the selected restaurant while preserving the visible locale and slug path.
3. Checkout through either locale alias creates an order only for the API-resolved restaurant and uses the existing server-priced/idempotent flow. Receipt tracking stays under the matching `/{locale}/{restaurantSlug}/order/{orderId}` route and exposes only status data after capability validation.
4. Invalid, unknown, or inactive slugs return the generic not-found/unavailable state; no request falls back to another tenant.
5. Direct calls to the slug-scoped API routes can access only the corresponding public operations. Anonymous callers cannot use the slug routes to access protected staff or organization data; existing identity/membership authorization tests and routes remain unchanged.
6. `/en` and `/fr` marketing routes on the shared Vercel host, and existing `restaurantname.whiteplate/en` and `/fr` subdomain storefronts, keep their current behavior.
7. Reserved paths and malformed/mismatched selectors do not enter another tenant's storefront or tracking flow.
8. Automated tests cover both `/en/{restaurantSlug}` and `/fr/{restaurantSlug}` for menu routing, localized interface copy, slug and locale preservation through checkout/receipt/tracking, and unchanged localized marketing and restaurant-subdomain routing. Menu-language selection is tested independently from the route locale.

## Verification and documentation

The implementation plan will use the existing frontend Vitest and API .NET test suites. API checks will cover path-versus-host tenant resolution, generic unknown/inactive behavior, public-only route metadata, checkout tenant scoping, and unchanged protected membership checks. Frontend tests will cover exact-host rewriting for both `en` and `fr`, invalid locale/path handling, localized marketing and tenant-host routing, locale and slug preservation through cart/checkout/tracking, same-origin validation, BFF tenant selection, localized interface copy, and menu-language independence. Manual acceptance will exercise a real active restaurant in both locales on the central Vercel host without restaurant wildcard DNS, then confirm the existing host route still loads independently. The implementation plan must verify which browser-test tooling is currently configured; it must not claim automated browser coverage from installed but unconfigured tooling.

Update the API contract, frontend and backend architecture, tenant isolation/security notes, development configuration guide, functional test plan, and the existing storefront kanban card to distinguish implemented behavior from remaining deployment acceptance. Record the design as a follow-up to [decision 0003](../../architecture/decisions/0003-catalog-localization-and-tenant-domain-policy.md). No schema migration is expected.

## Approaches considered

1. **Resolve the path slug on the central API origin (selected).** Add explicit slug-scoped variants only for existing public operations and keep protected tenant routes unchanged. This avoids restaurant wildcard DNS for the temporary preview and uses the already-configured central API origin. It adds API route contracts and focused tenant-resolution work.
2. **Construct the current per-tenant API host from the path slug.** This would require fewer API changes, but it retains the tenant wildcard DNS/TLS dependency that is still listed as unverified and therefore may not enable the requested preview.
3. **Rewrite the request Host or trust a tenant header.** Rejected because it weakens the explicit host and tenant-selector boundary, depends on proxy behavior, and does not provide a clear public-only API contract.

## Open decisions

The user clarified that the slug must always follow the app locale and both English and French routes must be included in automated test coverage. Therefore only `/en/{restaurantSlug}` and `/fr/{restaurantSlug}` are supported; an unprefixed `/{restaurantSlug}` alias is out of scope. The path host, full storefront scope, localized routes, and central API slug-resolution approach were approved conversationally on 2026-10-18. Written-spec review is pending.
