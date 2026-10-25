# W2 — Authentication and session

## Scope and method

Audit date 2026-10-25. Audited code is `origin/main` `55f31a5`; this branch adds only documentation (`git diff 55f31a5 HEAD -- apps` is empty). Better Auth is the installed `better-auth` 1.7.6 and `@better-auth/core` 1.7.6 from `npm ci` against the checked-in lockfile. Library citations below are paths inside `apps/frontend/node_modules/` of that install.

Read: `apps/frontend/lib/auth.ts`, `lib/auth-client.ts`, `lib/email.ts`, `lib/api/email-delivery.ts`, `lib/api/index.ts`, `app/api/auth/[...all]/route.ts`, `app/.well-known/openid-configuration/route.ts`, `app/api/kitchen/signalr-token/route.ts`, `hooks/use-auth-form.ts`, `components/auth/*`, the sign-in, sign-up, forgot/reset-password, verify-email and invitation pages, `scripts/dev-token.mjs`, `apps/api/WhitePlate.Api/Program.cs`, `Configuration/ServiceRegistration.cs`, `Identity/HttpCurrentIdentity.cs`, `Controllers/StaffInvitationsController.cs`, the staff-invitation domain, application and repository code, `docs/architecture/decisions/0002-authentication.md`, and the Better Auth routes, cookie, rate-limit, IP, origin-check, verification-storage, OAuth-linking and JWT-plugin sources. No auth-related source changed between the old base `7e5b2e3` and `55f31a5`: `git diff 7e5b2e3 55f31a5 --stat -- apps/frontend/lib apps/api/WhitePlate.Api/Identity apps/api/WhitePlate.Api/Configuration` touches none of the auth files; the `ServiceRegistration.cs` change adds Stripe Connect services (`ServiceRegistration.cs:36-44`), not authentication.

Local runtime probes (approved) ran against the Neon `test` database (`DATABASE_URL` host checked to end in `.neon.tech`; the production auth database is in Coolify) with the API on `http://localhost:5184` (Development, `Authentication__Issuer=http://localhost:3014`) and the frontend `next dev` on `http://localhost:3014` (Node 24.19.0). Configuration came from the main checkout's ignored environment files into the process environment only. `RESEND_API_KEY`, `RESEND_FROM_EMAIL` and `BETTER_AUTH_API_KEY` were removed from the probe environment so no real email or dashboard telemetry left the workstation. Each Better Auth request carried a distinct `X-Forwarded-For` address from `198.51.100.0/24` so the shared database rate-limit buckets of other local servers were not consumed. Test JWTs were minted in-process with Better Auth's server-only `signJWT` using the test database's own signing key. A second `.invalid` account was created through the sign-up endpoint the local sign-up page calls; its identifiers are in the ignored `apps/frontend/.acceptance/w2-probe-ids.json`. No token or password was printed or recorded. Both servers were stopped and ports 5184 and 3014 were confirmed closed.

The Neon `test` business schema is 11 EF migrations behind this code (controller note), so protected REST endpoints returned `500` after authentication succeeded (`GET /api/v1/me` and the invitation endpoints). Authentication-only API checks therefore used `POST /hubs/orders/negotiate?negotiateVersion=1`, which requires an authenticated user (`Program.cs:76-77`) and touches no business table.

| Probe | Result |
| --- | --- |
| API: no token; valid RS256 token (15 min) | 401; 200 |
| API: token expired 3 min, 4.5 min, 6 min ago | 200, 200, 401 `The token expired at …` |
| API: `alg: none`; HS256 signed with `BETTER_AUTH_SECRET`; RS256 with signature stripped | 401 `The signature is invalid`; 401 `The signature key was not found`; 401 `The signature is invalid` |
| API: wrong `aud`; wrong `iss` (`http://evil.localhost:3014`); `nbf` 10 min ahead | 401 `The audience '(null)' is invalid`; 401 `The issuer … is invalid`; 401 `The token is not valid before …` |
| Sign in (dev account), read `set-auth-jwt` from `GET /api/auth/get-session`, negotiate, `POST /api/auth/sign-out`, `get-session` again, negotiate again with the same JWT | 200; header present with `Access-Control-Expose-Headers: set-auth-jwt`; 200; 200; `200 null`; **200** |
| Sign-in, unknown email vs existing email with wrong password (3 pairs) | All `401 INVALID_EMAIL_OR_PASSWORD`; 285/265, 234/242, 208/216 ms |
| 12 sign-ins from one `X-Forwarded-For`, then 1 from another | `401` × 10, `429` × 2; then `401` |
| Sign-up new email vs existing email | Both `200 {"token":null,"user":{…}}` with the same keys; 555 ms vs 237 ms (one sample each, email delivery disabled) |
| Sign-up with 7-character password; with `password` | `400 PASSWORD_TOO_SHORT`; **200** (account created) |
| Sign-in of unverified probe account with correct password | `403 EMAIL_NOT_VERIFIED` |
| `GET /api/auth/verify-email` with a valid token twice; with an expired token | 302 `/en/sign-in` both times; 302 `/en/verify-email?error=TOKEN_EXPIRED` |
| `POST /api/auth/request-password-reset` existing vs unknown email; with `redirectTo: https://evil.example/steal` | Both `200 {"status":true,"message":"If this email exists in our system, …"}` (145 ms vs 173 ms, no delivery); `403 INVALID_REDIRECT_URL` |
| `auth.verification` row for the reset request | Identifier is `reset-password:` + the 24-character alphanumeric token in plain text; TTL 59 min 59.999 s |
| `POST /api/auth/reset-password` with that token, then again | `200 {"status":true}`; `400 INVALID_TOKEN`; the GET callback afterwards redirects with `error=INVALID_TOKEN` |
| Session cookie on local sign-in (HTTP) | `better-auth.session_token; Max-Age=604800; Path=/; HttpOnly; SameSite=Lax`; session `expiresAt − createdAt` = 7.00 days |
| `POST /api/auth/sign-out` with cookie and `Origin: https://evil.example`; with cookie and no Origin/Referer | 403; `403 MISSING_OR_NULL_ORIGIN` |
| `POST /api/auth/sign-in/email` with no cookie and `Sec-Fetch-Site: cross-site`, `Sec-Fetch-Mode: navigate`; with `Origin: https://evil.example` | `403 MISSING_OR_NULL_ORIGIN`; `403 INVALID_ORIGIN` |
| `POST /api/kitchen/signalr-token` with cookie and foreign Origin; with same Origin | 403; 200 with `accessToken` |
| `GET /api/auth/token` and variants `token/`, `//token`, `%74oken`, `TOKEN`, `token?x=1`, `./token`, `token%2F` (with cookie) | 404, 308 → `/api/auth/token`, 308 → `/api/auth/token`, then 404 for the rest; no body contains `token` |
| `POST /api/v1/invitations/accept` unauthenticated; with token `abc` | 401; 404. Other invitation probes Not covered (schema). |
| Hosted, unauthenticated `GET` (4 requests): `$FE/.well-known/openid-configuration`, `$FE/api/auth/jwks`, `$FE/api/auth/token` | 200, `issuer` `https://white-plate.vercel.app`, `id_token_signing_alg_values_supported: ["RS256"]`, `Cache-Control: public, max-age=300`; 200, one key `kty: RSA`, `alg: RS256`, `kid` present; 404 |

## Findings

### AUTH-01 — API JWTs stay valid for up to about 20 minutes after sign-out or password reset

- **Workstream:** W2
- **Location:** `apps/api/WhitePlate.Api/Configuration/ServiceRegistration.cs:45-66` (no `ClockSkew`, no revocation hook); `apps/frontend/lib/auth.ts:126-142` (`expirationTime: "15m"`, no session claim); `apps/frontend/lib/auth.ts:86` (password reset revokes only Better Auth sessions)
- **Evidence:** Local probe: a JWT read from `set-auth-jwt` on `GET /api/auth/get-session` returned 200 on `POST /hubs/orders/negotiate`; after `POST /api/auth/sign-out` returned 200 and `get-session` returned `null`, the same JWT still returned 200. Tokens expired 3 and 4.5 minutes earlier returned 200; 6 minutes earlier returned 401, which matches the JwtBearer default `ClockSkew` of 5 minutes. The JWT carries only `iat, email, email_verified, sub, exp, iss, aud` (no session id), and the API validates it statelessly from JWKS, so nothing ties it to the signed-out or reset session. The same token is readable by browser JavaScript through `set-auth-jwt` and `/api/kitchen/signalr-token` (W1 (SEC-06), re-verified here: header present with `Access-Control-Expose-Headers: set-auth-jwt`), which contradicts ADR 0002 ("Do not expose API tokens to client-side JavaScript").
- **Impact:** A token captured by an injected script, a shared device or a log keeps full API access for up to 15 minutes plus 5 minutes of skew after the user signs out, resets a compromised password or has the Better Auth session deleted. Membership changes are not affected (roles are read from the database per request).
- **Severity:** Should
- **Fix direction:** Set `TokenValidationParameters.ClockSkew` to 30-60 seconds. Decide and record in ADR 0002 whether a 15-minute stateless window after sign-out is acceptable; if not, shorten the API token lifetime (for example 5 minutes, refreshed by the BFF) or add a `sid` claim and reject tokens whose Better Auth session no longer exists for sensitive operations. Stop exposing the token to browser code as W1 recommends (`disableSettingJwtHeader`).
- **Regression test:** Sketch below
- **Status:** Confirmed

```text
Request:  POST /hubs/orders/negotiate with a JWT whose exp is 120 s in the past (API test host with a local JWKS)
Expected: 401 invalid_token (ClockSkew <= 60 s)
Actual:   200 (default ClockSkew 5 min; local probe with exp 180 s and 270 s in the past)
```

### AUTH-02 — JWT validation parameters are implicit library defaults and have no regression test

- **Workstream:** W2
- **Location:** `apps/api/WhitePlate.Api/Configuration/ServiceRegistration.cs:47-54`; `apps/api/tests/WhitePlate.Tests/Api/ErrorResponseTests.cs:98-108`, `apps/api/tests/WhitePlate.Tests/Api/BrandAssetsEndpointTests.cs:206-212`
- **Evidence:** Only `MetadataAddress`, `RequireHttpsMetadata`, `ValidIssuer` and `ValidAudience` are set. `ValidAlgorithms`, `ValidateLifetime`, `RequireExpirationTime`, `RequireSignedTokens` and `ClockSkew` come from Microsoft.IdentityModel defaults. API tests replace JwtBearer with test authentication schemes (`AddScheme<…, ProbeAuthenticationHandler>`, `MediaAuthentication`), so no test exercises signature, algorithm, issuer, audience or lifetime validation. Today's defaults do reject the attacks probed locally: `alg: none`, HS256 with the Better Auth secret, a stripped signature, a wrong `aud`, a wrong `iss`, a future `nbf` and an expiry older than the skew all returned 401.
- **Impact:** The API's only authentication control is untested. A library upgrade, a refactor of `AddWhitePlate` or a copy of the test scheme into production wiring could weaken validation without any failing test.
- **Severity:** Should
- **Fix direction:** Set the parameters explicitly (`ValidAlgorithms = ["RS256"]`, `ValidateIssuer/Audience/Lifetime = true`, `RequireExpirationTime = true`, `RequireSignedTokens = true`, a short `ClockSkew`). Add API integration tests that keep the real JwtBearer handler, point it at an in-memory signing key or JWKS, and assert 401 for each case in the table above and 200 for a valid token.
- **Regression test:** Sketch below
- **Status:** Confirmed

```text
Request:  GET /api/v1/me with (a) alg=none, (b) HS256, (c) wrong aud, (d) wrong iss, (e) expired beyond skew, (f) valid RS256
Expected: 401 for (a)-(e) with WWW-Authenticate: Bearer error="invalid_token"; (f) not 401
Actual:   no such test; behaviour verified only by manual local probe
```

### AUTH-03 — Password policy accepts 8-character and breached passwords

- **Workstream:** W2
- **Location:** `apps/frontend/lib/auth.ts:81-90` (no `minPasswordLength`, no breached-password plugin in `plugins` at `auth.ts:122-144`); `better-auth/dist/context/create-context.mjs:186-187` (defaults 8 and 128); `apps/frontend/components/auth/password-field.tsx:45-46`
- **Evidence:** Local probe: sign-up with a 7-character password returned `400 PASSWORD_TOO_SHORT`; sign-up with the password `password` returned 200 and created the account. The installed Better Auth ships a `haveIBeenPwned` plugin (`better-auth/dist/plugins/index.mjs:28`) that is not enabled.
- **Impact:** Owner and staff accounts that control restaurant catalogues, orders and payouts can use trivially guessable or known-breached passwords; the per-IP sign-in rate limit slows but does not prevent credential stuffing from many addresses. ASVS 2.1.1 (12 characters) and 2.1.7 (breached-password check) are not met.
- **Severity:** Should
- **Fix direction:** Set `emailAndPassword.minPasswordLength: 12` and the matching `minLength` in `password-field.tsx` with translated hints. Enable a breached-password check (Better Auth `haveIBeenPwned` uses a k-anonymity range query to an external service; record that egress decision) or a local top-passwords list.
- **Regression test:** Sketch below
- **Status:** Confirmed

```text
Request:  POST /api/auth/sign-up/email {"email":"new@whiteplate.invalid","password":"password",…}
Expected: 400 (too short / compromised)
Actual:   200, account created
```

### AUTH-04 — Sessions last 7 days, renew daily and have no idle or absolute limit

- **Workstream:** W2
- **Location:** `apps/frontend/lib/auth.ts:49-145` (no `session` options); `better-auth/dist/context/create-context.mjs:147-148` (`updateAge` 1 day, `expiresIn` 7 days); `better-auth/dist/cookies/index.mjs:49`
- **Evidence:** Local probe: sign-in set `better-auth.session_token; Max-Age=604800`; the session row's `expiresAt − createdAt` was 7.00 days. Better Auth extends the session once a day while it is used, so an active session never expires.
- **Impact:** A signed-in browser on a shared or stolen device keeps owner or staff access indefinitely while used and for 7 days when idle. ASVS 3.3.2 at Level 2 expects re-authentication after 12 hours or 30 minutes of inactivity. Kitchen displays may legitimately need long sessions, which is a product decision.
- **Severity:** Should
- **Fix direction:** Owner decision: set `session.expiresIn` and `session.updateAge` to an agreed idle limit (for example 12 hours) and add an absolute lifetime (for example re-authentication for organization owners and payout settings), or document a scoped exception for kitchen-display devices.
- **Regression test:** Sketch below
- **Status:** Confirmed

```text
Request:  POST /api/auth/sign-in/email (valid credentials), inspect Set-Cookie and session row
Expected: Max-Age and expiresAt within the agreed limit (for example <= 43200 s)
Actual:   Max-Age=604800, expiresAt − createdAt = 7 days, renewed daily
```

### AUTH-05 — Sign-up and password-reset timing reveals whether an email has an account

- **Workstream:** W2
- **Location:** `better-auth/dist/api/routes/sign-up.mjs:194-204` and `:241-249`; `better-auth/dist/api/routes/password.mjs:59-72` and `:73-87`; `better-auth/dist/context/create-context.mjs:215-221`; `apps/frontend/lib/auth.ts:87-98`; `apps/frontend/lib/api/email-delivery.ts:12-18`
- **Evidence:** Responses are identical in status and body (sign-up: generic duplicate response because `requireEmailVerification` is on; reset: same `status` and message), and delivery errors are swallowed by `runInBackgroundOrAwait`, so there is no status oracle. Timing differs by construction: without `advanced.backgroundTasks.handler`, `runInBackgroundOrAwait` awaits the email callback, so a new sign-up waits for a user insert plus a Resend HTTPS call (timeout 15 s) and an existing email only hashes the password; a reset for an existing account waits for a token insert plus the Resend call, while an unknown email does one lookup. Better Auth's own `send-verification-email` adds a 500 ms floor for exactly this reason (`better-auth/dist/api/routes/email-verification.mjs:97-118`); these two routes do not. Local sample with delivery disabled: sign-up new 555 ms vs existing 237 ms; reset 145 ms vs 173 ms (no network call locally, so the reset gap could not be shown).
- **Impact:** An attacker can learn which emails have WhitePlate accounts (restaurant owners and staff) by timing sign-up or reset requests, within the per-IP limits (5 sign-ups per minute, 5 resets per hour). ADR 0002 promises generic recovery responses.
- **Severity:** Could
- **Fix direction:** Configure `advanced.backgroundTasks.handler` with Next.js `after()` or the platform's `waitUntil` so email delivery is not awaited, or wrap both callbacks in a constant minimum response time.
- **Regression test:** Sketch below
- **Status:** Confirmed

```text
Request:  20 alternating POST /api/auth/request-password-reset for an existing and an unknown email (real delivery stubbed with a 300 ms delay)
Expected: median latency difference < 50 ms
Actual:   existing-email requests include the delivery delay (source)
```

### AUTH-06 — Password-reset tokens are stored in plain text

- **Workstream:** W2
- **Location:** `better-auth/dist/api/routes/password.mjs:73-79`; `better-auth/dist/db/internal-adapter.mjs:787-790` with `better-auth/dist/db/verification-token-storage.mjs:14-23` (`verification.storeIdentifier` unset in `apps/frontend/lib/auth.ts`)
- **Evidence:** Local probe: after `POST /api/auth/request-password-reset`, the newest `auth.verification` row for the probe user had `identifier` = `reset-password:` followed by the 24-character token itself. That token completed `POST /api/auth/reset-password` once (200).
- **Impact:** Anyone with read access to the `auth` schema (a leaked backup, a read-only database credential, a SQL injection elsewhere) can take over any account with an outstanding reset within its one-hour lifetime.
- **Severity:** Could
- **Fix direction:** Set `verification: { storeIdentifier: "hashed" }` (supported by the installed Better Auth) so reset identifiers are stored hashed; outstanding plain rows expire within an hour.
- **Regression test:** Sketch below
- **Status:** Confirmed

```text
Request:  POST /api/auth/request-password-reset for a test account, then SELECT identifier FROM auth.verification
Expected: identifier does not contain the token sent in the email
Actual:   identifier = 'reset-password:' || token
```

### AUTH-07 — Rate limiting depends on an implicit single-value X-Forwarded-For header

- **Workstream:** W2
- **Location:** `apps/frontend/lib/auth.ts:57-69` (no `advanced.ipAddress`); `better-auth/dist/api/rate-limiter/index.mjs:239-245`; `@better-auth/core/dist/utils/ip.mjs:174-218`
- **Evidence:** Better Auth reads only `x-forwarded-for` by default and trusts it only when it holds exactly one address; otherwise, in production, the IP is `null` and every client shares one bucket per path (`no-trusted-ip|/sign-in/email`). Locally, changing `X-Forwarded-For` after the 429 reset the limit (401 again). On Vercel the platform sets `X-Forwarded-For` to the client address, so as deployed this is not exploitable; hosted behaviour was not probed (sign-in is not permitted on hosted environments).
- **Impact:** If a proxy or CDN is placed in front of Vercel, or the frontend moves to a host that appends to the header, the limits silently become global: 10 sign-ins per minute for all users (denial of service) and 5 reset requests per hour for everyone. If a host passes client-supplied headers through, the limits become bypassable.
- **Severity:** Could
- **Fix direction:** Set `advanced.ipAddress.ipAddressHeaders` explicitly for the platform (for Vercel, `x-real-ip` or `x-vercel-forwarded-for`), and record the dependency in the deployment docs; alert on Better Auth's "could not determine a client IP" warning.
- **Regression test:** None
- **Status:** Suspected

## Checked, no finding

- JWT signing: RS256, 2048-bit RSA, `kid` in the header, keys in the `auth.jwks` table with private keys encrypted by `BETTER_AUTH_SECRET` (`apps/frontend/lib/auth.ts:126-131`; `better-auth/dist/plugins/jwt/sign.mjs:61-68`); 30-day rotation and 30-day grace (`auth.ts:129-130`). Hosted JWKS publishes one RSA RS256 key with public members only.
- API key source: discovery from the issuer (`ServiceRegistration.cs:50`) served by `app/.well-known/openid-configuration/route.ts:5-17` (5-minute cache); HTTPS metadata required for an HTTPS issuer (`ServiceRegistration.cs:51`); production startup fails without an HTTPS issuer and an audience (`ServiceRegistration.cs:27-32`, `Program.cs:11`). Rotation needs no API change: unknown `kid` triggers a metadata refresh in the JwtBearer configuration manager.
- Issuer and audience validated (`ServiceRegistration.cs:52-53`); probes with a wrong `aud` and `iss` returned 401. Inbound claim mapping is off and identity requires `iss` and `sub` (`ServiceRegistration.cs:55`, `Identity/HttpCurrentIdentity.cs:15-22`).
- Algorithm confusion: `alg: none`, HS256 with the Better Auth secret and a stripped signature all returned 401 (probe; see AUTH-02 for the missing test).
- API tokens are issued only for verified emails: `app/api/kitchen/signalr-token/route.ts:31-37` and `lib/api/index.ts:15-19`; `/api/auth/token` is blocked (`app/api/auth/[...all]/route.ts:10-11`), path variants return 404 or 308 to the blocked path, and hosted returns 404.
- Membership revocation: the JWT carries identity only (`auth.ts:136-140`); roles are read from the database on each request, so a role change applies to the next REST call. The hub closes connections when the token expires (`Program.cs:76`). Real-time subscription revocation is W1's responsibility.
- Session cookie flags: `HttpOnly`, `SameSite=Lax`, `Path=/` on every Better Auth cookie, plus `Secure` and the `__Secure-` prefix when `BETTER_AUTH_URL` is HTTPS (`better-auth/dist/cookies/index.mjs:23-37`), which production enforces (`auth.ts:36-37`). Locally over HTTP the observed cookie had `HttpOnly; SameSite=Lax` without `Secure`, as expected. The production cookie itself was not observed (see Not covered).
- Sign-out deletes the server session (`better-auth/dist/api/routes/sign-out.mjs:50`) and no cookie cache is configured (`auth.ts:49-145`), so the old cookie returned `get-session` `null` immediately (probe). Password reset deletes all sessions (`auth.ts:86`; `password.mjs:169`).
- CSRF on auth endpoints: Better Auth rejects cookie-bearing POSTs without a trusted Origin or Referer and cross-site navigations to sign-in (`better-auth/dist/api/middlewares/origin-check.mjs:96-118`, `:131-153`); trusted origins are only `BETTER_AUTH_URL` (`auth.ts:56`). Probes returned 403 for a foreign Origin, a missing Origin and a cross-site navigation, and `403 INVALID_REDIRECT_URL` for a foreign `redirectTo`. Other route handlers and server actions are W1's responsibility; `signalr-token` rejected a foreign Origin (403).
- Reset tokens: 24 characters from `[A-Za-z0-9]` (about 143 bits; `password.mjs:74`, `@better-auth/core/dist/utils/id.mjs:3-4`), one-hour expiry (`auth.ts:85`, probe TTL 59:59.999), bound to the user id (`password.mjs:75-79`), consumed atomically and checked for expiry (`better-auth/dist/db/internal-adapter.mjs:787-857`); reuse returned `400 INVALID_TOKEN`. Storage is AUTH-06.
- Verification tokens: HS256 JWT signed with the server secret, one-hour expiry (`email-verification.mjs:14-20`, `auth.ts:95`), algorithm pinned on verify (`email-verification.mjs:178`), expired token rejected (probe). Reuse is idempotent: an already-verified user changes nothing (`email-verification.mjs:287-292`; probe second use).
- Invitation tokens (source): 32 random bytes as 64 hex characters from `RandomNumberGenerator` (`apps/api/WhitePlate.Application/Staff/InvitationToken.cs:10`), only the SHA-256 hash stored (`InvitationToken.cs:11-16`, `WhitePlate.Domain/Identity/StaffInvitation.cs:63`) under a unique index (`WhitePlate.Infrastructure/Persistence/Configurations/StaffInvitationConfiguration.cs:20`); 7-day expiry (`CreateStaffInvitationCommandHandler.cs:45`); acceptance requires not revoked, not accepted, not expired, a verified email equal to the recipient (`StaffInvitation.cs:78-86`) and an active organization (`StaffInvitationRepository.cs:29-33`); single use enforced by the `AcceptedSubject` concurrency token (`StaffInvitationConfiguration.cs:23-24`); malformed tokens return 404 before any lookup (`AcceptStaffInvitationCommandHandler.cs:31-32`, probe 404); unauthenticated accept returns 401 (probe).
- Sign-in enumeration: unknown and existing emails both return `401 INVALID_EMAIL_OR_PASSWORD`, and unknown emails hash the password to equalise timing (`better-auth/dist/api/routes/sign-in.mjs:316-336`); probe timings overlapped (208-285 ms). `EMAIL_NOT_VERIFIED` is returned only after a correct password (`sign-in.mjs:338-350`; probe 403).
- Sign-up and reset response bodies are generic (`sign-up.mjs:155`, `:194-202`; `password.mjs:60-71`; probe). Timing is AUTH-05.
- Rate limits: custom rules for sign-up, sign-in, reset, verification email and social sign-in (`auth.ts:57-69`) work with database storage: the 11th sign-in in a minute returned 429. The ADR 0002 concern about `rateLimit.lastRequest` being `int8` is handled by the library (`better-auth/dist/api/rate-limiter/index.mjs:88`). IP source is AUTH-07.
- Password hashing: Better Auth's default scrypt (`better-auth/dist/crypto/password.mjs:6-7`); maximum length 128 bounds hashing cost (`create-context.mjs:187`).
- OAuth: implicit linking only for the trusted Google provider or a provider-verified email, and only into a locally verified account (`auth.ts:75-80`; `better-auth/dist/oauth2/link-account.mjs:137-139`); Microsoft `common` tenant emails count as verified only with `email_verified` or `verified_primary_email` (`@better-auth/core/dist/social-providers/microsoft-entra-id.mjs:119`); unverified social sign-ups get no session (`link-account.mjs:312-320`); state and PKCE verifier are generated per flow (`better-auth/dist/oauth2/state.mjs:20`).
- `BETTER_AUTH_SECRET` fallback (sweep lead): the literal at `auth.ts:53-55` is reachable only when `NODE_ENV` is not `production`; production throws when the secret is missing or shorter than 32 characters (`auth.ts:14-16`, `:30-35`), and `next build`/`next start` (including Vercel) run with `NODE_ENV=production`. Lead closed with no finding.
- `dev-token` script: refuses `NODE_ENV=production` and any non-`localhost` `BETTER_AUTH_URL` (`scripts/dev-token.mjs:36-41`), so the tokens it mints carry a localhost issuer that a production API rejects (`ServiceRegistration.cs:52`; wrong-issuer probe 401). It is an npm script, not a deployed route.
- Reset and invitation links carry tokens in query strings; their Referer exposure depends on the missing `Referrer-Policy` already recorded as HOST-03 (W8). Browsers' default `strict-origin-when-cross-origin` strips the query cross-origin.

## Not covered

- Invitation runtime probes (create, accept with mismatched email, unverified email, replay, revoked, expired): the Neon `test` business schema is 11 migrations behind this code (latest applied `20261014150246_OrderingOperations`; `OrganizationRoleGrants` missing), and applying migrations is out of scope. Invitation create returned 404 and protected REST calls returned 500 after authentication. Covered by source review above; only unauthenticated (401) and malformed-token (404) acceptance ran.
- Hosted session cookie attributes, hosted rate limiting and the Vercel client-IP header: observing them needs a hosted sign-in, which the audit rules forbid.
- Real email delivery timing for AUTH-05: Resend was deliberately disabled locally so no email was sent; the reset timing gap is source-based.
- Live Google and Microsoft OAuth flows: they need real identity-provider sign-ins; source review only.
- Live JWKS rotation: the 30-day interval was not forced on a shared test database.
- Stripe Connect OAuth callback (`StripeConnectController.cs:36-44`, anonymous with `state`): it links a payment account to an organization and creates no WhitePlate session, so it is outside authentication and session; left to the payments workstream.

## ASVS / WCAG coverage

ASVS 4.0.3 Level 2, chapters named for this task:

| Requirement | Status | Basis |
| --- | --- | --- |
| V2.1 Password security | Not met | AUTH-03 (8-character minimum, no breached-password check). Maximum 128 and no composition rules are compliant. |
| V2.2 General authenticator | Partial | Per-IP rate limits on sign-in, sign-up and recovery work locally; IP source is AUTH-07. Generic sign-in errors; enumeration by timing is AUTH-05. |
| V2.4 Credential storage | Met | scrypt via Better Auth. |
| V2.5 Credential recovery | Partial | Random, single-use, one-hour reset tokens; sessions revoked on reset; tokens stored in plain text (AUTH-06); API tokens survive reset (AUTH-01). |
| V2.7-V2.9 Out-of-band, OTP, cryptographic authenticators | Not applicable | No MFA or OTP is implemented. |
| V3.2 Session binding | Met | Server-generated session token in an HttpOnly cookie; no session id in URLs. |
| V3.3 Session termination | Partial | Sign-out and reset invalidate the cookie session immediately; API JWTs do not end (AUTH-01); no idle or absolute timeout (AUTH-04). |
| V3.4 Cookie-based session management | Met (source) | `__Secure-` prefix, `Secure`, `HttpOnly`, `SameSite=Lax`, `Path=/` in production; not observed on hosted. |
| V3.5 Token-based session management | Partial | RS256 with issuer, audience and lifetime validation; token readable by browser JavaScript (W1 (SEC-06)); no revocation (AUTH-01); untested validation (AUTH-02). |
| V3.7 Defences against session management exploits | Partial | Origin checks on Better Auth POSTs; no re-authentication for sensitive operations (AUTH-04). |
| V6.4 Secret management | Partial | Signing keys encrypted at rest with a 32+ character secret enforced in production, 30-day key rotation; the secret itself is a plain environment variable with no rotation procedure documented. |

WCAG: out of scope for W2 (see W6).
