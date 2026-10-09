# API contracts

## M5 product photo galleries — 2026-10-09

Source implementation; actual S3/PostgreSQL/hosted acceptance remains open. See [ADR 0008](../architecture/decisions/0008-product-photo-gallery.md).

| Method and route | Behavior |
| --- | --- |
| `GET /api/v1/tenants/{tenantId}/products/{productId}/photos` | Persisted owner/manager authorization; returns `{storageAvailable, assets: [{id, width, height, bytes}]}` in order; authorized staff can inspect retained archived-product galleries |
| `POST …/photos/uploads?aspect=1:1` or `4:3` | Bounded `application/octet-stream`, at most 4 MiB; actual decoded-content validation and three private variants; 201 with a photo descriptor |
| `GET …/photos/uploads/{assetId}/{size}` | Protected preview of exact tenant/product media; size 320, 640 or 1200; WebP bytes |
| `PUT …/photos` | `{assetIds: UUID[], expectedIds: UUID[]}`; distinct ordered lists of at most eight; atomic save/reorder/removal, returning authoritative descriptors; stale gallery returns 412 |
| `GET /api/v1/products/{productId}/photos/{assetId}/{size}` | Public host-resolved tenant; only current active photos of nonarchived products in visible, nonarchived categories |

Empty desired IDs remove all photos. Missing/foreign products/media, revoked membership and unauthorized roles return 404. Archived products/categories reject mutations. Invalid files, ratios, duplicates or excessive length return validation errors. Storage failures return 503 and preserve the published gallery. Draft uploads alone are never public.

Public menu products add ordered `photos` descriptors without bucket keys or URLs. Frontend BFF paths: protected `/api/product-photos?tenantId=…&productId=…`, public `/api/public/product-photos/{productId}/{assetId}/{size}`. Mutations require the configured exact origin and bounded body reads before shared-factory forwarding. Protected responses use `private, no-store` and `Vary: Cookie`; public images use `no-store` and `Vary: Host` at the BFF. Shared Next image optimization is bypassed.


Status: the Better Auth frontend, email/password and social auth routes, server-side API token exchange, organization signup, email-bound invitations, public order tracking, and localized restaurant description management are wired in source. The `RestaurantDescriptionTranslations` EF migration is generated but not yet applied to a shared environment. The `PublicOrderTracking` schema migration is applied to Coolify Production, but its feature code is not deployed there and hosted tracking acceptance remains pending. Localized checkout snapshots, catalog language paths, restaurant description fallback and management authorization are covered by API tests. Catalog and order locale migrations are applied on Neon `test` and Coolify Production. Local email/password signup, organization creation, invitation acceptance, owner/manager/kitchen permissions, cross-tenant denial, REST revocation recovery, and live outbox/reconnect acceptance are recorded on Neon `test`. Local email/password signup, organization creation, and invitation acceptance were verified using locally intercepted email delivery. Vercel Production has also completed one hosted email/password signup and verification, organization listing, an authenticated protected API request, and restaurant creation against Coolify over verified TLS. The owner-protected team roster and invitation-list routes were added in merge `8a2f835` (PR #26); the currently recorded Coolify API deployment at `e13860e` predates them, so redeployment and hosted team-read verification remain open. The operator reports that both signed-out and alternate-account visits to the protected restaurant route redirected to `/fr?error=invalid_code`; consider this hosted access-denial behavior complete without a repeat check. This records the frontend redirect, not an independently observed API status code. Browser OAuth, hosted invitation acceptance, hosted SignalR delivery/token-expiry, and broader real email delivery remain open.

## 1. HTTP routes

All paths are rooted at `/api/v1`. Success responses contain the resource directly; errors use the shared `application/problem+json` contract in section 5.

| Method and path | Access | Behavior |
| --- | --- | --- |
| `GET /tenant` | Public, resolved restaurant host | Return active tenant id, name, subdomain, default menu language, and enabled menu languages; invalid/unknown/inactive host receives `404` |
| `GET /menu?locale={tag}` | Public, resolved restaurant host | Return the localized menu for an enabled language, or the restaurant default when omitted/unsupported; includes unavailable non-archived products with availability state |
| `POST /organizations` | Better Auth bearer, verified email | Create an organization and make the caller its first owner |
| `GET /organizations` | Better Auth bearer, owner | List the caller's organizations with `isActive` so the workspace can show archived organizations |
| `GET /organizations/{organizationId}/restaurants` | Better Auth bearer, owner | List restaurants owned by the organization |
| `GET /organizations/{organizationId}/members` | Better Auth bearer, owner | List organization owners and restaurant staff memberships; return role, optional verified email, and restaurant scope without issuer or subject |
| `GET /organizations/{organizationId}/invitations` | Better Auth bearer, owner | List invitation role, recipient email, restaurant scope, expiry, and `Pending`, `Accepted`, `Revoked`, or `Expired` status without token material |
| `PATCH /organizations/{organizationId}` | Better Auth bearer, owner | Rename an owned organization |
| `POST /organizations/{organizationId}/archive` | Better Auth bearer, active owner | Archive an organization without deleting organization, restaurant, catalog, invitation, or order data; suspend restaurant access, public menus, and new orders |
| `POST /organizations/{organizationId}/restore` | Better Auth bearer, owner | Restore an archived organization; existing restaurant and product availability flags remain unchanged |
| `POST /organizations/{organizationId}/restaurants` | Better Auth bearer, owner | Create a restaurant tenant with EUR, USD, or GBP currency |
| `POST /organizations/{organizationId}/invitations` | Better Auth bearer, verified owner | Create a single-use seven-day invitation bound to the request email and role; token is returned once to the server action |
| `DELETE /organizations/{organizationId}/invitations/{invitationId}` | Better Auth bearer, owner | Revoke a pending invitation; accepted, revoked, expired, missing, or foreign invitations return the same `404` |
| `POST /invitations/accept` | Better Auth bearer, verified invitee | Accept only when the JWT verified email matches the invitation email |
| `GET /me` | Better Auth bearer | Return the current identity and its organization/restaurant memberships |
| `GET /tenants/{tenantId}/catalog` | Organization owner or restaurant manager | Read tenant catalog entries, including archived entries and discount state |
| `GET /tenants/{tenantId}/menu-languages` | Organization owner or restaurant manager | Read enabled menu language tags and default language |
| `GET /tenants/{tenantId}/restaurant-description-translations` | Organization owner or restaurant manager | Read enabled locales, default locale, and saved restaurant description translations; private response is not cached |
| `PUT /tenants/{tenantId}/restaurant-description-translations/{locale}` | Organization owner or restaurant manager | Save or clear the restaurant description for an enabled menu locale; descriptions are trimmed and limited to 500 characters |
| `PUT /tenants/{tenantId}/menu-languages` | Organization owner or restaurant manager | Replace enabled menu languages and default; requires at least one unique language and a default included in the list. Changing the default requires translations for every active category, product, option group, and option in the new default language |
| `PUT /tenants/{tenantId}/catalog/{entityType}/{entityId}/translation` | Organization owner or restaurant manager | Save a translated name and optional product description for an enabled locale; supported entity types are categories, products, option-groups, and options |
| `POST /tenants/{tenantId}/categories` | Organization owner or restaurant manager | Create a category |
| `PUT /tenants/{tenantId}/categories/{categoryId}` | Organization owner or restaurant manager | Update a category name and sort order |
| `PUT /tenants/{tenantId}/categories/{categoryId}/visibility` | Organization owner or restaurant manager | Set temporary public visibility with `{ "isVisible": true/false }`; requires an active category in the authorized tenant |
| `DELETE /tenants/{tenantId}/categories/{categoryId}` | Organization owner or restaurant manager | Archive the category and its product/option descendants |
| `POST /tenants/{tenantId}/products` | Organization owner or restaurant manager | Create a product with base price and percentage tax |
| `PUT /tenants/{tenantId}/products/{productId}` | Organization owner or restaurant manager | Update product details, price, tax, order, availability and optional `categoryId`; omitted/null preserves the current category. Current and target categories must be active and owned by the authorized tenant; foreign/missing/archived or empty UUID targets return `404` without a write |
| `DELETE /tenants/{tenantId}/products/{productId}` | Organization owner or restaurant manager | Archive the product and its option descendants |
| `POST /tenants/{tenantId}/products/{productId}/restore` | Organization owner or restaurant manager | Restore an archived product in an active category. The product remains unavailable until a manager explicitly enables it; archived option descendants remain archived. No permanent product purge route exists |
| `POST /tenants/{tenantId}/products/{productId}/option-groups` | Organization owner or restaurant manager | Create a selection group with minimum/maximum counts |
| `PUT /tenants/{tenantId}/option-groups/{groupId}` | Organization owner or restaurant manager | Update selection rules and display order |
| `DELETE /tenants/{tenantId}/option-groups/{groupId}` | Organization owner or restaurant manager | Archive the group and its options |
| `POST /tenants/{tenantId}/option-groups/{groupId}/options` | Organization owner or restaurant manager | Create a fixed-price option |
| `PUT /tenants/{tenantId}/options/{optionId}` | Organization owner or restaurant manager | Update an option |
| `DELETE /tenants/{tenantId}/options/{optionId}` | Organization owner or restaurant manager | Archive an option |
| `POST /tenants/{tenantId}/discounts` | Organization owner or restaurant manager | Create a fixed or percentage discount code |
| `PUT /tenants/{tenantId}/discounts/{discountId}` | Organization owner or restaurant manager | Update discount name, kind, and value; its code stays stable |
| `DELETE /tenants/{tenantId}/discounts/{discountId}` | Organization owner or restaurant manager | Deactivate a discount |
| `POST /orders` | Public, resolved restaurant host | Price and create an order from the server's catalog; requires `Idempotency-Key`. Accepts optional `menuLocale` and returns the effective locale with saved localized labels. |
| `POST /orders/{orderId}/tracking` | Public, resolved restaurant host plus per-order capability | Read only `id`, `status`, `version`, and `createdAt`; accepts `trackingToken` in JSON body; unknown, wrong-tenant, invalid, and expired capabilities return the same `404`; response is `no-store` |
| `GET /tenants/{tenantId}/orders` | Restaurant owner, manager, or kitchen staff | Read bounded, cursor-paginated order summaries with saved ticket lines and option labels; optional status filter |
| `PATCH /tenants/{tenantId}/orders/{orderId}/status` | Restaurant owner, manager, or kitchen staff | Change status with a required `If-Match` version |
| `/hubs/orders` | Better Auth JWT authenticated SignalR connection | Join authorized restaurant groups and receive `order.changed` events |
| `GET /health/live` | Public | Return `Healthy` while the API process can answer requests; does not check dependencies |
| `GET /health/ready` | Public | Check PostgreSQL connectivity and return `Healthy` or `Unhealthy` with HTTP `200` or `503`; response contains no provider details |
| `GET /openapi/v1.json`, `GET /swagger` | Anonymous when enabled | OpenAPI 3.1 JSON and interactive Swagger UI |

The app interface supports `/en` and `/fr`; restaurant menu locales are independent and restaurant-configurable without a fixed count limit. Menu locale is requested with `GET /menu?locale=<tag>`. Names for categories, products, option groups, options, product descriptions, and the short restaurant description can be translated. Missing text falls back to the default menu language; the public menu reports its effective locale and includes `restaurantDescription` as a string or `null`. Omitted or unsupported request locales resolve to the default. Restaurant descriptions are saved per enabled locale, trimmed, limited to 500 characters, and an empty value clears that locale. Owners and restaurant managers edit menu languages and descriptions in the localized organization area. First-release tenant addressing uses one-label subdomains; custom domains are deferred. See [decision 0003](../architecture/decisions/0003-catalog-localization-and-tenant-domain-policy.md).

The tenant ID in a protected route selects a resource. Every catalog/order query and mutation checks the authenticated issuer/subject membership for that tenant. Foreign or missing resource IDs return the same `404`. Kitchen staff can read/progress orders but cannot cancel them; owner/manager cancellation is allowed for incomplete orders. Restaurant entries from `GET /me` currently use role values `Manager` and `Kitchen`; organization-owned restaurants use `OrganizationOwner`. Invitation role values `RestaurantManager` and `KitchenStaff` map to those persisted membership values.

`GET /tenants/{tenantId}/orders` returns each summary's `lines` array with `productId`, saved `productName`, `quantity`, and selected `options` (`optionId`, saved `name`). These labels come from persisted order snapshots and are not re-read or re-translated from the current catalog. The default page size is 50, the maximum is 100, and `nextCursor` is opaque.

`POST /orders` resolves the restaurant from the request host. For local development, `bistro.localhost:5182` resolves the `bistro` tenant when `Tenancy:BaseDomain=localhost`. Forwarded-host and tenant headers are ignored. Order creation returns the receipt. Capability-protected status-only tracking is specified by [decision 0006](../architecture/decisions/0006-public-order-tracking.md); it is not a general lookup by order ID.

## 2. Authentication and tenancy

Better Auth issues short-lived RS256 JWTs from the Next.js server. The API discovers signing keys from `{Authentication:Issuer}/.well-known/openid-configuration` and validates issuer and audience. Configure `Authentication:Issuer` to the exact Better Auth base URL and `Authentication:Audience` to the same value as `API_AUDIENCE`. The browser session cookie stays in the browser; the server-side BFF obtains API tokens and calls the API without exposing bearer tokens to client JavaScript. A person is identified by validated issuer/subject. Persisted organization-owner and restaurant memberships determine access; token-supplied tenant IDs are not authorization. OpenAPI declares Bearer security per protected route. The API has no login route; local Swagger testing uses the frontend's `auth:dev-token` command and Swagger's Bearer **Authorize** control.

Invitation role identifiers are `OrganizationOwner`, `RestaurantManager`, and `KitchenStaff`; `/me` restaurant role values are `OrganizationOwner`, `Manager`, and `Kitchen`. An organization owner can manage that organization's restaurants and invitations. Restaurant managers manage that restaurant's catalog/orders. Kitchen staff can read and progress its orders. Restaurant tenant resolution for public routes accepts exactly one subdomain label below `Tenancy:BaseDomain`; unknown, inactive, nested, and foreign-domain hosts return `404`.

The organization team reads are owner-checked on every request and return private, non-cacheable data. Member rows expose only role, nullable email, and nullable restaurant ID/name. Email is derived from a matching accepted invitation or, for the currently authenticated verified owner, the verified identity claim; legacy memberships without a known email return `null`. Invitation rows expose a role, recipient email, nullable restaurant ID/name, expiry, and server-derived status. Neither read returns OIDC issuer/subject, raw invitation tokens, or token hashes. Only pending invitations can be revoked; accepted, revoked, expired, missing, and foreign invitations share the safe `404` response.

New customers use the localized organization signup flow, which creates the organization and its verified-email owner through `POST /organizations`. The operator-only `--provision-organization` command remains available for migrations/backfill using an issuer and subject. Staff invitations carry a normalized recipient email; accepting requires a verified JWT email with the same normalized address. See the [authentication decision](../architecture/decisions/0002-authentication.md) and [development guide](../development.md#authentication-configuration).

## 3. Pricing, checkout, and order workflow

The tenant menu includes ordered active categories and non-archived products, including items marked unavailable so the storefront can show their state. Checkout still rejects unavailable products. Product records have a base price and percentage tax rate. Option groups enforce their minimum/maximum selection counts; selected options add fixed amounts. Prices use decimal arithmetic in EUR, USD, or GBP. The server allocates at most one fixed or percentage discount across lines, computes tax, and rounds line amounts to two decimal places using `AwayFromZero`. New orders store the effective menu locale and immutable server-resolved product/option label snapshots per [decision 0004](../architecture/decisions/0004-localized-order-snapshots.md). Existing orders preserve their labels and report an unknown locale as `null`. No payment, cart, inventory, tax-jurisdiction engine, or stacked promotion is included.

`POST /orders` accepts a customer name, optional menu locale, unique product lines, positive quantities, selected option IDs, and an optional discount code. The API resolves the locale against enabled menu locales and defaults omitted or unsupported values to the tenant default. New orders snapshot the resolved product and selected-option labels using decision 0003's per-item default-language fallback. Legacy orders return `menuLocale: null` and keep their existing labels. The server derives tenant, names, prices, tax, currency, and totals from its catalog, then stores the order and purchase-time snapshots atomically. Requests are limited to 16 KiB. The fixed-window checkout limit is configured with `CheckoutRateLimit:PermitLimit`, `CheckoutRateLimit:WindowSeconds`, and `CheckoutRateLimit:QueueLimit`; buckets are per tenant and remote client address. `429` uses `rate_limited`.

The storefront may include `trackingToken`, a 32-byte random base64url capability, in the order create request. The API stores only its SHA-256 hash and a 30-day expiry. `POST /orders/{orderId}/tracking` accepts `{ "token": "…" }`; see [decision 0006](../architecture/decisions/0006-public-order-tracking.md) for capability, host, response and privacy boundaries.

Every checkout requires an `Idempotency-Key`. Keys are tenant-scoped and retained for 24 hours. The effective locale is included in normalized request hashing, so an unchanged retry replays the original receipt while a changed effective locale or other request content with the same key returns `409`. The successful create response contains the receipt. Staff kitchen lists default to 50 summaries per page, cap at 100, and return an opaque `nextCursor`; archived orders are excluded from every kitchen-list status filter. Each order summary includes its effective `menuLocale`, nullable for legacy rows, and its lifecycle `status` as a string name such as `Pending`.

The storefront submits checkout through a same-origin Next.js server action. Its in-memory cart supplies `customerName`, nullable `discountCode`, selected `menuLocale`, and `items: [{ productId, quantity, optionIds }]`. The action derives the restaurant API host from validated actual Host and the configured template; browser tenant IDs, labels, and prices are not submitted. The frontend generates a UUID key, preserves payload/key on uncertain retries, and displays the API receipt's totals, tax, discount, currency, status, saved product/option labels, effective menu locale, and ID. Safe `400`, `404`, `409`, and `429` distinctions are retained; unreadable success responses are uncertain.

The API limiter still uses its observed remote address. Different guests behind the BFF can share the BFF's per-tenant API bucket. Browser address/forwarded headers are not forwarded or trusted to bypass it. A deployment-specific trusted-proxy and edge-rate policy remains separate operational work.

Statuses progress `Pending -> Preparing -> Ready -> Completed`. Repeating the current status is a no-op. Skipped/backward transitions and cancellation of a completed order return `409`; managers may cancel other incomplete orders. Mutations require `If-Match: "<version>"`; missing values return `428`, and stale concurrent writes return `412`. Successful mutations return the updated receipt and a new ETag.

`GET /api/v1/tenants/{tenantId}/orders/history` returns every order, including completed, cancelled, and daily-archived orders. Only organization owners and restaurant managers may use it; kitchen staff and identities without current tenant membership receive `403`. Optional filters are `status`, `search`, `from`, and `through` (`yyyy-MM-dd`, inclusive UTC dates). Search matches a customer name or the visible order-reference prefix; a complete UUID also matches exactly. `sort` is `createdAt` or `total`; `direction` is `asc` or `desc`. Pages are numbered from 1, default to 25 items and cap at 100; responses include `page`, `pageSize`, and `totalCount`. Ordering uses the order ID as a stable tie-breaker.

On `Completed` or `Cancelled`, the API records `ClosedAt` and UTC ticks. The hosted `OrderArchiveDispatcher` archives eligible terminal orders at each UTC midnight, retaining their original status and snapshots. It also runs once on startup to catch a missed daily run and retries failed runs every minute. The operation is idempotent across API instances. Kitchen lists hide archived rows; the owner/manager history endpoint continues to include them. There is no restaurant timezone setting, so the daily boundary is UTC.

## 4. SignalR notifications

### Frontend kitchen read BFF

`GET /api/kitchen/orders?tenantId=<uuid>&status=<optional-status>&cursor=<optional-cursor>` is a frontend same-origin read adapter for TanStack Query. It validates selectors (including duplicate query parameters), requires the current verified session through the server API client, reads the user's memberships, and rejects a foreign restaurant before requesting its order page. The API independently authorizes the read. The browser supplies no API bearer token.

Success returns `{ ok: true, status: 200, data: { items: [...], nextCursor: null | string } }` using the existing validated order summaries. Failure returns a safe `error` code with an appropriate HTTP status, including 400 for invalid selectors, 401 for no verified session, 403 for no membership and 5xx for unavailable data. All responses use `Cache-Control: private, no-store` and `Vary: Cookie`. Client keys include account, tenant, locale, status and cursor; status mutations still use a validated Server Action and the API `If-Match` contract. SignalR hints invalidate the account/tenant query prefix. This adapter introduces no database or API schema change.

### API hub

The hub is `/hubs/orders`; bearer tokens supplied by SignalR's `access_token` query parameter are read only on this path. Call `JoinRestaurant(tenantId)` to request a membership-checked subscription. The server derives the group name and checks the current owner/manager/kitchen membership before joining; clients cannot submit a group name. `LeaveRestaurant(tenantId)` removes the current connection's subscription and group membership; disconnect removes all of that connection's subscriptions.

The publisher rechecks persisted membership for each subscribed connection immediately before sending an event to that connection. Revoked memberships are removed from the subscription registry and group without receiving the event; authorization/database failures propagate to outbox retry. Leaving or disconnecting during the authorization check prevents that captured subscription from receiving. An already queued event cannot be recalled. SignalR closes authenticated connections at token expiration (`CloseOnAuthenticationExpiration`); reconnect must obtain a fresh token, rejoin and recover REST state. The registry and SignalR transport are in memory and support the current single API instance. Multiple replicas require a shared delivery/subscription design before deployment; a transport backplane alone would not share this registry.

The dispatcher publishes `order.changed` with `eventId`, `tenantId`, `orderId`, `eventType`, current `status`, `version`, and UTC `occurredAt`. Order creation/status changes and outbox rows commit in one transaction. The dispatcher retries failed deliveries with bounded exponential delay; delivery is at least once, so clients should deduplicate by event ID and use the authorized paginated REST list after reconnect. REST/database state remains authoritative.

The localized staff page at `/[locale]/organization/orders?tenantId=<id>` reads `/me` first and only requests the selected tenant's order page when that membership is present. It uses saved ticket labels, passes status and cursor filters through the page URL, and calls the status API through a same-origin Next.js server action with `If-Match`. The frontend's `POST /api/kitchen/signalr-token` route requires a verified session and exact same-origin `Origin`, returns a short-lived API JWT with `Cache-Control: no-store`, and grants no tenant-specific permission. The browser keeps the token in memory for SignalR only. The API still authorizes `JoinRestaurant`; events trigger a coalesced REST refresh, and reconnect rejoins the selected tenant before reloading REST state. Set `PUBLIC_API_BASE_URL` to the browser-reachable API origin when it differs from server-side `API_BASE_URL`. Production URL, CORS, proxy, and TLS verification remain in the hosting/operations task.

## 5. Error contract

Errors use `ApiProblemResponse` with `application/problem+json`, `type: about:blank`, status, safe English detail, a stable code, trace ID, and optional field issues. `instance` is omitted and responses are `Cache-Control: no-store`. Exception/provider details, request values, and arbitrary JSON paths are not returned or logged.

| Status | Stable code and use |
| --- | --- |
| `400` | `validation_failed`: malformed request or invalid use-case input |
| `401` | `unauthorized`: authentication required |
| `403` | `forbidden`: authenticated identity lacks permission |
| `404` | `not_found`: missing/foreign resource or invalid/unknown/inactive tenant |
| `409` | `conflict`: invalid state transition, conflicting idempotency key, duplicate resource |
| `412` | `precondition_failed`: stale `If-Match` version |
| `413` | `request_too_large`: body exceeds the checkout limit |
| `428` | `precondition_required`: order status change omitted `If-Match` |
| `429` | `rate_limited`: checkout fixed-window limit reached |
| `500` | `unexpected_error`: safe fallback without exception details |

405 and 415 responses also preserve their status with stable `method_not_allowed` and `unsupported_media_type` codes. Binding/JSON failures use field `request`, code `invalid_value`, and fixed copy. See the [security boundaries](../architecture/tenancy-and-security.md) and [functional test plan](../functional-test-plan.md).

## M1 category visibility — 2026-10-08

Management category responses include required `isVisible` (boolean). New and migrated categories default to `true`. `PUT /api/v1/tenants/{tenantId}/categories/{categoryId}/visibility` accepts an explicit JSON boolean and returns `204`; absent/null/invalid values return `400`, missing identity returns `401`, and unauthorized, foreign or archived categories return `404`. It changes only visibility, preserving archive, ordering and product availability. Public menus omit hidden categories and their products. New checkout attempts with products under hidden categories fail with the existing `404` unavailable-item result; existing order snapshots are unchanged. Ordering continues through existing category/product updates. API and migration must precede frontend rollout; see [M1 verification](../audits/menu-builder.md).

## T1 brand assets — implemented source, hosted acceptance pending

Protected owner/manager routes resolve persisted membership on every operation. Unknown or unauthorized tenants/assets return the same 404; missing authentication returns 401. Responses and image delivery are no-store. A browser tenant ID never grants access.

| Method/path under `/api/v1` | Request | Success |
| --- | --- | --- |
| GET `/tenants/{tenantId}/brand-assets` | None | 200 `{ storageAvailable, assets: [{ id, slot, contentType, width, height, bytes }] }` |
| POST `/tenants/{tenantId}/brand-assets/{slot}/uploads?aspect=16:9` | Raw binary, `Content-Type: application/octet-stream`; aspect also accepts `21:9` | 201 normalized private asset metadata |
| GET `/tenants/{tenantId}/brand-assets/uploads/{assetId}` | Authenticated read | 200 PNG/WebP bytes for ready, unexpired tenant-owned media |
| PUT `/tenants/{tenantId}/brand-assets/{slot}` | `{ "assetId": "<draft-guid>" }`, `If-Match: "<current-guid>"` or `"none"` | 204; draft becomes current immediately |
| DELETE `/tenants/{tenantId}/brand-assets/{slot}` | Same precondition | 204; current slot removed, fallback restored |
| GET `/brand-assets/{slot}` | Active tenant resolved from actual host; no private asset selector | 200 current PNG/WebP or 404 when absent |

Slots are `logo`, `favicon`, `banner`. Upload alone never publishes. Save checks tenant, slot, readiness, expiry and prior publication; retired media cannot be republished as a draft. A serializable transaction compares the expected current ID before swapping pointers. Missing precondition is 428; stale precondition is 412. The old asset remains current after failed validation/storage/save. Normalization rules and limits are in [decision 0007](../architecture/decisions/0007-brand-media-storage.md). Invalid files return 400, oversized transport may return 413, unsupported transport type returns 415, and storage failures return 503 `unavailable`. A maximum of 20 retained unpublished uploads per tenant returns 429 `rate_limited`; serialization contention on pending creation also asks the client to retry.

The same-origin BFF at `/api/brand-assets` validates selectors and body limits, requires the exact configured auth origin on mutations, and keeps tokens server-side. It forwards original binary bytes using the shared request factory. `/api/public/brand-assets/{slot}` derives its upstream solely from the validated incoming tenant host and fixed server configuration, ignores browser tenant selectors, and serves only public slot reads. A missing saved favicon falls back to `/favicon.ico`. `storageAvailable` means configured, not a verified provider health result.
