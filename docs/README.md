# Documentation index

Reviewed against the working tree on 2026-10-04. WhitePlate contains the first-release restaurant API, Better Auth account/organization/team flows, owner restaurant creation, localized tenant menu browsing, an in-memory guest checkout, and a localized staff kitchen order dashboard with SignalR refresh hints and REST recovery. Localization migrations, checkout and owner kitchen acceptance are verified on Neon `test`. Staff-role acceptance and production operations remain separately tracked; the kanban also records user-reported production OAuth/onboarding verification.

## Reading order

| Document | Purpose |
| --- | --- |
| [Repository README](../readme.md) | Product intent and quickest path to running the scaffolds |
| [Development guide](development.md) | Setup, configuration, Neon connection, Swagger, commands, and troubleshooting |
| [System architecture](architecture/WHITEPLATE_SYSTEM_ARCHITECTURE.md) | Current runtime and proposed system boundaries |
| [Backend architecture](architecture/WHITEPLATE_BACKEND_ARCHITECTURE.md) | Project references, request paths, and test layout |
| [Frontend architecture](architecture/WHITEPLATE_FRONTEND_ARCHITECTURE.md) | Routing, localization, rendering, and component map |
| [Frontend implementation conventions](architecture/frontend-conventions.md) | Enforced UI, type, module, request and query boundaries |
| [Technology stack](architecture/technology_stack.md) | Wired dependencies versus installed or proposed tools |
| [Coding standards](coding-standards.md) | Rules for extending this codebase |
| [API contracts](api/api-contracts.md) | Organization, staff, tenant, catalog, checkout, orders and SignalR routes |
| [Database design](database/database-schema.md) | Current organization/tenant/catalog/order/idempotency/outbox schema and remaining design notes |
| [Tenant isolation and security](architecture/tenancy-and-security.md) | Trust boundaries, membership authorization and deployment requirements |
| [Authentication decision](architecture/decisions/0002-authentication.md) | Better Auth, JWT/API boundary, email binding, and migration ownership |
| [Catalog localization and tenant domain decision](architecture/decisions/0003-catalog-localization-and-tenant-domain-policy.md) | Restaurant-configurable menu languages and first-release one-label subdomain policy; database rollout remains pending |
| [Localized order snapshots decision](architecture/decisions/0004-localized-order-snapshots.md) | Implemented checkout locale and historical product/option label behavior; production rollout remains separate work |
| [Functional test plan](functional-test-plan.md) | Executable smoke checks and future acceptance criteria |
| [Development roadmap](development-roadmap.md) | Implemented backend scope and unresolved frontend/deployment decisions |
| [Documentation review](documentation-review.md) | Audit findings, verification evidence, and remaining blockers |
| [Root agent instructions](../AGENTS.md) | Working rules for development agents |
| [API agent instructions](../apps/api/AGENTS.md) | Scoped backend project and test rules |
| [Frontend README](../apps/frontend/README.md) | Frontend package entry point |
| [API README](../apps/api/WhitePlate.Api/README.md) | API project entry point |

## Status and source of truth

- **Implemented** means source/configuration is wired into a runnable app. It does not imply production readiness or complete test coverage.
- **Installed, unused** means a dependency exists in a manifest/lockfile but no feature integrates it.
- **Proposed** means a design recommendation for future work, not an available endpoint, schema, or approved product requirement.
- **Open** means a choice must be resolved and recorded before the dependent feature is implemented.

For current behavior, source files and checked-in configuration take precedence over prose. `apps/frontend/package.json` specifies requested dependency versions and scripts; its lockfile records resolved versions. The API project file specifies the target framework and NuGet references. Generated files and installed dependency folders are inspection aids, not files to maintain by hand.

For intended behavior, use the proposed contract, schema, and acceptance plan together. If they disagree, resolve the conflict before implementing it. A library's presence is not a decision to use all of its features.

## Keeping documentation current

Update the relevant documents with changes to commands, routes, ports, dependencies, environment variables, trust boundaries, or data models. Link to one canonical explanation rather than copying it into every guide. Keep examples valid, fence code blocks, and use relative links within repository Markdown.

When settling an open architecture decision, record its date, status, context, choice, alternatives, consequences, and affected documents in a new decision note under `docs/architecture/decisions/` (create that directory when the first decision is made). Until then, use the [open-decision register](development-roadmap.md).
