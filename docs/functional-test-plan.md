# Functional test plan

This is an acceptance plan, not a test-results report. The existing API suite covers tenant/organization/staff/catalog CRUD, verified email and invitation binding, checkout pricing/idempotency, order workflow, body/rate limits, outbox dispatch, and hub authorization. The new catalog-localization paths are not behaviorally tested yet, and their migration is not applied. The prior test-database schema migrations and local email/password signup/invitation path are verified. Live OAuth, real Resend delivery, browser auth flows, and SignalR acceptance remain to be run. The earlier documentation audit is in [documentation review](documentation-review.md).

## 1. Current scaffold checks

Start services using the [development guide](development.md). Use fresh browser cookies for locale-negotiation tests and an already-restored frontend/API for build checks.

| ID | Action | Expected result |
| --- | --- | --- |
| CUR-01 | Open `/en` and `/fr` on the frontend | Localized account entry links and title/description, with matching HTML `lang` |
| CUR-02 | Request `/` with `Accept-Language: fr`, no cookies; repeat with `en` | Redirect to the matching supported locale |
| CUR-03 | Choose French using the page link, then visit `/` with the same cookie jar | Remembered locale takes precedence over browser language; explicit `/en` still selects English |
| CUR-04 | Press `d` outside editable controls | Theme toggles; reload preserves the explicit selection through next-themes |
| CUR-05 | Press Ctrl/Alt/Meta+D, hold D for repeats, or type in auth inputs/selects | Theme shortcut does not trigger while typing or for modified/repeated key presses |
| CUR-06 | Navigate language, sign-in, signup, and auth-form controls with the keyboard | Focus is visible and controls have accessible names; localized routes resolve correctly |
| CUR-07 | Run frontend tests, lint, typecheck, and build separately | Each exits successfully; record tool/runtime failures separately rather than calling the whole set passed |
| CUR-08 | Run the API solution tests and request `/WeatherForecast` | API tests pass; the removed sample route returns `404` |
| CUR-09 | Fetch `/openapi/v1.json` and `/swagger` in Development | OpenAPI JSON documents current API routes, omits `/WeatherForecast`, and Swagger UI returns `200` |
| CUR-10 | Start API with Production environment and no Development launch profile, then request OpenAPI | `404`; use an explicit test port and the intended HTTP/HTTPS configuration |
| CUR-11 | Request `/api/v1/menu` on a configured tenant host | `200` for an active provisioned tenant; unknown tenant host returns `404` |
| CUR-12 | Run the API against the Neon `test` branch and request `/api/v1/tenant` on an unknown subdomain | Database resolution completes and returns the expected `404`; production remains untouched |

PowerShell 7 API smoke check, while the HTTP profile is running:

```powershell
$spec = Invoke-RestMethod http://localhost:5182/openapi/v1.json -NoProxy
if ($spec.paths.'/WeatherForecast') { throw 'Removed weather route remains in OpenAPI' }
if (-not $spec.paths.'/api/v1/orders') { throw 'Public order route is missing from OpenAPI' }
if (-not $spec.paths.'/api/v1/tenants/{tenantId}/catalog') { throw 'Catalog management route is missing from OpenAPI' }
Invoke-WebRequest http://localhost:5182/swagger -NoProxy | Select-Object -ExpandProperty StatusCode
```

The local Neon `test` branch and the OpenAPI/Swagger endpoints were verified on 2026-09-29. The first seven EF migrations and Better Auth's `auth` schema are applied there; `CatalogLocalization` is not yet applied. The branch has test-only signup, organization, and membership records from the local invitation flow; do not treat it as an empty database. The xUnit API tests run through an in-memory host and do not detect every local port, external OAuth, or Windows logging issue.

## 2. Live integration and frontend acceptance scenarios

Existing automated tests cover the previously implemented API behaviors in the contracts. The catalog-localization paths have build verification only and require behavioral acceptance after applying `CatalogLocalization`. These scenarios also check the configured Better Auth issuer, live PostgreSQL behavior, real SignalR connections, and frontend flows. Before execution, provision two tenants A/B with distinct staff identities and menus; include an unavailable product, stale order version, and malformed/expired credentials.

### Authentication and onboarding

The local email/password signup, email verification, organization creation, and invitation acceptance path was exercised against the Neon `test` database on 2026-09-29 with test-only `.invalid` addresses and locally intercepted email delivery. The browser scenarios below, OAuth providers, and real email delivery remain unverified; configure Google and Microsoft callback URLs and a verified Resend sender before running those checks.

On 2026-09-30, a dedicated verified `local-tester@whiteplate.invalid` account was added using intercepted verification, and a JWT minted with the current signing key passed live `GET /api/v1/me` with HTTP 200. The real frontend sign-in endpoint returned 200 and its session cookie loaded `/en/organization` with HTTP 200 using Webpack dev mode; Turbopack hit the documented Windows process error 5. The account has no organization membership by default. Browser interaction and Swagger UI interaction remain separate acceptance checks.

| ID | Scenario | Required outcome | Priority |
| --- | --- | --- | --- |
| AUTH-01 | Sign up with email/password | Verification email arrives; session/API access is denied until email is verified |
| AUTH-02 | Sign in with Google and Microsoft | Callback creates or signs in account; Microsoft contact email is verified before API access; same-email linking follows the configured trusted-provider rule |
| AUTH-03 | Request password reset for an existing and unknown address | Same generic response; known address gets an expiring reset link; successful reset revokes prior sessions |
| AUTH-04 | Open expired, tampered, and valid verification/reset links | Invalid/expired links show localized recovery states; valid links complete their intended change |
| AUTH-05 | Sign up for an organization with a verified account | API creates organization and first owner; unverified users are rejected; tenant IDs from browser input do not grant ownership |
| AUTH-06 | Invite owner and restaurant staff by email, then accept as that verified address | Email contains one-time seven-day invite; matching verified address gains only the encoded role/scope |
| AUTH-07 | Try invitation as another address, unverified account, expired/revoked/reused token | No membership is created; API preserves opaque not-found behavior |
| AUTH-08 | Cause Resend invitation delivery to fail | Server revokes the just-created invite, returns a safe retryable error, and does not expose raw API tokens |
| AUTH-09 | Inspect browser requests and call `/api/auth/token` directly | No API bearer token appears in client-visible responses; token endpoint returns 404 to browser HTTP |
| AUTH-10 | Exercise auth routes at narrow/mobile and keyboard-only sizes in English/French | Labels, focus, loading/error/success states, and localized links remain usable |

### Tenant boundaries

| ID | Scenario | Required outcome | Priority |
| --- | --- | --- | --- |
| MT-01 | Visit configured tenant hosts plus unknown/inactive hosts | Resolve correct restaurant; reject unknown/inactive hosts without fallback | Critical |
| MT-02 | Staff A lists, reads, updates, and deletes data using B's resource IDs | No B data disclosed or changed; verify database state as well as response | Critical |
| MT-03 | Spoof tenant headers, mismatch host/token tenant, link a product to B's category | No privilege gain or cross-tenant relationship; both app and database constraints tested | Critical |
| MT-04 | Change one tenant's theme, then reload both storefronts | Correct branding and isolated cache invalidation | Medium |
| MT-05 | Browse each restaurant's configured menu languages, switch tenant | Menu locale remains independent of the app's `/en` or `/fr` interface locale; restaurant languages do not leak across tenants | High |
| MT-06 | Exercise raw SQL, background jobs, maintenance, and tenant-context absence | Only explicit authorized scope operates; missing context fails closed | Critical |

### Storefront and checkout

| ID | Scenario | Required outcome | Priority |
| --- | --- | --- | --- |
| SF-01 | Load populated/empty menus in several enabled languages, including an untranslated item and unavailable product | Correct grouping/order, translated fields, default-language fallback, unavailable state, empty states, and unsupported locale resolving to the restaurant default | High |
| SF-10 | Owner/manager edits menu languages and translations; attempt to remove the final language and use a duplicate or invalid tag | At least one enabled language and one included default always remain; translations can be saved only for enabled languages; kitchen staff cannot change settings or translations | High |
| SF-12 | Change the default while active catalog items lack translations; then translate all active items and retry | The first change is rejected without changing settings; the change succeeds after every active category, product, option group, and option has a translation in the new default language | High |
| SF-11 | Request storefront on the configured base host, a one-label tenant subdomain, a nested subdomain, and an unrelated host | Only a validated one-label subdomain routes to the matching public menu; raw/forwarded host values do not select another tenant | High |
| SF-02 | Add items, reload, switch tenant | No cart is included in the API scope; any future frontend cart remains tenant-scoped | High |
| SF-03 | Submit valid order through the API/client | `201`, persisted order/items and server total; no payment/cart conversion is included | Critical |
| SF-04 | Submit an unavailable product | Safe validation/error response, no partial order | High |
| SF-05 | Send negative/zero/fractional quantities, duplicate IDs, empty/oversized payloads, or forged prices | Automated API tests cover validation, the 16 KiB body cap, and server-derived prices | Critical |
| SF-06 | Send foreign-tenant product IDs | No foreign data exposed, no order inserted | Critical |
| SF-07 | Double-submit or retry after response loss | Automated API test proves the 24-hour key returns one original receipt; no payment is included | Critical |
| SF-08 | Edit product price/name after an order | Historical line snapshots and total remain unchanged | High |
| SF-09 | Concurrent checkout and availability change | Outcome follows the selected stock/availability policy; no unjustified stock guarantee | High |

### Kitchen and authorization

| ID | Scenario | Required outcome | Priority |
| --- | --- | --- | --- |
| DB-01 | Commit a new order while A/B dashboards are connected | Outbox write is transactional; a live multi-connection check should verify only authorized A staff receive A's order | Critical |
| DB-02 | Advance status, repeat same status, attempt skipped/backward transition | Agreed lifecycle enforced; repeat is no-op success; invalid transition proposed `409` | High |
| DB-03 | Make a status update under latency, rejection, and stale version | If optimistic UI is used, rollback/refetch on failure; stale write never silently overwrites newer state | High |
| DB-04 | Call protected endpoints with missing/expired token, wrong role, or foreign-tenant ID | `401`, `403`, or non-disclosing `404` as specified; UI login redirect tested separately | Critical |
| DB-05 | Request another tenant's SignalR group or reconnect after permissions change | Membership checks reject unauthorized subscription; verify live Better Auth token/group behavior | Critical |
| DB-06 | Disconnect, miss events, reconnect; duplicate or reorder messages | Authoritative refetch restores state; duplicates do not create duplicate orders | High |
| DB-07 | Fail notification delivery after database commit | The dispatcher retries; order remains durable and REST recovery stays authoritative | High |

## 3. Automation strategy

Vitest runs the frontend unit suite with `npm run test`; it includes focused checks for the shared API request factory methods, authorization header, safe error mapping, and path boundary. Playwright is installed but has no browser-test configuration. The backend has xUnit v3 tests under `apps/api/tests/WhitePlate.Tests`, organized into `Api`, `Application`, `Architecture`, `Domain`, and `Infrastructure`. The backend suite covers restaurant domain, application, persistence, ownership, and HTTP behavior. Run `dotnet test apps/api/WhitePlate.slnx` from the repository root.

Prioritize backend integration tests for tenant boundaries, persistence constraints, transactions, and concurrency against the selected real PostgreSQL version. Browser tests should cover localized navigation, checkout, and dashboard recovery. Unit tests should cover pricing/lifecycle invariants rather than duplicate framework behavior. Avoid timing-only assertions such as “instantly”; define observable synchronization and a bounded wait.

For each run, record source revision (or working-tree baseline before the first commit), environment/tool versions, fixture setup, scenario IDs, commands, outcome, and diagnostics. Proposed tests remain pending until both the feature and assertions exist. CI should eventually run these checks with isolated test data and deterministic cleanup; no such pipeline exists today.
