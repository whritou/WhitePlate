# API contracts

Status: the Better Auth frontend, email/password and social auth routes, server-side API token exchange, organization signup, and email-bound invitations are wired in source. Localized checkout snapshots and catalog language paths are covered by API tests. Catalog and order locale migrations are applied on Neon `test` and Coolify Production. Local email/password signup, organization creation, and invitation acceptance were verified using locally intercepted email delivery. Vercel Production has also completed one hosted email/password signup and verification, organization creation/listing, and an authenticated protected API request against Coolify over verified TLS. Hosted restaurant creation, second-account denial, browser OAuth, invitation acceptance, and broader real email delivery remain open.

## 1. HTTP routes

All paths are rooted at `/api/v1`. Success responses contain the resource directly; errors use the shared `application/problem+json` contract in section 5.

| Method and path | Access | Behavior |
| --- | --- | --- |
| `GET /tenant` | Public, resolved restaurant host | Return active tenant id, name, subdomain, default menu language, and enabled menu languages; invalid/unknown/inactive host receives `404` |
| `GET /menu?locale={tag}` | Public, resolved restaurant host | Return the localized menu for an enabled language, or the restaurant default when omitted/unsupported; includes unavailable non-archived products with availability state |
| `POST /organizations` | Better Auth bearer, verified email | Create an organization and make the caller its first owner |
| `GET /organizations` | Better Auth bearer, owner | List the caller's organizations |
| `GET /organizations/{organizationId}/restaurants` | Better Auth bearer, owner | List restaurants owned by the organization |
| `PATCH /organizations/{organizationId}` | Better Auth bearer, owner | Rename an owned organization |
| `POST /organizations/{organizationId}/restaurants` | Better Auth bearer, owner | Create a restaurant tenant with EUR, USD, or GBP currency |
| `POST /organizations/{organizationId}/invitations` | Better Auth bearer, verified owner | Create a single-use seven-day invitation bound to the request email and role; token is returned once to the server action |
| `DELETE /organizations/{organizationId}/invitations/{invitationId}` | Better Auth bearer, owner | Revoke an invitation |
| `POST /invitations/accept` | Better Auth bearer, verified invitee | Accept only when the JWT verified email matches the invitation email |
| `GET /me` | Better Auth bearer | Return the current identity and its organization/restaurant memberships |
| `GET /tenants/{tenantId}/catalog` | Organization owner or restaurant manager | Read tenant catalog entries, including archived entries and discount state |
| `GET /tenants/{tenantId}/menu-languages` | Organization owner or restaurant manager | Read enabled menu language tags and default language |
| `PUT /tenants/{tenantId}/menu-languages` | Organization owner or restaurant manager | Replace enabled menu languages and default; requires at least one unique language and a default included in the list. Changing the default requires translations for every active category, product, option group, and option in the new default language |
| `PUT /tenants/{tenantId}/catalog/{entityType}/{entityId}/translation` | Organization owner or restaurant manager | Save a translated name and optional product description for an enabled locale; supported entity types are categories, products, option-groups, and options |
| `POST /tenants/{tenantId}/categories` | Organization owner or restaurant manager | Create a category |
| `PUT /tenants/{tenantId}/categories/{categoryId}` | Organization owner or restaurant manager | Update a category name and sort order |
| `DELETE /tenants/{tenantId}/categories/{categoryId}` | Organization owner or restaurant manager | Archive the category and its product/option descendants |
| `POST /tenants/{tenantId}/products` | Organization owner or restaurant manager | Create a product with base price and percentage tax |
| `PUT /tenants/{tenantId}/products/{productId}` | Organization owner or restaurant manager | Update product details, price, tax, order, and availability |
| `DELETE /tenants/{tenantId}/products/{productId}` | Organization owner or restaurant manager | Archive the product and its option descendants |
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
| `GET /tenants/{tenantId}/orders` | Restaurant owner, manager, or kitchen staff | Read bounded, cursor-paginated order summaries with saved ticket lines and option labels; optional status filter |
| `PATCH /tenants/{tenantId}/orders/{orderId}/status` | Restaurant owner, manager, or kitchen staff | Change status with a required `If-Match` version |
| `/hubs/orders` | Better Auth JWT authenticated SignalR connection | Join authorized restaurant groups and receive `order.changed` events |
| `GET /health/live` | Public | Return `Healthy` while the API process can answer requests; does not check dependencies |
| `GET /health/ready` | Public | Check PostgreSQL connectivity and return `Healthy` or `Unhealthy` with HTTP `200` or `503`; response contains no provider details |
| `GET /openapi/v1.json`, `GET /swagger` | Anonymous when enabled | OpenAPI 3.1 JSON and interactive Swagger UI |

The app interface supports `/en` and `/fr`; restaurant menu locales are independent and restaurant-configurable without a fixed count limit. Menu locale is requested with `GET /menu?locale=<tag>`. Names for categories, products, option groups, and options and product descriptions can be translated. Missing item translations fall back to the default language; omitted or unsupported request locales resolve to the default and the response reports the effective locale and available list. To change the default, every active category, product, option group, and option must first have a translation in the new language, so existing base-language text is not silently relabeled. Owners and restaurant managers edit menu languages and translations in the localized organization area. First-release tenant addressing uses one-label subdomains; custom domains are deferred. See [decision 0003](../architecture/decisions/0003-catalog-localization-and-tenant-domain-policy.md).

The tenant ID in a protected route selects a resource. Every catalog/order query and mutation checks the authenticated issuer/subject membership for that tenant. Foreign or missing resource IDs return the same `404`. Kitchen staff can read/progress orders but cannot cancel them; owner/manager cancellation is allowed for incomplete orders. Restaurant entries from `GET /me` currently use role values `Manager` and `Kitchen`; organization-owned restaurants use `OrganizationOwner`. Invitation role values `RestaurantManager` and `KitchenStaff` map to those persisted membership values.

`GET /tenants/{tenantId}/orders` returns each summary's `lines` array with `productId`, saved `productName`, `quantity`, and selected `options` (`optionId`, saved `name`). These labels come from persisted order snapshots and are not re-read or re-translated from the current catalog. The default page size is 50, the maximum is 100, and `nextCursor` is opaque.

`POST /orders` resolves the restaurant from the request host. For local development, `bistro.localhost:5182` resolves the `bistro` tenant when `Tenancy:BaseDomain=localhost`. Forwarded-host and tenant headers are ignored. No public order lookup route exists; the create response is the receipt.

## 2. Authentication and tenancy

Better Auth issues short-lived RS256 JWTs from the Next.js server. The API discovers signing keys from `{Authentication:Issuer}/.well-known/openid-configuration` and validates issuer and audience. Configure `Authentication:Issuer` to the exact Better Auth base URL and `Authentication:Audience` to the same value as `API_AUDIENCE`. The browser session cookie stays in the browser; the server-side BFF obtains API tokens and calls the API without exposing bearer tokens to client JavaScript. A person is identified by validated issuer/subject. Persisted organization-owner and restaurant memberships determine access; token-supplied tenant IDs are not authorization. OpenAPI declares Bearer security per protected route. The API has no login route; local Swagger testing uses the frontend's `auth:dev-token` command and Swagger's Bearer **Authorize** control.

Invitation role identifiers are `OrganizationOwner`, `RestaurantManager`, and `KitchenStaff`; `/me` restaurant role values are `OrganizationOwner`, `Manager`, and `Kitchen`. An organization owner can manage that organization's restaurants and invitations. Restaurant managers manage that restaurant's catalog/orders. Kitchen staff can read and progress its orders. Restaurant tenant resolution for public routes accepts exactly one subdomain label below `Tenancy:BaseDomain`; unknown, inactive, nested, and foreign-domain hosts return `404`.

New customers use the localized organization signup flow, which creates the organization and its verified-email owner through `POST /organizations`. The operator-only `--provision-organization` command remains available for migrations/backfill using an issuer and subject. Staff invitations carry a normalized recipient email; accepting requires a verified JWT email with the same normalized address. See the [authentication decision](../architecture/decisions/0002-authentication.md) and [development guide](../development.md#authentication-configuration).

## 3. Pricing, checkout, and order workflow

The tenant menu includes ordered active categories and non-archived products, including items marked unavailable so the storefront can show their state. Checkout still rejects unavailable products. Product records have a base price and percentage tax rate. Option groups enforce their minimum/maximum selection counts; selected options add fixed amounts. Prices use decimal arithmetic in EUR, USD, or GBP. The server allocates at most one fixed or percentage discount across lines, computes tax, and rounds line amounts to two decimal places using `AwayFromZero`. New orders store the effective menu locale and immutable server-resolved product/option label snapshots per [decision 0004](../architecture/decisions/0004-localized-order-snapshots.md). Existing orders preserve their labels and report an unknown locale as `null`. No payment, cart, inventory, tax-jurisdiction engine, or stacked promotion is included.

`POST /orders` accepts a customer name, optional menu locale, unique product lines, positive quantities, selected option IDs, and an optional discount code. The API resolves the locale against enabled menu locales and defaults omitted or unsupported values to the tenant default. New orders snapshot the resolved product and selected-option labels using decision 0003's per-item default-language fallback. Legacy orders return `menuLocale: null` and keep their existing labels. The server derives tenant, names, prices, tax, currency, and totals from its catalog, then stores the order and purchase-time snapshots atomically. Requests are limited to 16 KiB. The fixed-window checkout limit is configured with `CheckoutRateLimit:PermitLimit`, `CheckoutRateLimit:WindowSeconds`, and `CheckoutRateLimit:QueueLimit`; buckets are per tenant and remote client address. `429` uses `rate_limited`.

Every checkout requires an `Idempotency-Key`. Keys are tenant-scoped and retained for 24 hours. The effective locale is included in normalized request hashing, so an unchanged retry replays the original receipt while a changed effective locale or other request content with the same key returns `409`. The successful create response contains the receipt. Staff lists default to 50 summaries per page, cap at 100, and return an opaque `nextCursor`; each order summary includes its effective `menuLocale`, nullable for legacy rows, and its lifecycle `status` as a string name such as `Pending`.

The storefront submits checkout through a same-origin Next.js server action. Its in-memory cart supplies `customerName`, nullable `discountCode`, selected `menuLocale`, and `items: [{ productId, quantity, optionIds }]`. The action derives the restaurant API host from validated actual Host and the configured template; browser tenant IDs, labels, and prices are not submitted. The frontend generates a UUID key, preserves payload/key on uncertain retries, and displays the API receipt's totals, tax, discount, currency, status, saved product/option labels, effective menu locale, and ID. Safe `400`, `404`, `409`, and `429` distinctions are retained; unreadable success responses are uncertain.

The API limiter still uses its observed remote address. Different guests behind the BFF can share the BFF's per-tenant API bucket. Browser address/forwarded headers are not forwarded or trusted to bypass it. A deployment-specific trusted-proxy and edge-rate policy remains separate operational work.

Statuses progress `Pending -> Preparing -> Ready -> Completed`. Repeating the current status is a no-op. Skipped/backward transitions and cancellation of a completed order return `409`; managers may cancel other incomplete orders. Mutations require `If-Match: "<version>"`; missing values return `428`, and stale concurrent writes return `412`. Successful mutations return the updated receipt and a new ETag.

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
