# Development guide

This guide runs the frontend and .NET API. The frontend now includes Better Auth email/password, Google and Microsoft sign-in, verification/reset email, organization signup, and email-bound staff invitation flows. The API validates Better Auth JWTs and retains persisted membership authorization. Test schemas and the local email/password invitation flow are verified on Neon `test`; provider credentials, real email/browser acceptance, production domain/TLS/CORS, and production schema rollout remain deployment work.

## Prerequisites and layout

- Node.js and npm on PATH. Next.js currently declares Node >=20.9; the repository has no pinned Node/npm policy. Use a supported runtime compatible with all installed tools, not just Next.js's minimum.
- .NET 10 SDK for the API. Root `global.json` selects Microsoft Testing Platform for `dotnet test`; it does not pin an SDK feature band.
- Network access on first install/restore. The frontend imports Google fonts during compilation and may need external font access.
- Docker is optional for the API-only container example. API persistence requires PostgreSQL. PostgreSQL/PgAdmin/Compose are not provisioned by the repository.

Check your shell with `node --version`, `npm --version`, and `dotnet --version`. The frontend package is `apps/frontend`; the API host is `apps/api/WhitePlate.Api/WhitePlate.Api.csproj`. Its solution at `apps/api/WhitePlate.slnx` includes Domain, Application, Infrastructure, and backend tests. There is no root npm workspace or runnable root app.

## Install and run

Frontend, in its own terminal:

```sh
cd apps/frontend
npm ci
npm run dev
```

Open [English](http://localhost:3000/en) or [French](http://localhost:3000/fr). `/` negotiates the locale. Explicit locale paths override the remembered locale; a cookie can override `Accept-Language` on unprefixed requests. Use a fresh browser session for language-negotiation tests.

API, from the repository root in another terminal:

```sh
dotnet restore apps/api/WhitePlate.slnx
dotnet run --project apps/api/WhitePlate.Api/WhitePlate.Api.csproj --launch-profile http
```

Visit [Swagger UI](http://localhost:5182/swagger) to inspect and call the API, or open [OpenAPI JSON](http://localhost:5182/openapi/v1.json). Swagger is enabled automatically in Development. The localized auth and organization pages use Next.js server actions as a BFF for protected API calls. Stop either server with Ctrl+C in its terminal.

For HTTPS, trust the development certificate if needed, then select the HTTPS profile:

```sh
dotnet dev-certs https --trust
dotnet run --project apps/api/WhitePlate.Api/WhitePlate.Api.csproj --launch-profile https
```

Certificate trust may require an OS prompt and platform-specific setup. Trust local development certificates only for local work.

| Listener | Configuration | Notes |
| --- | --- | --- |
| Frontend `http://localhost:3000` | Next development default | Check terminal if port is busy; override with `npm run dev -- --port 3001` |
| API `http://localhost:5182` | `http` and `https` launch profiles | `Program.cs` enables HTTPS redirection |
| API `https://localhost:7283` | `https` launch profile | Requires a usable local certificate |
| Container HTTP `8080` | API image and run command below | Container ports are independent of launch-profile ports |

An HTTP-only API run may warn that it cannot determine the HTTPS port. This does not mean authentication is enabled. If using the HTTPS profile, call the HTTPS URL directly to avoid confusing redirects.

## Configuration

| Source | Current purpose |
| --- | --- |
| `apps/frontend/next.config.ts` | next-intl plugin; server actions use `API_BASE_URL` |
| `apps/frontend/i18n/routing.ts` | Supported locales and default |
| `apps/frontend/messages/*.json` | Translated interface text |
| `apps/api/WhitePlate.Api/appsettings.json` | Logging, `AllowedHosts: "*"`, and `Tenancy:BaseDomain` (local default `localhost`) |
| `apps/api/WhitePlate.Api/appsettings.Development.json` | Development logging and local Better Auth issuer/audience |
| `apps/api/WhitePlate.Api/Properties/launchSettings.json` | Local URLs and Development environment |
| `global.json` | Selects Microsoft Testing Platform for .NET 10 test runs; does not pin SDK version |

API persistence needs server-only `ConnectionStrings__WhitePlate`. Set `Tenancy__BaseDomain` to the domain whose immediate subdomains identify tenants. Protected routes require `Authentication__Issuer` (Better Auth base URL) and `Authentication__Audience` (same value as frontend `API_AUDIENCE`); production startup fails when either is absent. Browser CORS origins are supplied through `Cors__AllowedOrigins`. Checkout rate limits use `CheckoutRateLimit:PermitLimit`, `CheckoutRateLimit:WindowSeconds`, and `CheckoutRateLimit:QueueLimit`. Swagger is on by default in Development and can be enabled in a deployment with `Swagger__Enabled=true`. Its OpenAPI server is `/`, so browser calls use the Swagger page's HTTPS origin behind a proxy. On Render (`RENDER=true`), the API leaves HTTP-to-HTTPS redirection to Render's TLS proxy; `GET /` and `HEAD /` return 200 for service probes. For other hosts, configure forwarded headers and HTTPS redirection to match their proxy setup.

The Neon `WhitePlate` project has a `test` branch and a `neondb` database. All seven EF migrations, including `StaffInvitationRecipientEmail`, are applied to the test branch as of 2026-09-29; the separate Better Auth `auth` schema is also migrated there. Production was not changed. The API's pooled test-branch connection is stored in this machine's .NET User Secrets, outside the repository. The EF history and Better Auth tables were queried after migration. Email/password signup, email verification, organization creation, staff invitation, invitation acceptance, and the accepted invitee's membership were exercised against this database using a local Resend interception and test-only `.invalid` addresses. OAuth providers, real email delivery, browser acceptance, and production setup remain unverified. The branch now contains test-only signup and organization/membership records from that flow; no production data was changed. The Better Auth CLI reports a `rateLimit.lastRequest` type difference (`int8` in the database versus `number` expected); signup succeeded, but this warning should be reconciled before production rollout.

ASP.NET Core variables override configuration using double underscores. `ASPNETCORE_ENVIRONMENT` controls Development defaults; launch profiles set Development. The host also supports User Secrets for the runtime connection string. EF tooling reads the connection environment variable directly. Never put credentials in source, command arguments, or `NEXT_PUBLIC_*` variables.

## Authentication configuration

Copy `apps/frontend/.env.example` to `apps/frontend/.env.local` and set server-only values for a new checkout. `DATABASE_URL` must point to PostgreSQL with permission to create/use the separate `auth` schema. Run `npm run auth:migrate` to create Better Auth's tables; `npm run auth:generate` prints the schema for review. The auth schema is migrated on the Neon test branch. This checkout has an ignored `.env.local` containing only local test-account credentials; its database connection and Better Auth secret remain in `.env`. Production migration and credentials remain separate deployment work. Do not run the auth migration against production until its SQL/schema target has been reviewed.

Set Google OAuth redirect URI to `http://localhost:3000/api/auth/callback/google` and Microsoft/Entra redirect URI to `http://localhost:3000/api/auth/callback/microsoft` for local development; use the corresponding HTTPS host in deployment. Configure a verified Resend sender in `RESEND_FROM_EMAIL` and an API key in `RESEND_API_KEY`. The UI hides provider buttons when their credentials are absent in development. Production requires HTTPS URLs, a 32-character Better Auth secret, both OAuth providers, Resend settings, an auth database URL, and API audience/base URL. Better Auth Dashboard integration is enabled when server-only `BETTER_AUTH_API_KEY` is set. Register the frontend's deployed `/api/auth` HTTPS URL in Dashboard, make `BETTER_AUTH_URL` match that host, and redeploy after setting the key. As of 2026-09-30, this project's Vercel Production domain is `white-plate.vercel.app` (with a hyphen), so its Dashboard base URL should be `https://white-plate.vercel.app/api/auth`. Dashboard access still depends on the deployed auth route and database connection working.

The frontend routes are `/[locale]/sign-in`, `/sign-up`, `/forgot-password`, `/reset-password`, `/verify-email`, `/organization/sign-up`, `/organization`, `/organization/team`, and `/invitations/accept`. Its Better Auth endpoint is `/api/auth/*`; the OIDC discovery document and JWKS endpoint are `/.well-known/openid-configuration` and `/api/auth/jwks`. The Next.js server exchanges its authenticated session for a short-lived API JWT; it does not expose that token to browser code. For schema status, see the [database guide](database/database-schema.md#implemented-organization-tenant-catalog-and-order-schema) and [authentication decision](architecture/decisions/0002-authentication.md).

For local Swagger calls, use the verified `local-tester@whiteplate.invalid` account. Its generated password is stored only in the ignored `apps/frontend/.env.local`. Start both services, then run `npm run auth:dev-token` from `apps/frontend`. Paste the printed JWT into Swagger's **Authorize** Bearer field (without the `Bearer ` prefix) and call `GET /api/v1/me` to verify it. Tokens expire after 15 minutes; run the command again when needed. The command signs in through Better Auth using `WHITEPLATE_DEV_EMAIL` and `WHITEPLATE_DEV_PASSWORD`; it runs only with a localhost Better Auth URL and does not add a password endpoint to the .NET API. This identity has no organization or restaurant roles until they are created through the normal app flows. On 2026-09-30, the test branch's old encrypted signing key was retained, a new key was minted with the current secret, and this token passed `GET /api/v1/me` with HTTP 200.

## Tenant database and local provisioning

For a local Neon-connected run, save the pooled application URL in User Secrets from the API project, then open Swagger at `http://localhost:5182/swagger`. This machine already has the test-branch value saved; the command is included for another checkout:

```powershell
dotnet user-secrets set "ConnectionStrings:WhitePlate" "<Neon pooled connection string>" --project apps/api/WhitePlate.Api/WhitePlate.Api.csproj
dotnet user-secrets set "Tenancy:BaseDomain" "localhost" --project apps/api/WhitePlate.Api/WhitePlate.Api.csproj
dotnet run --project apps/api/WhitePlate.Api/WhitePlate.Api.csproj --launch-profile http
```

Use Neon's direct, non-`-pooler` endpoint for EF migration commands. Review SQL and test generated migrations on the Neon test branch before scheduling any production change.

For a separate local PostgreSQL database, set the connection string through your shell/secret manager; this example is a placeholder, not a working credential:

```powershell
$env:ConnectionStrings__WhitePlate = 'Host=localhost;Database=whiteplate;Username=YOUR_USER;Password=YOUR_PASSWORD'
$env:Tenancy__BaseDomain = 'localhost'
dotnet tool restore
dotnet ef migrations script --idempotent --project apps/api/WhitePlate.Infrastructure
dotnet ef database update --project apps/api/WhitePlate.Infrastructure
dotnet run --project apps/api/WhitePlate.Api --no-launch-profile -- --provision-tenant --name 'Bistro' --subdomain bistro
dotnet run --project apps/api/WhitePlate.Api --launch-profile http
```

Review migration SQL before applying it. The application does not migrate/seed on startup. Use a migration-capable operator credential for schema deployment, then a restricted application credential for runtime. The seven EF migrations on Neon `test` create tenant/organization/staff/catalog/order snapshot tables, idempotency records, the transactional order outbox, and invitation recipient email. Better Auth separately manages its migrated `auth` schema on `test`. Production migration rollout, backup/rollback, and deployment remain operational decisions.

The public organization signup endpoint now creates the first verified-email owner. The `--provision-organization` switch remains for operator migration/backfill and creates an organization and first owner identity from `--name`, `--issuer`, and `--subject`, then exits without opening a listener. Example, using a configured connection string:

```powershell
dotnet run --project apps/api/WhitePlate.Api/WhitePlate.Api.csproj --no-launch-profile -- --provision-organization --name 'WhitePlate Demo' --issuer 'https://YOUR-AUTH-DOMAIN/' --subject 'YOUR-OWNER-SUBJECT'
```

The legacy `--provision-tenant` path remains for local migration/backfill work. Organization self-signup uses the verified Better Auth account; staff invites can be accepted only by that exact verified recipient email. Names are trimmed, 1–200 characters; subdomains normalize to lowercase ASCII DNS labels, 1–63 characters. `www`, `api`, `admin`, `app` are reserved.

Call `http://bistro.localhost:5182/api/v1/tenant`. If local wildcard DNS does not resolve, use `curl.exe --resolve bistro.localhost:5182:127.0.0.1 http://bistro.localhost:5182/api/v1/tenant`. Configure real DNS/TLS and `Tenancy__BaseDomain` for deployment. The API reads the actual Host header; forwarded-host and tenant headers are ignored. This selects public metadata and does not authorize staff. Do not enable forwarded-header trust without a separate proxy design.

Without a connection string, OpenAPI remains available, while routes requiring persistence return a safe 500; invalid tenant hosts return 404 before database access. Missing migrations/database failures are never reported as a missing tenant. Swagger's Authorize button requires a Better Auth JWT minted for the configured issuer/audience.

For later schema changes, run `dotnet ef migrations add NAME --project apps/api/WhitePlate.Infrastructure --output-dir Persistence/Migrations`, inspect generated SQL and add relational tests. Never hand-edit generated snapshots or application startup to silently create a production schema.

## Validation commands

From `apps/frontend`:

```sh
npm run lint
npm run test
npm run typecheck
npm run build
```

After a successful build, `npm run start` serves the production frontend. Lint is a separate command; a build is not proof that lint or behavioral tests passed. `npm run format` writes all matching TS/TSX files. For a focused formatting change, invoke the installed Prettier on the touched files instead.

From the repository root:

```sh
dotnet test apps/api/WhitePlate.slnx
dotnet publish apps/api/WhitePlate.Api/WhitePlate.Api.csproj -c Release
```

The xUnit v3 suite uses Microsoft Testing Platform selected in root `global.json` and includes Domain, Application, Infrastructure, project-dependency, and HTTP tests. Use `--no-restore` only when dependencies have already been restored. The frontend Vitest suite currently covers the API request factory. There is no CI workflow. Root `npm test` deliberately exits with the template's “no test specified” error. See [backend architecture](architecture/WHITEPLATE_BACKEND_ARCHITECTURE.md), [functional checks](functional-test-plan.md), and the [earlier review baseline](documentation-review.md).

## Optional API container

These commands describe the API Dockerfile; container execution has not been verified because Docker was unavailable in the review environment. Run from the repository root with Docker available:

```sh
docker build -f apps/api/WhitePlate.Api/Dockerfile -t whiteplate-api:local apps/api
docker run --rm -p 127.0.0.1:8080:8080 -e ASPNETCORE_HTTP_PORTS=8080 whiteplate-api:local
```

The build context must be `apps/api` because the Dockerfile copies the API host and its sibling Domain, Application, and Infrastructure projects. `apps/api/.dockerignore` excludes generated output and tests. The image uses .NET 10 SDK/runtime stages. OpenAPI is Development-only and is absent under the default Production environment. For local inspection only, add `-e ASPNETCORE_ENVIRONMENT=Development` to the run command.

The image does not configure HTTPS or provision a certificate. A production deployment needs an explicit TLS/reverse-proxy and trusted-forwarding design. There is no full-stack Compose command.

## Troubleshooting

| Symptom | What to check |
| --- | --- |
| Root `npm run dev` fails | Run inside `apps/frontend`; root scripts do not orchestrate apps |
| `dotnet test` reports a VSTest/Microsoft Testing Platform mismatch | Run from the repository root so `global.json` selects Microsoft Testing Platform; keep the test runner and xUnit packages aligned |
| `npm` is not recognized but `node` works | The shell may expose an isolated Node runtime without npm. Configure a complete Node/npm installation on PATH and reopen the shell |
| Typecheck mentions missing generated Next types | Run the installed Next type-generation command (`node node_modules/next/dist/bin/next typegen`) from the frontend, then re-run typecheck; do not edit `.next` types |
| ESLint throws `contextOrFilename.getFilename is not a function` | Baseline failure inside the React plugin with the installed ESLint 10 toolchain; align compatible versions in a separate dependency fix, then rerun lint |
| Turbopack fails while spawning Node with Windows error 5 | Check runtime executable access and execution policy/environment restrictions. For local development, `npm run dev -- --webpack` bypassed this error on 2026-09-30; this is not proof of a CSS syntax error. |
| Font download failure | `next/font/google` needs access to its font resources during compilation; check proxy/network configuration or deliberately migrate to local fonts |
| `Failed to decrypt private key` | The current `BETTER_AUTH_SECRET` cannot decrypt the selected key in `auth.jwks`; restore the original secret or rotate keys only on a confirmed test database. Do not reset the whole database or disable private-key encryption as a quick fix. |
| API bearer returns `401` after key rotation | Keep the frontend running so OIDC discovery and JWKS are available; retry after the API refreshes signing keys. Check issuer and audience if it persists. |
| API HTTPS certificate error | Check the development certificate and selected launch profile; do not disable certificate validation globally |
| API response ends prematurely in a restricted Windows shell | Inspect logs for denied `.NET Runtime` Event Log access. The review's normal-permission rerun succeeded; do not confuse the logger failure with endpoint behavior |
| `/swagger` returns 404 | Only `/openapi/v1.json` is mapped, and only in Development |
| `/api/v1/menu` returns 404 | Business endpoints are proposals and do not exist yet |
| Browser API requests fail cross-origin | No CORS policy or BFF exists. Decide the integration topology before adding requests |
| Changing browser language has no effect | Explicit locale path or locale cookie can take precedence |

If an execution environment supplies Node without npm but dependencies already exist, the current scripts can be inspected with equivalent local CLI entry points: `node node_modules/eslint/bin/eslint.js .`, `node node_modules/typescript/bin/tsc --noEmit`, and `node node_modules/next/dist/bin/next build`, all from `apps/frontend`. This does not replace `npm ci` or validate a fresh installation.

## Before submitting changes

Inspect Git status and preserve pre-existing work. The initial review found the entire project untracked and no commits; do not infer that untracked application files are disposable. Root `.gitignore` now excludes generated .NET output and IDE user state, while the frontend has its own scoped ignore file. Review staged content before the initial commit.

Update affected contracts, architecture, and test scenarios. Report the checks actually run, their outcomes, and remaining blockers rather than treating proposed scenarios as passing tests.
