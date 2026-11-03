# W8 — Hosted posture (read-only)

## Scope and method

Audit date 2026-10-25, probes between 13:34 and 13:39 UTC, from the owner's Windows workstation. Audited source base is the `origin/main` ref as last fetched on 2026-10-19 (`55f31a5`); a fetch on 2026-10-25 failed on this workstation (TLS interception), so newer commits may already be deployed (HOST-05).

Origins (owner-provided on 2026-10-25, the only hosts probed):

| Role | Origin |
| --- | --- |
| Production frontend (Vercel) | `https://white-plate.vercel.app` |
| Production API (Coolify, Traefik) | `https://wqyrztj6uyuwlveq75qrl68t.<VPS-IP>.sslip.io` (the host label embeds the VPS IPv4 address; it is redacted here, and `$API` below stands for the full origin) |
| Preview | Not applicable. The owner states there is no Preview environment. |
| Tenant storefront | No tenant DNS exists. The shared-domain path `https://white-plate.vercel.app/{locale}/{storefront-name}` is used. No public storefront name is recorded in the documentation, so a random name was probed. |

Rules followed: unauthenticated `GET`, `HEAD` and `OPTIONS` only; one TCP connect test; no `POST`, sign-in, account creation or write; 15 sequential requests in the only rate-limit probe (the limit is 20); no tool downloaded or installed. OWASP ZAP was not approved and is recorded as Not run. Raw output stays in the session scratchpad.

Probes run (`$FE` is the frontend origin):

| Probe | Result |
| --- | --- |
| `curl -sSI $API/`, `GET $API/health/live`, `/health/ready`, `/openapi/v1.json`, `/swagger`, `/nonexistent-zz`, `/api/v1/organizations` | All `HTTP 503`, body `no available server` (20 bytes), `Content-Type: text/plain`, `X-Content-Type-Options: nosniff`, `Alt-Svc: h3=":443"`. No `x-request-id`, `x-error-code` or problem+json. Re-probed at 13:39 UTC: `/health/live` and `/health/ready` still 503. |
| `OPTIONS $API/api/v1/organizations` with `Origin: https://evil.example` | `HTTP 503`, same proxy body, no CORS headers. The preflight never reached Kestrel. |
| `GET http://$API/` (plain HTTP, port 80) | `HTTP 404`, Traefik text body, no redirect to HTTPS. |
| `GET $FE/`, `/fr`, `/en`, `/en/sign-in` | `/` is 307 to `/en`; the others are 200 HTML. Headers in the table below. |
| `GET http://white-plate.vercel.app/` | 308 to HTTPS. |
| `GET $FE/fr/organization` and `/en/organization`, signed out | 307 to `/fr/sign-in` and `/en/sign-in`. The 307 body is the app shell with a redirect marker; it contains no organization data. |
| `GET $FE/en/order/<random uuid>` and `/en/order/not-a-uuid` | 200 with `<meta name="robots" content="noindex, nofollow"/>` and "This tracking link is incomplete" copy (random UUID); 404 (not-a-uuid). No order data. |
| `GET $FE/en/some-restaurant`, `/en/nonexistent-zz` | 200, `X-Matched-Path: /[locale]/storefront-preview/[restaurantSlug]`, copy "This restaurant menu is temporarily unavailable" (consistent with the API outage). |
| 12 fixture routes × `en` and `fr` (24 requests, the `studio-parity-test` pair by `HEAD`): `brand-design-test`, `catalog-design-test`, `design-system-test`, `establishment-design-test`, `live-workspace-test`, `order-history-test`, `orders-kanban-test`, `photo-design-test`, `photo-guest-design-test`, `studio-parity-test`, `workspace-toast-test`, `__test__` | All 24 return 404 (`X-Matched-Path: /[locale]/design-system-test` confirms the page's own `notFound()` ran). |
| `GET $FE/.well-known/openid-configuration` | 200 JSON with `issuer`, `jwks_uri` and algorithm metadata only. |
| `GET $FE/api/auth/jwks` | 200; one RSA key with members `alg`, `e`, `kid`, `kty`, `n` only (no private members). |
| `GET $FE/api/auth/ok`, `/api/auth/get-session`, `/api/auth/token` | 200 `{"ok":true}`; 200 `null` with `Cache-Control: no-store`; 404. |
| Anonymous `GET` of `/api/kitchen/orders`, `/api/kitchen/signalr-token`, `/api/brand-assets`, `/api/public/establishment`, `/api/public/orders/<uuid>/tracking` | 400 `{"ok":false,"error":"invalid"}`, 405, 400, 404 `not_found`, 405. No data and no stack traces. |
| `OPTIONS` with `Origin: https://evil.example` on `$FE/api/kitchen/orders` and `$FE/api/auth/get-session`; `GET` with that origin on `get-session` | 204 with `Allow` only; no `Access-Control-Allow-Origin` echoed. |
| Malformed paths `/en/%00`, `/en/order/%ZZ`, `/_next/static/chunks/nonexistent.js`, `/api/nonexistent` | 400 `Bad request` plain text with a Vercel request id; 400; 404; 404. No stack trace, framework version or internal host name. |
| Rate-limit probe: 15 sequential `GET $FE/api/public/establishment` | 15 × 404; no `RateLimit-*`, `X-RateLimit-*`, `Retry-After` or 429. Not a checkout endpoint (see Not covered). |
| `Test-NetConnection <documented Coolify PostgreSQL host> -Port 5433` (connect only) | `TcpTestSucceeded=True`. |
| TLS: `curl -vI` and `openssl s_client` against both origins | Both negotiate TLS 1.3 (`TLS_AES_256_GCM_SHA384`). The issuer seen locally is "Avast Web/Mail Shield Root" for both hosts (see limitation below). Validity seen: frontend `2026-08-29` to `2026-11-27`; API `2026-10-05` to `2027-01-03`. |

TLS limitation: this workstation runs Avast Web/Mail Shield TLS interception. The local leaf certificate is re-signed by Avast, so the real issuer, chain and negotiated protocol of the upstream connection cannot be confirmed from here. Avast copies the upstream validity dates and subject, so the dates above are the best available evidence that neither certificate is expired. A scan from a non-intercepting network is still needed for the issuer, the chain and legacy-protocol rejection.

Security headers observed on `$FE` HTML responses (`/en`, `/fr`, `/en/sign-in`, `/en/order/...`, `/en/some-restaurant`):

| Header | Observed |
| --- | --- |
| `Strict-Transport-Security` | `max-age=63072000; includeSubDomains; preload` (set by Vercel) |
| `Content-Security-Policy` | Absent |
| `X-Content-Type-Options` | Absent on pages and auth routes; present only on `/api/brand-assets` |
| `Referrer-Policy` | Absent |
| `Permissions-Policy` | Absent |
| `X-Frame-Options` / CSP `frame-ancestors` | Absent |
| `Server` | `Vercel` |
| `X-Powered-By` | `Next.js` (no version) |
| `Cache-Control` on dynamic pages | `private, no-cache, no-store, max-age=0, must-revalidate` |

## Findings

### HOST-01 — Production API returns 503 "no available server" on every route

- **Workstream:** W8
- **Location:** `$API` (Coolify/Traefik in front of resource `wqyrztj6uyuwlveq75qrl68t`); healthcheck defined at `docs/deployment/coolify.md:228`; `/health/live` mapped with no dependencies at `apps/api/WhitePlate.Api/Program.cs:65`
- **Evidence:** `curl -sS -D - $API/health/live`, `/health/ready`, `/api/v1/organizations` and an `OPTIONS` preflight all returned `HTTP/1.1 503 Service Unavailable`, body `no available server`, between 13:34:41 and 13:34:44 UTC; `/health/live` and `/health/ready` were still 503 at 13:39 UTC. The controller confirmed the same earlier on 2026-10-25. The responses carry no `x-request-id`, `x-error-code` or problem+json, so the request never reached Kestrel. The organization page renders `Auth.serviceError` ("We couldn’t reach WhitePlate"), which the owner reported. The same signature is recorded for 2026-10-10 at `docs/deployment/coolify.md:53-75`. The cause is Suspected only (container failing its `/health/ready` database check so Traefik drops it, or a stopped or crash-looping container); Coolify access is needed to tell which.
- **Impact:** All API-backed behaviour is down in Production: sign-in organization lists, restaurant management, kitchen orders, public menus, checkout and order tracking. Guests cannot place orders; staff cannot see them.
- **Severity:** Blocker
- **Fix direction:** Owner-side Coolify checks, in this order. (1) Resource status (Running, Degraded, Exited, Restarting) and whether a deploy or reboot followed the 2026-10-12 rollout. (2) `docker inspect --format '{{json .State.Health}}'` and `docker logs --since 24h` for Npgsql errors: CA permission denied, `pg_hba` rejection, password failure. (3) Readability of the mounted CA (`/etc/ssl/certs/coolify-ca.crt`) as the application user, compared with the host file by fingerprint and inode, because the 2026-10-10 incident was an unreadable mounted CA and the process that rewrote the host inode was never identified (`docs/deployment/coolify.md:75`). (4) Internal `curl http://localhost:8080/health/ready`. (5) After recovery, verify externally: `/health/live` and `/health/ready` return 200 `Healthy` and anonymous `/api/v1/organizations` returns 401. Do not change TLS verification. Prevention is HOST-06.
- **Regression test:** Sketch below
- **Status:** Confirmed

```text
Request:  GET $API/health/live   (and /health/ready, anonymous /api/v1/organizations)
Expected: 200 "Healthy" (live, ready); 401 problem+json with x-request-id (organizations)
Actual:   503 "no available server", no x-request-id (2026-10-25 13:34-13:39 UTC)
```

### HOST-02 — Documented PostgreSQL port 5433 is reachable from the Internet

- **Workstream:** W8
- **Location:** The documented Coolify PostgreSQL host, TCP port 5433 (`docs/deployment/coolify.md:111`, `:238`, `:245`; `docs/documentation-review.md:90`; `apps/frontend/lib/auth-database.test.ts:14`)
- **Evidence:** `Test-NetConnection <documented Coolify PostgreSQL host> -Port 5433` returned `TcpTestSucceeded=True` from the audit workstation at about 13:37 UTC. This was a TCP connect only; no authentication, query or TLS negotiation was attempted. The docs describe this as a user-approved public proxy (`docs/deployment/coolify.md:245`) and record that plaintext and administrator connections are rejected, that TLS is verified, and that `pg_hba` cannot separate roles by source because the proxy appears as an internal address (`docs/documentation-review.md:90`). `docs/deployment/coolify.md:245` itself warns not to assume a host firewall protects a Docker-published port. The IPv4 address is also embedded in the API's `sslip.io` host name, so it is not a secret.
- **Impact:** Any Internet host can reach the database listener and attempt password guessing, connection exhaustion or pre-authentication protocol exploits against PostgreSQL. Credentials plus TLS are the only barrier. The database holds every tenant's data and the Better Auth tables.
- **Severity:** Should
- **Fix direction:** The frontend connects directly from Vercel functions (`apps/frontend/lib/auth-database.ts`), so restricting the port to the API host alone would break sign-in. Options: Vercel Static IPs or Secure Compute and allow-list those; or move the Better Auth database access behind a private channel (tunnel or private network); and meanwhile enforce a host firewall rule for the Docker-published port (for example in the `DOCKER-USER` chain), connection-rate limiting, SCRAM-only logins with long random passwords, and alerting on failed authentications. Avoid copying credential URLs that use the real host into fixtures (the address is also in the API host name, so this is hygiene only).
- **Regression test:** Sketch below
- **Status:** Confirmed

```text
Request:  TCP connect to <documented Coolify PostgreSQL host>:5433 from a non-allow-listed network
Expected: connection refused or timed out
Actual:   TcpTestSucceeded=True (2026-10-25)
```

### HOST-03 — Frontend sends no CSP, Referrer-Policy, Permissions-Policy, framing or nosniff headers

- **Workstream:** W8
- **Location:** `apps/frontend/next.config.ts:1-12` and `apps/frontend/proxy.ts:1-28` (no `headers()` or header middleware); hosted `$FE` responses
- **Evidence:** `curl -sSI $FE/en`, `/fr`, `/en/sign-in` returned only `Strict-Transport-Security` (Vercel default) among the expected security headers. `Content-Security-Policy`, `Referrer-Policy`, `Permissions-Policy`, `X-Frame-Options`/`frame-ancestors` were absent on every page. `X-Content-Type-Options: nosniff` appeared only on `/api/brand-assets`. Neither `next.config.ts` nor `proxy.ts` sets any header.
- **Impact:** The sign-in, sign-up, password-reset and workspace pages can be framed by any site (clickjacking). No CSP limits the impact of an injected script. The tracking page (a capability URL) and workspace URLs leak through `Referer`. Browser features are not restricted.
- **Severity:** Should
- **Fix direction:** Add a `headers()` block in `next.config.ts` (or middleware) with `X-Content-Type-Options: nosniff`, `Referrer-Policy: strict-origin-when-cross-origin` (or `no-referrer` on `/[locale]/order/*`), a `Permissions-Policy` that disables unused features, `frame-ancestors 'none'` plus `X-Frame-Options: DENY`, and a CSP (start in report-only; Next.js needs nonces for inline scripts). Keep Vercel's HSTS.
- **Regression test:** Sketch below
- **Status:** Confirmed

```text
Request:  GET $FE/en/sign-in
Expected: Content-Security-Policy (with frame-ancestors), Referrer-Policy, Permissions-Policy, X-Content-Type-Options: nosniff
Actual:   none of the four present; only Strict-Transport-Security
```

### HOST-04 — Production API is configured to publish OpenAPI and Swagger UI

- **Workstream:** W8
- **Location:** `docs/deployment/coolify.md:217` (`Swagger__Enabled` = `true`); `apps/api/WhitePlate.Api/Program.cs:37-60` (`MapOpenApi` and `UseSwaggerUI` when `Swagger:Enabled`)
- **Evidence:** The Production runtime variable table sets `Swagger__Enabled` to `true` "for current development verification; reassess before production use". Source maps `/openapi/v1.json` and Swagger UI when that flag is set. The hosted check could not be made: `GET $API/openapi/v1.json` and `/swagger` returned the proxy's 503 (HOST-01). Whether the flag is still set in the live resource is therefore unverified.
- **Impact:** If still enabled, anyone can download the full contract (every route, DTO and error shape) and use Swagger UI against the production API, which lowers the cost of probing for authorization gaps.
- **Severity:** Should
- **Fix direction:** Set `Swagger__Enabled=false` (or remove it) in the Production Coolify resource and redeploy. Re-check `/openapi/v1.json` and `/swagger` return 404 once the API is healthy. Keep the contract in `docs/api/` for developers.
- **Regression test:** Sketch below
- **Status:** Suspected

```text
Request:  GET $API/openapi/v1.json ; GET $API/swagger
Expected: 404 problem+json
Actual:   not testable (503 from proxy); documented configuration says enabled
```

### HOST-05 — Deployed commits are not recorded or exposed, so "audited code is production code" is an assumption

- **Workstream:** W8
- **Location:** `docs/deployment/coolify.md:116` (Vercel `e13860e`) and the API rollout notes (`0732e79`, `d2738dc`); hosted `$FE` and `$API` responses
- **Evidence:** The runbook records old deployed SHAs only (Vercel `e13860e`, API `d2738dc` and `0732e79`), none for the current releases. Neither origin exposes a build identifier: the `$FE` responses carry no version or commit header (headers table above) and the API could not be probed (HOST-01). The hosted frontend does serve `X-Matched-Path: /[locale]/storefront-preview/[restaurantSlug]`, which exists in the audited tree, so it is at least recent. The audited base is the `origin/main` ref as last fetched on 2026-10-19 (`55f31a5`). A `git fetch` on 2026-10-25 failed on this workstation (TLS interception, noted above), so newer commits may already be deployed. Without recorded or exposed deployed SHAs the audit cannot confirm that audited code equals deployed code. Suspected because the deployed SHAs may well match; that cannot be proven from here.
- **Impact:** An audit, or an incident investigation, cannot show that the code reviewed is the code customers run, and findings may describe code that is no longer (or not yet) deployed.
- **Severity:** Could
- **Fix direction:** Record the deployed Vercel and API commit SHAs for each release in `docs/deployment/coolify.md`. Expose a build or version identifier, for example an unauthenticated `/version` route or a response header carrying the commit SHA, on both the frontend and the API, so audits and incidents can confirm it.
- **Regression test:** None
- **Status:** Suspected

### HOST-06 — No health alerting; the same outage signature has recurred

- **Workstream:** W8
- **Location:** `docs/deployment/coolify.md:53-75` (2026-10-10 incident, cause "has not been identified"); `docs/deployment/coolify.md:228` (Coolify routes on `/health/ready`)
- **Evidence:** The 2026-10-10 incident (unreadable mounted CA) and the 2026-10-25 outage (HOST-01) both present as proxy-level `no available server` on every route, including the dependency-free `/health/live`. The documentation lists no external uptime monitor or alert, and the owner discovered the 2026-10-25 outage through the organization page. Traefik drops the container when the readiness check, which includes a database connection, fails. Suspected because the absence of alerting outside the repository cannot be proven from here.
- **Impact:** Outages are found by users, not by operators, and last until someone looks. A transient database fault takes the whole API out of routing rather than returning a diagnosable API error.
- **Severity:** Should
- **Fix direction:** Add an external uptime check on `$API/health/live` and `$API/health/ready` and on `$FE/en/sign-in`, with an alert to the owner. Identify and fix the process that rewrites the mounted CA file (`docs/deployment/coolify.md:75`), or mount the CA as a directory. Consider pointing Coolify's routing healthcheck at `/health/live` and alerting separately on `/health/ready` so a database fault returns an API problem response with a trace ID.
- **Regression test:** None
- **Status:** Suspected

### HOST-07 — Frontend discloses `X-Powered-By: Next.js`

- **Workstream:** W8
- **Location:** `apps/frontend/next.config.ts:1-12` (no `poweredByHeader: false`); hosted `$FE` HTML responses
- **Evidence:** `curl -sSI $FE/fr` returned `X-Powered-By: Next.js`. No version number is disclosed; `Server` is `Vercel`.
- **Impact:** Names the framework, which helps targeted scanning. Low.
- **Severity:** Could
- **Fix direction:** Set `poweredByHeader: false` in `next.config.ts`.
- **Regression test:** None
- **Status:** Confirmed

### HOST-08 — Production API uses a temporary `sslip.io` host name

- **Workstream:** W8
- **Location:** `docs/deployment/coolify.md:204-207`; `$API`
- **Evidence:** The API is served at a `sslip.io` host name whose label embeds the VPS address. The runbook records that Coolify warns HTTPS on this temporary host name "is not recommended because Let's Encrypt may rate-limit certificate validation". The observed leaf is valid `2026-10-05` to `2027-01-03` (90 days; issuer not confirmable, see TLS limitation). `sslip.io` is a shared third-party domain.
- **Impact:** Certificate renewal depends on shared-domain issuance limits and a third-party DNS service. The next renewal falls near 2027-01-03; a failure would break TLS for the API and so the whole product.
- **Severity:** Could
- **Fix direction:** Move the API to an owned domain (for example `api.<owned-domain>`), then update `API_BASE_URL`, `PUBLIC_API_BASE_URL` and CORS. Until then, monitor certificate expiry (HOST-06).
- **Regression test:** None
- **Status:** Confirmed

### HOST-09 — Vercel Preview variables still reference the legacy database

- **Workstream:** W8
- **Location:** `docs/deployment/coolify.md:116`, `:245`, `:249`
- **Evidence:** The runbook (`docs/deployment/coolify.md:249`) says: "Preview's old Render database target is also operator-reported; full Preview environment isolation remains to be reviewed". The owner states that no Preview environment is in use today, so the hosted Preview probe is Not applicable. The Vercel Preview variables themselves cannot be read from here; this is documentation only.
- **Impact:** If the Vercel git integration builds a preview for any branch or pull request, the preview could connect to the legacy database with whatever credentials remain valid, or fail. The documented review of Preview isolation is still open.
- **Severity:** Could
- **Fix direction:** Remove or disable Preview deployments, or replace the Preview variables with a separate test database and distinct `BETTER_AUTH_SECRET`. Delete the legacy Render database credentials if it is retired.
- **Regression test:** None
- **Status:** Suspected

## Checked, no finding

- Security headers, HSTS: Vercel sets `Strict-Transport-Security: max-age=63072000; includeSubDomains; preload` on every frontend response (`$FE/`, `/en`, `/en/sign-in`), and plain HTTP redirects to HTTPS (308).
- Stack traces and internals: malformed paths, anonymous BFF reads and 404 pages returned no stack trace, framework version, file path or internal host name. `Server` is `Vercel`; the proxy 503 body is a fixed 19-character string (20 bytes with the newline).
- Fixture routes absent in Production: all 24 `*-test` and `__test__` requests returned 404. The page's own gate ran (`apps/frontend/app/[locale]/design-system-test/page.tsx:7`, and the same `notFound()` guard in `brand-design-test/page.tsx:9`, `catalog-design-test/page.tsx:176`, `establishment-design-test/page.tsx:11`, `live-workspace-test/page.tsx:39`, `order-history-test/page.tsx:42`, `orders-kanban-test/page.tsx:12`, `photo-design-test/page.tsx:10`, `photo-guest-design-test/page.tsx:9`, `studio-parity-test/page.tsx:9`, `workspace-toast-test/page.tsx:8`); `__test__` does not exist in source.
- Guard styles differ: `establishment-design-test`, `live-workspace-test` and `studio-parity-test` use `NODE_ENV === "production"`, while the others use `!== "development"`. Both return 404 on Vercel Production; the `=== "production"` form would render the fixture in any non-production, non-development environment (for example a test build), so the two styles are not equivalent.
- Protected pages signed out: `/fr/organization` and `/en/organization` return 307 to the localized sign-in page; the body carries no organization data.
- Public order tracking: a random UUID page shows only generic "tracking link incomplete" copy with `noindex, nofollow` (`/en/order/<uuid>`); a malformed ID is 404. The tracking API accepts only `POST` (`apps/frontend/app/api/public/orders/[orderId]/tracking/route.ts:15`) and returned 405 to `GET`. No order existence is revealed.
- Public key material: `/.well-known/openid-configuration` carries issuer and algorithm metadata only (`apps/frontend/app/.well-known/openid-configuration/route.ts:6-18`). `/api/auth/jwks` returned one RS256 public key with `alg`, `e`, `kid`, `kty`, `n` only.
- Frontend CORS: `OPTIONS` and `GET` with `Origin: https://evil.example` on `/api/kitchen/orders` and `/api/auth/get-session` returned no `Access-Control-Allow-Origin`. `Access-Control-Allow-Origin: *` appears only on Vercel-served static assets and prerendered public pages (`/en/demo`, `/_next/static/*`), which carry no per-user data.
- Auth token endpoint: `/api/auth/token` returns 404 (the blocked route noted in W1).
- Anonymous `get-session` returns `null` with `Cache-Control: no-store`.
- API CORS policy in source: explicit origin list, no wildcard (`apps/api/WhitePlate.Api/Configuration/ServiceRegistration.cs:76-80`, `docs/deployment/coolify.md:215`). Hosted behaviour is Not covered (below).
- Plain HTTP on the API host returned 404 with no content, not an HTTP application response; the runbook states HTTP-to-HTTPS redirect is enabled in Coolify (`docs/deployment/coolify.md:207`). While the API is unhealthy the router set may differ, so redirect behaviour is re-checked once HOST-01 is closed.
- Preview environment: Not applicable (owner: none exists); documented stale variables are HOST-09.

## Not covered

- API response headers, CORS preflight with a foreign origin, OpenAPI absence, error body shape, 404 shape and the `Server`/`X-Powered-By` headers of the API: every API route returned the Traefik 503, so nothing from Kestrel could be observed. Reason: API unavailable (HOST-01). Source shows no security-header middleware, rate limiter or HSTS in `apps/api/WhitePlate.Api/Program.cs`, which is for W5 to weigh.
- Rate-limit headers on checkout endpoints: the checkout and quote endpoints are on the unavailable API, and `POST` is not allowed. The only rate-limit probe was 15 sequential `GET` requests to a public frontend route, which showed no rate-limit headers and no 429. That is not a result for checkout.
- Unknown-storefront semantics: `/en/<random>` returned 200 "temporarily unavailable" copy instead of a localized not-found, which matches the API being down (the page cannot tell "unknown" from "unreachable"). Re-test after recovery: expect 404 for an unknown name and a menu for a real one. No public storefront name is documented, so a real storefront was not loaded.
- TLS issuer, chain and legacy protocol rejection: local Avast TLS interception (see Scope and method). Run a scan from a non-intercepting network.
- Frontend rate limiting for sign-in and sign-up: needs `POST`.
- ZAP baseline: Not run (not approved).
- Hosted two-tenant behaviour and tenant DNS: no tenant DNS exists.
- Vercel and Coolify consoles: configuration (Production variables, deployed SHAs, Preview settings) was not read; those items rest on the runbook and are Suspected where noted.

## ASVS / WCAG coverage

ASVS 4.0.3 Level 2, chapters named for this task:

| Requirement | Status | Basis |
| --- | --- | --- |
| V9.1 Communications security (TLS) | Partial | TLS 1.3 negotiated and HSTS present on the frontend; API HSTS, issuer and legacy-protocol checks Not covered (HOST-01, TLS limitation). HOST-08 for the API host name. |
| V14.3 Unintended security disclosure | Partial | No stack traces or internal names on the frontend; `X-Powered-By` present (HOST-07); API disclosure and OpenAPI exposure unverified (HOST-04). |
| V14.4 HTTP security headers | Not met | HOST-03; API headers not observable. |
| V14.5 HTTP request header validation | Partial | CORS rejects the foreign origin on the frontend; API CORS Not covered. Malformed paths return 400/404 without detail. |

WCAG: out of scope for W8 (see W6).
