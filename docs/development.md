# Development guide

This guide runs the frontend and .NET API. The frontend includes Better Auth email/password, Google and Microsoft sign-in, verification/reset email, organization signup, email-bound staff invitation flows, owner/manager catalog and discount editing, localized storefront/checkout, and a localized staff kitchen order dashboard. The API validates Better Auth JWTs and retains persisted membership authorization. Neon `test` acceptance covers localized checkout snapshots, catalog editing, owner/manager/kitchen permissions, cross-tenant denial, dashboard revocation recovery, and live outbox/reconnect behavior. The guarded discount-management browser flow and checkout redemption/receipt-history remain separate test-plan scenarios. Vercel-to-Coolify protected API access and production business/auth schema setup are verified; a hosted account, organization, acceptance restaurant and owner-protected kitchen page were exercised over TLS. The operator reports that signed-out and alternate-account visits to the protected restaurant route redirected to `/fr?error=invalid_code`; this hosted access-denial behavior is accepted. Configured Google/Microsoft OAuth and broader real email delivery, hosted SignalR URL/CORS/TLS and token-expiry, Preview isolation, backups, and monitoring remain deployment work.

## Prerequisites and layout

- Supported toolchain: Node.js `^24.19.0` and npm `^11.17.0` (Node 24/npm 11 from those minimum versions, excluding new majors). `.nvmrc` pins Node `24.19.0` for local setup and GitHub Actions; `packageManager` records npm `11.17.0` as the reproducible reference.
- .NET 10 SDK, with `10.0.100` as the minimum feature band and `latestFeature` roll-forward. Root `global.json` also selects Microsoft Testing Platform for `dotnet test`.
- Network access on first install/restore. Frontend builds use system font stacks and do not fetch fonts from Google.

The frontend `.npmrc` keeps `engine-strict=true` to enforce the supported ranges and uses legacy peer resolution because the React plugin currently bundled by Next.js declares ESLint support only through v9. Exact engine pins are unsuitable for Vercel, which automatically rolls minor/patch releases forward within the selected Node major. The flat config wraps Next's plugin configs with ESLint's `@eslint/compat` utility, and lint runs against ESLint 10.
- Docker is optional for the API-only container example. API persistence requires PostgreSQL. PostgreSQL/PgAdmin/Compose are not provisioned by the repository.

Check your shell with `node --version`, `npm --version`, and `dotnet --version`. Prefer the local/CI reference versions above; `npm ci` accepts newer compatible Node 24/npm 11 releases and rejects versions outside the supported ranges. The frontend package is `apps/frontend`; the API host is `apps/api/WhitePlate.Api/WhitePlate.Api.csproj`. Its solution at `apps/api/WhitePlate.slnx` includes Domain, Application, Infrastructure, and backend tests. There is no root npm workspace or runnable root app.

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
| `apps/frontend/next.config.ts` | next-intl plugin; authenticated server actions use `API_BASE_URL` |
| Frontend server environment | `PUBLIC_API_BASE_URL` sets the browser-reachable SignalR hub origin when it differs from server-side `API_BASE_URL` |
| Frontend server environment | `STOREFRONT_BASE_DOMAIN` validates the incoming tenant host; `PUBLIC_TENANT_API_URL_TEMPLATE` supplies a fixed host template such as `http://{tenant}.localhost:5182` for public menu reads |
| `apps/frontend/i18n/routing.ts` | Supported locales and default |
| `apps/frontend/messages/*.json` | Translated interface text |
| `apps/api/WhitePlate.Api/appsettings.json` | Logging, `AllowedHosts: "*"`, and `Tenancy:BaseDomain` (local default `localhost`) |
| `apps/api/WhitePlate.Api/appsettings.Development.json` | Development logging and local Better Auth issuer/audience |
| `apps/api/WhitePlate.Api/Properties/launchSettings.json` | Local URLs and Development environment |
| `apps/frontend/.nvmrc`, package `engines`, and `packageManager` | Exact local/CI references: Node 24.19.0/npm 11.17.0; supported deployment ranges: `^24.19.0`/`^11.17.0` |
| `global.json` | Pins the .NET 10.0.100 feature baseline with latest-feature roll-forward and selects Microsoft Testing Platform |

API persistence needs server-only `ConnectionStrings__WhitePlate`. Set `Tenancy__BaseDomain` to the domain whose immediate subdomains identify tenants. For local storefront routing, set frontend `STOREFRONT_BASE_DOMAIN=localhost` and `PUBLIC_TENANT_API_URL_TEMPLATE=http://{tenant}.localhost:5182`; the base domain must match `Tenancy__BaseDomain`, and the template must use exactly that one tenant label. Production templates must use HTTPS and a wildcard route that reaches the API. These values are server-only and the frontend never forwards an arbitrary Host header. If the browser cannot reach the API at `API_BASE_URL`, set the non-secret `PUBLIC_API_BASE_URL` to its public HTTP(S) origin so the dashboard's SignalR connection can reach `/hubs/orders`; allow the frontend origin in API CORS and use HTTPS in production. Protected routes require `Authentication__Issuer` (Better Auth base URL) and `Authentication__Audience` (same value as frontend `API_AUDIENCE`); production startup fails when either is absent. Browser CORS origins are supplied through `Cors__AllowedOrigins`. Checkout rate limits use `CheckoutRateLimit:PermitLimit`, `CheckoutRateLimit:WindowSeconds`, and `CheckoutRateLimit:QueueLimit`. Swagger is on by default in Development and can be enabled in a deployment with `Swagger__Enabled=true`. Its OpenAPI server is `/`, so browser calls use the Swagger page's HTTPS origin behind a proxy. `GET /health/live` is a dependency-free liveness probe. `GET /health/ready` checks PostgreSQL connectivity with a three-second timeout and returns only a generic status. Set `HttpsRedirection__Enabled=false` when a TLS proxy such as Coolify enforces public HTTPS and redirects. Without an explicit value, the legacy `RENDER=true` default still delegates redirects to Render; otherwise API redirection is enabled. `GET /` and `HEAD /` remain available for service probes. Do not enable blanket forwarded-header trust. See the [Coolify/Vercel runbook](deployment/coolify.md) for the hosted main migration, private API database connection, external auth connection and acceptance gates.

The Neon `WhitePlate` project has a `test` branch and a `neondb` database. The `CatalogLocalization` and `LocalizedOrderSnapshots` EF migrations are applied to the test branch. The separate Better Auth `auth` schema is migrated there. Coolify Production was initialized from a separate empty target. The API's pooled test-branch connection is stored in this machine's .NET User Secrets, outside the repository. The EF history and Better Auth tables were queried after migration. Email/password signup, email verification, organization creation, staff invitation, invitation acceptance, and the accepted invitee's membership were exercised against Neon using local Resend interception and test-only `.invalid` addresses. On 2026-10-06, the operator created and verified one hosted Better Auth account, an organization, and the EUR restaurant `WhitePlate Acceptance Test`. Its Vercel session loaded the organization, completed authenticated server-side `GET /api/v1/me`, and opened the owner-protected restaurant kitchen page over TLS; the page showed no orders. The operator reports that signed-out and alternate-account visits to the protected restaurant route redirected to `/fr?error=invalid_code`; accept this hosted denial behavior without repeating the check. Hosted event delivery and production hub configuration remain open. The Better Auth CLI reports a `rateLimit.lastRequest` type difference (`int8` in PostgreSQL versus `number` expected) on the test schema; review this warning during hosted acceptance.

ASP.NET Core variables override configuration using double underscores. `ASPNETCORE_ENVIRONMENT` controls Development defaults; launch profiles set Development. The host also supports User Secrets for the runtime connection string. EF tooling reads the connection environment variable directly. Never put credentials in source, command arguments, or `NEXT_PUBLIC_*` variables.

## Authentication configuration

Copy `apps/frontend/.env.example` to `apps/frontend/.env.local` and set server-only values for a new checkout. `DATABASE_URL` must point to PostgreSQL with runtime access to the separate `auth` schema; reviewed migrations use an operator credential. For a custom PostgreSQL CA, set server-only `DATABASE_SSL_CA` to its PEM and omit SSL parameters from the URL; the Node client verifies certificates and hostnames. Run `npm run auth:migrate` to create Better Auth's tables; `npm run auth:generate` prints the schema for review. The auth schema is migrated on Neon `test` and Coolify Production. This checkout has an ignored `.env.local` containing only local test-account credentials; its database connection and Better Auth secret remain in `.env`. Coolify Production's Better Auth user lookup and JWKS storage were exercised through Vercel over the configured verified TLS connection on 2026-10-06. The operator later completed a hosted signup and email verification; the signed-in organization flow, protected `/api/v1/me` call, restaurant creation, and owner-protected kitchen route succeeded through the server-side API client. The operator reports that signed-out and alternate-account visits to the kitchen route redirected to `/fr?error=invalid_code`; accept this hosted denial behavior without another check. Configured OAuth/real provider email, hosted SignalR URL/CORS/TLS, and actual token-expiry recovery remain outstanding. Review any SQL/schema target before running migrations against an existing production database; see the [deployment runbook](deployment/coolify.md).

Set Google OAuth redirect URI to `http://localhost:3000/api/auth/callback/google` and Microsoft/Entra redirect URI to `http://localhost:3000/api/auth/callback/microsoft` for local development; use the corresponding HTTPS host in deployment. Configure a verified Resend sender in `RESEND_FROM_EMAIL` and an API key in `RESEND_API_KEY`. The UI hides provider buttons when their credentials are absent in development. Production requires HTTPS URLs, a 32-character Better Auth secret, both OAuth providers, Resend settings, an auth database URL, and API audience/base URL. Better Auth Dashboard integration is enabled when server-only `BETTER_AUTH_API_KEY` is set. Register the frontend's deployed `/api/auth` HTTPS URL in Dashboard, make `BETTER_AUTH_URL` match that host, and redeploy after setting the key. As of 2026-09-30, this project's Vercel Production domain is `white-plate.vercel.app` (with a hyphen), so its Dashboard base URL should be `https://white-plate.vercel.app/api/auth`. Dashboard access still depends on the deployed auth route and database connection working.

The frontend routes include `/[locale]/sign-in`, `/sign-up`, `/forgot-password`, `/reset-password`, `/verify-email`, `/organization/sign-up`, `/organization`, `/organization/team`, `/organization/orders`, and `/invitations/accept`. Its Better Auth endpoint is `/api/auth/*`; the OIDC discovery document and JWKS endpoint are `/.well-known/openid-configuration` and `/api/auth/jwks`. The Next.js server exchanges its authenticated session for a short-lived API JWT. It does not expose the token to browser code except through the verified, exact-origin `POST /api/kitchen/signalr-token` response needed by SignalR; that short-lived token stays in memory. For schema status, see the [database guide](database/database-schema.md#implemented-organization-tenant-catalog-and-order-schema) and [authentication decision](architecture/decisions/0002-authentication.md).

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

Review migration SQL before applying it. The application does not migrate/seed on startup. Use a migration-capable operator credential for schema deployment, then a restricted application credential for runtime. EF migrations on Neon `test` create tenant/organization/staff/catalog/order snapshot tables, idempotency records, the transactional order outbox, invitation recipient email, catalog locale/translation fields, and nullable order locale snapshots. Better Auth separately manages its migrated `auth` schema on `test`. The current Coolify Production business/auth schemas have been applied; review and apply each future migration deliberately, and keep backup/rollback and deployment procedures as operational requirements.

The public organization signup endpoint now creates the first verified-email owner. The `--provision-organization` switch remains for operator migration/backfill and creates an organization and first owner identity from `--name`, `--issuer`, and `--subject`, then exits without opening a listener. Example, using a configured connection string:

```powershell
dotnet run --project apps/api/WhitePlate.Api/WhitePlate.Api.csproj --no-launch-profile -- --provision-organization --name 'WhitePlate Demo' --issuer 'https://YOUR-AUTH-DOMAIN/' --subject 'YOUR-OWNER-SUBJECT'
```

The legacy `--provision-tenant` path remains for local migration/backfill work. Organization self-signup uses the verified Better Auth account; staff invites can be accepted only by that exact verified recipient email. Names are trimmed, 1–200 characters; subdomains normalize to lowercase ASCII DNS labels, 1–63 characters. `www`, `api`, `admin`, `app` are reserved.

Call `http://bistro.localhost:5182/api/v1/tenant`. If local wildcard DNS does not resolve, use `curl.exe --resolve bistro.localhost:5182:127.0.0.1 http://bistro.localhost:5182/api/v1/tenant`. Configure real DNS/TLS and `Tenancy__BaseDomain` for deployment. The API reads the actual Host header; forwarded-host and tenant headers are ignored. This selects public metadata and does not authorize staff. Do not enable forwarded-header trust without a separate proxy design.

Without a connection string, OpenAPI remains available, while routes requiring persistence return a safe 500; invalid tenant hosts return 404 before database access. Missing migrations/database failures are never reported as a missing tenant. Swagger's Authorize button requires a Better Auth JWT minted for the configured issuer/audience.

For later schema changes, run `dotnet ef migrations add NAME --project apps/api/WhitePlate.Infrastructure --output-dir Persistence/Migrations`, inspect generated SQL and add relational tests. Never hand-edit generated snapshots or application startup to silently create a production schema.

## Validation commands

Every UI task must first read and follow the [design system](design-system/README.md) and its delivery checklist. For changes to the reference itself, run `py -3 docs/design-system/verify.py` from the repository root to check defined contrast pairs, palette-table parity and local file links. `--render` also regenerates its static SVG overview from tokens. This documentation tooling does not validate rendered application accessibility or migrate runtime CSS.

From `apps/frontend`:

```sh
npm run lint
npm run test
npm run typecheck
npm run format:check
npm run build
```

After a successful build, `npm run start` serves the production frontend. Lint is a separate command; a build is not proof that lint or behavioral tests passed. `npm run format:check` is read-only and required by CI; `npm run format` rewrites TS/TSX source. Do not run standalone typecheck concurrently with a Next build, which regenerates `.next/types`. Follow [frontend implementation conventions](architecture/frontend-conventions.md) for UI, types, actions, services and query boundaries.

From the repository root:

```sh
dotnet test apps/api/WhitePlate.slnx
dotnet publish apps/api/WhitePlate.Api/WhitePlate.Api.csproj -c Release
```

The xUnit v3 suite uses Microsoft Testing Platform selected in root `global.json` and includes Domain, Application, Infrastructure, project-dependency, and HTTP tests. Use `--no-restore` only when dependencies have already been restored. The frontend Vitest suite covers API requests, query/state primitives, the theme shortcut, and guest cart/checkout boundaries. GitHub Actions runs frontend install, tests, lint, typecheck, production build, and API tests on pushes and pull requests. Root `npm test` deliberately exits with the template's “no test specified” error. See [backend architecture](architecture/WHITEPLATE_BACKEND_ARCHITECTURE.md), [functional checks](functional-test-plan.md), and [verification evidence](documentation-review.md).

## Design system browser verification

The shared theme and controls implement [Porcelaine, encre et sauge](design-system/README.md). `npm run test` includes a canonical light/dark color and radius parity check; changing CSS colors requires updating the reference in the same change. The development-only `/en/design-system-test` and `/fr/design-system-test` routes render actual controls, the workspace shell and kitchen tickets with fixed data. Production returns 404. They do not authorize access to organizations or read a database.

With a local development frontend, run `npm run test:browser -- --project=design-system --project=workspace-toasts --reporter=line`. The first project checks rendered contrast, hover/pressed/disabled/pending states, keyboard focus, FR/EN, both themes, 320/375/768/1024/1440px, 200% text size and reduced motion, plus signed-out sign-in layouts. Use process-local `WHITEPLATE_ACCEPTANCE_URL=http://localhost:3010` to select the port. For the four storefront cases, start the deterministic checkout API and Next routing from the guest fixture instructions below, then set `WHITEPLATE_DESIGN_STOREFRONT_FIXTURE=1`. Those cases explicitly select the menu locale, test invalid discount recovery and complete a fixture order. They are skipped unless opted in. Optional `WHITEPLATE_DESIGN_SCREENSHOTS` supplies an output directory for screenshots of fixed fixture data; no screenshots of credentials or real tenant data are recorded.

These checks complement the design delivery checklist. They do not verify hosted deployment or authenticated catalog/team/database flows.

The orders kanban has a separate development-only fixture at `/en/orders-kanban-test` and `/fr/orders-kanban-test`; production returns 404. Run `npm run test:browser -- --project=orders-kanban --reporter=line` against the local development frontend (set `WHITEPLATE_ACCEPTANCE_URL` to its localhost port when needed). It uses fixed orders and a delayed in-memory mutation, without authentication or database reads/writes. Coverage includes next-step actions, permitted and rejected mouse/touch drops, owner cancellation, Escape, pending guards, rejected-save feedback, focus restoration, Base UI tab keyboard navigation, FR/EN, light/dark and 320–1440px layouts. The separate staff project verifies authenticated persistence and authorization; the fixture is not evidence of hosted behavior.

## Restaurant browser acceptance

The restaurant creation browser test uses the existing verified `.invalid` local account and the documented Neon `test` database. Start the API HTTP profile and the frontend on port 3000 with process-local `API_BASE_URL=http://localhost:5182` and `PUBLIC_API_BASE_URL=http://localhost:5182`. From `apps/frontend`, run `npm run test:browser -- tests/browser/restaurant-creation.spec.ts --reporter=line`. Playwright uses installed Chrome in headless mode; it loads the existing local environment without printing passwords or tokens and rejects a non-localhost browser target. The test signs in, creates a named acceptance organization/restaurant, verifies GBP and normalized subdomain submission, and checks French duplicate-subdomain feedback. Test-only data is retained for subsequent catalog/dashboard acceptance. Non-secret fixture IDs go in ignored `.acceptance/restaurant.json`; traces, screenshots and video are disabled so credentials are not captured. Do not run this test against production.

## Guest checkout browser fixture

The storefront uses the existing server-only tenant API template for both menu reads and checkout. No extra environment variables or schema changes are needed for guest cart/checkout. The browser keeps the cart and receipt only in component memory; checkout derives the API target from actual Host and validates same-origin requests. Guests behind the BFF can share the API's per-tenant remote-address rate bucket; a trusted production proxy/edge-rate design remains operational work.

To reproduce browser acceptance without touching PostgreSQL, run these commands from `apps/frontend` in two separate PowerShell terminals. First start the deterministic fixture:

```powershell
node tests/fixtures/checkout-api.mjs
```

Then start Next.js with process-local test routing:

```powershell
$env:STOREFRONT_BASE_DOMAIN = 'localhost'
$env:PUBLIC_TENANT_API_URL_TEMPLATE = 'http://{tenant}.localhost:5189'
$env:NODE_OPTIONS = '--require ./tests/fixtures/localhost-dns.cjs'
node node_modules/next/dist/bin/next dev --webpack --port 3010 --hostname 127.0.0.1
```

Open `http://bistro.localhost:3010/en` or `/fr`; `harbor.localhost:3010` is a separate tenant fixture. Choose the required bread option, add Soup, edit/remove quantities, and switch menu language. `LUNCH` applies a fixture discount; another nonempty code returns validation failure. Customer name `LOST_RESPONSE` stores one order then drops the first response; retry returns that same receipt. `RATE_LIMIT` rejects the first attempt with 429, and `CONFLICT` returns 409. `http://127.0.0.1:5189/__results` exposes write/replay/conflict counts without request payloads. The fixture only supports these deterministic cases and is not a replacement for real API/database acceptance. Stop both processes and close the test shell afterward. Never load the fixture DNS module or deploy the fixture server in production.

## Optional API container

These commands describe the API Dockerfile; container execution has not been verified because Docker was unavailable in the review environment. Run from the repository root with Docker available:

```sh
docker build -f apps/api/WhitePlate.Api/Dockerfile -t whiteplate-api:local apps/api
docker run --rm -p 127.0.0.1:8080:8080 -e ASPNETCORE_HTTP_PORTS=8080 whiteplate-api:local
```

The build context must be `apps/api` because the Dockerfile copies the API host and its sibling Domain, Application, and Infrastructure projects. `apps/api/.dockerignore` excludes generated output and tests. The image uses .NET 10 SDK/runtime stages. OpenAPI is Development-only and is absent under the default Production environment. For local inspection only, add `-e ASPNETCORE_ENVIRONMENT=Development` to the run command.

The image does not configure HTTPS or provision a certificate. A production deployment needs an explicit TLS/reverse-proxy and trusted-forwarding design. There is no full-stack Compose command.

## Troubleshooting

### Catalog browser acceptance

After the restaurant creation browser test has saved `.acceptance/restaurant.json`, set `$env:WHITEPLATE_ACCEPTANCE_DATABASE='neon-test'` only after confirming `DATABASE_URL` targets the documented non-production test branch. With the same local frontend/API, run this from `apps/frontend`: `npm run test:browser -- tests/browser/catalog-management.spec.ts tests/browser/discount-management.spec.ts --no-deps --reporter=line`. The `test:browser` script invokes the installed Playwright CLI, and both spec paths are relative to `apps/frontend`. The catalog test creates named categories and products, persists price/tax/order/availability edits, checks French feedback and archive cancellation/confirmation, then reloads archived history. The discount test creates fixed and percentage codes, edits a discount without exposing its immutable code, verifies cancellation, and deactivates only the codes it creates. Fixture rows remain on Neon `test`; catalog rows are archived. Discount redemption, totals and tax rounding, tenant isolation, and receipt snapshots are separate real checkout acceptance work.

### Staff dashboard browser acceptance

Set the local API's process-only `Cors__AllowedOrigins__0=http://localhost:3000` before starting it. Explicitly set `$env:WHITEPLATE_ACCEPTANCE_DATABASE='neon-test'` after confirming `DATABASE_URL` selects the documented test branch. From `apps/frontend`, `npm run test:browser -- --reporter=line` runs the configured Playwright projects in dependency order, with one worker. A focused project run with `--no-deps` uses the existing ignored fixture instead; otherwise Playwright runs prerequisite projects first.

The staff helper creates verified `.invalid` users directly in the test auth schema with random in-memory passwords, signs in through the real auth endpoint, and grants manager/kitchen memberships through email-bound API invitations. No email is sent. It provisions another test restaurant for foreign-membership isolation and uses real checkout/status APIs. Cleanup removes only its generated identities' restaurant memberships and auth sessions; test users, organizations, restaurants, catalog and orders remain for audit. Interrupting the process can bypass cleanup, so inspect those test identity IDs before another run. Traces, videos and automatic screenshots stay disabled.

The staff test exercises role controls and actual owner/manager/kitchen transitions, conditional stale-version rejection/reload, manager catalog creation, kitchen catalog denial, two-tenant read/write denial, English/French copy, and membership revocation during an open dashboard. REST polling detects revocation within 30 seconds and removes tickets/filters. The manager's hub is deliberately disconnected during the stale-version scenario.

For real-time acceptance alone, run `npm run test:browser -- --project=realtime --no-deps --reporter=line` with the same guard and services. `order-realtime.spec.ts` opens four actual SignalR clients, uses the authenticated same-origin token route, checks exact local CORS, two-tenant joins/events, persisted dispatch, same-event duplicate deduplication, retry after a deliberately malformed test payload, fresh-token reconnect/REST recovery and membership removal with an open kitchen socket. Only a newly created test event is changed for retry simulation; its payload is restored in `finally`. The test must not run against production. The publisher now rechecks membership before delivery; this is separate from REST polling. Polling failures log a safe operation name and exception type; the historical 2026-10-04 `InvalidOperationException` did not reproduce on 2026-10-05. Hosted Coolify URL/CORS/TLS and actual token-expiration recovery remain separate verification work.

Vercel selects a Node major and manages its minor/patch releases. Configure the frontend root as `apps/frontend`, use Node **24.x**, and use the checked-in lockfile (`npm ci`) when configuring an install command. The package engine ranges accept Vercel's Node 24.21.0/npm 11.19.0 pair. Keep engine validation enabled; do not work around `EBADENGINE` using `--force` or `engine-strict=false`. When toolchain references change, regenerate the lockfile with npm and verify the supported ranges. See [Vercel Node versions](https://vercel.com/docs/functions/runtimes/node-js/node-js-versions) and [package manager selection](https://vercel.com/docs/package-managers).

| Symptom | What to check |
| --- | --- |
| Root `npm run dev` fails | Run inside `apps/frontend`; root scripts do not orchestrate apps |
| `dotnet test` reports a VSTest/Microsoft Testing Platform mismatch | Run from the repository root so `global.json` selects Microsoft Testing Platform; keep the test runner and xUnit packages aligned |
| `npm` is not recognized but `node` works | Install the pinned Node.js distribution, which includes npm, or use a version manager that reads `apps/frontend/.nvmrc`; open a new shell after setup |
| Typecheck mentions missing generated Next types | Run the installed Next type-generation command (`node node_modules/next/dist/bin/next typegen`) from the frontend, then re-run typecheck; do not edit `.next` types |
| ESLint throws `contextOrFilename.getFilename is not a function` | Check that the lockfile is installed with `npm ci`; the flat config adapts the legacy React plugin rule context used by Next.js's current config |
| Turbopack fails while spawning Node with Windows error 5 | The standard development and production scripts use Webpack because the local Windows environment denied Turbopack worker startup. If you opt into Turbopack, check runtime executable access and execution policy; a Webpack success rules out neither every bundler issue nor a Turbopack-specific defect. |
| Font download failure | Builds use system font stacks and do not request remote font files; check other network-dependent build steps if this persists |
| `Failed to decrypt private key` | The current `BETTER_AUTH_SECRET` cannot decrypt the selected key in `auth.jwks`; restore the original secret or rotate keys only on a confirmed test database. Do not reset the whole database or disable private-key encryption as a quick fix. |
| API bearer returns `401` after key rotation | Keep the frontend running so OIDC discovery and JWKS are available; retry after the API refreshes signing keys. Check issuer and audience if it persists. |
| API HTTPS certificate error | Check the development certificate and selected launch profile; do not disable certificate validation globally |
| API response ends prematurely in a restricted Windows shell | Inspect logs for denied `.NET Runtime` Event Log access. The review's normal-permission rerun succeeded; do not confuse the logger failure with endpoint behavior |
| `/swagger` returns 404 | Only `/openapi/v1.json` is mapped, and only in Development |
| `/api/v1/menu` returns 404 | Check `Tenancy:BaseDomain`, then request the API using exactly one active restaurant subdomain under that base domain (for example `bistro.localhost` for local development). The API deliberately returns 404 for an unknown, inactive, nested, or foreign-domain tenant host |
| Browser API requests fail cross-origin | Dashboard and protected frontend actions use the server-side BFF/API client. For browser SignalR, check `PUBLIC_API_BASE_URL` is browser-reachable and `Cors:AllowedOrigins` contains the exact frontend origin; the API does not trust tenant headers or unconfigured forwarded-host values |
| Changing browser language has no effect | Explicit locale path or locale cookie can take precedence |

Run frontend commands from `apps/frontend`. GitHub Actions is the clean-install reference for `npm ci` and the full set of frontend/API checks; local package CLI invocations do not replace that workflow.

## Before submitting changes

Inspect Git status and preserve pre-existing work. The initial review found the entire project untracked and no commits; do not infer that untracked application files are disposable. Root `.gitignore` now excludes generated .NET output and IDE user state, while the frontend has its own scoped ignore file. Review staged content before the initial commit.

Update affected contracts, architecture, and test scenarios. Report the checks actually run, their outcomes, and remaining blockers rather than treating proposed scenarios as passing tests.

### Catalog and translation design fixture

With the frontend development server running locally, run `npm run test:browser -- --project=catalog-design`. Set `WHITEPLATE_ACCEPTANCE_URL=http://localhost:3012` when using that port. `/fr/catalog-design-test` displays the catalog; add `?view=languages` for menu languages/translations. The route is unavailable in production. Tests cover both locales/themes, 320–1440 px layouts, keyboard/focus, nested dialogs, cancellation, archived/inactive controls, and synthetic rejected/acknowledged saves. These tests do not prove API/database persistence. Optional `WHITEPLATE_DESIGN_SCREENSHOTS` writes review screenshots to the supplied directory.