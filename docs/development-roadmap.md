# Development roadmap and open decisions

Status: the [full API design](superpowers/specs/2026-09-29-full-api-design.md) and [authentication design](superpowers/specs/2026-09-29-authentication-system-design.md) are approved. Backend API scope and localized auth/organization frontend flows are implemented in source; 129 API tests passed before this localization change and frontend typecheck passes. Both prior database schemas are migrated on Neon `test`; the new `CatalogLocalization` migration is not. Local email/password signup, organization creation, and invitation acceptance were previously verified there with email intercepted. Localization browser acceptance, configured OAuth/real email delivery, production deployment, and production migration rollout remain open.

## Suggested sequence

| Stage | Scope | Evidence needed to call it complete |
| --- | --- | --- |
| 1. Reproducible baseline | Toolchain versions, lint compatibility, build environment, frontend test scripts and CI | Fresh setup/build/checks documented and repeatable; API tests and root ignore policy are now in place |
| 2. Tenant and identity foundation | Host resolution, staff permissions, persistence, two-tenant fixtures | Backend organization, membership, tenancy, email-bound invitation, and isolation tests pass; new migration still needs deployment |
| 3. Read-only storefront | Tenant catalog, API DTOs, locale-aware UI, branding | Server-rendered subdomain menu, restaurant-configurable menu languages, translations, fallback, and availability state are implemented in source; browser acceptance, deployment host routing, and the unapplied `CatalogLocalization` migration remain |
| 4. Checkout | Server pricing, order transaction, retry semantics | Backend checkout, pricing, tax/discount, snapshots and idempotency tests pass; no cart/payment is in scope |
| 5. Kitchen workflow | Staff order list, lifecycle rules, real-time notifications, recovery | Backend authorization, concurrency, outbox and hub access are implemented; frontend recovery and live Better Auth SignalR test remain |
| 6. Deployment readiness | Runtime topology, TLS, secrets, migrations, observability, backups/restore | Documented deployment/rollback and successful restore/recovery checks appropriate to the chosen infrastructure |

Each stage should be implemented in small usable slices. No need to create all architectural layers before delivering a concrete feature.

## Decision register

D04 is resolved by the architecture. D02/D03/D05-D09 are approved in the full API design; deployment/provider-specific details remain open. D11 is resolved by [decision 0003](architecture/decisions/0003-catalog-localization-and-tenant-domain-policy.md). The table records accepted decisions and their implementation status.

| ID | Decision | Resolve before | Questions to answer |
| --- | --- | --- | --- |
| D01 | Toolchain and checks | Reproducible baseline/CI | Which Node/npm and .NET SDK versions are pinned? Which ESLint/plugin versions work together? How are fonts handled in restricted builds? |
| D02 | HTTP topology and tenant mapping | Storefront menu integration | Implemented in source: frontend validates the one-label tenant host and uses a fixed server-side API URL template; API resolves that subdomain under its configured base domain. No forwarded/tenant-header trust. Custom domains are deferred. Open: production DNS/TLS/proxy setup and CORS. |
| D03 | Identity and permissions | Staff operations | Implemented: Better Auth email/password, Google/Microsoft OAuth, RS256 API JWTs, verified-email org signup, persisted issuer/subject membership, three staff roles, seven-day hashed email-bound single-use invites, Resend mail, and localized auth UI. Both schemas are migrated and the email/password signup/invitation path is verified on Neon `test`; provider credentials, real email, browser verification, and production rollout remain. |
| D04 | Business use-case conventions | First business use case | Resolved: plain handlers, explicit validation/mapping, typed Result<T>, centralized Problem Details. Revisit only for a demonstrated need. |
| D05 | Persistence | Migrations | Implemented mappings use EF Core/Npgsql and composite tenant keys. The first seven EF migrations and Better Auth's independent `auth` schema are applied and verified on Neon `test`; new `CatalogLocalization` is not yet applied. Production remains unchanged. |
| D06 | Catalog and pricing | Menu and checkout | Implemented category/product/option/discount management, archive/deactivation, option groups, configurable percentage tax, one non-stacking fixed/percentage discount, EUR/USD/GBP, and two-decimal AwayFromZero rounding. |
| D07 | Checkout scope | Order creation | Implemented without persisted cart/payment/inventory/pickup; accepts customer/items/options/promo, tenant-scoped 24-hour idempotency, 16 KiB body cap, and per-tenant/client rate limiting. |
| D08 | Order access and lifecycle | Confirmation/dashboard | Implemented approved transitions, manager cancellation, required If-Match, 412 stale and 428 missing precondition, and paged staff reads. |
| D09 | Real-time delivery | Kitchen notifications | Implemented `/hubs/orders`, membership-checked tenant groups, transactional outbox, at-least-once event IDs/versions, retry, and REST recovery. Frontend subscriptions and live Better Auth multi-connection verification remain. |
| D10 | Deployment | First hosted environment | Host, containers, domain/TLS termination, secret store, health checks, backups, rollback and observability? |
| D11 | Catalog localization | Storefront menu | Resolved: restaurants configure any number of menu languages (minimum one) and a default; category/product/option names and product descriptions support translations, missing item text falls back to the default, and menu locale is independent of app `/en`/`/fr`. Storefront and manager UI/API are implemented in source. Open: locale in checkout/order snapshots and migration rollout. See [decision 0003](architecture/decisions/0003-catalog-localization-and-tenant-domain-policy.md). |

Do not fabricate product answers such as payment rules or pickup-time limits. Settle the decision when the requested implementation depends on it; continue independent work where possible. Record decisions using the format in the [documentation index](README.md), then update the relevant contract, schema, and acceptance scenarios together.

## Definition of done for a feature

- The behavior is implemented and its error/empty/loading states are handled.
- Relevant authorization, ownership, validation, and concurrency cases are verified.
- Both language catalogs and accessible interactions are updated for UI changes.
- Commands/configuration and public contracts match the source.
- Verification results distinguish passed checks, failures, and unrun checks.
- Documentation moves the capability from proposed to implemented only after runtime wiring exists.
