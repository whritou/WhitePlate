# Development roadmap and open decisions

Status: the [full API design](superpowers/specs/2026-09-29-full-api-design.md) and [authentication design](superpowers/specs/2026-09-29-authentication-system-design.md) are approved. Backend API scope and localized auth/organization frontend flows are implemented in source; 133 API and 132 frontend tests pass. Catalog and localized order migrations are applied on Neon `test`. Local email/password signup, organization creation, invitation acceptance, localized storefront and checkout, and owner kitchen workflow have test-branch acceptance. Staff-role browser acceptance, configured OAuth/real email delivery, production rollout, and production migration rollout remain open.

## Suggested sequence

| Stage | Scope | Evidence needed to call it complete |
| --- | --- | --- |
| 1. Reproducible baseline | Toolchain versions, lint compatibility, build environment, frontend test scripts and CI | Node/npm and .NET SDK are pinned; ESLint 10 compatibility and no-network font stack are configured; frontend and API checks run in GitHub Actions. Clean install and full checks are recorded in [verification evidence](documentation-review.md). |
| 2. Tenant and identity foundation | Host resolution, staff permissions, persistence, two-tenant fixtures | Backend organization, membership, tenancy, email-bound invitation, and isolation tests pass; catalog and order-locale migrations are applied to test |
| 3. Read-only storefront | Tenant catalog, API DTOs, locale-aware UI, branding | Server-rendered subdomain menu, configurable languages, translations, fallback, and availability are implemented. Neon `test` browser acceptance passed for French translations and default fallback. |
| 4. Checkout | Guest cart, server pricing, order transaction, retry semantics | In-memory tenant cart and same-origin checkout BFF are implemented; frontend tests and real Neon `test` receipt, persisted snapshot, and locale-aware replay/conflict checks pass. No persisted cart or payment is in scope. |
| 5. Kitchen workflow | Staff order list, lifecycle rules, real-time notifications, recovery | Staff dashboard, saved localized ticket labels, server actions, SignalR refresh hints, and reconnect REST recovery are implemented and covered by tests; an owner dashboard transition and live refresh passed against Neon `test`. Staff-role matrix and production hub configuration remain. |
| 6. Deployment readiness | Runtime topology, TLS, secrets, migrations, observability, backups/restore | Documented deployment/rollback and successful restore/recovery checks appropriate to the chosen infrastructure |

Each stage should be implemented in small usable slices. No need to create all architectural layers before delivering a concrete feature.

## Decision register

D04 is resolved by the architecture. D02/D03/D05-D09 are approved in the full API design; deployment/provider-specific details remain open. D11 is resolved by [decisions 0003](architecture/decisions/0003-catalog-localization-and-tenant-domain-policy.md) and [0004](architecture/decisions/0004-localized-order-snapshots.md). The table records accepted decisions and their implementation status.

| ID | Decision | Resolve before | Questions to answer |
| --- | --- | --- | --- |
| D01 | Resolved 2026-10-01; deployment compatibility corrected 2026-10-02 | Node.js 24.19.0 and npm 11.17.0 remain exact local/CI references; engine ranges `^24.19.0` and `^11.17.0` accept compatible deployment updates within Node 24/npm 11. .NET uses SDK 10.0.100 as its minimum feature band with `latestFeature` roll-forward. ESLint remains on supported v10 and a focused flat-config adapter restores `context.getFilename()` for the React plugin bundled by Next.js 16.3.4. System font stacks remove network font fetches. GitHub Actions covers clean frontend install, Vitest, lint, typecheck, production build, and .NET solution tests. |
| D02 | HTTP topology and tenant mapping | Storefront menu integration | Implemented in source: frontend validates the one-label tenant host and uses a fixed server-side API URL template; API resolves that subdomain under its configured base domain. No forwarded/tenant-header trust. Custom domains are deferred. Open: production DNS/TLS/proxy setup and CORS. |
| D03 | Identity and permissions | Staff operations | Implemented: Better Auth email/password, Google/Microsoft OAuth, RS256 API JWTs, verified-email org signup, persisted issuer/subject membership, three staff roles, seven-day hashed email-bound single-use invites, Resend mail, and localized auth UI. Both schemas are migrated and the email/password signup/invitation path is verified on Neon `test`; provider credentials, real email, browser verification, and production rollout remain. |
| D04 | Business use-case conventions | First business use case | Resolved: plain handlers, explicit validation/mapping, typed Result<T>, centralized Problem Details. Revisit only for a demonstrated need. |
| D05 | Persistence | Migrations | Implemented mappings use EF Core/Npgsql and composite tenant keys. `CatalogLocalization` and `LocalizedOrderSnapshots` are applied on Neon `test`. Production remains separate. |
| D06 | Catalog and pricing | Menu and checkout | Implemented category/product/option/discount management, archive/deactivation, option groups, configurable percentage tax, one non-stacking fixed/percentage discount, EUR/USD/GBP, and two-decimal AwayFromZero rounding. |
| D07 | Checkout scope | Order creation | Implemented without persisted cart/payment/inventory/pickup; accepts customer/items/options/promo/menuLocale, tenant-scoped 24-hour idempotency including effective locale, 16 KiB body cap, and per-tenant/client rate limiting. |
| D08 | Order access and lifecycle | Confirmation/dashboard | Implemented approved transitions, manager cancellation, required If-Match, 412 stale and 428 missing precondition, paged staff reads, saved ticket lines, and the server-backed staff dashboard. |
| D09 | Real-time delivery | Kitchen notifications | Implemented `/hubs/orders`, membership-checked tenant groups, transactional outbox, at-least-once event IDs/versions, retry, and REST recovery. The frontend gets a same-origin short-lived token, uses events as refresh hints, and reloads authoritative state after reconnect; owner browser acceptance passed on Neon `test`, while the staff-role matrix and production hub configuration remain. |
| D10 | Deployment | First hosted environment | Vercel, Render, Better Auth, and one-label tenant subdomains are selected; API liveness and database-readiness probes are implemented. Preview secret/build policy, production OIDC/database/hub verification, wildcard DNS, durable Data Protection keys, client-IP configuration, secret handling, observability, backups/restore, and migration/rollback acceptance remain open. |
| D11 | Catalog localization | Storefront menu and checkout | Resolved: restaurants configure menu languages (minimum one) and a default; category/product/option names and product descriptions support translations, missing item text falls back to the default, menu locale is independent of app `/en`/`/fr`, and orders preserve effective locale plus resolved product/option labels. Storefront, manager UI/API, checkout snapshots, and generated migrations are implemented. Both localization migrations and browser acceptance are verified on Neon `test`; production rollout remains separate. See [decisions 0003](architecture/decisions/0003-catalog-localization-and-tenant-domain-policy.md) and [0004](architecture/decisions/0004-localized-order-snapshots.md). |

Do not fabricate product answers such as payment rules or pickup-time limits. Settle the decision when the requested implementation depends on it; continue independent work where possible. Record decisions using the format in the [documentation index](README.md), then update the relevant contract, schema, and acceptance scenarios together.

## Definition of done for a feature

- The behavior is implemented and its error/empty/loading states are handled.
- Relevant authorization, ownership, validation, and concurrency cases are verified.
- Both language catalogs and accessible interactions are updated for UI changes.
- Commands/configuration and public contracts match the source.
- Verification results distinguish passed checks, failures, and unrun checks.
- Documentation moves the capability from proposed to implemented only after runtime wiring exists.
