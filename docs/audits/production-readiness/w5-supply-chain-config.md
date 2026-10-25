# W5 — Supply chain, secrets and configuration

## Scope and method

Audit date 2026-10-25. Audited code is `origin/main` `55f31a5`; this file was written on the audit branch at `8a11be6`, which changes only documentation. W5 covers dependencies, secrets and configuration. W8 owns hosted posture (HOST-01 to HOST-09) and W3 owns the rate-limit keying (PUB-01), so neither is repeated here; this file references them by ID.

Read in full or in the relevant part: `.github/workflows/ci.yml`; `apps/api/WhitePlate.Api/Dockerfile`; `apps/api/.dockerignore`; `.gitignore`; `apps/frontend/.gitignore`, `.npmrc`, `.nvmrc`, `package.json`, `package-lock.json` (parsed with a script, not edited); `apps/frontend/next.config.ts`; `apps/frontend/proxy.ts`; `apps/frontend/lib/auth.ts`; `apps/frontend/lib/auth-database.ts`; `apps/frontend/scripts/dev-token.mjs`; `apps/frontend/.env.example`; `apps/api/WhitePlate.Api/Program.cs`; `Configuration/ServiceRegistration.cs`, `MediaRegistration.cs`, `HmacEmailTrackingCapability.cs`, `AnalyticsPrivacyService.cs`; `appsettings.json` and `appsettings.Development.json`; `global.json`; `dotnet-tools.json`; every `process.env.*` use in `apps/frontend` (grep); `docs/development.md`, `docs/deployment/coolify.md`, `docs/architecture/decisions/0005-coolify-hosting.md`.

Probes and how they were run:

1. **npm audit reachability.** The raw `npm audit --json` from the Task 3 sweep (clean copy at `55f31a5`, Node 24.19.0, npm 11.17.0; raw file stays in the session scratchpad) was parsed again for ranges and advisories. It was not re-run: the lockfile is byte-identical, and a re-run adds nothing to a read-only analysis. Each package was classified production or dev from `package-lock.json` (`dev` flag and a dependency walk from the root `dependencies`). Reachability from shipped code was decided with `grep` over `apps/frontend` for the vulnerable feature (`next/og`, `ImageResponse`, `opengraph-image`, `use cache`, `cacheComponents`, `draftMode`, `unstable_cache`, `remotePatterns`, `next/image`, `"use server"`) and by reading the GitHub advisory pages for GHSA-2464-fhr4-w9xw and GHSA-p3m5-59mp-jv5r (fetched read-only). Nothing was installed or fixed.
2. **Stray artifacts.** `git ls-files` filtered for `TestResults`, `*.csproj.user`, `*.tsbuildinfo`, `apps/api/WhitePlate.Api/apps`, `*.suo`, `.env*`, `.vs/`, `.next`, `coverage`, `*.log`, `*.zip`, `*.pem`, `*.key`, `*.sql`.
3. **Fixture routes.** Not re-run: W8 requested all 12 names in `en` and `fr` against the production frontend and got 24 times 404 (`w8-hosted-posture.md`, probe table and "Fixture routes absent in Production"). This file adds the source and build-side view only (CFG-09).
4. **Runtime probes of the API or frontend.** None. HOST-01 (API 503) blocks hosted API probes; no local server was started for this workstream.

## Findings

### CFG-01 — `next` 16.3.4 has a reachable High DoS (Server Actions) and sits in the range of three Critical advisories

- **Workstream:** W5
- **Location:** `apps/frontend/package.json` (`"next": "16.3.4"`, exact pin; `eslint-config-next` is pinned to the same version); reachable code: the ten `"use server"` modules in `apps/frontend/actions/` (`checkout.ts`, `catalog.ts`, `orders.ts`, `restaurant.ts`, `organization.ts`, `stripe-connect.ts`, `establishment-settings.ts`, `order-email-settings.ts`, `ordering-operations.ts`, `catalog-publication.ts`)
- **Evidence:** `npm audit` flags `next` 16.0.0 to 16.4.0 as critical, fix `next@16.4.3` (not semver-major). Of its eleven advisories, reachability in this application:
  GHSA-p3m5-59mp-jv5r (High, CVSS 8.2, DoS through excessive CPU on crafted requests to App Router Server Actions; affected `<=16.4.0`, patched 16.4.1; "applications ... not using Server Actions are not vulnerable"; no workaround): **reachable**. The app is App Router and has ten action modules, including the anonymous guest checkout action `actions/checkout.ts`.
  GHSA-2464-fhr4-w9xw (Critical, memory flaw in the upstream image library reached through the Image Optimization API with SVG input, glibc Linux; patched 16.4.1; advisory workaround: `sharp` at least 0.35.5): **mitigated and not reachable by the app's inputs**. `package-lock.json` resolves `node_modules/sharp` and every `@img/sharp-*` to 0.35.5 (and `next` asks for `sharp ^0.35.4`). Every `next/image` that goes through the optimizer has a static `/public` source (`components/auth/auth-form.tsx:65`, `:86`; `components/marketing/landing-hero.tsx:78`; and the others); the two components that take user or API-supplied sources set `unoptimized` (`components/brand/asset-image.tsx:31`, `components/product/photo-image.tsx:52`). `next.config.ts` has no `images` block, so no `remotePatterns` and no `dangerouslyAllowSVG`. The one SVG, `/auth/microsoft.svg`, is a static file. The `/_next/image` endpoint still exists on every Next app.
  GHSA-cjq9-62q9-8jv4 (High, SSRF in Image Optimization): not reachable, no `remotePatterns` or `localPatterns`.
  GHSA-vcvr-r3jv-pc5j (Critical, RCE in `next/og` `ImageResponse`): not reachable; no `next/og`, `ImageResponse`, `opengraph-image`, `twitter-image` or `icon` file anywhere in `apps/frontend`.
  GHSA-673q-mjm6-r5xr (Critical, RCE in `use cache` functions returning typed arrays) and GHSA-h694-7cp9-m8p3, GHSA-3w37-wq28-93x7 (moderate `use cache` and Draft Mode leaks): not reachable; no `"use cache"`, `cacheComponents`, `cacheLife` or `draftMode` anywhere in `apps/frontend`.
  GHSA-4jqv-mc3x-m676, GHSA-mcj8-r9mp-w47p (moderate SSG/ISR cache poisoning, "self-hosted applications"): not applicable while the frontend stays on Vercel (Production uses `white-plate.vercel.app`); the app does prerender SSG pages (`app/[locale]/layout.tsx:9` `generateStaticParams`), so a move to self-hosting would make them relevant. GHSA-f87g-xv8r-7p7x (metadata image routes) and GHSA-39w2-rjm5-chcv (dev-server MCP endpoint): not reachable.
  No advisory in the list concerns `proxy.ts` (middleware) bypass, rewrites or authentication, so the audit found no authentication bypass of the protected routes from this dependency. Result: no reachable Critical, so this is not a Blocker.
- **Impact:** An unauthenticated client can send crafted requests to Server Action endpoints and burn CPU in the function instance, degrading checkout and the workspace. Vercel's per-invocation limits may soften the blast radius but are not evidence of safety. Three Critical advisories are present in the installed version even though the app does not reach them; any later use of `next/og`, `use cache` or remote images (a likely next step for a storefront product) would make them reachable.
- **Severity:** Should
- **Fix direction:** Upgrade `next` and `eslint-config-next` to 16.4.3 (the version `npm audit` reports) in a dedicated dependency PR, run lint, typecheck, tests and the build, then re-run `npm audit`. Keep `sharp` at 0.35.5 or later. Until then, apply a request-size and rate limit at the edge for the guest Server Action routes. Add a dependency-audit gate (CFG-07).
- **Regression test:** None
- **Status:** Confirmed

### CFG-02 — `zod` 4.6.5 (High memory-exhaustion advisory) is a runtime dependency of the public auth endpoints

- **Workstream:** W5
- **Location:** `apps/frontend/package-lock.json`: `node_modules/zod` 4.6.5, required by `better-auth` 1.7.6, `@better-auth/core` and `@better-auth/infra` (`apps/frontend/lib/auth.ts:1-3`, `:49`, `:123-125`)
- **Evidence:** GHSA-mrhx-c7xc-m3w5, "Zod can exhaust memory while validating oversized constrained collections", affects `<4.6.6`, fix available. `better-auth` and `@better-auth/core` list `zod ^4.5.4` under `dependencies` (lock `dependencies` sections), and Better Auth validates request bodies of the public `/api/auth/*` routes (`basePath: "/api/auth"`, `auth.ts:52`). Whether any of those request schemas constrains an array, set or map, which the advisory requires, was not checked in the Better Auth source. The second zod copy (`node_modules/shadcn/node_modules/zod` 3.25.76) is covered by CFG-03.
- **Impact:** If an auth schema has a constrained collection, an anonymous request below the platform body limit could exhaust memory in a Vercel function. Unproven; no payload was sent (hosted probes are read-only).
- **Severity:** Should
- **Fix direction:** Update the lockfile to `zod` 4.6.6 or later (a patch-level change within `^4`); check with `npm ls zod` that Better Auth resolves to it. Re-run `npm audit`.
- **Regression test:** None
- **Status:** Suspected

### CFG-03 — Dependency declarations pull dev tooling and an unused package into the production tree

- **Workstream:** W5
- **Location:** `apps/frontend/package.json` `dependencies`: `shadcn` (`^4.21.0`), `axios` (`^1.20.0`); `devDependencies`: `@types/node` (`^20`); `apps/frontend/.npmrc:2` (`legacy-peer-deps=true`); `apps/api/WhitePlate.Api/WhitePlate.Api.csproj` (`Microsoft.VisualStudio.Azure.Containers.Tools.Targets` `1.24.2-preview.1`)
- **Evidence:** `grep` finds no import of `axios` in any `.ts`, `.tsx` or `.mjs` file under `apps/frontend` (outside `node_modules`); the lockfile's only consumer of `axios` is the root package, and `axios` is the only parent of `follow-redirects`. `shadcn` appears in source only as `@import "shadcn/tailwind.css"` in `app/globals.css:3`; it is the component-generator CLI, and its tree brings `@modelcontextprotocol/sdk`, `express`, `body-parser`, `hono`, `undici`, `ajv`/`fast-uri`, `socks`/`ip-address` and a second `zod`. Lock paths: `body-parser <- express <- @modelcontextprotocol/sdk <- shadcn`; `fast-uri <- ajv <- @modelcontextprotocol/sdk <- shadcn`; `ip-address <- socks <- shadcn`; `undici <- shadcn`; `follow-redirects <- axios`. Of the 14 vulnerable packages in the sweep: 7 (`shadcn`, `@modelcontextprotocol/sdk`, `body-parser`, `undici`, `fast-uri`, `hono`, `ip-address`) exist only through `shadcn`; `follow-redirects` only through unused `axios`; `vite`, `vitest` and `@vitest/mocker` carry the lockfile `dev` flag; `source-map-js` is build-time CSS tooling under `next`'s `postcss`. None of these is reachable from request handling, so they are install-surface and audit noise, not exploitable. `@types/node` is `^20` while the toolchain is Node 24. `legacy-peer-deps=true` is documented (`docs/development.md:24`). The API host references a preview, IDE-only package (`Microsoft.VisualStudio.Azure.Containers.Tools.Targets` 1.24.2-preview.1).
- **Impact:** Eight of the 14 audit entries disappear from the production dependency tree (seven through `shadcn`, one through `axios`), and three more are already dev-only, which makes the next real advisory visible. A larger install tree widens exposure to a compromised install-time script. Node 20 types allow APIs that do not match the runtime version.
- **Severity:** Could
- **Fix direction:** Remove `axios`; move `shadcn` to `devDependencies` (Vercel installs dev dependencies for the build); move `@types/node` to `^24`; remove or condition the Visual Studio container tools package. Confirm with `npm ls --omit=dev` and a build. Consider committing NuGet lock files (`RestorePackagesWithLockFile`) so `dotnet restore` in the Dockerfile is reproducible.
- **Regression test:** None
- **Status:** Confirmed

### CFG-04 — Authentication secret falls back to a public constant outside `NODE_ENV=production`, and the production guard checks only length

- **Workstream:** W5
- **Location:** `apps/frontend/lib/auth.ts:53-55` (fallback), `:14-35` (guard); `apps/frontend/.env.example:2`
- **Evidence:** `secret: process.env.BETTER_AUTH_SECRET ?? "whiteplate-local-development-secret-change-before-production"` (the constant is committed in the public repository). The throw at `auth.ts:14` runs only when `process.env.NODE_ENV === "production"`; there the check is "set and at least 32 characters" (`:34-35`). The shipped example value `replace-with-a-random-secret-of-at-least-32-characters` is 54 characters, so copying `.env.example` to a production environment passes the guard with a known secret. `.env.example` is the only tracked env file and holds placeholders; `.env`, `.env.*` and `*.pem` are ignored (`.gitignore:9-11`, `apps/frontend/.gitignore`). Vercel Production and Preview both run with `NODE_ENV=production`, so the fallback is dormant on the documented hosts; this is not reachable in Production as deployed (W8 saw no environment signal either way). The Git-history grep sweep found no real secret.
- **Impact:** A deployment started with any other `NODE_ENV` (a staging container, a test build run publicly, a typo) and no secret signs Better Auth cookies and encrypts the JWKS private keys with a value anyone can read in the repository, which allows session forgery. A copied placeholder in Production has the same effect.
- **Severity:** Could
- **Fix direction:** Remove the fallback and require `BETTER_AUTH_SECRET` always; in local development set it in `.env.local` (document a one-line generator). In the guard, reject known placeholders (anything starting `replace-with` or equal to the old constant) and require entropy, for example Base64 of 32 random bytes. Keep the existing production throw.
- **Regression test:** Sketch below
- **Status:** Confirmed

```text
Request:  import lib/auth.ts with NODE_ENV=staging and BETTER_AUTH_SECRET unset; separately NODE_ENV=production with BETTER_AUTH_SECRET set to the .env.example value
Expected: both throw before betterAuth() is constructed
Actual:   by reading auth.ts:14-55, the first constructs betterAuth() with the committed constant; the second passes the length check
```

### CFG-05 — The API application sets no security headers, HSTS or host filtering and leaves HTTPS entirely to the proxy

- **Workstream:** W5
- **Location:** `apps/api/WhitePlate.Api/Program.cs:29-77` (middleware pipeline: no `UseHsts`, no header middleware, no `UseForwardedHeaders`); `Program.cs:43-49` (HTTPS redirection off when `HttpsRedirection__Enabled=false`); `apps/api/WhitePlate.Api/appsettings.json:8` (`"AllowedHosts": "*"`)
- **Evidence:** `grep` over `apps/api` for `UseHsts`, `AddHsts`, `ForwardedHeaders`, `Headers.Append` and `Headers[` finds nothing in product code (only tests). The production runbook sets `HttpsRedirection__Enabled=false` (`docs/deployment/coolify.md:216`), so the app never redirects or sends `Strict-Transport-Security`. `AllowedHosts` is `*`, so host filtering is delegated to tenant resolution (`TenantHostResolver`, W1). The hosted response headers could not be observed because every route returned the Traefik 503 (HOST-01); the only header seen on that proxy page was `X-Content-Type-Options: nosniff`, set by the proxy's own error page.
- **Impact:** For a JSON API the main exposure is limited: no `nosniff` or HSTS from the application means that correctness depends on Traefik labels that are not in the repository. W8 saw plain HTTP on the API host answer `404` with no redirect (`w8-hosted-posture.md`, probe table), which is weaker than the runbook's "HTTP-to-HTTPS redirect enabled". Any move to another host or a plain `docker run` loses every protection silently.
- **Severity:** Should
- **Fix direction:** Add a small middleware that sets `X-Content-Type-Options: nosniff`, `Referrer-Policy: no-referrer`, `Cache-Control: no-store` for API responses and, in Production, `Strict-Transport-Security`. Keep the decision on forwarded headers explicit (ADR 0005 rejects blanket trust; `PUB-01` covers the client-IP consequence, so the trusted-proxy design belongs there). Set `AllowedHosts` to the API host and the tenant wildcard in Production. After HOST-01 is fixed, re-probe headers and the HTTP redirect on the API host. Frontend headers are HOST-03.
- **Regression test:** Sketch below
- **Status:** Confirmed

```text
Request:  GET /health/live against WebApplicationFactory<Program> in the Production environment
Expected: X-Content-Type-Options: nosniff and Strict-Transport-Security on an HTTPS request
Actual:   no header set by the application (Program.cs has none); proxy behaviour unverified while HOST-01 is open
```

### CFG-06 — Production start-up does not fail fast for several required secrets, and defaults point at test mode and localhost

- **Workstream:** W5
- **Location:** `apps/api/WhitePlate.Api/Configuration/ServiceRegistration.cs:25-32` (the only production guard: HTTPS issuer and audience), `:36-39`, `:84-88`, `:93`; `HmacEmailTrackingCapability.cs:10`, `:14`; `AnalyticsPrivacyService.cs:26-28`; `apps/api/WhitePlate.Application/Payments/StripeConnectContracts.cs:15`; `apps/api/WhitePlate.Api/appsettings.json:9-11`; `apps/frontend/lib/auth-database.ts:15`; `apps/frontend/lib/auth.ts:14-40`
- **Evidence:** In Production the API refuses to start without an HTTPS `Authentication:Issuer` and an audience, and the frontend refuses without its listed variables (`auth.ts:15-39`). Nothing else is checked: a missing `ConnectionStrings:WhitePlate` is discovered at first query (readiness reports unhealthy); a missing `OrderEmails:TrackingSigningKey` returns `null` capability, so tracking links are silently omitted; missing `Analytics:PrivacyKey` makes consenting orders fail (documented, `docs/development.md:315`); `StripeConnectOptions.ActiveMode` defaults to `Test` and the runbook asks the operator to set `Live` explicitly; `Tenancy:BaseDomain` defaults to `localhost` in the shipped `appsettings.json` and passes validation as a DNS name. The database TLS settings are unchecked in both tiers: `createAuthDatabaseConfig` returns a config without `ssl` when `DATABASE_SSL_CA` is empty (`auth-database.ts:15`), and the API uses whatever the Npgsql string says; only the runbook's example sets `SSL Mode=VerifyFull` (`docs/deployment/coolify.md`, API settings). The server side currently enforces TLS with `hostssl` rules (`docs/deployment/coolify.md`, `pg_hba.conf` block), which is why this is Could rather than Should. Fail-closed behaviour holds for the Media toggles (`AllowLocalHttp`, `AllowPrivateHttp` default to false, `S3MediaStorage.cs:26`) and CORS (below).
- **Impact:** A misconfigured or partially configured deployment starts and looks healthy while features are off or in the wrong mode (for example Stripe test mode in production), and a database connection without TLS depends on the server alone to refuse it.
- **Severity:** Could
- **Fix direction:** Add a production start-up validation block next to `ServiceRegistration.cs:29` that lists every required key and rejects `StripeConnect:ActiveMode` unset, `Tenancy:BaseDomain=localhost`, a missing connection string, a connection string without `SSL Mode=VerifyFull`/`VerifyCA`, and a missing tracking or analytics key. Mirror it in `auth.ts` by requiring `DATABASE_SSL_CA` or `sslmode=verify-full` in the URL when `NODE_ENV=production`.
- **Regression test:** Sketch below
- **Status:** Confirmed

```text
Request:  start WebApplicationFactory<Program> in Production with only Authentication:Issuer (https) and Authentication:Audience set
Expected: start-up fails listing the missing required settings
Actual:   by reading ServiceRegistration.cs:29-32 the host starts; failures appear per feature at runtime
```

### CFG-07 — CI pins actions by tag and has no dependency, container or browser gate

- **Workstream:** W5
- **Location:** `.github/workflows/ci.yml:3-5`, `:22`, `:27`, `:102`, `:105`; no `.github/dependabot.yml` or Renovate config (`git ls-files` finds only `ci.yml` under `.github`)
- **Evidence:** Actions are referenced by movable tags: `actions/checkout@v7`, `actions/setup-node@v7`, `actions/setup-dotnet@v6`. Positive: top-level `permissions: contents: read`, concurrency with cancel, job timeouts, `npm ci`, and a pinned toolchain (`.nvmrc` 24.19.0; `global.json` SDK 10.0.100). The workflow runs on every `push` and `pull_request` (duplicate runs per PR commit). Jobs: frontend (test, lint, typecheck, changed-file format check, build with inert `ci-only-*` secrets) and `dotnet test apps/api/WhitePlate.slnx --configuration Release`, so API tests and the production build do run. Missing: no `npm audit` or `dotnet list package --vulnerable` step (the Critical `next` in CFG-01 passes CI), no Docker build of `apps/api/WhitePlate.Api/Dockerfile` (the deployed artifact is built only by Coolify), no Playwright run (`npm run test:browser`), no `persist-credentials: false` on `checkout`, and formatting is checked only for changed `.ts`/`.tsx` files (`ci.yml:54-78`), so 17 files already fail `format:check` (README baseline). The `.nvmrc` and `engines` ranges agree: CI uses 24.19.0, `engines` accepts `^24.19.0`, Vercel uses 24.x (`docs/development.md:20`, `:259`).
- **Impact:** A moved or compromised tag runs in a job that holds a read token and an `npm ci` environment. A broken Dockerfile or a vulnerable dependency reaches `main` unnoticed, and the supply-chain backlog (CFG-01) grows without a signal.
- **Severity:** Could
- **Fix direction:** Pin the three actions to full commit SHAs with a comment for the tag, and let Dependabot (actions, npm, NuGet) keep them current. Add `npm audit --omit=dev --audit-level=high` and `dotnet list package --vulnerable --include-transitive` as non-blocking-then-blocking steps, a `docker build` job for the API image, and `persist-credentials: false`. Decide whether to run the full `format:check` once W7's formatting drift is fixed.
- **Regression test:** None
- **Status:** Confirmed

### CFG-08 — API image uses floating base tags, has no `HEALTHCHECK` and ships `curl` in the runtime layer

- **Workstream:** W5
- **Location:** `apps/api/WhitePlate.Api/Dockerfile:1`, `:2-4`, `:5`, `:9`; `apps/api/.dockerignore:1-9`
- **Evidence:** Base images are `mcr.microsoft.com/dotnet/aspnet:10.0` and `sdk:10.0`, tags without digests. The runtime stage installs `curl` as root (`:2-4`) so that Coolify can probe `/health/ready`; there is no `HEALTHCHECK` instruction, so the check exists only as a Coolify setting (`docs/deployment/coolify.md`, "Configure a Coolify HTTP healthcheck"). `USER $APP_UID` (`:5`) drops to the non-root user that Microsoft's .NET 8+ images define; the instruction comes after the `apt-get` layer and before `WORKDIR` and `COPY`, and the runbook says the deployed container runs as that non-root user. No secrets are baked: the only `ARG` is `BUILD_CONFIGURATION`, there are no `ENV` secrets, and `.dockerignore` excludes `**/.env`, `bin`, `obj`, `tests` and `.git`. It does not exclude `.env.*`, `appsettings.Development.json` (harmless, localhost values) or the tracked generated SQL script (CFG-10), which are copied into the build stage but not into the final image. No Docker daemon was used; non-root was confirmed from source and the runbook, not from `docker run`.
- **Impact:** A rebuild can silently change the base layer (including a bad patch), and an unpinned build is not reproducible. `curl` adds binaries and a package index to the runtime layer. A host without Coolify's configured probe has no container health signal.
- **Severity:** Could
- **Fix direction:** Pin both bases by digest (with Dependabot for Docker); consider the `-noble-chiseled` runtime image plus a tiny in-process health probe instead of `curl`; add `HEALTHCHECK` that calls `/health/ready` if `curl` is kept; add `**/.env.*` and `**/*.sql` to `.dockerignore`.
- **Regression test:** None
- **Status:** Confirmed

### CFG-09 — Ten development fixture routes are compiled into the production build and gated at runtime by two different checks

- **Workstream:** W5
- **Location:** `apps/frontend/app/[locale]/{brand-design-test,catalog-design-test,design-system-test,order-history-test,orders-kanban-test,photo-design-test,photo-guest-design-test,workspace-toast-test}/page.tsx` (`process.env.NODE_ENV !== "development"` then `notFound()`, for example `design-system-test/page.tsx:7`); `app/[locale]/{establishment-design-test,live-workspace-test,studio-parity-test}/page.tsx:11`, `:39`, `:9` (`NODE_ENV === "production"`)
- **Evidence:** The README baseline records that `npm run build` lists them as production routes (nine dynamic, `establishment-design-test` and `studio-parity-test` prerendered for `en` and `fr`). W8 requested all of them in `en` and `fr` on the production frontend and got 24 times 404; so the guard holds in Production today, and this is not a hosted exposure. The guards are not equivalent: the `!== "development"` form returns 404 in any build except `next dev`, while `=== "production"` renders the fixture in `next start` under any other `NODE_ENV` and in test builds. `__test__` does not exist in `app/[locale]` (directory listing). The ten routes contain fixture data and development harness components and their code is part of the build output.
- **Impact:** Production safety rests on `NODE_ENV` alone, and an inconsistent pair of checks; any future environment (a staging container with `NODE_ENV=staging`) would expose the `=== "production"` fixtures, which mount development harness components. The harness bundles add build time and size.
- **Severity:** Could
- **Fix direction:** Keep fixtures out of the production route table: gate them at build level (a dev-only route group removed by `pageExtensions` or a separate `app` directory used only by Playwright through an environment flag) and make all ten use one shared `assertDevelopmentFixture()` helper with the `!== "development"` form. Re-check with `next build` output and W8's 24-request probe.
- **Regression test:** Sketch below
- **Status:** Confirmed

```text
Request:  next build, then read the route table (or .next/server/app-paths-manifest.json)
Expected: no *-test routes in a production build
Actual:   10 *-test routes listed (README baseline, build row); all 404 at runtime on Vercel Production (W8)
```

### CFG-10 — A stale generated SQL migration script is tracked in the API project root

- **Workstream:** W5
- **Location:** `apps/api/brand-media-migrations.sql` (787 lines, tracked since `76ad1bc`)
- **Evidence:** `git ls-files` lists it; it is an idempotent EF-generated bootstrap that stops at `20261008210000_BrandMediaPublicationState`, while `apps/api/WhitePlate.Infrastructure/Persistence/Migrations` now holds 38 migrations, the latest `20261019082708_OrderCustomerDetails`. `docs/audits/brand-assets.md:43` records that it was never re-run in production, and `docs/audits/live-demo-parity.md:27` once called it "unrelated untracked". It contains no credentials. It sits inside the Docker build context (CFG-08). The other stray-artifact checks are clean: `git ls-files` returns nothing for `TestResults`, `*.csproj.user`, `*.tsbuildinfo`, `apps/api/WhitePlate.Api/apps`, `*.suo`, `.vs/`, `.next`, `coverage`, `.env` (only `.env.example`), `*.log`, `*.pem`, `*.key` or archives, and `.gitignore` covers each (`**/TestResults/`, `*.csproj.user`, `**/bin/`, `**/obj/`, `/.next/`, `*.tsbuildinfo`).
- **Impact:** A future operator may apply a partial schema script to an empty target database, or believe it is current. It is also a second source of truth for schema next to the EF migrations.
- **Severity:** Could
- **Fix direction:** Delete it (the EF migrations and `docs/deployment/coolify.md` describe how to generate the script on demand with `dotnet ef migrations script --idempotent`), or regenerate it as a documented, dated artifact outside the build context.
- **Regression test:** None
- **Status:** Confirmed

## Checked, no finding

- Secrets in the repository: no `.env`, key or certificate is tracked; `.gitignore:9-11` and `apps/frontend/.gitignore` ignore `.env*` except `.env.example`; `appsettings.json` and `appsettings.Development.json` hold only logging, `AllowedHosts`, a localhost `Tenancy:BaseDomain`, rate-limit numbers and a localhost issuer. The README secret sweep found no real credential.
- `NEXT_PUBLIC_*`: no use anywhere in `apps/frontend` (grep over `.ts`, `.tsx`, `.mjs`, `.json`, `.md`); only documentation mentions it, as a prohibition (`AGENTS.md:22`, `docs/coding-standards.md:29`). The one value that deliberately reaches browser code is the non-secret `PUBLIC_API_BASE_URL`, read on the server in `app/[locale]/(workspace)/organization/dashboard/page.tsx:130` and `orders/page.tsx:137` and passed as a prop.
- Server-only variables in client code: every `process.env.*` read in `apps/frontend` is in a server module, route handler, action, `proxy.ts`, a script or a test (grep list); no `"use client"` module reads a secret.
- CORS: explicit allow-list only (`ServiceRegistration.cs:76-83`); an empty list yields a policy with no origin, so the default denies; methods and headers are enumerated; credentials are allowed only together with explicit origins; the production value is the single frontend origin (`docs/deployment/coolify.md`, runtime variable table). Not tested at runtime (HOST-01).
- Forwarded headers: none are trusted (`Program.cs`, no `UseForwardedHeaders`), matching ADR 0005 and `docs/architecture/tenancy-and-security.md:9` (tenant resolution uses the real Host; `X-Forwarded-Host` is ignored, tested in `TenantEndpointTests.cs:53`). The cost, one shared rate-limit bucket per restaurant, is PUB-01.
- HTTPS and authority checks: production requires an HTTPS `Authentication:Issuer` (`ServiceRegistration.cs:29-32`); JWT validation pins issuer and audience (`:50-53`); the frontend refuses non-HTTPS `BETTER_AUTH_URL` and `API_BASE_URL` in production (`auth.ts:36-39`).
- Database TLS on the frontend, when configured: `rejectUnauthorized: true` with a bound identity check (`auth-database.ts:29-35`); URL SSL parameters that would override it are rejected (`:19-27`). The public IPv4:5433 literal is HOST-02.
- Swagger and OpenAPI in Production, `X-Powered-By`, frontend security headers: HOST-04, HOST-07, HOST-03. Not repeated.
- Fixture routes at runtime: W8 probe, 24 times 404 on Production (see CFG-09 for the build-side point).
- Node versions: `.nvmrc` 24.19.0 and `engines` `^24.19.0` agree with CI (`node-version-file`) and with Vercel 24.x (`docs/development.md:20`, `:259`). The failure seen on the audit workstation (default Node 20.18.3) is `engine-strict=true` working as designed (`apps/frontend/.npmrc:1`), not a repository defect.
- CI permissions and secrets: `permissions: contents: read` at workflow level; no `pull_request_target`; the build step uses inert `ci-only-*` and `.invalid` values, no repository secret is referenced.
- Docker user: non-root (`USER $APP_UID`, `Dockerfile:5`); no `ARG` or `ENV` secret; `tests/` and `.git` excluded.
- Media toggles `Media:AllowLocalHttp` and `Media:AllowPrivateHttp`: default `false` and used only when explicitly set (`MediaRegistration.cs:13-15`, `S3MediaStorage.cs:26`).
- NuGet: no vulnerable packages (README sweep; five projects). Package versions are pinned exactly in the `.csproj` files.
- `proxy.ts`: no authentication logic, only locale routing and a Host-based storefront rewrite (`proxy.ts:11-23`); the matcher excludes `api`, `_next` and static files (`:26-28`). No auth-bypass advisory exists for it in the audit output.
- `dev-token.mjs`: refuses `NODE_ENV=production` and non-localhost URLs (`scripts/dev-token.mjs:37-42`) and reads its secret from the environment, with no fallback.

## Not covered

- Real-time and hosted behaviour of the API (headers, CORS preflight, HTTP-to-HTTPS redirect, OpenAPI): the production API returns 503 (HOST-01), so only source was read.
- Whether the Vercel Production environment variables are set as documented (including `BETTER_AUTH_API_KEY`, which enables the `dash` plugin at `auth.ts:123-125`): the Vercel and Coolify consoles were not read.
- Better Auth request schemas (for CFG-02) and the behaviour of Vercel's image optimizer: not read or observed; CFG-01 reasons from the app's inputs and the advisory's own workaround.
- Secret scanning with gitleaks and static analysis with Semgrep: not approved, not run (README, Automated sweep). Only the Git-history grep fallback ran.
- Runtime TLS posture of the database and API certificate chain: W8, limited by TLS interception on the audit workstation.
- Rate-limit effectiveness behind Traefik: PUB-01 (W3).
- Dependency `npm audit` was not re-run; the Task 3 output was reused (lockfile unchanged).

## ASVS / WCAG coverage

ASVS 4.0.3 Level 2, chapters named for this task:

| Requirement | Status | Basis |
| --- | --- | --- |
| V1.14 Configuration architecture | Partial | Server-only secrets and `NEXT_PUBLIC_` absence confirmed; start-up validation incomplete (CFG-06); fallback secret (CFG-04). |
| V2.10 Service authentication (stored secrets) | Partial | No secrets in the repository or image; Stripe, Media, Resend keys come from the environment; fail-fast gaps (CFG-06). |
| V6.4 Secret management | Partial | Keys are read from configuration; known-placeholder acceptance (CFG-04); rotation procedure for the analytics key documented in `docs/development.md:315`. |
| V10.3 Deployed application integrity | Partial | Lockfile and `npm ci` used; actions pinned by tag (CFG-07); unpinned base images (CFG-08). |
| V14.1 Build and deploy | Partial | CI builds and tests both apps; no Docker build or dependency gate (CFG-07, CFG-08). |
| V14.2 Dependency | Not met | 1 Critical and 8 High `npm audit` entries; reachable Server Actions DoS (CFG-01); runtime zod (CFG-02); tree hygiene (CFG-03). |
| V14.4 HTTP security headers | Not met | API sets none (CFG-05); frontend HOST-03. |
| V14.5 HTTP request header validation | Partial | Explicit CORS allow-list and ignored forwarded headers confirmed in source; `AllowedHosts: *` (CFG-05); hosted CORS Not covered. |

WCAG: out of scope for W5 (see W6).
