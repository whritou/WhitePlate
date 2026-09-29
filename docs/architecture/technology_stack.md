# Technology stack and implementation status

Reviewed on 2026-09-29. Package manifests and the frontend lockfile are the source of truth for versions; this table describes integration status.

## Active dependencies

| Area | Technology | Evidence / role |
| --- | --- | --- |
| Web framework | Next.js 16.3.4, React/React DOM 19.2.8 | Frontend manifest, App Router pages |
| Language | TypeScript, strict mode | `apps/frontend/tsconfig.json` |
| Localization | next-intl | Plugin, Proxy, request config, en/fr catalogs |
| Styling | Tailwind CSS 4, PostCSS, tw-animate-css, shadcn styles | Global stylesheet and PostCSS config |
| UI primitives | Base UI, class-variance-authority, cn | Button and class-name utilities |
| Theme | next-themes | Client theme provider |
| API | ASP.NET Core, .NET 10 | `apps/api/WhitePlate.Api/WhitePlate.Api.csproj` and controllers |
| Backend structure | Four .NET projects with inward references | Domain, Application, Infrastructure, API host; restaurant capabilities use these layers |
| Persistence | EF Core 10.0.12, Npgsql EF provider 10.0.3 | Scoped DbContext, six incremental migrations; current schema applied to Neon `test`; SQLite relational tests |
| API description | Microsoft.AspNetCore.OpenApi 10.0.12, Swashbuckle.AspNetCore.SwaggerUI 10.2.3 | OpenAPI JSON and Swagger UI enabled in Development or by configuration |
| Backend tests | xUnit v3, Microsoft Testing Platform, ASP.NET Core MVC Testing | Domain, application, infrastructure, architecture, and API tests in `WhitePlate.Tests` |
| Container tooling | API Dockerfile, Visual Studio container targets | API-only Linux image scaffold; `apps/api` build context |
| Frontend tooling | ESLint 10, TypeScript, Prettier | Package scripts; lint currently fails, see review findings |

The manifest also includes `clsx`, `tailwind-merge`, Lucide, and the shadcn CLI. Some support UI tooling or transitive utilities; their presence is not a business capability.

## Installed but not integrated into features

| Dependency | Intended use | Missing wiring |
| --- | --- | --- |
| Axios | HTTP requests | Configured client, base URL, API calls |
| TanStack Query | Interactive server-state cache | Provider, query keys, queries/mutations |
| Zustand | Local client state | Store, cart persistence and tenant scoping |
| @microsoft/signalr | Frontend kitchen notifications | The API hub/outbox is wired; frontend connection, authentication, and subscription lifecycle are not |
| Vitest | Frontend unit tests | Configuration, files, scripts |
| Playwright | Browser tests | Configuration, files, browser provisioning, scripts |

## Configured per deployment

EF Core and PostgreSQL implement organizations, tenants, catalog, order snapshots, idempotency, and outbox persistence. Six EF migrations are applied to Neon `test`; the generated seventh invitation-email migration is unapplied. Better Auth stores users/sessions/rate limits/JWT keys in a separate CLI-managed PostgreSQL `auth` schema, whose migration is unapplied. Google/Microsoft OAuth, Resend credentials, production issuer/audience and CORS origins need deployment configuration. MediatR, Compose and GitHub Actions remain unimplemented. No deployment host or CI policy is selected in executable configuration.

The ASP.NET Core SignalR server, tenant-authenticated hub, and outbox dispatcher are registered and mapped. The frontend SignalR client package is not integrated into an application flow.

## Toolchain and reproducibility

Use the .NET 10 SDK and Node with npm; the installed Next.js package declares Node >=20.9. This is its minimum engine requirement, not a repository-wide tested version matrix. Root `global.json` selects Microsoft Testing Platform for `dotnet test` but does not pin an SDK version. There is no Node version file, npm `engines`/`packageManager` policy, or root npm workspace. The initial review environment used Node 24.19.0 and .NET SDK 10.0.401.

Use `npm ci` in `apps/frontend` to respect the lockfile. The API has explicit NuGet references but no locked-restore policy. Toolchain pinning and reproducible CI are follow-up decisions in the [roadmap](../development-roadmap.md).

See [development commands](../development.md) and [verification findings](../documentation-review.md) for practical limitations.
