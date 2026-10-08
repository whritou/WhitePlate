# Backend architecture

Implemented in source: .NET 10 inward dependencies, typed results, centralized errors, EF Core tenant/organization ownership, Better Auth RS256 JWT validation, verified-email organization creation, email-bound staff invitations and owner-only team reads, reversible organization archive/restore with operational access gates, tenant-resolved menus, localized catalog/restaurant descriptions and checkout snapshots, product restore without purge, order workflow/idempotency, owner/manager order history, daily terminal-order archival, transactional outbox, and tenant-authorized SignalR. Catalog, localized-order, daily order-history, public-tracking, and restaurant-description migrations are generated; environment rollout remains separate for the last feature migration.

Tenant description translations are stored in `Tenants.DescriptionTranslationsJson`. Owners and restaurant managers can read and update one enabled locale through `GET`/`PUT /api/v1/tenants/{tenantId}/restaurant-description-translations`. The public menu resolves the selected effective locale first, then the default menu locale, and returns `restaurantDescription: null` when neither has saved text. The API enforces membership on every management request and the Domain enforces locale enablement, trimming, clearing, and the 500-character limit.

## Projects and folders

```text
apps/api/
  WhitePlate.Domain/
    Common/                 # Authored domain rule errors
    Tenants/                # Tenant entity and TenantSubdomain value object
    Organizations/           # Organization ownership
    Orders/                  # Order snapshots and lifecycle rules
    Catalog/                 # Tenant-owned catalog invariants
  WhitePlate.Application/
    Common/Errors/          # Transport-independent categories and validation issues
    Common/Results/         # Result<T>: either a value or a failure
    Tenants/                # Create/resolve handlers, DTO, repository port, ICurrentTenant
    Organizations/          # Organization queries/commands and ports
    Catalog/                # Menu/catalog commands, queries and ports
  WhitePlate.Infrastructure/
    Persistence/
      WhitePlateDbContext.cs
      WhitePlateDbContextFactory.cs
      Configurations/       # Entity mappings and indexes
      Repositories/         # Focused EF queries and writes
      Migrations/           # Generated PostgreSQL migration and snapshot
    Persistence/            # EF Core mappings, repositories and migrations
  WhitePlate.Api/
    Configuration/          # Composition and local tenant provisioning command
    Contracts/              # HTTP DTOs and typed Problem Details
    Controllers/            # Routes, binding and HTTP response mapping
    Mapping/                # Explicit DTO and result mapping
    Errors/                 # One status/code/message catalog and exception handler
    Tenancy/                # Host resolver, middleware and scoped context
    Program.cs              # Pipeline and command dispatch
  tests/WhitePlate.Tests/    # Domain, Application, Infrastructure, Api, Architecture
```

No additional project, mediator, generic CRUD repository, mapping library, or base entity was needed. Feature folders group related types; technical folders hold shared transport or persistence code.

| Project | References | Responsibility |
| --- | --- | --- |
| Domain | No project/framework dependencies | Entities, value objects, rules and domain errors |
| Application | Domain | Use cases, validation, results, DTOs and capability interfaces |
| Infrastructure | Application (Domain transitively) | EF Core, PostgreSQL, migrations, queries and external implementations |
| API | Application and Infrastructure | HTTP, composition, host resolution, contracts and error translation |

Architecture tests inspect project and compiled dependencies. Application and Domain must not reference EF Core or ASP.NET Core. API owns HTTP status decisions. Result<T> prevents a success carrying an error or a failure carrying a value. Use cases translate known domain rule errors; unrelated exceptions remain unexpected server errors.

## Request and command paths

The weather example has been removed from the route table and OpenAPI document. Restaurant routes use explicit request contracts and map application results through the central Problem Details mapper.

GET /api/v1/tenant requires [RequireTenant]. After routing, middleware extracts one DNS label below Tenancy:BaseDomain from Request.Host, resolves an active registry entry, and stores its DTO in scoped CurrentTenant. The controller returns public id, name, and subdomain. Invalid, unknown, inactive, nested, and foreign-domain hosts receive the same 404; there is no fallback. Client tenant headers and forwarded-host headers are ignored. Public selection grants no staff permissions.

The localized organization signup flow provisions an organization and verified-email owner through `POST /api/v1/organizations`. The local `--provision-organization` command remains available for migration/backfill using operator-supplied name, issuer, and subject. The legacy `--provision-tenant` path remains for migration/backfill work. Restaurant creation is organization-owner authorized. See [setup](../development.md#authentication-configuration).

Staff organization routes authorize the validated issuer/subject against persisted owner memberships. Owners can archive and restore organizations using the existing `IsActive` flag; all records are retained. Archived organizations remain visible to owners for restore, while their restaurants are excluded from `/me`, membership checks block staff operations, public tenant/menu resolution is unavailable, and checkout refuses new orders. Pending invitations remain stored and cannot be accepted during archive. Owner-only organization team reads project safe member and invitation DTOs, omit identity keys and invitation secrets, and derive accepted/revoked/expired/pending status on the server. Invitation revocation checks the active persisted owner and permits only pending invitations; non-pending and foreign resources return the same `404`. Restaurant staff routes authorize a role against the selected tenant ID. The ID selects a resource only. Catalog reads/updates/archives and order list/status operations use tenant-scoped repository calls; category/product archival also archives dependent options so checkout cannot accept a hidden product. Product restore clears only its archive flag and requires an active category; it does not reactivate availability or restore archived option descendants. Historical order lines retain snapshots. The staff order-list DTO serializes lifecycle status as its API string name (for example, `Pending`) for the dashboard contract; the enum remains an internal persistence/domain value. `GET /api/v1/tenants/{tenantId}/orders/history` independently requires organization-owner or restaurant-manager membership and returns all order statuses, including archived rows, with server-side search, filtering, sorting, and bounded pagination.

Public `POST /api/v1/orders` requires a host-resolved tenant, a tenant-scoped 24-hour idempotency key, and passes a 16 KiB request limit plus per-tenant/client rate limit. The application handler prices the request against the catalog and the repository saves the order, snapshots, idempotency receipt, and outbox message in one transaction. Staff order reads/status writes use `/api/v1/tenants/{tenantId}/orders`; status persistence checks the version through EF's concurrency token and writes its outbox event in the same transaction.

`OrderOutboxDispatcher` claims leased messages, publishes them, marks success, and retries failures with bounded delay. Safe polling diagnostics identify service resolution, idempotency cleanup, batch claim or retry scheduling plus the exception type, without payloads or credentials. `/hubs/orders` requires the bearer scheme; `JoinRestaurant` validates current membership before deriving the server-side group name. `KitchenSubscriptions` tracks connection identities and tenant selectors, never cached authorization decisions. Publication rechecks persisted membership and sends only to still-current authorized connections; revoked subscriptions are removed. Leave/disconnect removes subscriptions, and token expiration closes the authenticated connection. This registry matches the current single-instance in-memory SignalR host; multiple replicas need a shared subscription/delivery design. The frontend uses a same-origin short-lived token route, treats events as refresh hints, and reloads paged REST state after reconnect.

`OrderArchiveDispatcher` records the first terminal transition time and runs a hosted, idempotent UTC-midnight archive query. It runs once on API startup to catch up after downtime and retries failures each minute; archived orders keep their status and saved details, leave the kitchen list, and remain in history. No restaurant timezone or external scheduler is configured, so UTC defines the daily boundary. The generated migration backfills existing terminal orders from `CreatedAt`; operators must review and apply it through the normal migration process before deployment.

## Persistence and related entities

EF Core 10.0.12 and Npgsql provider 10.0.3 use a scoped WhitePlateDbContext. All 12 EF business migrations through `RestaurantDescriptionTranslations` are applied to Neon `test`; `DailyOrderHistory`, `PublicOrderTracking`, and `RestaurantDescriptionTranslations` were applied and verified on 2026-10-08. Better Auth uses a separate CLI-managed PostgreSQL schema, not EF; its `auth` schema is also migrated on `test`. The local API's pooled test-branch connection, migration history, auth tables, and signup/invitation flow have been verified. Later migrations on Neon `test` do not alter Coolify Production; see the [database schema status](../database/database-schema.md). The registry is intentionally global for public lookup; it is not a generic repository for tenant-owned records. Queries explicitly filter normalized subdomain and active status and use AsNoTracking. Async repository methods propagate cancellation. A create commits with SaveChangesAsync; no extra unit-of-work wrapper is needed.

There are no relationships yet, so no Include abstraction exists. Future persistence queries belong beside repository implementations. Use DTO projection for read-only graphs, explicit Include/ThenInclude for tracked aggregates when needed, and bounded pagination for lists. Do not expose IQueryable, EF expressions, lazy-loaded graphs, or include strings to Application/API callers.

Future tenant-owned models need server-resolved tenant keys, ownership checks on all reads/writes, and composite same-tenant foreign keys. Filters may supplement these checks. The registry alone does not prove order/catalog isolation. Migrations and seed data are never automatically applied at startup.

## Errors and messages

Successful reads return typed resource objects or arrays directly. Errors use ApiProblemResponse, application/problem+json, stable codes, safe English fallback messages, trace IDs, and optional structured field issues. See the [wire contract](../api/api-contracts.md#5-error-contract).

ApiErrorMapper is shared by application-result mapping, MVC binding failures, status-code pages, and ApiExceptionHandler. Binding failures do not echo values or JSON paths. Exception details are never returned, even in Development. ASP.NET Core handles disconnected-request cancellation; failures after streaming starts cannot be remapped. There are no streaming routes today.

Error logs contain code, status, route template, trace ID, and exception type. They omit payloads, headers, query strings, concrete URLs, rejected values, and raw exceptions. EF logging is disabled because provider diagnostics may contain data. The .NET 10 default suppresses handled-exception diagnostics; see [Microsoft's documentation](https://learn.microsoft.com/aspnet/core/breaking-changes/10/exception-handler-diagnostics-suppressed?view=aspnetcore-10.0).

401/403 bodies and role checks are tested with a test-only authentication scheme. Production uses configured JWT bearer validation and does not issue local credentials. Hub access tokens from query parameters are accepted only on `/hubs/orders`; tenant groups are authorized from persisted memberships.

## Adding a model or route

1. Confirm invariants, ownership, access policy, fields, and unresolved product decisions.
2. Add Domain types and invariant tests, without ORM/HTTP dependencies.
3. Add focused Application commands/queries, DTOs and plain handlers returning Result<T>. Validate before I/O; add a narrow repository port only when needed.
4. Add Infrastructure mappings/queries, cancellation and ownership checks, and a reviewed generated migration. Choose projections/includes per use case.
5. Add separate HTTP contracts and mapping, declare OpenAPI success/error responses, and register in ServiceRegistration. Add [RequireTenant] for selection plus actual authorization for protected routes.
6. Test relational behavior, missing/foreign tenant access, failures and HTTP contracts. Update contracts, schema, setup and decisions together.

## Verification scope

The xUnit v3/Microsoft Testing Platform suite covers tenant/organization invariants and use cases, verified email and invitation binding, catalog authorization and HTTP management, SQLite relational behavior, PostgreSQL model/migration generation, host separation/spoofing, error redaction, checkout pricing/idempotency/rate and body limits, order listing/status concurrency, outbox persistence, hub authorization, subscription cleanup, publication revocation/fail-closed behavior, and dependency boundaries. SQLite does not prove live PostgreSQL execution or independent-connection database races. Local acceptance against Better Auth and Neon `test` verifies multi-connection delivery, persisted acknowledgement/retry, duplicate handling, revoked sockets and REST recovery; see the dated [test plan](../functional-test-plan.md). Hosted Coolify delivery and actual token-expiration/reconnect remain unverified.
