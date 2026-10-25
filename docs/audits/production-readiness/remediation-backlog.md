# Remediation backlog

Fix batches for the production-readiness audit of 2026-10-25. Each batch groups findings that can land as one change (one branch, one pull request). The finding files are the source of truth for evidence, locations and regression-test sketches. This file only groups the findings and states what "done" means for each group.

Finding files: SEC = [W1](w1-tenant-authz.md), AUTH = [W2](w2-auth-session.md), PUB = [W3](w3-public-surface.md), DATA = [W4](w4-input-media-data.md), CFG = [W5](w5-supply-chain-config.md), A11Y = [W6](w6-accessibility.md), CODE = [W7](w7-code-health.md), HOST = [W8](w8-hosted-posture.md), PERF = [W9](w9-performance.md).

How to read a batch:

- Findings: the finding IDs the batch closes, with their severity. A W7 test-gap finding (CODE) sits in the batch whose control it tests.
- Size: S is under a day, M is a few days, L is a week or more of focused work, including tests and documentation.
- Depends on: batches or owner decisions (D-numbers, see [Owner decisions](#owner-decisions)) that must land or be settled first.
- Design: `written spec` means a spec under `docs/superpowers/specs/` is approved before code. `in-chat` means the fix direction in the finding is specific enough to agree in the working session.
- Acceptance criteria: drawn from each finding's fix direction and regression-test sketch. A batch is done when every criterion holds and the affected documentation is updated in the same change.

Order: the Blocker batch first, then security, accessibility, performance, data and test-gap batches, then hygiene. Batches without dependencies can run in parallel.

## B01 — Production API recovery and migration guardrails

- Findings: HOST-01 (Blocker), DATA-01 (Should), HOST-06 (Should), CODE-06 (Should, readiness part only; the PostgreSQL stage is B16), HOST-05 (Could), DATA-02 (Could)
- Highest severity: Blocker
- Size: M
- Depends on: none. Within the batch, DATA-01 is a hard precondition of HOST-01 recovery: apply and verify the pending migrations before, or together with, any redeploy of `main`.
- Design: in-chat
- Acceptance criteria:
  - Production `__EFMigrationsHistory` is read (read-only) and the result is recorded in `docs/deployment/coolify.md`. The missing migrations (documented as `20261017222900_OrganizationRoleGrants`, `20261018103516_CustomOrganizationRoles`, `20261019082708_OrderCustomerDetails`; possibly fewer, see DATA-02) are applied with the existing guarded procedure, after a fresh backup, and the rollout is recorded.
  - The owner-side Coolify checks from HOST-01's fix direction are run in order (resource status, container health and logs, mounted CA readability, internal `/health/ready`), the cause is recorded, and TLS verification is not weakened.
  - Externally, `/health/live` and `/health/ready` return 200 `Healthy` and anonymous `GET /api/v1/organizations` returns 401 problem+json with `x-request-id` (HOST-01 sketch).
  - `/health/ready` reports Unhealthy while any migration is pending (`Database.GetPendingMigrationsAsync()` non-empty, or a pinned latest migration ID). An API test proves it with a database whose history lacks the latest migration (DATA-01 and CODE-06 sketches).
  - An external uptime check covers `$API/health/live`, `$API/health/ready` and `$FE/en/sign-in` and alerts the owner. The process that rewrites the mounted CA file is identified and fixed, or the CA is mounted as a directory (HOST-06).
  - Each release records the deployed Vercel and API commit SHAs in `coolify.md`, and both apps expose a build identifier (a `/version` route or a response header) (HOST-05).
  - `coolify.md` gains one per-environment migration table. The ThemePublication and OrderCancellationReason rollouts get dated notes, or a note that evidence is missing (DATA-02).
  - Neon `test` is brought to the same migration level before the next acceptance run (13 migrations behind at the audit).

## B02 — API token confinement

- Findings: SEC-06 (Should), CODE-02 (Should, token-confinement part; the auth-configuration tests are B04), SEC-05 (Could)
- Highest severity: Should
- Size: M
- Depends on: none. Complements B10 (CSP).
- Design: written spec (hub-only token audience and lifetime; updates ADR 0002, `tenancy-and-security.md` and `frontend-conventions.md`)
- Acceptance criteria:
  - The Better Auth `jwt` plugin sets `disableSettingJwtHeader: true`. `GET /api/auth/get-session` returns 200 without a `set-auth-jwt` header (SEC-06 sketch).
  - `/api/kitchen/signalr-token` issues a hub-only token (dedicated audience or scope, shortest workable lifetime). The API accepts it only on `/hubs/orders` and returns 401 for it on REST routes (SEC-06 sketch).
  - Proxy access logs are confirmed to drop or redact the hub `access_token` query string (SEC-05).
  - Tests: a route test that `/api/auth/token` returns 404; a test that `get-session` does not expose a token; an Origin-refusal test for `getApiToken`; an API test with the real JwtBearer handler that the hub audience is rejected on REST routes (CODE-02).
  - The audit notes added to `tenancy-and-security.md`, `frontend-conventions.md` and ADR 0002 are replaced by an accurate description of the hub token.

## B03 — API JWT validation and token lifetime

- Findings: AUTH-02 (Should), AUTH-01 (Should)
- Highest severity: Should
- Size: S
- Depends on: B02 (for the hub audience), D5 (post-sign-out token window)
- Design: in-chat
- Acceptance criteria:
  - `TokenValidationParameters` are explicit: `ValidAlgorithms = ["RS256"]`, issuer, audience and lifetime validation on, `RequireExpirationTime`, `RequireSignedTokens`, `ClockSkew` of 30 to 60 seconds.
  - API integration tests keep the real JwtBearer handler with an in-memory signing key or JWKS and return 401 with `WWW-Authenticate: Bearer error="invalid_token"` for the wrong algorithm, wrong issuer, wrong audience, expired token and unsigned token, and accept a valid token (AUTH-02 sketch).
  - A token presented 61 seconds after expiry returns 401 `invalid_token` (AUTH-01 sketch).
  - The post-sign-out window is recorded in ADR 0002 as accepted, or reduced by a shorter API token lifetime or a `sid` claim checked for sensitive operations (D5).

## B04 — Better Auth account and session policy

- Findings: AUTH-03 (Should), AUTH-04 (Should), AUTH-06 (Should), CODE-02 (Should, configuration-test part), AUTH-05 (Could), AUTH-07 (Could), CFG-04 (Could)
- Highest severity: Should
- Size: M
- Depends on: D1 (session lifetime), D10 (breached-password check)
- Design: in-chat
- Acceptance criteria:
  - `emailAndPassword.minPasswordLength` is 12, `password-field.tsx` matches with translated hints in both catalogs, and a breached-password check (Better Auth `haveIBeenPwned` or a local top-passwords list) rejects compromised passwords with 400 (AUTH-03 sketch).
  - `session.expiresIn` and `session.updateAge` match the owner's policy, with an absolute limit or re-authentication for owner and payout actions, or a documented kitchen-device exception; the cookie `Max-Age` and `expiresAt` stay within it (AUTH-04 sketch).
  - `verification.storeIdentifier` is `"hashed"`; a reset-token row no longer contains the token sent in the email (AUTH-06 sketch).
  - Email delivery in sign-up and reset no longer blocks the response (`advanced.backgroundTasks.handler` with `after()` or `waitUntil`, or a constant minimum response time); the median latency difference between existing and unknown emails is under 50 ms (AUTH-05 sketch).
  - `advanced.ipAddress.ipAddressHeaders` is set for Vercel and documented in the deployment docs (AUTH-07).
  - The `BETTER_AUTH_SECRET` fallback is removed; the guard rejects placeholders and low-entropy values and throws before `betterAuth()` is built (CFG-04 sketch).
  - The Better Auth options are exported as a plain object and a Vitest test asserts every value above plus the `jwt` plugin `expirationTime` and `disableSettingJwtHeader` (CODE-02).

## B05 — Restaurant permission enforcement

- Findings: SEC-08 (Should), SEC-09 (Should), CODE-01 (Should), SEC-01 (Could), SEC-03 (Could)
- Highest severity: Should
- Size: M
- Depends on: B01 (role migrations applied before deployment); D9 for the SEC-01 history rule
- Design: in-chat
- Acceptance criteria:
  - The analytics handler checks `analytics.view`, catalog reorder checks `catalog.manage`, and discount deactivation checks `discounts.manage`. For custom roles holding exactly one key, analytics returns 403 for `orders.manage` and 200 for `analytics.view`, and reorder and deactivation follow the same rule (SEC-08 sketch).
  - A non-owner inviter can assign only roles whose permissions are a subset of their own on that restaurant, both in the assignable-role list and on invitation create; a built-in Manager cannot invite as Accountant (SEC-09 sketch).
  - Deactivated restaurants are excluded by the shared ownership and permission checks and by the staff directory; protected routes and the hub return 404 or 403 for them, per D9 (SEC-01 sketch).
  - The authorization fallback policy requires an authenticated user; public endpoints are marked `[AllowAnonymous]` explicitly, and a test fails on any anonymous endpoint outside the allowlist (SEC-03).
  - One parameterized API test class seeds a custom role per permission key and asserts the allow and deny outcome of every protected route in the W1 matrix (CODE-01).
  - `api-contracts.md:392` describes the `analytics.view` check.

## B06 — Membership and co-owner removal

- Findings: SEC-02 (Should)
- Highest severity: Should
- Size: M
- Depends on: B05 (permission test harness); D8 (co-owner equality)
- Design: written spec (new owner-only endpoints, last-owner guard, workspace UI in both locales)
- Acceptance criteria:
  - Owner-only endpoints remove a restaurant membership and a co-owner, with a last-owner guard, enforced server-side.
  - After removal, the removed member's next REST call is denied (204 then 403 or 404) and the next hub event is not delivered to them (SEC-02 sketches).
  - The co-owner policy is recorded.

## B07 — Organization and storefront creation limits

- Findings: SEC-04 (Should)
- Highest severity: Should
- Size: M
- Depends on: D3 (name reservation and approval policy)
- Design: written spec
- Acceptance criteria:
  - The API's reserved-name list covers platform, auth, support and infrastructure names and the frontend's reserved path segments, and is shared with `storefront-preview-routing.ts`; a reserved name returns 400 `reserved_subdomain` (SEC-04 sketch).
  - Per-account quotas and a rate limit apply to organization and restaurant creation; creation beyond the quota returns 429 (SEC-04 sketch).
  - Whether new storefronts need approval before resolving publicly is decided and implemented as decided.

## B08 — Public rate limiting and trusted client address

- Findings: PUB-01 (Should), CODE-05 (Should), PUB-06 (Could), PUB-07 (Could)
- Highest severity: Should
- Size: L
- Depends on: D7 for PUB-06's withdrawal policy (the rate-limit part does not wait for it)
- Design: written spec (trusted-proxy or edge limiting design; must stay consistent with ADR 0005, which rejects blanket forwarded-header trust)
- Acceptance criteria:
  - The checkout limiter partitions by a trusted client address: either `ForwardedHeadersOptions` limited to the Traefik network with a server-only client address sent by the BFF, or per-client limiting at the BFF or edge with a larger per-tenant ceiling in the API. Guests behind distinct client addresses are limited independently (PUB-01 sketch).
  - Quotes have their own, larger bucket and no longer spend the order allowance. 429 responses carry `Retry-After`.
  - Failed discount lookups have a small per-client budget or a short lockout (PUB-07).
  - The analytics-withdrawal BFF route checks `Origin`, and its bucket uses the same trusted client address (PUB-06).
  - Tests: two guests behind one proxy are limited independently; quotes do not limit checkout; quote and withdrawal limiters return 429 after the permit; a checkout that sends price fields gets server-computed totals in the tenant currency (CODE-05 sketches).
  - `api-contracts.md:280` and `:288` state the effective partition consistently.

## B09 — Next.js and runtime dependency update

- Findings: CFG-01 (Should), CFG-02 (Should), CFG-03 (Could)
- Highest severity: Should
- Size: S
- Depends on: none. Should land early: it removes a reachable High advisory and three Critical ones from range.
- Design: in-chat
- Acceptance criteria:
  - `next` and `eslint-config-next` are at 16.4.3 or later; lint, typecheck, tests and the build pass; `npm audit` no longer reports the `next` advisories. `sharp` stays at 0.35.5 or later.
  - `zod` resolves to 4.6.6 or later for Better Auth (`npm ls zod`) and `npm audit` no longer reports GHSA-mrhx-c7xc-m3w5.
  - `axios` is removed, `shadcn` is a dev dependency, `@types/node` is `^24`, the Visual Studio container tools package is removed or conditioned; `npm ls --omit=dev` and the build confirm it (CFG-03).

## B10 — Security response headers

- Findings: HOST-03 (Should), CFG-05 (Should), HOST-07 (Could)
- Highest severity: Should
- Size: M
- Depends on: B01 for re-probing the hosted API
- Design: in-chat (CSP starts in report-only mode; Next.js nonces for inline scripts)
- Acceptance criteria:
  - Hosted frontend responses carry `Content-Security-Policy` (with `frame-ancestors 'none'`), `X-Frame-Options: DENY`, `Referrer-Policy` (`no-referrer` on `/[locale]/order/*`), a restrictive `Permissions-Policy` and `X-Content-Type-Options: nosniff`; Vercel's HSTS is kept (HOST-03 sketch).
  - `poweredByHeader: false`; no `X-Powered-By` header (HOST-07).
  - API responses carry `X-Content-Type-Options: nosniff`, `Referrer-Policy: no-referrer`, `Cache-Control: no-store` and, in Production over HTTPS, `Strict-Transport-Security`; `AllowedHosts` is the API host and the tenant wildcard (CFG-05 sketch).
  - After HOST-01 is fixed, the API headers and HTTP redirect are re-probed on the hosted API and recorded.

## B11 — Database network exposure

- Findings: HOST-02 (Should), HOST-09 (Could)
- Highest severity: Should
- Size: M
- Depends on: D4 (Vercel-to-PostgreSQL network path)
- Design: written spec (the frontend connects to PostgreSQL directly from Vercel functions, so closing the port alone breaks sign-in)
- Acceptance criteria:
  - From an address outside the agreed allow-list, a connection to the PostgreSQL port is refused or times out (HOST-02 sketch), while Vercel sign-in still works.
  - Until the network path changes: a host firewall rule for the Docker-published port, connection-rate limiting, SCRAM-only logins with long random passwords, and alerting on failed authentications.
  - Fixtures no longer use credential URLs with the real host.
  - Preview deployments are disabled, or their variables point at a separate test database with a distinct `BETTER_AUTH_SECRET`; legacy Render credentials are deleted if that database is retired (HOST-09).

## B12 — Off-host backups and restore test

- Findings: DATA-07 (Should)
- Highest severity: Should
- Size: S
- Depends on: none
- Design: in-chat
- Acceptance criteria:
  - Coolify scheduled backups go to encrypted off-VPS storage with a stated retention.
  - A restore into a disposable database is run and recorded in `coolify.md`.
  - The migration procedure requires a fresh verified backup before each production migration.

## B13 — API production configuration hardening

- Findings: HOST-04 (Should), CFG-06 (Could), DATA-03 (Could), HOST-08 (Could)
- Highest severity: Should
- Size: M
- Depends on: B01
- Design: in-chat
- Acceptance criteria:
  - `Swagger__Enabled` is false or removed in the Production resource; `/openapi/v1.json` and `/swagger` return 404 problem+json once the API is healthy (HOST-04 sketch).
  - Production start-up fails, listing the missing settings, when `StripeConnect:ActiveMode` is unset, `Tenancy:BaseDomain` is `localhost`, the connection string is missing or lacks `SSL Mode=VerifyFull`/`VerifyCA`, or a tracking or analytics key is missing; `auth.ts` requires `DATABASE_SSL_CA` or `sslmode=verify-full` in production (CFG-06 sketch).
  - An unauthenticated upload returns 401 without the body being read; authenticated JSON endpoints have explicit `[RequestSizeLimit]` values (DATA-03 sketch).
  - The API moves to an owned domain, with `API_BASE_URL`, `PUBLIC_API_BASE_URL` and CORS updated, or certificate expiry is monitored until then (HOST-08).

## B14 — Stripe Connect tests and callback binding

- Findings: CODE-04 (Should), SEC-10 (Could), PUB-05 (Could)
- Highest severity: Should
- Size: M
- Depends on: none
- Design: in-chat
- Acceptance criteria:
  - API tests with a fake `IStripeConnectProvider`: unsigned and wrongly signed webhooks return 400; a `livemode` mismatch returns 400 with no write; a valid `account.updated` re-reads the account; a callback with an unknown or reused state redirects to `stripeConnectResult=failed` (CODE-04).
  - The OAuth state is bound to the initiating browser (short-lived `HttpOnly`, `SameSite=Lax` cookie with a second secret, or a BFF callback that checks the signed-in owner); a callback from another browser redirects to `stripeConnectResult=failed` and saves nothing; the owner sees the linked account's name or ID (SEC-10 sketch).
  - An event with a different `api_version` returns 200 and is applied, or the setup guide pins the endpoint version Stripe.net 53 expects (PUB-05 sketch).

## B15 — BFF input and origin guards

- Findings: CODE-03 (Should), SEC-07 (Could), CODE-09 (Could)
- Highest severity: Should
- Size: M
- Depends on: none
- Design: in-chat
- Acceptance criteria:
  - `saveOpeningHoursAction` validates `tenantId` with `isUuid` and a bounded integer version, and returns `{ ok: false, status: 400 }` with no outgoing request for a malformed ID; the two regex-checked actions use `isUuid` (SEC-07 sketch).
  - API paths are built from encoded segments, or `resolveApiUrl` rejects `?`, `#` and dot segments; a table test covers `?`, `#`, `..`, `%2e%2e`, `%2f` and backslashes (CODE-03).
  - One `isTrustedOrigin`, one `parseTenantQuery`, one `isUuid` and one permission-precheck helper replace the copies (CODE-09).
  - `route.test.ts` for `theme-publication`, `order-quote` and `catalog-history` show a foreign Origin gets 403 before any API call; the four untested actions have valid, malformed, non-UUID and stale-version tests (CODE-03).

## B16 — Catalog publication consistency and PostgreSQL tests

- Findings: CODE-06 (Should, PostgreSQL and publication-state part), DATA-04 (Could), PUB-02 (Could), DATA-05 (Could)
- Highest severity: Should
- Size: L
- Depends on: B01 (readiness part of CODE-06); D11 for DATA-05
- Design: written spec (PostgreSQL test stage in CI or a manual Neon `test` job; decision 0013 updates)
- Acceptance criteria:
  - A PostgreSQL-backed test stage covers the three `IsNpgsql()` paths: concurrent checkouts against one slot give exactly one 201 and one 409; a paused restaurant rejects checkout; concurrent publishes serialize (CODE-06 sketch).
  - Anonymous photo reads follow the published snapshot when a head exists: the menu and the photo agree (both shown or both hidden) (DATA-04 sketch).
  - A deactivated discount code is rejected at checkout immediately with 400 `invalid_discount` (PUB-02 sketch).
  - Catalog `PUT`/`DELETE` require `If-Match` and return 412 when stale or 428 when missing, or last-writer-wins for drafts is recorded as accepted in `api-contracts.md` (DATA-05, D11).
  - Decision 0013 records the photo and discount rules.

## B17 — Page titles and language marking

- Findings: A11Y-01 (Should), A11Y-06 (Should)
- Highest severity: Should
- Size: M
- Depends on: none
- Design: in-chat
- Acceptance criteria:
  - The `[locale]` layout has a localized title template and each route family has `generateMetadata`; `document.title` is non-empty, localized and names the page in both locales (A11Y-01 sketch).
  - The storefront menu, product dialog, basket and receipt carry `lang={menu.locale}` when it differs from the UI locale, and menu-builder catalog names carry the edited locale (A11Y-06 sketch).

## B18 — Focus visibility, focus return and announcements

- Findings: A11Y-02 (Should), A11Y-08 (Should), A11Y-09 (Should)
- Highest severity: Should
- Size: M
- Depends on: none
- Design: in-chat
- Acceptance criteria:
  - Focused tabs, tab panels, moved kanban cards and highlighted menu items show an outline or ring (at least 3:1 against the popover); `design-system.spec.ts` asserts a non-`none` outline on focused tabs (A11Y-02 sketch).
  - Focus returns to the trigger or basket button after adding from the product dialog, pending submit buttons stay focusable (`aria-disabled`) or focus moves to the error alert, and focus returns to the moved handle after a reorder (A11Y-08 sketch).
  - Adding a dish puts "… added to basket" text into a polite live region, in both locales (A11Y-09 sketch).

## B19 — Contrast and link distinction

- Findings: A11Y-03 (Should), A11Y-04 (Should), A11Y-05 (Should), A11Y-13 (Should)
- Highest severity: Should
- Size: M
- Depends on: none. Any global token change follows the [design system](../../design-system/README.md) and updates it.
- Design: in-chat
- Acceptance criteria:
  - Storefront muted text is derived with a contrast floor of 4.5:1 against the theme background; axe `color-contrast` passes for descriptions, prices and info labels; the derived customer roles are added to the contrast validator (A11Y-03 sketch).
  - The scoped `--destructive` reaches 4.5:1 on `--destructive-muted` and the customer and auth backgrounds (A11Y-04 sketch).
  - Inline auth links are underlined at rest, or keep 3:1 against surrounding text with a non-colour cue on hover and focus (A11Y-05 sketch).
  - The landing call-to-action uses full-opacity `primary-foreground`, inactive demo rows use status labels and muted tokens at 4.5:1, and the demo category-name input is labelled; the remaining axe needs-review contrast nodes on landing and demo pages are triaged (A11Y-13 sketch).

## B20 — Storefront control names and footer

- Findings: A11Y-10 (Should), A11Y-14 (Should), A11Y-15 (Could), A11Y-16 (Could)
- Highest severity: Should
- Size: S
- Depends on: none
- Design: in-chat
- Acceptance criteria:
  - Basket and product-dialog quantity buttons are named "Remove one {product}" and "Add one {product}", and option sets are `role="group"` labelled by title and rule (A11Y-14 sketch).
  - The footer phone link renders only when a phone exists and is named "Call {restaurant}" (A11Y-10 sketch).
  - The menu-language select applies on explicit confirmation, or its label announces the behaviour (A11Y-15).
  - "Back to WhitePlate" is a link without `role="button"` (A11Y-16).

## B21 — Workspace menu builder, analytics and context switcher

- Findings: A11Y-07 (Should), A11Y-11 (Should), A11Y-12 (Should), A11Y-19 (Should), A11Y-17 (Could), A11Y-18 (Could)
- Highest severity: Should
- Size: L
- Depends on: B01 and Neon `test` migrations for verification on the API-backed pages
- Design: in-chat
- Acceptance criteria:
  - Each menu-builder row has click and tap "Move up" and "Move down" controls (or a position field); the handle describes the arrow-key method through `aria-describedby` and visible help text in both catalogs (A11Y-07 sketch).
  - Category names wrap or expose the full name, and the three-column layout falls back to stacked under enlarged text and text spacing with no clipped content (A11Y-11 sketch).
  - The analytics pie is `aria-hidden` or each sector is named, the `Cell`s apply colours, and the best-sellers scroller is a named, focusable region; axe `svg-img-alt` and `scrollable-region-focusable` pass (A11Y-12 sketch).
  - The workspace context select navigates only on explicit confirmation, or is replaced by links (A11Y-19 sketch).
  - Badge labels for kanban counts and timers are in visually hidden text (A11Y-17).
  - "Opens" and "Closes" use the same input type or an "HH:MM" hint, with a dev fixture or Playwright project for the hours section (A11Y-18).

## B22 — Product dialog responsiveness

- Findings: PERF-01 (Should)
- Highest severity: Should
- Size: M
- Depends on: none
- Design: in-chat
- Acceptance criteria:
  - The first tap is profiled with the React Profiler under 4x CPU throttling and the cause recorded.
  - Dialog content and gallery mount only while open, or one shared dialog replaces per-card dialogs.
  - With the W9 measurement script, the maximum interaction duration is at most 200 ms (PERF-01 sketch).

## B23 — Guest page payload

- Findings: PERF-03 (Should), PERF-04 (Could), PERF-05 (Could)
- Highest severity: Should
- Size: M
- Depends on: none
- Design: in-chat
- Acceptance criteria:
  - Storefront and tracking routes receive only the namespaces they use; the HTML has no keys from unrelated namespaces such as Auth, LiveWorkspace or Marketing, and the document size is re-measured (PERF-03 sketch).
  - Fonts are subset `woff2` served through `next/font/local`, unused weights are dropped, and an unneeded face is not requested (PERF-04).
  - The first one or two guest cards load eagerly with high fetch priority, list thumbnails request the 320 variant, measured on a fixture menu with photos (PERF-05).

## B24 — API read-path performance

- Findings: PERF-06 (Could), PERF-07 (Could), PERF-08 (Could)
- Highest severity: Could
- Size: M
- Depends on: B16 (PostgreSQL test stage for plans and statement counts)
- Design: in-chat
- Acceptance criteria:
  - `GetMenuAsync` reuses the resolved tenant, and the mapped menu is cached per tenant and locale keyed by `PublishedVersion` and photo changes (or served with `ETag` and a short `max-age`), with invalidation on publish and availability changes (PERF-06).
  - Order history drops the exact count or uses a keyset cursor, and search uses indexable columns; plans are checked with `EXPLAIN (ANALYZE, BUFFERS)` on seeded PostgreSQL (PERF-07).
  - Analytics uses split queries or SQL aggregates, with a test bounding statement and row counts for a seeded window (PERF-08).

## B25 — Outbox and email dispatcher robustness

- Findings: DATA-06 (Could), CODE-07 (Could)
- Highest severity: Could
- Size: M
- Depends on: none
- Design: in-chat
- Acceptance criteria:
  - Kitchen outbox rows end `Failed` after a maximum attempt count with an alert, and dispatched rows older than the retention period are deleted (DATA-06 sketch).
  - The email claim, lease and attempt logic sits behind an Application interface implemented in Infrastructure; a lease that keeps expiring ends `Failed`; dispatcher tests cover success, retry, the tenth attempt, a closed order and a crashed lease; an architecture test keeps `WhitePlate.Api` from referencing Infrastructure persistence outside registration (CODE-07 sketch).

## B26 — Server-generated tracking capability

- Findings: PUB-03 (Could)
- Highest severity: Could
- Size: S
- Depends on: none
- Design: in-chat
- Acceptance criteria:
  - The API generates the tracking capability with `RandomNumberGenerator` (or the existing HMAC capability) and returns it once; client-chosen tokens are ignored or rejected after the documented compatibility window, and an all-zero token is refused (PUB-03 sketch).
  - ADR 0006 and the API contract are updated.

## B27 — CI and supply-chain gates

- Findings: CFG-07 (Could), CFG-08 (Could), CFG-10 (Could), CODE-10 (Could), CODE-14 (Could)
- Highest severity: Could
- Size: M
- Depends on: B09 (so the audit gate starts green)
- Design: in-chat
- Acceptance criteria:
  - Actions are pinned to commit SHAs with Dependabot for actions, npm, NuGet and Docker; CI runs `npm audit --omit=dev --audit-level=high`, `dotnet list package --vulnerable --include-transitive` and an API `docker build`, with `persist-credentials: false` (CFG-07).
  - Both Docker bases are pinned by digest, the image has a health probe without shipping `curl` (or a `HEALTHCHECK` if it stays), and `.dockerignore` excludes `**/.env.*` and `**/*.sql` (CFG-08).
  - `apps/api/brand-media-migrations.sql` is removed or regenerated as a documented, dated artifact outside the build context (CFG-10).
  - `npm run format` is applied once, CI runs the full `format:check`, and a root `.gitattributes` fixes line endings (CODE-10).
  - Coverage is reported for both suites, first report-only, then with a floor for security-relevant folders (CODE-14).

## B28 — Code hygiene

- Findings: CFG-09 (Could), CODE-08 (Could), CODE-11 (Could), CODE-12 (Could), CODE-13 (Could)
- Highest severity: Could
- Size: M
- Depends on: D12 for CODE-11
- Design: in-chat
- Acceptance criteria:
  - No `*-test` fixture route is in the production build output, and all fixtures use one `assertDevelopmentFixture()` helper (CFG-09 sketch).
  - `OrderRepository`, `CatalogRepository` and the two largest test classes are split by feature, with tenant predicates in one shared helper (CODE-08).
  - The `<img>` decision is recorded per area and lint runs with an agreed `--max-warnings` (CODE-11).
  - `AGENTS.md:37` and `docs/documentation-review.md` no longer ask contributors to report the resolved lint failure, and the weather-sample test file is renamed to `OpenApiAndHostingTests` (CODE-12). This audit added a resolution note to `documentation-review.md`; `AGENTS.md` is outside the audit's docs-only scope.
  - Catalog history returns an actor display name and no `actorSubject` or `actorIssuer`; a former member shows null (CODE-13 sketch).

## Unbatched Could findings

These wait for an owner decision before they can be shaped into a change.

| Finding | Severity | Waiting on | Note |
| --- | --- | --- | --- |
| PERF-02 | Could | D2 | Public product photo caching versus ADR 0008's `no-store`. Once decided, it fits B23 or B24. |
| PUB-04 | Could | D6 | Abuse control for anonymous unpaid orders that reserve pickup capacity. Once decided, it fits B08. |

## Owner decisions

Each decision becomes a Backlog card. A batch that depends on one does not start until it is recorded (in an ADR, the API contract, or the deployment runbook).

| ID | Decision | Findings | Blocks |
| --- | --- | --- | --- |
| D1 | Session lifetime policy: idle limit, absolute limit, re-authentication for owners and payout settings, kitchen-display exception | AUTH-04 | B04 |
| D2 | Public product photo caching: keep `no-store` (ADR 0008:30), short `max-age`, `ETag` revalidation, or long-lived caching with accepted takedown delay | PERF-02 | PERF-02 |
| D3 | Storefront and subdomain name reservation, creation quotas, and whether new storefronts need approval | SEC-04 | B07 |
| D4 | Network path from Vercel functions to PostgreSQL (Vercel Static IPs or Secure Compute allow-list, private tunnel, or interim firewall only) | HOST-02 | B11 |
| D5 | Whether a 15-minute stateless API token window after sign-out or password reset is acceptable (ADR 0002) | AUTH-01 | B03 |
| D6 | Abuse control for anonymous pay-at-pickup orders (daily cap, confirmation, challenge, bulk cancel, or required payment) | PUB-04 | PUB-04 |
| D7 | Accept one-step analytics withdrawal by email (Art. 7(3)) and its integrity trade-off, or require a confirmation link | PUB-06 | B08 (PUB-06 part) |
| D8 | Co-owner equality and removal rules | SEC-02 | B06 |
| D9 | Whether owners keep read access to a deactivated restaurant's history | SEC-01 | B05 (SEC-01 part) |
| D10 | Breached-password check: external k-anonymity egress (Have I Been Pwned) or a local list | AUTH-03 | B04 (AUTH-03 part) |
| D11 | Catalog drafts: per-entity concurrency tokens or recorded last-writer-wins | DATA-05 | B16 (DATA-05 part) |
| D12 | `<img>` versus `next/image` per area | CODE-11 | B28 (CODE-11 part) |

## Kanban cards (to create)

Not created yet: the GitHub token lacks the `project` scope, so the cards could not be added to the [WhitePlate project kanban](https://github.com/users/whritou/projects/1/views/1). Create them once the scope is granted. Per the audit spec, the Blocker batch goes to `Ready`, every other batch and every decision to `Backlog`. Each card cites its finding IDs and copies the batch's acceptance criteria from this file.

| Card title | Column | Findings |
| --- | --- | --- |
| B01 Production API recovery and migration guardrails | Ready | HOST-01, DATA-01, HOST-06, CODE-06, HOST-05, DATA-02 |
| B02 API token confinement | Backlog | SEC-06, CODE-02, SEC-05 |
| B03 API JWT validation and token lifetime | Backlog | AUTH-02, AUTH-01 |
| B04 Better Auth account and session policy | Backlog | AUTH-03, AUTH-04, AUTH-06, CODE-02, AUTH-05, AUTH-07, CFG-04 |
| B05 Restaurant permission enforcement | Backlog | SEC-08, SEC-09, CODE-01, SEC-01, SEC-03 |
| B06 Membership and co-owner removal | Backlog | SEC-02 |
| B07 Organization and storefront creation limits | Backlog | SEC-04 |
| B08 Public rate limiting and trusted client address | Backlog | PUB-01, CODE-05, PUB-06, PUB-07 |
| B09 Next.js and runtime dependency update | Backlog | CFG-01, CFG-02, CFG-03 |
| B10 Security response headers | Backlog | HOST-03, CFG-05, HOST-07 |
| B11 Database network exposure | Backlog | HOST-02, HOST-09 |
| B12 Off-host backups and restore test | Backlog | DATA-07 |
| B13 API production configuration hardening | Backlog | HOST-04, CFG-06, DATA-03, HOST-08 |
| B14 Stripe Connect tests and callback binding | Backlog | CODE-04, SEC-10, PUB-05 |
| B15 BFF input and origin guards | Backlog | CODE-03, SEC-07, CODE-09 |
| B16 Catalog publication consistency and PostgreSQL tests | Backlog | CODE-06, DATA-04, PUB-02, DATA-05 |
| B17 Page titles and language marking | Backlog | A11Y-01, A11Y-06 |
| B18 Focus visibility, focus return and announcements | Backlog | A11Y-02, A11Y-08, A11Y-09 |
| B19 Contrast and link distinction | Backlog | A11Y-03, A11Y-04, A11Y-05, A11Y-13 |
| B20 Storefront control names and footer | Backlog | A11Y-10, A11Y-14, A11Y-15, A11Y-16 |
| B21 Workspace menu builder, analytics and context switcher | Backlog | A11Y-07, A11Y-11, A11Y-12, A11Y-19, A11Y-17, A11Y-18 |
| B22 Product dialog responsiveness | Backlog | PERF-01 |
| B23 Guest page payload | Backlog | PERF-03, PERF-04, PERF-05 |
| B24 API read-path performance | Backlog | PERF-06, PERF-07, PERF-08 |
| B25 Outbox and email dispatcher robustness | Backlog | DATA-06, CODE-07 |
| B26 Server-generated tracking capability | Backlog | PUB-03 |
| B27 CI and supply-chain gates | Backlog | CFG-07, CFG-08, CFG-10, CODE-10, CODE-14 |
| B28 Code hygiene | Backlog | CFG-09, CODE-08, CODE-11, CODE-12, CODE-13 |
| Decision D1: session lifetime policy | Backlog | AUTH-04 |
| Decision D2: public product photo caching | Backlog | PERF-02 |
| Decision D3: storefront name reservation and approval | Backlog | SEC-04 |
| Decision D4: Vercel-to-PostgreSQL network path | Backlog | HOST-02 |
| Decision D5: API token window after sign-out | Backlog | AUTH-01 |
| Decision D6: unpaid order abuse control | Backlog | PUB-04 |
| Decision D7: analytics withdrawal confirmation | Backlog | PUB-06 |
| Decision D8: co-owner equality and removal | Backlog | SEC-02 |
| Decision D9: deactivated restaurant history access | Backlog | SEC-01 |
| Decision D10: breached-password check | Backlog | AUTH-03 |
| Decision D11: catalog draft concurrency | Backlog | DATA-05 |
| Decision D12: `<img>` versus `next/image` | Backlog | CODE-11 |

The umbrella audit card, once created, records the verdict, coverage gaps and verification results from [README.md](README.md) and moves to `In review` with the pull request.
