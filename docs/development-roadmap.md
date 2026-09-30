# Development roadmap and open decisions

Status: the [full API design](superpowers/specs/2026-09-29-full-api-design.md) and [authentication design](superpowers/specs/2026-09-29-authentication-system-design.md) are approved. Backend API scope and localized auth/organization frontend flows are implemented in source; 129 API tests pass and frontend typecheck passes. Both database schemas are migrated on Neon `test`, and local email/password signup, organization creation, and invitation acceptance were verified there with email intercepted. Configured OAuth/real email delivery, browser acceptance, production deployment, and production migration rollout remain open.

## Suggested sequence

| Stage | Scope | Evidence needed to call it complete |
| --- | --- | --- |
| 1. Reproducible baseline | Toolchain versions, lint compatibility, build environment, frontend test scripts and CI | Fresh setup/build/checks documented and repeatable; API tests and root ignore policy are now in place |
| 2. Tenant and identity foundation | Host resolution, staff permissions, persistence, two-tenant fixtures | Backend organization, membership, tenancy, email-bound invitation, and isolation tests pass; new migration still needs deployment |
| 3. Read-only storefront | Tenant catalog, API DTOs, locale-aware UI, branding | Backend tenant menu/catalog API and tenant/locale query-key plus client-state primitives are ready; storefront API integration, tenant host mapping, and cache behavior remain |
| 4. Checkout | Server pricing, order transaction, retry semantics | Backend checkout, pricing, tax/discount, snapshots and idempotency tests pass; no cart/payment is in scope |
| 5. Kitchen workflow | Staff order list, lifecycle rules, real-time notifications, recovery | Backend authorization, concurrency, outbox and hub access are implemented; frontend recovery and live Better Auth SignalR test remain |
| 6. Deployment readiness | Runtime topology, TLS, secrets, migrations, observability, backups/restore | Documented deployment/rollback and successful restore/recovery checks appropriate to the chosen infrastructure |

Each stage should be implemented in small usable slices. No need to create all architectural layers before delivering a concrete feature.

## Decision register

D04 is resolved by the architecture. D02/D03/D05-D09 are approved in the full API design; deployment/provider-specific details remain open. D11 records an accepted catalog translation requirement while its storage, fallback, and API design remain open. The table records accepted decisions and their implementation status.

| ID | Decision | Resolve before | Questions to answer |
| --- | --- | --- | --- |
| D01 | Toolchain and checks | Reproducible baseline/CI | Which Node/npm and .NET SDK versions are pinned? Which ESLint/plugin versions work together? How are fonts handled in restricted builds? |
| D02 | HTTP topology and tenant mapping | Storefront menu integration | Implemented: direct one-label host resolution under a configured base domain, localhost default, no forwarded/tenant-header trust. Accepted for first release: one-label tenant subdomains only; custom domains deferred. Open: frontend-to-API host mapping/BFF, production DNS/TLS/proxy setup, and CORS. |
| D03 | Identity and permissions | Staff operations | Implemented: Better Auth email/password, Google/Microsoft OAuth, RS256 API JWTs, verified-email org signup, persisted issuer/subject membership, three staff roles, seven-day hashed email-bound single-use invites, Resend mail, and localized auth UI. Both schemas are migrated and the email/password signup/invitation path is verified on Neon `test`; provider credentials, real email, browser verification, and production rollout remain. |
| D04 | Business use-case conventions | First business use case | Resolved: plain handlers, explicit validation/mapping, typed Result<T>, centralized Problem Details. Revisit only for a demonstrated need. |
| D05 | Persistence | Migrations | Implemented mappings use EF Core/Npgsql and composite tenant keys. All seven EF migrations and Better Auth's independent `auth` schema are applied and verified on Neon `test`. Production remains unchanged. |
| D06 | Catalog and pricing | Menu and checkout | Implemented category/product/option/discount management, archive/deactivation, option groups, configurable percentage tax, one non-stacking fixed/percentage discount, EUR/USD/GBP, and two-decimal AwayFromZero rounding. |
| D07 | Checkout scope | Order creation | Implemented without persisted cart/payment/inventory/pickup; accepts customer/items/options/promo, tenant-scoped 24-hour idempotency, 16 KiB body cap, and per-tenant/client rate limiting. |
| D08 | Order access and lifecycle | Confirmation/dashboard | Implemented approved transitions, manager cancellation, required If-Match, 412 stale and 428 missing precondition, and paged staff reads. |
| D09 | Real-time delivery | Kitchen notifications | Implemented `/hubs/orders`, membership-checked tenant groups, transactional outbox, at-least-once event IDs/versions, retry, and REST recovery. Frontend subscriptions and live Better Auth multi-connection verification remain. |
| D10 | Deployment | First hosted environment | Host, containers, domain/TLS termination, secret store, health checks, backups, rollback and observability? |
| D11 | Catalog localization | Storefront menu | Accepted: storefront catalog copy must support `en` and `fr`. Open: translated fields, storage, editing/completeness, missing-translation behavior, locale-aware menu contract, and future order snapshot locale. See [decision 0003](architecture/decisions/0003-catalog-localization-and-tenant-domain-policy.md). |

Do not fabricate product answers such as payment rules or pickup-time limits. Settle the decision when the requested implementation depends on it; continue independent work where possible. Record decisions using the format in the [documentation index](README.md), then update the relevant contract, schema, and acceptance scenarios together.

## Definition of done for a feature

- The behavior is implemented and its error/empty/loading states are handled.
- Relevant authorization, ownership, validation, and concurrency cases are verified.
- Both language catalogs and accessible interactions are updated for UI changes.
- Commands/configuration and public contracts match the source.
- Verification results distinguish passed checks, failures, and unrun checks.
- Documentation moves the capability from proposed to implemented only after runtime wiring exists.
