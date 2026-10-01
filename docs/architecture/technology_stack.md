# Technology stack and implementation status

Reviewed on 2026-10-01 against source and manifests. The package manifest and lockfile remain the source of truth for versions. See [frontend conventions](frontend-conventions.md) for the implemented module boundaries.

## Active dependencies

| Area | Technology | Implemented role |
| --- | --- | --- |
| Web framework | Next.js 16.3.4, React 19.2.8 | App Router; server pages, route handlers and mutation actions |
| Language | Strict TypeScript | Named contracts in `types/`; runtime parsers validate untrusted JSON |
| Localization | next-intl | en/fr interface, independent restaurant menu language |
| Styling | Tailwind CSS 4, PostCSS, tw-animate-css, shadcn styles | Theme tokens and local system fonts |
| UI | shadcn base-lyra, Base UI, class-variance-authority, cn, Lucide | Shared form controls, buttons, cards, feedback and icons |
| Theme | next-themes | Client theme provider and keyboard shortcut |
| Server state | TanStack Query | Account/tenant/view-scoped kitchen queries, action mutations and invalidation |
| Client state | Zustand | Per-provider tenant-selection store; guest cart uses feature-local state |
| Authentication | Better Auth, pg, Kysely | Server sessions, separate PostgreSQL auth schema, OAuth configuration and API JWTs |
| Live notifications | @microsoft/signalr | Kitchen connection, group lifecycle, deduplicated hints and REST recovery |
| Frontend tooling | Vitest, ESLint 10, TypeScript, Prettier | Boundary/regression tests; enforced UI/type/request rules and CI format check |
| API | ASP.NET Core, .NET 10 | API host composing Domain, Application and Infrastructure |
| Persistence | EF Core 10, Npgsql | Tenant/catalog/orders/idempotency/outbox persistence and migrations |
| API description | Microsoft.AspNetCore.OpenApi, Swagger UI | Generated development or explicitly configured OpenAPI |
| Backend tests | xUnit v3, Microsoft Testing Platform | Domain, application, infrastructure, architecture and HTTP tests |
| CI | GitHub Actions | Package-local frontend checks and API solution tests |
| Container tooling | API Dockerfile, Visual Studio container targets | API-only Linux image; no full-stack Compose configuration |

## Installed without a feature integration

| Dependency | Status |
| --- | --- |
| Axios | Installed; current HTTP adapters use fetch and the shared request factory |
| Playwright | Installed; no checked-in browser-test runner/configuration yet; browser acceptance uses documented fixtures and manual automation |

Installed tooling does not imply a new business capability. Do not add a second HTTP or state abstraction merely because its package exists.

## Deployment verification

PostgreSQL and Better Auth schemas have separately documented test-branch migrations. The new CatalogLocalization migration remains unapplied; refer to [development](../development.md) for current setup rather than inferring rollout from a checked-in migration. Live OAuth and real Resend credentials, production issuer/audience, domain/TLS/CORS, and authenticated browser/SignalR acceptance remain separate work. Source wiring and unit tests do not establish production readiness. MediatR and full-stack Compose are not implemented.

## Toolchain and reproducibility

Node.js 24.19.0 and npm 11.17.0 are pinned by `.nvmrc`, package engines/packageManager, and `.npmrc`. Root `global.json` selects a .NET 10 SDK minimum feature band with roll-forward and Microsoft Testing Platform. There is no root npm workspace: run npm commands in `apps/frontend`, use `npm ci` to respect the lockfile, and use explicit .NET solution/project paths. Dev/build select Webpack due to the recorded Windows Turbopack worker limitation. Next's legacy React ESLint plugin is adapted with `@eslint/compat`.

See [development commands](../development.md) and [verification findings](../documentation-review.md) for machine-specific install limitations and actual results. The cleanup did not upgrade dependencies or change the lockfile.
