# API contracts

Status: the Better Auth frontend, email/password and social auth routes, server-side API token exchange, organization signup, and email-bound invitations are wired in source. Existing API behavior is covered by its automated suite; the new localization paths have compile verification but still need behavioral acceptance after the migration is applied. The first seven EF migrations and Better Auth auth schema are applied on Neon `test`; `CatalogLocalization` is not. Email/password signup, organization creation, and invitation acceptance were previously exercised there using locally intercepted email delivery. Provider credentials, production domain/CORS settings, browser OAuth, real email delivery, and production migrations remain deployment/verification work.

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
| `POST /orders` | Public, resolved restaurant host | Price and create an order from the server's catalog; requires `Idempotency-Key`. The approved follow-up adds optional `menuLocale` input and returns the effective locale with saved localized labels. |
| `GET /tenants/{tenantId}/orders` | Restaurant owner, manager, or kitchen staff | Read bounded, cursor-paginated order summaries; optional status filter |
| `PATCH /tenants/{tenantId}/orders/{orderId}/status` | Restaurant owner, manager, or kitchen staff | Change status with a required `If-Match` version |
| `/hubs/orders` | Better Auth JWT authenticated SignalR connection | Join authorized restaurant groups and receive `order.changed` events |
| `GET /openapi/v1.json`, `GET /swagger` | Anonymous when enabled | OpenAPI 3.1 JSON and interactive Swagger UI |

The app interface supports `/en` and `/fr`; restaurant menu locales are independent and restaurant-configurable without a fixed count limit. Menu locale is requested with `GET /menu?locale=<tag>`. Names for categories, products, option groups, and options and product descriptions can be translated. Missing item translations fall back to the default language; omitted or unsupported request locales resolve to the default and the response reports the effective locale and available list. To change the default, every active category, product, option group, and option must first have a translation in the new language, so existing base-language text is not silently relabeled. Owners and restaurant managers edit menu languages and translations in the localized organization area. First-release tenant addressing uses one-label subdomains; custom domains are deferred. See [decision 0003](../architecture/decisions/0003-catalog-localization-and-tenant-domain-policy.md).

The tenant ID in a protected route selects a resource. Every catalog/order query and mutation checks the authenticated issuer/subject membership for that tenant. Foreign or missing resource IDs return the same `404`. Kitchen staff can read/progress orders but cannot cancel them; owner/manager cancellation is allowed for incomplete orders.

`POST /orders` resolves the restaurant from the request host. For local development, `bistro.localhost:5182` resolves the `bistro` tenant when `Tenancy:BaseDomain=localhost`. Forwarded-host and tenant headers are ignored. No public order lookup route exists; the create response is the receipt.

## 2. Authentication and tenancy

Better Auth issues short-lived RS256 JWTs from the Next.js server. The API discovers signing keys from `{Authentication:Issuer}/.well-known/openid-configuration` and validates issuer and audience. Configure `Authentication:Issuer` to the exact Better Auth base URL and `Authentication:Audience` to the same value as `API_AUDIENCE`. The browser session cookie stays in the browser; the server-side BFF obtains API tokens and calls the API without exposing bearer tokens to client JavaScript. A person is identified by validated issuer/subject. Persisted organization-owner and restaurant memberships determine access; token-supplied tenant IDs are not authorization. OpenAPI declares Bearer security per protected route. The API has no login route; local Swagger testing uses the frontend's `auth:dev-token` command and Swagger's Bearer **Authorize** control.

Roles are `OrganizationOwner`, `RestaurantManager`, and `KitchenStaff`. An organization owner can manage that organization's restaurants and invitations. Restaurant managers manage that restaurant's catalog/orders. Kitchen staff can read and progress its orders. Restaurant tenant resolution for public routes accepts exactly one subdomain label below `Tenancy:BaseDomain`; unknown, inactive, nested, and foreign-domain hosts return `404`.

New customers use the localized organization signup flow, which creates the organization and its verified-email owner through `POST /organizations`. The operator-only `--provision-organization` command remains available for migrations/backfill using an issuer and subject. Staff invitations carry a normalized recipient email; accepting requires a verified JWT email with the same normalized address. See the [authentication decision](../architecture/decisions/0002-authentication.md) and [development guide](../development.md#authentication-configuration).

## 3. Pricing, checkout, and order workflow

The tenant menu includes ordered active categories and non-archived products, including items marked unavailable so the storefront can show their state. Checkout still rejects unavailable products. Product records have a base price and percentage tax rate. Option groups enforce their minimum/maximum selection counts; selected options add fixed amounts. Prices use decimal arithmetic in EUR, USD, or GBP. The server allocates at most one fixed or percentage discount across lines, computes tax, and rounds line amounts to two decimal places using `AwayFromZero`. **Approved but not implemented:** localized order snapshots follow [decision 0004](../architecture/decisions/0004-localized-order-snapshots.md). Current orders do not record menu locale. No payment, cart, inventory, tax-jurisdiction engine, or stacked promotion is included.

`POST /orders` currently accepts a customer name, unique product lines, positive quantities, selected option IDs, and an optional discount code. The approved contract change adds optional `menuLocale`: the API resolves it against enabled menu locales, defaults omitted/unsupported values to the tenant default, and returns the effective locale. New orders will snapshot the resolved product and selected-option labels using decision 0003's per-item default-language fallback. Legacy orders return `menuLocale: null` and keep their existing labels. The server derives tenant, names, prices, tax, currency, and totals from its catalog, then stores the order and purchase-time snapshots atomically. Requests are limited to 16 KiB. The fixed-window checkout limit is configured with `CheckoutRateLimit:PermitLimit`, `CheckoutRateLimit:WindowSeconds`, and `CheckoutRateLimit:QueueLimit`; buckets are per tenant and remote client address. `429` uses `rate_limited`.

Every checkout requires an `Idempotency-Key`. Keys are tenant-scoped and retained for 24 hours. The same key and normalized request replay the original receipt; the same key with different content returns `409`. The successful create response contains the receipt. Staff lists default to 50 summaries per page, cap at 100, and return an opaque `nextCursor`.

The storefront submits checkout through a same-origin Next.js server action. Its in-memory cart supplies `customerName`, nullable `discountCode`, `menuLocale`, and `items: [{ productId, quantity, optionIds }]`. The action derives the restaurant API host from validated actual Host and the configured template; browser tenant IDs, labels, and prices are not submitted. The frontend generates a UUID key, preserves payload/key on uncertain retries, and displays the API receipt's totals, tax, discount, currency, status, saved product/option labels, effective menu locale, and ID. The effective locale is part of the normalized idempotency request, so reusing a key with a different resolved locale returns `409`; unchanged retries replay the original receipt. These are approved contract changes, not current behavior. Safe `400`, `404`, `409`, and `429` distinctions are retained; unreadable success responses are uncertain.

The API limiter still uses its observed remote address. Different guests behind the BFF can share the BFF's per-tenant API bucket. Browser address/forwarded headers are not forwarded or trusted to bypass it. A deployment-specific trusted-proxy and edge-rate policy remains separate operational work.

Statuses progress `Pending -> Preparing -> Ready -> Completed`. Repeating the current status is a no-op. Skipped/backward transitions and cancellation of a completed order return `409`; managers may cancel other incomplete orders. Mutations require `If-Match: "<version>"`; missing values return `428`, and stale concurrent writes return `412`. Successful mutations return the updated receipt and a new ETag.

## 4. SignalR notifications

The hub is `/hubs/orders`; bearer tokens supplied by SignalR's `access_token` query parameter are read only on this path. Call `JoinRestaurant(tenantId)` to request a membership-checked subscription. The server derives the group name and checks the current owner/manager/kitchen membership before joining; clients cannot submit a group name. `LeaveRestaurant(tenantId)` removes the current connection from that group.

The dispatcher publishes `order.changed` with `eventId`, `tenantId`, `orderId`, `eventType`, current `status`, `version`, and UTC `occurredAt`. Order creation/status changes and outbox rows commit in one transaction. The dispatcher retries failed deliveries with bounded exponential delay; delivery is at least once, so clients should deduplicate by event ID and use the authorized paginated REST list after reconnect. REST/database state remains authoritative.

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
