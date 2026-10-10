# Documentation index

Production availability was restored on 2026-10-10 after correcting unreadable permissions on the API container's mounted public PostgreSQL CA. Health probes, authenticated organization loading, restaurant navigation and the orders page were verified. See the [incident, recovery and mounted-certificate checks](deployment/coolify.md#availability-incident-and-recovery--2026-10-10); older deployment evidence below remains historical.

The approved Lovable design now also covers real workspaces, tenant customer shells and account screens, using the restored ZIP reference. See [real routes, connected operations and explicit fictitious drafts](lovable-live-workspace.md). Existing backend contracts are retained; hosted acceptance remains separate.

[Lovable migration](lovable-migration.md): current landing/demo routes, scoped design, assets, browser-only behavior and backend connections.

M5 galleries are implemented in source: multiple ordered photos, cover selection, independent private drafts/save, guest cards/options gallery and T1 cleanup reuse. See [policies](architecture/decisions/0008-product-photo-gallery.md) and [verification](audits/product-photos.md). Shared migration, actual provider and hosted acceptance remain pending.


Reviewed against the working tree on 2026-10-08. WhitePlate contains the first-release restaurant API, Better Auth account/organization/team flows, owner restaurant creation, owner/manager catalog and discount-code management, localized tenant menu browsing, a tenant-scoped in-memory Zustand guest checkout, capability-protected receipt tracking by the organization Kanban status, a localized staff kitchen dashboard with SignalR refresh hints and REST recovery, and owner/manager order history with daily archival of terminal kitchen orders. Public tracking has source-level frontend/API tests; its additive migration is applied to Coolify Production, while the feature code and hosted tracking acceptance remain pending deployment. Acceptance on the documented test database covers localization, catalog editing, checkout snapshots, owner/manager/kitchen permissions, cross-tenant denial, dashboard revocation recovery, and live outbox retry/delivery/reconnect. The guarded discount-management browser flow and checkout redemption/receipt-history checks remain separate acceptance work. The main Vercel frontend reaches the Coolify API and PostgreSQL. One hosted Better Auth account and organization were created and verified; the session completed protected `GET /api/v1/me`, created an acceptance restaurant, and opened its owner-protected kitchen page over TLS. The operator reports that signed-out and alternate-account visits to the protected restaurant route both redirected to `/fr?error=invalid_code`; treat this hosted access-denial check as complete without repeating it. The operator also reports Production `DATABASE_URL` targets Coolify PostgreSQL over verified TLS using `DATABASE_SSL_CA`, while Preview remains on the old Render database. Whole-environment Preview isolation, public tenant DNS/TLS, hosted event delivery, production hub configuration and operations remain open; see the [Coolify/Vercel runbook](deployment/coolify.md) and project kanban.

The currently recorded Coolify API image (`e13860e`) predates merge `8a2f835` (PR #26), which added the owner-protected team roster and invitation-list endpoints; redeploying the API and verifying those hosted reads remain open.

## Reading order

| Document | Purpose |
| --- | --- |
| [Repository README](../readme.md) | Product intent and quickest path to running the scaffolds |
| [Development guide](development.md) | Setup, configuration, Neon connection, Swagger, commands, and troubleshooting |
| [Coolify/Vercel runbook](deployment/coolify.md) | Empty PostgreSQL bootstrap, separate runtime connections, verified TLS, deployment and rollback gates |
| [System architecture](architecture/WHITEPLATE_SYSTEM_ARCHITECTURE.md) | Current runtime and proposed system boundaries |
| [Backend architecture](architecture/WHITEPLATE_BACKEND_ARCHITECTURE.md) | Project references, request paths, and test layout |
| [Frontend architecture](architecture/WHITEPLATE_FRONTEND_ARCHITECTURE.md) | Routing, localization, rendering, and component map |
| [Frontend implementation conventions](architecture/frontend-conventions.md) | Enforced UI, type, module, request and query boundaries |
| [WhitePlate design system](design-system/README.md) | Canonical Culinary Commerce reference, shared runtime tokens, visual guidance, accessibility and implementation boundaries |
| [Technology stack](architecture/technology_stack.md) | Wired dependencies versus installed or proposed tools |
| [Coding standards](coding-standards.md) | Rules for extending this codebase |
| [API contracts](api/api-contracts.md) | Organization, staff, tenant, catalog, checkout, orders and SignalR routes |
| [Database design](database/database-schema.md) | Current organization/tenant/catalog/order/idempotency/outbox schema and remaining design notes |
| [Tenant isolation and security](architecture/tenancy-and-security.md) | Trust boundaries, membership authorization and deployment requirements |
| [Authentication decision](architecture/decisions/0002-authentication.md) | Better Auth, JWT/API boundary, email binding, and migration ownership |
| [Catalog localization and tenant domain decision](architecture/decisions/0003-catalog-localization-and-tenant-domain-policy.md) | Restaurant-configurable menu languages and first-release one-label subdomain policy; Coolify schema is applied, hosted storefront DNS/TLS remains open |
| [Localized order snapshots decision](architecture/decisions/0004-localized-order-snapshots.md) | Implemented checkout locale and historical product/option label behavior; Coolify Production schema is applied, hosted checkout acceptance remains |
| [Coolify hosting decision](architecture/decisions/0005-coolify-hosting.md) | One hosted development stack, empty new database, existing Neon retained; dev stack deferred |
| [Public order tracking decision](architecture/decisions/0006-public-order-tracking.md) | Expiring capability-based public status tracking and tenant-scoped ephemeral guest checkout |
| [Functional test plan](functional-test-plan.md) | Executable smoke checks and future acceptance criteria |
| [Development roadmap](development-roadmap.md) | Implemented backend scope and unresolved frontend/deployment decisions |
| [Restaurant management backlog](planning/restaurant-management-backlog.md) | Future theming, dashboard, restaurant settings, unified menu/translations and live Kanban tasks with Stitch references and responsive acceptance criteria |
| [Full Stitch redesign handoff](redesign-handoff.md) | Public landing, illustrative screen routes, visual adoption and verification |
| [Landing and demo responsive audit](audits/landing-demo-responsive.md) | Responsive defects, fixes, captured walkthrough and browser verification for the public landing and menu |
| [Frontend interaction and density audit](audits/ui-state-density.md) | Project-wide source findings and contrast evidence for hover/pressed states, readable brand text, category width and shared spacing |
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

## M1 Menu Builder — 2026-10-08

The 9 October menu-manager follow-up replaces the picker/inline editor with a grouped Menu & Categories sidebar entry, separate Menu/Categories tabs (one table each), and a right-side product sheet containing extras, translations and photos. Category creation is available from page actions and product forms; category reassignment and keyboard display-order saves are persisted. Descriptions remain plain text by user decision. See [current evidence and remaining acceptance](audits/menu-manager.md).

The combined catalog/language workspace and persisted category hiding are implemented in source. Local verification and separate remaining shared-database/hosted acceptance are in [M1 evidence](audits/menu-builder.md). The generated visibility migration is not applied to shared environments; other management roadmap cards remain separate.

## T1 brand assets — 2026-10-08

Tenant-owned logo, favicon and banner uploads are wired in source using private S3-compatible storage, normalized images, protected draft previews and explicit per-asset save/removal. The workspace is `/[locale]/organization/theming?tenantId=…`; saved assets reach the public storefront through host-resolved delivery. See the [storage decision](architecture/decisions/0007-brand-media-storage.md), [setup](development.md#brand-media-storage-t1), and [verification evidence](audits/brand-assets.md). Generated media migrations are not applied to shared environments. A real bucket and hosted two-tenant acceptance remain unverified; T2/T3 and product-photo workflows remain separate.

## Workspace regression fixes — 10 October 2026

[Issue #65 evidence](audits/workspace-regressions.md) records light-only appearance, responsive shop/Studio cards, inline category creation, shared history filters/summary/export, demo locale switching, organization/restaurant navigation, restaurant settings entry points and official provider marks.

The [real/demo parity follow-up](audits/live-demo-parity.md) supersedes the earlier menu/table/Sheet layout with four demo tabs, dish cards and an adjacent editor, and restores restaurant Staff navigation, source dashboard sections and Staff tabs. The demo itself is unchanged.
