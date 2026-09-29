# Functional test plan

This is an acceptance plan, not a test-results report. The API test suite covers tenant/organization/staff/catalog behavior, checkout pricing/idempotency, order workflow, body/rate limits, outbox dispatch, and hub authorization. Manual live OIDC/SignalR and frontend integration checks remain. The earlier documentation audit is in [documentation review](documentation-review.md).

## 1. Current scaffold checks

Start services using the [development guide](development.md). Use fresh browser cookies for locale-negotiation tests and an already-restored frontend/API for build checks.

| ID | Action | Expected result |
| --- | --- | --- |
| CUR-01 | Open `/en` and `/fr` on the frontend | Translated starter text, localized title/description, and matching HTML `lang` |
| CUR-02 | Request `/` with `Accept-Language: fr`, no cookies; repeat with `en` | Redirect to the matching supported locale |
| CUR-03 | Choose French using the page link, then visit `/` with the same cookie jar | Remembered locale takes precedence over browser language; explicit `/en` still selects English |
| CUR-04 | Press `d` outside editable controls | Theme toggles; reload preserves the explicit selection through next-themes |
| CUR-05 | Press Ctrl/Alt/Meta+D, hold D for repeats, or type in an input/textarea/select/contenteditable control | App shortcut does not toggle for these cases; use a controlled fixture if a text-entry control is needed, because the current home page has none |
| CUR-06 | Navigate language links and the sample button with the keyboard | Focus is visible and controls have accessible names; sample button is not expected to perform a business action |
| CUR-07 | Run frontend lint, typecheck, build separately | Each exits successfully; record tool/runtime failures separately rather than calling the whole set passed |
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

The local Neon `test` branch and the OpenAPI/Swagger endpoints were verified on 2026-09-29. The branch currently has no organization/tenant fixture; staff calls also need a configured OIDC issuer, and a valid tenant call returns `404` until an operator provisions an organization and restaurant. The xUnit API tests run through an in-memory host and do not detect every local port, external OIDC, or Windows logging issue.

## 2. Live integration and frontend acceptance scenarios

Automated tests cover the API behaviors in the contracts. These scenarios check the configured OIDC issuer, live PostgreSQL behavior, real SignalR connections, and frontend flows. Before execution, provision two tenants A/B with distinct staff identities and menus; include an unavailable product, stale order version, and malformed/expired credentials.

### Tenant boundaries

| ID | Scenario | Required outcome | Priority |
| --- | --- | --- | --- |
| MT-01 | Visit configured tenant hosts plus unknown/inactive hosts | Resolve correct restaurant; reject unknown/inactive hosts without fallback | Critical |
| MT-02 | Staff A lists, reads, updates, and deletes data using B's resource IDs | No B data disclosed or changed; verify database state as well as response | Critical |
| MT-03 | Spoof tenant headers, mismatch host/token tenant, link a product to B's category | No privilege gain or cross-tenant relationship; both app and database constraints tested | Critical |
| MT-04 | Change one tenant's theme, then reload both storefronts | Correct branding and isolated cache invalidation | Medium |
| MT-05 | Browse en/fr for both tenants, switch tenants with a saved cart | Locale and tenant remain independent; cart and cached data do not leak | High |
| MT-06 | Exercise raw SQL, background jobs, maintenance, and tenant-context absence | Only explicit authorized scope operates; missing context fails closed | Critical |

### Storefront and checkout

| ID | Scenario | Required outcome | Priority |
| --- | --- | --- | --- |
| SF-01 | Load populated/empty menus and unavailable products | Correct grouping/order, empty states, and agreed availability behavior | High |
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
| DB-05 | Request another tenant's SignalR group or reconnect after permissions change | Membership checks reject unauthorized subscription; verify live token/group behavior against OIDC | Critical |
| DB-06 | Disconnect, miss events, reconnect; duplicate or reorder messages | Authoritative refetch restores state; duplicates do not create duplicate orders | High |
| DB-07 | Fail notification delivery after database commit | The dispatcher retries; order remains durable and REST recovery stays authoritative | High |

## 3. Automation strategy

Playwright and Vitest are installed, but no frontend configs, test files, or scripts exist. The backend has xUnit v3 tests under `apps/api/tests/WhitePlate.Tests`, organized into `Api`, `Application`, `Architecture`, `Domain`, and `Infrastructure`. The backend suite covers restaurant domain, application, persistence, ownership, and HTTP behavior. Run `dotnet test apps/api/WhitePlate.slnx` from the repository root.

Prioritize backend integration tests for tenant boundaries, persistence constraints, transactions, and concurrency against the selected real PostgreSQL version. Browser tests should cover localized navigation, checkout, and dashboard recovery. Unit tests should cover pricing/lifecycle invariants rather than duplicate framework behavior. Avoid timing-only assertions such as “instantly”; define observable synchronization and a bounded wait.

For each run, record source revision (or working-tree baseline before the first commit), environment/tool versions, fixture setup, scenario IDs, commands, outcome, and diagnostics. Proposed tests remain pending until both the feature and assertions exist. CI should eventually run these checks with isolated test data and deterministic cleanup; no such pipeline exists today.
