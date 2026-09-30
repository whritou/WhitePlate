# WhitePlate full API design

- Date: 2026-09-29
- Status: approved by the user for implementation planning
- Scope: organization and restaurant tenancy, external OIDC staff authentication, catalog and pricing, public orders, staff order workflow, and live kitchen notifications. Remove the sample weather feature.

## Goals and boundaries

Extend the existing .NET 10 four-project architecture. Preserve inward project dependencies, the PostgreSQL/Npgsql persistence choice, plain use-case handlers, typed application results, direct success bodies, and centralized safe Problem Details. Do not add a mediator, generic repository, payment provider, local password store, or frontend API integration.

An organization owns one or more restaurants. Each restaurant is a tenant and the isolation boundary for its catalog, orders, staff memberships, settings, idempotency keys, and notification groups. Organization-wide ownership does not remove explicit tenant checks on restaurant data.

## Authentication and organization access

- Validate bearer access tokens from an external OIDC issuer. Configure issuer/authority, audience, and allowed browser origins outside source control. WhitePlate does not issue access or refresh tokens.
- Identify a person by the validated `(issuer, subject)` pair. Persist organization-owner membership and restaurant memberships in WhitePlate.
- Roles: `OrganizationOwner` manages its organization, restaurants, and restaurant staff; `RestaurantManager` manages one restaurant's catalog and orders; `KitchenStaff` reads and progresses orders for assigned restaurants.
- An operator-only command creates the initial organization and owner identity link. No public organization signup exists in this release.
- Owners invite organization owners or restaurant staff with a cryptographically random, single-use token that expires after seven days. Persist only a token hash, bind the accepted membership to the accepting validated OIDC identity, and reveal the token only in the creation response. No email delivery is included.
- An ID or tenant selector supplied by a caller only selects a resource. Membership authorization is required for every protected read and write.

## HTTP capabilities

- Public host-resolved reads: `GET /api/v1/tenant` and `GET /api/v1/menu`.
- Organization owner operations: list/read owned organizations, update organization metadata, create/list restaurants, and create/revoke owner or restaurant staff invitations.
- Restaurant manager catalog operations: manage categories, products, option groups/options, product tax rates, and promo discounts. Product/category deletion archives records so historical orders remain intact. Public menu responses include active categories and available products in configured order.
- Public checkout: `POST /api/v1/orders` under the resolved restaurant host. It accepts customer name, product IDs, quantities, selected option IDs, and an optional promo code. The server derives all tenant, price, tax, discount, currency, and total values.
- Staff order workflow: tenant-scoped, authorized paginated order listing and `PATCH /api/v1/tenants/{tenantId}/orders/{id}/status`. A tenant ID in the route is a selector only; the authenticated membership is authoritative.
- `GET /api/v1/me` exposes the validated identity and its current organization/restaurant memberships for API clients.
- SignalR hub `/hubs/orders` authenticates with the same OIDC scheme. The server derives allowed tenant groups from memberships. Clients cannot select arbitrary groups. Events carry order ID, tenant ID, event ID, version, and current status; REST is authoritative after reconnect.

Exact DTOs and route templates should remain consistent with these resource boundaries and be added to the OpenAPI document. Tenant host resolution continues to ignore forwarded-host and tenant headers. Browser access uses a server-configured CORS origin allowlist; wildcard credentialed CORS is prohibited.

## Catalog and price rules

- A restaurant has one configured currency, initially limited to EUR, USD, or GBP, with two fractional digits.
- Products have a base price and one percentage tax rate. Product option groups define minimum and maximum selections; selected options add fixed amounts to the base price.
- Promo discounts are tenant-owned codes with either a fixed amount or percentage value. At most one code applies to an order. It cannot reduce the pre-tax subtotal below zero.
- Calculate with decimal arithmetic. Apply the accepted discount to the pre-tax subtotal, allocate it across lines, calculate tax for each line, and round monetary line results to two decimal places using `MidpointRounding.AwayFromZero`.
- Reject unavailable products/options, invalid option counts, duplicate product lines, malformed quantities, invalid promo codes, and cross-tenant IDs. No payment, inventory reservation, product option translation, tax jurisdiction engine, or stacked promotion is included.

## Orders, retries, and concurrency

- Persist an order and its item/option/tax/discount/currency snapshots atomically. Historical orders do not change when catalog data changes.
- Order statuses are `Pending -> Preparing -> Ready -> Completed`. A manager may cancel any order that is not completed. Repeating the current status is a no-op; other invalid transitions return `409`.
- Staff status mutations require `If-Match` with the current order version. Missing preconditions return `428`; stale versions return `412` without overwriting newer state.
- Public order creation requires an `Idempotency-Key`, unique per tenant and retained for 24 hours. Repeating the same key and normalized request returns the original receipt; reusing it for a different request returns `409`.
- Return the receipt in the successful create response. No public order lookup route is included.
- Staff order lists use cursor pagination with a default page size of 50 and a maximum of 100; filtering and ordering remain within the authorized tenant.
- Public order creation has configurable per-tenant/IP rate limits and a request-body size limit. Rate-limit responses use the existing `429 rate_limited` error code.

## Durable kitchen notifications

Write outbox events in the same database transaction as the order mutation. A background dispatcher retries undelivered events, records delivery state, and publishes events to the authorized tenant's SignalR group. Events are at-least-once and include a stable event ID/version for client deduplication. Clients recover missed updates through the authorized REST list. No cross-tenant or client-selected group broadcast is allowed.

## Persistence and project ownership

- Domain: Organization, Tenant/Restaurant, catalog and pricing invariants, memberships/invitations, orders/status transitions, and outbox event data.
- Application: commands/queries, DTOs, validation, result mapping, OIDC current-principal abstraction, and narrow repository/publisher ports.
- Infrastructure: EF Core 10/Npgsql, PostgreSQL constraints and composite tenant foreign keys, migrations, repositories, hashed invitation/idempotency tokens, and outbox storage/dispatcher.
- API: OIDC JWT bearer validation, authorization policies, tenant-aware HTTP/Hub boundaries, OpenAPI contracts, error mapping, composition, and operator commands.

Never migrate the live database automatically at startup. Add reviewed incremental migrations to the existing tenant migration history; do not drop or recreate the existing tenant registry.

## Delivery sequence

1. Add organization ownership, identity memberships, staff invitations, and authorized restaurant creation; evolve the tenant migration without losing registry rows; configure OIDC validation and operator provisioning.
2. Add tenant-scoped catalog and price configuration, including option groups, percentage tax rates, and promo discounts.
3. Add public order creation, exact server-side totals and snapshots, idempotency, and staff order list/status concurrency.
4. Add transactional outbox, authenticated tenant-scoped SignalR subscriptions, retries, and reconnect contract.
5. Remove weather source/use case/route/tests and revise all affected API, architecture, setup, schema, and test-plan documentation.

Each slice must include meaningful domain, relational, HTTP, and authorization coverage appropriate to its behavior. Use two-tenant fixtures to verify both response and persisted state for cross-tenant attempts.

## Explicit exclusions and implementation assumptions

- The external OIDC provider is not selected; issuer, audience, and claim configuration are deployment inputs.
- Online payments, carts, pickup scheduling, inventory, public order lookup, custom domains, forwarded-proxy trust, email delivery, and self-service organization signup are excluded.
- The initial percentage-tax and rounding behavior is a configurable calculation model, not a claim of compliance with any particular jurisdiction. Confirm applicable rules before production use.
- First-owner provisioning requires the operator to supply organization details plus the validated issuer and subject. No secrets or tokens are accepted from untrusted tenant headers.
- The existing weather API is removed rather than retained as sample behavior.
