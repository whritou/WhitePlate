# W7 — Code health and test gaps

## Scope and method

Audit date 2026-10-25. Audited code is `origin/main` `55f31a5`; this file was written on the audit branch at `f5dd551`, which changes only documentation. W7 asks whether the security controls found or confirmed by W1-W4 are protected by automated tests, whether the code respects its layer boundaries, and what the baseline says about lint, format and test health. W6 (accessibility) was still in progress when this file was written and is excluded; W5, W8 and W9 findings are read only for cross-references.

Method (read-only, no product code touched, nothing installed or downloaded):

1. Read `docs/coding-standards.md`, `docs/architecture/WHITEPLATE_BACKEND_ARCHITECTURE.md` (via the architecture tests that enforce it), `apps/api/AGENTS.md`, the README baseline and the W1-W5, W8 and W9 files.
2. Inventoried every API test method (258 `[Fact]`/`[Theory]` methods in 64 files under `apps/api/tests/WhitePlate.Tests`, which expand to the 372 passing tests of the baseline) with a scratchpad script, and every frontend test file (114 `*.test.ts(x)` files plus 2 `.mjs` ESLint-rule tests, matching the 116 files and 729 tests of the baseline). Playwright specs (`apps/frontend/tests/browser`, 37 spec files) were listed but not read in depth: `.github/workflows/ci.yml` never runs `npm run test:browser`.
3. For each W1-W4 finding and for each implemented security control in the W1 matrix's Enforcement column, searched the test projects for the route, handler, method or behaviour (`Grep` for the route path, controller, handler and error code) and read the tests that matched. "No test" means that search found nothing; it is a negative search, not a coverage measurement. The repository has no coverage tooling (CODE-14).
4. Layer check: read all five `.csproj` files, grepped `using` statements and fully qualified names across `WhitePlate.Domain`, `WhitePlate.Application`, `WhitePlate.Infrastructure` and `WhitePlate.Api`, and read `Architecture/DependencyRulesTests.cs`.
5. File size: counted lines of every `.cs`, `.ts`, `.tsx`, `.mjs` file under `apps` excluding `node_modules`, `bin`, `obj`, `.next`, `Migrations`, `*.Designer.cs`, the model snapshot and `messages/*.json`.
6. Duplication: read the Origin, tenant-selector, UUID and permission-precheck code in every route handler and server action, and compared them.
7. Baseline: taken from `README.md` (`## Baseline`); `lint`, `typecheck`, `test`, `format:check`, `build` and `dotnet test` were not re-run for W7.

No finding here was reproduced at runtime. Every finding is Confirmed from source or from a negative test search, and each says so. Test sketches are unexecuted.

### Baseline recap (from `README.md`)

| Check | Result |
| --- | --- |
| `npm run lint` | 0 errors, 19 warnings, all `@next/next/no-img-element` (CODE-11) |
| `npm run typecheck` | Pass |
| `npm run test` | 116 files, 729 tests, all pass |
| `npm run format:check` | Fail: 17 files with real drift; CI checks only changed files (CODE-10) |
| `npm run build` | Pass (fixture routes in the route table are CFG-09) |
| `dotnet test apps/api/WhitePlate.slnx` | 372 passed, 0 failed, 0 skipped |

Neither suite fails today. The gaps below are about what the passing tests do not assert.

## Test-gap matrix

Columns: "Test?" is Yes (the behaviour is asserted), Partial (a neighbouring behaviour is asserted) or No. Paths are relative to `apps/api/tests/WhitePlate.Tests/` for API tests and `apps/frontend/` for frontend tests.

### Findings of W1-W4

| Finding | Severity | Test? | Evidence | CODE finding |
| --- | --- | --- | --- | --- |
| `SEC-01` inactive tenant stays accessible | Could | No for staff routes | Tenant deactivation appears only in `Api/OrganizationEndpointTests.cs:599-621` (`/me` omits inactive restaurants for owners) and `:1270` (establishment). No test deactivates a tenant and then reads orders, catalog, media or the hub. | CODE-01 |
| `SEC-02` memberships and co-owners cannot be removed | Should | No | No removal route exists, so nothing asserts the intended behaviour. | CODE-01 |
| `SEC-03` no fallback authorization policy | Could | Partial | Three spot checks: `Api/TenantEndpointTests.cs:83` (provisioning is not anonymous) and `Api/WeatherForecastEndpointTests.cs:47-61` (OpenAPI security present on three routes). No endpoint-metadata allowlist test. | CODE-01 |
| `SEC-04` unbounded organizations, thin reserved names | Should | Partial | Reserved-name rejection for the four entries: `Application/TenantUseCaseTests.cs:12`. Path-segment reservation in the BFF: `lib/storefront-preview-routing.test.ts:104-118`, `proxy.test.ts:30`. No quota or rate-limit test (no such control exists). | CODE-05 |
| `SEC-05` hub token in query string | Could | No | `Api/OrdersEndpointTests.cs:32` asserts only that negotiation needs authentication. | CODE-02 |
| `SEC-06` token readable by browser script | Should | No | `app/api/kitchen/signalr-token/route.test.ts:47` asserts that the token is returned (the behaviour SEC-06 questions). Nothing tests `get-session` for `set-auth-jwt`. | CODE-02 |
| `SEC-07` unvalidated tenant ID in opening-hours action | Could | No | `actions/establishment-settings.test.ts:54-64` rejects `../foreign` for `saveEstablishmentSettingsAction` only; `saveOpeningHoursAction` is never called. `lib/api/request-factory.test.ts:151-168` covers the `/api/v1/` prefix only. | CODE-03 |
| `SEC-08` wrong permission on analytics, reorder, discount deactivation | Should | Partial | Domain grants only: `Domain/OrganizationRoleGrantTests.cs:19` (a role without `analytics.view`) and `:28-41` (`DefaultsMatchTheApprovedMatrix`; `:32` Staff lacks `analytics.view`, `:35` Accountant has it). No route-level test: `grep` for `analytics/` and `withdrawal` finds nothing in `apps/api/tests`. Reorder: owner happy path `Api/OrganizationEndpointTests.cs:288-292`. Deactivation: manager happy path `:921`. | CODE-01 |
| `SEC-09` invitation into broader role | Should | No | Only owners invite: `Api/OrganizationEndpointTests.cs:56`, `:518`; `Application/CreateStaffInvitationCommandTests.cs:22-31`; `Application/StaffInvitationUseCaseTests.cs:11`. | CODE-01 |
| `SEC-10` OAuth completion not bound to the browser | Could | Partial | Owner and state checks: `Application/StripeConnectHandlerTests.cs:19`, `:105`, `:149`; `Infrastructure/StripeConnectRepositoryTests.cs:16`. None tests the controller callback or session binding. | CODE-04 |
| `AUTH-01` JWT valid after sign-out | Should | No | No test sets a token lifetime or `ClockSkew`; JwtBearer is replaced in test hosts (`Api/ErrorResponseTests.cs:98-108`, `Api/BrandAssetsEndpointTests.cs:206-212`). | AUTH-02, CODE-02 |
| `AUTH-02` JWT validation untested | Should | No | Recorded in `w2-auth-session.md` (AUTH-02) with its own sketch; not repeated here. | AUTH-02 |
| `AUTH-03` weak password policy | Should | No | `lib/auth.ts` has no test (only mocks of it: `app/api/kitchen/signalr-token/route.test.ts:5`, `services/live-workspace.test.ts:9`, three page tests). | CODE-02 |
| `AUTH-04` 7-day sessions, no idle limit | Should | No | Same: no test reads the `session` options or cookie attributes. | CODE-02 |
| `AUTH-05` timing reveals accounts | Could | No | No test. | CODE-02 |
| `AUTH-06` reset tokens stored in plain text | Should | No | No test inspects `auth.verification`. | CODE-02 |
| `AUTH-07` implicit client-IP header | Could | No | No test for `advanced.ipAddress`. | CODE-02 |
| `PUB-01` checkout bucket per restaurant | Should | Partial | Limiter unit: `Api/CheckoutRequestRateLimiterTests.cs:8`. Endpoint: `Api/OrdersEndpointTests.cs:518-547`, which never varies the client address and asserts the per-tenant bucket as correct. | CODE-05 |
| `PUB-02` deactivated code works until publish | Could | No | Deactivation call only: `Api/OrganizationEndpointTests.cs:921`. No quote after deactivation. | CODE-05 |
| `PUB-03` client-chosen tracking capability | Could | No | Existing tests use constant-byte tokens (`Api/OrdersEndpointTests.cs:120`, `:329`: 32 bytes of `7`), so they encode the behaviour. Capability checks: `:323`, `:392`. | CODE-05 |
| `PUB-04` anonymous unpaid orders fill capacity | Could | No | Capacity limit itself: `Api/OrdersEndpointTests.cs:235`. No abuse control to test. | CODE-05 |
| `PUB-05` webhook rejects other API versions | Could | Partial | One event, `api_version` fixed: `Infrastructure/StripeConnectProviderTests.cs:43-67`. | CODE-04 |
| `PUB-06` analytics withdrawal by email | Could | No | The analytics routes have no tests at all. | CODE-05 |
| `PUB-07` quote errors reveal codes | Could | No | Error codes for minimum and expiry are asserted (`Api/OrdersEndpointTests.cs:158`, `:179`), with no guessing budget. | CODE-05 |
| `DATA-01` schema lags, readiness blind | Should | No | `Api/HealthEndpointTests.cs:44-54` asserts Healthy when the database is reachable; `Infrastructure/TenantRepositoryTests.cs:101-114` checks model against snapshot, not applied migrations. | CODE-06 |
| `DATA-02` stale migration docs | Could | n/a | Documentation, no code behaviour. | None |
| `DATA-03` upload buffered before authentication | Could | No | The only 413 test is for checkout (`Api/OrdersEndpointTests.cs:550-568`). | CODE-05 |
| `DATA-04` photos follow draft visibility | Could | No | `Api/ProductPhotosEndpointTests.cs:125-142` runs without a publication head. | CODE-06 |
| `DATA-05` last-writer-wins catalog | Could | No | Versioned routes are tested (`Api/OrganizationEndpointTests.cs:1239`, `Api/OrdersEndpointTests.cs:677`, `Api/ThemeSettingsEndpointTests.cs:13`); catalog entity updates have no version to test. | CODE-06 |
| `DATA-06` outbox retries forever | Could | No | `Api/OrderOutboxDispatcherTests.cs:14` covers the success path only. | CODE-07 |
| `DATA-07` no off-host backup | Should | n/a | Operational; not testable in the suites. | None |

### Implemented security controls (W1 matrix, Enforcement column)

| Control | Where enforced | Tests | Gap |
| --- | --- | --- | --- |
| Tenant filter by route tenant plus persisted membership | `StaffMembershipRepository.cs`, repositories | Foreign-tenant denial: `Api/OrdersEndpointTests.cs:628`, `:975`; `Api/BrandAssetsEndpointTests.cs:107`; `Api/ProductPhotosEndpointTests.cs:63`, `:125`; `Api/ThemeSettingsEndpointTests.cs:55`; `Api/OrganizationEndpointTests.cs:335`, `:700`, `:1084`, `:1171`; `Infrastructure/CatalogPersistenceTests.cs:48` (composite keys) | Analytics, catalog publication/history/restore, discount and option-group routes with foreign IDs have no HTTP test (CODE-01) |
| Role or grant check (`HasPermissionAsync`) | Application handlers | `Infrastructure/StaffMembershipRepositoryTests.cs:14`, `:52`; `Api/OrganizationEndpointTests.cs:116`, `:853`; `Api/ProductAvailabilityTests.cs:14`, `:124`; `Api/OrderingOperationsTests.cs:71`; `Api/DashboardMetricsEndpointTests.cs:120` (kitchen sees no order value); `Application/StripeConnectHandlerTests.cs:41`, `:54` | Only one custom-role test (`Api/OrganizationEndpointTests.cs:116`, one permission on one route); no per-key matrix (CODE-01) |
| Origin check on BFF mutations | Route handlers, `actions/checkout.ts` | `app/api/brand-assets/route.test.ts:27`, `app/api/product-photos/route.test.ts:24`, `app/api/kitchen/signalr-token/route.test.ts:22`, `app/api/theme-settings/route.test.ts:19`, `app/api/public/orders/[orderId]/tracking/route.test.ts:20`, `actions/checkout.test.ts:11` | `theme-publication` and `order-quote` routes untested (CODE-03) |
| Idempotency | `OrderRepository.cs`, `CreateOrderCommandHandler.cs` | `Api/OrdersEndpointTests.cs:44`, `:415`, `:497`, `:571` | None at HTTP level; the PostgreSQL race path is not run (CODE-06) |
| Rate limit | `CheckoutRequestRateLimiter.cs`, controllers | `Api/CheckoutRequestRateLimiterTests.cs:8`, `Api/OrdersEndpointTests.cs:518` | Quote and withdrawal limiters, proxy keying (CODE-05) |
| Upload validation | `BrandImageProcessor`, `MediaAsset`, `S3MediaStorage` | `Infrastructure/BrandImageProcessorTests.cs:10-66`; `Api/BrandAssetsEndpointTests.cs:137`; `Api/ProductPhotosEndpointTests.cs:95`; `Infrastructure/S3MediaStorageTests.cs:20-55`; `Domain/MediaAssetTests.cs:8-37` | No metadata-stripping or polyglot test, no API-level size limit test (CODE-05) |
| Webhook signature | `StripeConnectProvider.cs` | `Infrastructure/StripeConnectProviderTests.cs:43`; dedup `Infrastructure/StripeConnectRepositoryTests.cs:42` | `ProcessWebhookAsync` and the webhook controller are never called by a test (CODE-04) |
| Hub authorization and delivery | `KitchenHub.cs`, `SignalRKitchenEventPublisher.cs` | `Api/OrdersEndpointTests.cs:32`; `Application/KitchenSubscriptionAccessTests.cs:13`, `:26`; `Api/SignalRKitchenEventPublisherTests.cs:15`, `:38`, `:55`; `Api/KitchenSubscriptionsTests.cs:11-41` | The `OnMessageReceived` query-string token path (`ServiceRegistration.cs:58-64`, SEC-05) is untested, consistent with CODE-02; no test joins the hub over a live connection |
| Public tracking capability | `OrderRepository.cs:504-532` | `Api/OrdersEndpointTests.cs:323`, `:392`; `app/api/public/orders/[orderId]/tracking/route.test.ts:20` | Token quality (PUB-03, CODE-05) |
| Server price authority | `CheckoutPricingReader.cs` | `Api/OrdersEndpointTests.cs:44`, `:601`; `Api/OrderQuoteTests.cs:31` | No test sends client price fields (CODE-05) |
| Invitation acceptance (verified email, single use, scoped membership) | `StaffInvitation.cs:78-86`, `StaffInvitationRepository.cs:26-57` | Accept and create membership: `Api/OrganizationEndpointTests.cs:89`, `:156`, `:543`; wrong recipient email gets 404 and no membership: `:553-575`; single use and no double membership: `Domain/StaffInvitationTests.cs:9`, `Infrastructure/StaffInvitationRepositoryTests.cs:51`; verified email: `Domain/StaffInvitationTests.cs:66`; foreign restaurant: `Infrastructure/StaffInvitationRepositoryTests.cs:80`; revoked and expired: `Domain/StaffInvitationTests.cs:22`, `Api/OrganizationEndpointTests.cs:805` | No HTTP replay of a used token and no HTTP test of an unverified-email account accepting (domain rule only); a non-owner inviting into a broader role is untested (SEC-09, CODE-01) |
| Owner-only role and member administration | `OrganizationRolePermissionsHandler.cs:27`, `:67`, `:101`, `:127`; `ChangeRestaurantMemberRoleHandler.cs:15-24` | Owner paths: `Api/OrganizationEndpointTests.cs:30`, `:56`, `:116`. Non-owner denial exists only at handler level and only for read and replace: `Application/OrganizationRolePermissionsHandlerTests.cs:42-58`. Foreign-organization owner for restaurant creation and rename: `Api/OrganizationEndpointTests.cs:386`, `Application/RenameOrganizationTests.cs:27` | None for role create, role archive, member role change and organization archive or restore: no non-owner (Manager, Kitchen or foreign-organization owner) denial test at HTTP or handler level (CODE-01) |
| Body and route resource-ID rechecks against the route tenant or organization | `CatalogRepository.cs:181-187`, `:347-400`, `CreateCatalogConfigurationHandlers.cs:21-40`, `MediaRepository.cs:24-58` | Product category: `Application/CatalogUseCaseTests.cs:43`, `Api/OrganizationEndpointTests.cs:202`, `Infrastructure/CatalogPersistenceTests.cs:48`, `Api/CategoryVisibilityTests.cs:109`; media and photo IDs: `Api/BrandAssetsEndpointTests.cs:107`, `Api/ProductPhotosEndpointTests.cs:63`, `:125`; invitation tenant: `Infrastructure/StaffInvitationRepositoryTests.cs:80`; checkout products and options: `Api/OrdersEndpointTests.cs:601` | No test posts a foreign product to an option group or a foreign option group to an option (`Api/OrganizationEndpointTests.cs:882-890` use own-tenant IDs), and `catalog/reorder` is tested with own IDs only (`:258-297`). Member role change with a foreign role or member ID is untested (CODE-01) |
| Private or no-store response headers | Controllers, BFF route handlers | API: `Api/BrandAssetsEndpointTests.cs:54`, `:77`, `:80`; `Api/ProductPhotosEndpointTests.cs:35`, `:39`; `Api/ThemeSettingsEndpointTests.cs:23`; `Api/DashboardMetricsEndpointTests.cs:83`; `Api/OrdersEndpointTests.cs:118`, `:144`, `:348`; `Api/TenantEndpointTests.cs:56`, `:127`. BFF: `app/api/brand-assets/route.test.ts:93`, `app/api/establishment-settings/route.test.ts:43`, `app/api/kitchen/orders/route.test.ts:89`, `app/api/kitchen/dashboard/metrics/route.test.ts:91`, `app/api/kitchen/dashboard/ordering-operations/route.test.ts:80`, `app/api/kitchen/signalr-token/route.test.ts:59`, `app/api/product-photos/route.test.ts:76`, `app/api/theme-settings/route.test.ts:55`, and the public brand-assets, establishment, tracking and product-photos route tests | None for BFF `catalog-history`, `organization-analytics`, `theme-publication`, `public/order-quote`, `public/pickup-slots`, `public/analytics-withdrawal`; `Vary` is asserted for seven BFF routes (`app/api/brand-assets/route.test.ts:146`, `app/api/establishment-settings/route.test.ts:44`, `app/api/kitchen/dashboard/ordering-operations/route.test.ts:81`, `app/api/product-photos/route.test.ts:77`, `app/api/theme-settings/route.test.ts:56`, the public brand-assets and product-photos route tests) but not for API responses, the kitchen orders and metrics routes, tracking, or the untested BFF routes; no menu header test (CODE-03) |
| Public data limited to the published snapshot or published theme | `MediaRepository.cs:14-23`, `CatalogRepository.cs:496-536`, `OrderRepository.cs:77-190` | Draft logo not public until published, then public: `Api/BrandAssetsEndpointTests.cs:62-81`; menu shows the resolved tenant's available data, and unknown, inactive and archived tenants get nothing: `Api/MenuEndpointTests.cs:74`, `:113`, `:132`; hidden category: `Api/CategoryVisibilityTests.cs:14`; published baseline used by checkout: `Api/OrdersEndpointTests.cs:1113-1139` | `MenuEndpointTests.cs` never creates a publication head, so "a draft edit after publish stays invisible to guests" is asserted nowhere for the menu; photos with a head are untested (DATA-04, CODE-06) |
| JWT validation | `ServiceRegistration.cs:47-54` | None | AUTH-02 |
| Error response hygiene | `ApiExceptionHandler.cs` | `Api/ErrorResponseTests.cs:64`, `:82` | None |

## Findings

No Blocker. Six Should findings group the test gaps by area (CODE-01 to CODE-06); eight Could findings cover layering, size, duplication, baseline drift and hygiene. No code, schema or test was changed.

### CODE-01 — Permission, tenant-state and endpoint-exposure rules are tested for default roles on a subset of routes

- **Workstream:** W7
- **Location:** `apps/api/tests/WhitePlate.Tests/Api/OrganizationEndpointTests.cs:116-199`; `apps/api/WhitePlate.Application/Orders/GetAnalyticsMetricsQueryHandler.cs:19-22`; `apps/api/WhitePlate.Infrastructure/Persistence/Repositories/CatalogPublicationRepository.cs`
- **Evidence:**
  - The only custom-role HTTP test grants `kitchen.display`, then `catalog.manage`, and checks one route (`GET …/catalog`, `OrganizationEndpointTests.cs:159-173`). The other seven permission keys have no allow and deny test through a role that holds exactly that key.
  - The analytics route has no API test: a search of `apps/api/tests` for `analytics/` and `withdrawal` finds nothing (`OrderOutboxDispatcherTests.cs:24` only stubs the repository). The wrong permission in SEC-08 therefore passes the suite.
  - Reorder is tested only as an owner (`OrganizationEndpointTests.cs:288-292`); discount deactivation only as a manager (`:921`); neither with a role holding the neighbouring permission.
  - Catalog publication, discard, restore and history have no dedicated test. `catalog/publish` is called as set-up in `CategoryVisibilityTests.cs:34`, `OrdersEndpointTests.cs:437`, `:798` and `ProductAvailabilityTests.cs:91`, and `ProductAvailabilityTests.cs:160-175` asserts 200 for a manager's publish with the current `If-Match`. None asserts a stale version (412), tenant isolation or a denied permission, and discard, restore and history are never called (W1 notes publication as serializable and row-locked).
  - Owner-only role and member administration has a non-owner denial test only at handler level and only for reading and replacing grants (`Application/OrganizationRolePermissionsHandlerTests.cs:42-58`, with a stub membership store). No test, at HTTP or handler level, has a non-owner or a foreign-organization owner create or archive a role, change a member's role or archive an organization; the HTTP tests for those routes run as the owner (`OrganizationEndpointTests.cs:30`, `:116-199`, `:956`).
  - Staff invitations are tested for owners only (`OrganizationEndpointTests.cs:56`, `:518`; `CreateStaffInvitationCommandTests.cs:22-31`); no test has a non-owner invite into a broader role (SEC-09).
  - Tenant deactivation is exercised only for `/me` and establishment settings (`OrganizationEndpointTests.cs:599-621`, `:1270`), not for orders, catalog, media or the hub (SEC-01).
  - There is no endpoint-metadata guard for SEC-03: `TenantEndpointTests.cs:83` and `WeatherForecastEndpointTests.cs:47-61` spot-check four routes out of 115 actions.
- **Impact:** SEC-02, SEC-08 and SEC-09 are Should findings that no test would catch regressing or being fixed incorrectly, and the grant model is the platform's main tenant-internal control. A future change to `HasPermissionAsync`, to a role default or to a new route can weaken it with a green build.
- **Severity:** Should
- **Fix direction:** Add one parameterized API test class that seeds a custom role per permission key and asserts the allow and deny outcome of every protected route for it (the W1 matrix is the route list), including analytics, reorder, discount deactivation, publication and history. Add the SEC-01, SEC-02 and SEC-09 sketches from W1 when those fixes land. Add the SEC-03 endpoint-metadata test so a new route must be classified.
- **Regression test:** Sketch below
- **Status:** Confirmed

```text
Arrange: organization G, restaurant T; for each key K in the eight permission keys, custom role R_K = [K]; member M_K.
Request: for each protected route X in the W1 matrix, call X as M_K.
Expected: allowed exactly when K is the permission X documents (api-contracts.md:260); 404 otherwise.
Actual: not tested; analytics, publication and history routes have no HTTP test (search of apps/api/tests).
Request: POST /api/v1/organizations/G/roles, PUT …/roles, POST …/roles/{id}/archive, PUT …/members/{id}/role, POST …/archive as Manager, Kitchen, and an owner of another organization
Expected: 404 each, no persisted change   Actual: no such test (handler-level denial exists only for read and replace)
Arrange: resolve EndpointDataSource from the test host.
Assert: every RouteEndpoint has IAuthorizeData or is in a reviewed IAllowAnonymous allowlist (SEC-03 sketch).
```

### CODE-02 — Authentication configuration and token confinement have no automated test

- **Workstream:** W7
- **Location:** `apps/frontend/lib/auth.ts:49-145`; `apps/frontend/app/api/auth/[...all]/route.ts:10-11`; `apps/frontend/lib/api/index.ts:6-20`; `apps/api/WhitePlate.Api/Configuration/ServiceRegistration.cs:58-64`
- **Evidence:**
  - `lib/auth.ts` is imported by tests only to be mocked (`app/api/kitchen/signalr-token/route.test.ts:5`, `services/live-workspace.test.ts:9`, `app/[locale]/(workspace)/organization/(overview)/page.test.tsx:23`, `.../settings/page.test.tsx:14`, `.../team/page.test.tsx:45`). The only auth-related unit test is `lib/auth-database.test.ts`, which covers TLS verification of the auth database connection.
  - No test asserts the password minimum (AUTH-03), session lifetime and renewal (AUTH-04), the hashed or plain reset-token identifier (AUTH-06), the rate-limit rules and client-IP header (AUTH-07), the 15-minute JWT lifetime or the `set-auth-jwt` header (SEC-06, AUTH-01).
  - The blocked `/api/auth/token` route (`[...all]/route.ts:10-11`) is verified in W2 by probe only; no test names it (search for `api/auth` in `*.test.ts(x)` finds nothing; only Playwright specs mention sign-in).
  - `getApiToken` (`lib/api/index.ts:6-20`: foreign Origin refused, verified email required) has no test of its own; search for `getApiToken` in tests is empty.
  - API side: the hub reads the token from the query string (`ServiceRegistration.cs:58-64`, SEC-05) and no test touches `OnMessageReceived`. JWT validation tests are AUTH-02 and are not repeated here.
- **Impact:** The configuration that decides who may sign in, how long a session lives and which token the browser can read is a set of library options that a dependency upgrade, a refactor or a copy-paste can change silently. W2 recorded seven findings there; none has a test that will fail when it regresses or confirm a fix.
- **Severity:** Should
- **Fix direction:** Extract the Better Auth options into a plain object (or export the built `auth` options) so a Vitest unit test can assert them: `minPasswordLength`, `session.expiresIn/updateAge`, `verification.storeIdentifier`, `advanced.ipAddress`, `plugins` jwt `expirationTime` and `disableSettingJwtHeader`. Add a route test for `[...all]` that `/api/auth/token` returns 404 and an Origin-refusal test for `getApiToken`. For the hub token, use the API test host with a real JwtBearer (AUTH-02's sketch) to assert that a hub-only audience is rejected on REST routes once SEC-06 is fixed.
- **Regression test:** Sketch below
- **Status:** Confirmed

```text
Test: import the auth options module; assert minPasswordLength >= 12, session.expiresIn <= agreed limit,
verification.storeIdentifier === "hashed", jwt.disableSettingJwtHeader === true, advanced.ipAddress.ipAddressHeaders is set.
Test: GET /api/auth/token through the route handler -> 404 and no handler call.
Test: getApiToken with Origin "https://foreign.example" -> null, auth.api.getSession not called.
Actual: none of these exist; lib/auth.ts is only mocked.
```

### CODE-03 — BFF Origin checks, permission prechecks and several server actions are untested, and the shared URL guard is tested only for its prefix

- **Workstream:** W7
- **Location:** `apps/frontend/app/api/theme-publication/route.ts:24-29`; `apps/frontend/app/api/public/order-quote/route.ts:7-10`; `apps/frontend/app/api/catalog-history/route.ts:31-41`; `apps/frontend/app/api/organization-analytics/route.ts`; `apps/frontend/actions/stripe-connect.ts`; `apps/frontend/actions/catalog-publication.ts`; `apps/frontend/actions/order-email-settings.ts`; `apps/frontend/actions/ordering-operations.ts`; `apps/frontend/actions/establishment-settings.ts:27`; `apps/frontend/lib/api/request-url.ts:7-28`
- **Evidence:**
  - Of the 19 route handlers under `app/api`, these have no `route.test.ts`: `theme-publication` (exact-Origin check at `:24-29`, applied at `:42`), `public/order-quote` (same-origin check `:7-10`), `catalog-history` (membership and `catalog.manage` precheck `:31-41`), `organization-analytics`, `public/analytics-withdrawal` and `auth/[...all]` (CODE-02). The Origin control is tested for brand-assets, product-photos, signalr-token, theme-settings and tracking.
  - Of the 10 files in `actions/`, four have no test: `stripe-connect.ts`, `catalog-publication.ts`, `order-email-settings.ts`, `ordering-operations.ts`. They validate tenant IDs and versions before building API paths, which is the control SEC-07 shows can be missed.
  - `saveOpeningHoursAction` (SEC-07) is not exercised: `actions/establishment-settings.test.ts:54-64` covers `saveEstablishmentSettingsAction` only.
  - `lib/api/request-factory.test.ts:151-168` asserts rejection of `//attacker…` and `/api/v2/…`. No test sends `?`, `#`, `..` or encoded segments through `resolveApiUrl`, the shared guard whose weakness SEC-07 reproduces (`request-url.ts:7`, `:26-28`).
  - Response-header tests (`private, no-store`) exist for most handlers (listed in the controls table) and are missing for `catalog-history`, `organization-analytics`, `theme-publication`, `public/order-quote`, `public/pickup-slots` and `public/analytics-withdrawal`.
  - The four permission prechecks in the kitchen and catalog-history routes are copies of API rules (CODE-09); the kitchen ones are tested (`app/api/kitchen/orders/route.test.ts`, `.../dashboard/metrics/route.test.ts`, `.../ordering-operations/route.test.ts`), `catalog-history` is not.
- **Impact:** CSRF defence for the staff BFF rests on one hand-copied Origin comparison per handler. Two handlers have no test, so the check can be dropped or changed (for example the `?? "http://localhost:3000"` fallback) without a failing test. The action layer is the BFF's only input validation before the API, and four actions have none under test.
- **Severity:** Should
- **Fix direction:** Add `route.test.ts` for `theme-publication`, `order-quote` and `catalog-history` modelled on `app/api/theme-settings/route.test.ts:19` (foreign Origin returns 403 before any API call). Add `*.test.ts` for the four actions (valid, malformed ID, non-UUID, stale version). Add a `resolveApiUrl` table test for `?`, `#`, `..`, `%2e%2e`, `%2f` and backslashes together with the SEC-07 fix.
- **Regression test:** Sketch below
- **Status:** Confirmed

```text
Call: POST /api/theme-publication with Origin "https://foreign.example"   Expected: 403 and no API call   Actual: no test
Call: POST /api/public/order-quote with Origin "https://foreign.example"   Expected: 403                     Actual: no test
Call: resolveApiUrl("/api/v1/tenants/T/x?y=/z", base), ("/api/v1/a/../b", base), ("/api/v1/a%2f..%2fb", base)
Expected: { ok: false, status: 400 } or a path with encoded segments   Actual: no test (SEC-07 reproduced with Node URL)
Call: saveOpeningHoursAction({ tenantId: "<T>/categories/<C>?x=", ... })   Expected: invalid, no request   Actual: not tested
```

### CODE-04 — Stripe Connect webhook handler, webhook controller and OAuth callback have no test

- **Workstream:** W7
- **Location:** `apps/api/WhitePlate.Application/Payments/StripeConnectHandler.cs:150-172`; `apps/api/WhitePlate.Api/Controllers/StripeConnectController.cs:36-53`, `:59-84`; `apps/api/tests/WhitePlate.Tests/Api/StripeConnectEndpointTests.cs:22`
- **Evidence:**
  - `StripeConnectEndpointTests.cs` holds one test: the status route returns 401 anonymously (`:22-31`).
  - `ProcessWebhookAsync` (`StripeConnectHandler.cs:150`), which checks `livemode` against the route (`:155`) and re-reads `account.updated` from Stripe (`:164-165`), is never called by a test (search for `ProcessWebhookAsync` in `apps/api/tests` is empty). The handler tests use a provider stub whose `VerifyWebhook` returns `null` (`Application/StripeConnectHandlerTests.cs:248`) and a store whose `ApplyWebhookAsync` returns `true` (`:224-225`).
  - The webhook controller (`StripeConnectController.cs:59-84`: anonymous, 2 MB limit, unknown mode returns 400, missing signature returns 400) and the OAuth callback redirect rules (`:36-53`) have no HTTP test.
  - Covered: signature against the exact raw body, with one fixed `api_version` (`Infrastructure/StripeConnectProviderTests.cs:43-67`); event deduplication and out-of-order handling (`Infrastructure/StripeConnectRepositoryTests.cs:42`); owner-only start, state single use and ownership loss (`Application/StripeConnectHandlerTests.cs:19-149`).
- **Impact:** Webhook signature verification is the one control that stops an anonymous caller from changing a restaurant's payment status. The unit test proves the provider verifies a signature; nothing proves that the controller and handler refuse an unsigned, wrong-mode or wrong-`livemode` event, or that PUB-05 and SEC-10 are fixed correctly.
- **Severity:** Should
- **Fix direction:** Add API tests with a fake `IStripeConnectProvider` (the existing `StripeConnectFactory` pattern): unsigned request returns 400; invalid signature returns 400; `livemode` mismatch returns 400 and no write; valid `account.updated` re-reads the account; a different `api_version` is handled as PUB-05 decides; callback with an unknown or reused state redirects to `stripeConnectResult=failed`. Add the SEC-10 session-binding test when that fix is chosen.
- **Regression test:** Sketch below
- **Status:** Confirmed

```text
Request: POST /api/v1/stripe-connect/webhooks/test with no Stripe-Signature   Expected: 400, no write   Actual: no test
Request: POST …/webhooks/live with a signed test-mode event (livemode=false)    Expected: 400, no write   Actual: no test
Request: POST …/webhooks/test signed, api_version "2025-01-27.acacia"           Expected: per PUB-05 decision   Actual: no test
Request: GET /api/v1/stripe-connect/oauth/callback?state=reused&code=x          Expected: 302 …stripeConnectResult=failed   Actual: no test
```

### CODE-05 — Rate-limit, body-limit and abuse controls on the public surface are only partly tested

- **Workstream:** W7
- **Location:** `apps/api/tests/WhitePlate.Tests/Api/OrdersEndpointTests.cs:518-568`; `apps/api/tests/WhitePlate.Tests/Api/CheckoutRequestRateLimiterTests.cs:8`; `apps/api/WhitePlate.Api/Controllers/AnalyticsController.cs:36-56`; `apps/api/WhitePlate.Api/Program.cs:52-56`; `apps/api/WhitePlate.Application/Tenants/CreateRestaurantCommandHandler.cs:11-14`
- **Evidence:**
  - Tested: the limiter partitions by key (`CheckoutRequestRateLimiterTests.cs:8-19`); checkout returns 429 after the permit and another tenant is unaffected (`OrdersEndpointTests.cs:518-547`); checkout rejects a 20 KiB body with 413 (`:550-568`); idempotency (`:44`, `:415`, `:497`, `:571`).
  - `CheckoutIsRateLimitedPerTenantAndClient` never varies the client address and treats the per-restaurant bucket as the contract, so the PUB-01 fix (a trusted client address) will break it rather than be guarded by it. The quote endpoint shares the limiter and has no limit test (`OrderQuoteTests.cs:31` only).
  - The analytics withdrawal route and its limiter have no test at all (PUB-06); `grep` for `analytics/` finds nothing in `apps/api/tests`.
  - Upload size is asserted only inside the processor (`Infrastructure/BrandImageProcessorTests.cs:35`, a 2 MiB-plus-1 byte array). The controller limits (`BrandAssetsController.cs:40-49`) and the pre-authentication buffering of DATA-03 have no HTTP test.
  - No test posts client-supplied price fields (`unitPrice`, `total`, `currency`, `discountAmount`) to checkout and asserts they are ignored. `CreateOrderRequest` has no such member, so the control is structural; a test would guard a future request-record change. W3 verified it only in a throwaway probe.
  - Tracking tests use constant-byte capabilities (`OrdersEndpointTests.cs:120`, `:329`), which will conflict with PUB-03's fix.
  - SEC-04's quota and rate limit have no control and no test; only the four reserved names are tested (`Application/TenantUseCaseTests.cs:12`).
  - PUB-02 (deactivated discount after a publish), PUB-07 (guess budget) and the media 413 are likewise absent.
- **Impact:** PUB-01 is the audit's top public-surface finding and its fix changes how every limiter is keyed; with the tests as they stand, the fix is verified by nobody and one existing test must be rewritten. Two anonymous limiters (quote, withdrawal) and the upload limits have no regression protection.
- **Severity:** Should
- **Fix direction:** Rewrite the rate-limit test around the chosen client-address source (forwarded header from a trusted hop) and assert that two guests behind one proxy are limited independently and that quotes do not spend the order allowance. Add limiter tests for quote and withdrawal, an upload test for 413 with and without credentials (DATA-03), a checkout test that sends price fields, and tests for PUB-02, PUB-03 and PUB-07 with their fixes.
- **Regression test:** Sketch below
- **Status:** Confirmed

```text
Request: 25 quotes with distinct X-Forwarded-For through the test proxy hop, then one checkout
Expected: independent per-client limits; checkout not limited by quotes   Actual: not testable today (test never varies the client)
Request: POST /api/v1/orders {customerName, items, unitPrice: 0.01, total: 0.01, currency: "USD"}
Expected: 201 with server-computed totals and tenant currency            Actual: no such test (W3 probe only)
Request: POST …/brand-assets/banner/uploads, no Authorization, 5 MiB chunked body
Expected: 401 without reading the body                                   Actual: no test (413 after buffering per DATA-03)
Request: 12 POST /api/v1/tenants/T/analytics/withdrawal from one client
Expected: 429 after the permit; same body otherwise                      Actual: no test
```

### CODE-06 — No PostgreSQL, migration or publication-state regression tests behind DATA-01, DATA-04 and DATA-05

- **Workstream:** W7
- **Location:** `apps/api/WhitePlate.Api/Configuration/DatabaseReadinessHealthCheck.cs:15`; `apps/api/tests/WhitePlate.Tests/Api/HealthEndpointTests.cs:44-54`; `apps/api/WhitePlate.Infrastructure/Persistence/Repositories/OrderRepository.cs:209-211`; `apps/api/WhitePlate.Infrastructure/Persistence/Repositories/CatalogPublicationRepository.cs:198`; `docs/coding-standards.md:47`
- **Evidence:**
  - Readiness calls `CanConnectAsync` only (`DatabaseReadinessHealthCheck.cs:15`) and its test asserts Healthy for a reachable database (`HealthEndpointTests.cs:44-54`). `TenantRepositoryTests.cs:101-114` checks that the model matches the snapshot and that one migration name exists; no test applies migrations or compares applied with pending ones (DATA-01).
  - Every database-backed test runs on in-memory SQLite (`new SqliteConnection("Data Source=:memory:")`, for example `OrdersEndpointTests.cs:1021`, `StripeConnectEndpointTests.cs:35`); `WhitePlate.Tests.csproj:14-18` has no PostgreSQL or container package. Production-only SQL is behind `IsNpgsql()` and never executed: the tenant `FOR SHARE` re-check of `AcceptingOrders` at checkout (`OrderRepository.cs:209-211`), the `ON CONFLICT` slot insert (`:225-229`), and the publication-head lock (`CatalogPublicationRepository.cs:198-202`). `docs/coding-standards.md:47` itself says production PostgreSQL concurrency "still need[s] broader validation".
  - DATA-04: `ProductPhotosEndpointTests.cs:125-142` tests photo visibility without a publication head. No test publishes, archives in draft and requests the photo.
  - DATA-05: versioned routes have 412/428 tests; catalog entity updates have no version, so there is nothing to test until the contract changes.
- **Impact:** The paused-restaurant guarantee, the pickup-slot capacity guarantee and the publish serialization are exactly the controls W1 and W3 cite as holding, yet their PostgreSQL behaviour is verified by no automated test, and the schema-lag outage of DATA-01 passes every check including `/health/ready`.
- **Severity:** Should
- **Fix direction:** Make readiness fail while migrations are pending (DATA-01 fix) with an API test using a database whose history lacks the latest migration. Add a small PostgreSQL-backed test stage (disposable container in CI, or the Neon `test` branch for a manual job) for the three `IsNpgsql()` paths: concurrent checkouts against one slot, a paused restaurant at checkout, and concurrent publishes. Add the DATA-04 published-snapshot photo test with its fix.
- **Regression test:** Sketch below
- **Status:** Confirmed

```text
Setup: database migrated up to the previous migration; API built from main
Request: GET /health/ready   Expected: 503 Unhealthy while migrations are pending   Actual: 200 Healthy (source and HealthEndpointTests.cs:44-54)
Setup (PostgreSQL): slot capacity 1; two concurrent POST /api/v1/orders for the same slot with different keys
Expected: exactly one 201 and one 409   Actual: not run; the test host uses SQLite, which takes the non-locking branch
Setup: product P published with active photo A; archive P in the draft (no publish)
Request: GET /api/v1/products/P/photos/A/640   Expected: 200 (published) or both hidden   Actual: no test with a publication head
```

### CODE-07 — The order-email dispatcher lives in the API host, queries EF directly and is untested

- **Workstream:** W7
- **Location:** `apps/api/WhitePlate.Api/Realtime/OrderEmailOutboxDispatcher.cs:5`, `:32`, `:69-92`, `:94-140`; `apps/api/WhitePlate.Api/Configuration/OrderEmailRenderer.cs:8`, `:18`, `:53`; `apps/api/WhitePlate.Api/Configuration/DatabaseReadinessHealthCheck.cs:3-7`; `apps/api/WhitePlate.Infrastructure/Persistence/OrderEmailDelivery.cs:96`
- **Evidence:**
  - Layering. `WhitePlate.Api` references Infrastructure by design (`apps/api/AGENTS.md`; `DependencyRulesTests.cs:22-24` requires exactly `Application` and `Infrastructure`). Registration code in `ServiceRegistration.cs` and `MediaRegistration.cs` is the composition root and is acceptable. Beyond it, three Api types use Infrastructure internals: `OrderEmailOutboxDispatcher` takes `WhitePlateDbContext`, runs the claim queries (`ExecuteUpdateAsync` on `OrderEmailDeliveries`, `:74-91`), loads `Orders` and `Tenants` entities and saves them (`:96-139`); `OrderEmailRenderer` takes the Infrastructure entity `OrderEmailDelivery` (`:18`, `:53`); `DatabaseReadinessHealthCheck` takes `WhitePlateDbContext` (`:7`). No test inspects what the Api project does with Infrastructure types: the four architecture tests cover project references and the assemblies of Domain, Application and Infrastructure.
  - The claim predicate is written twice: inline in the dispatcher (`:76-83`) and as `OrderEmailDelivery.IsClaimable` (`OrderEmailDelivery.cs:96`), which nothing calls (a search for `IsClaimable` finds only its definition).
  - Tests. The dispatcher is removed from every test host (`OrdersEndpointTests.cs:1047-1052`, and `MediaFactory` removes all `IHostedService` registrations, `BrandAssetsEndpointTests.cs:209`). Entity rules are tested (`Infrastructure/OrderEmailDeliveryTests.cs:8`, `:29`) but not the claim, lease, discard-when-order-closed or retry-state transitions the dispatcher drives. The kitchen outbox has one success-path test (`Api/OrderOutboxDispatcherTests.cs:14`), nothing for DATA-06's retry and purge.
  - W4 ("Relation to HOST-01") refuted the crash-loop hypothesis for the API host: every `BackgroundService` catches non-cancellation exceptions inside its loop, so a failing delivery cannot stop the host. What W4 left for W7 is the narrow case of a hard process kill during delivery: the row stays `Sending`, its expired lease is reclaimed, and the claim predicate does not look at `AttemptCount` (`OrderEmailOutboxDispatcher.cs:74-86`), because `Failed` is reached only through `ScheduleRetry` in the catch block (`OrderEmailDelivery.cs:63-70`). This is a hardening gap read from source, separate from the refuted host crash loop.
- **Impact:** This is the code path that holds a guest's email address and rendered message between checkout and delivery, and the privacy rule "clear the recipient after acceptance or failure" is enforced inside a class that no test runs. The boundary leak is also what makes it untestable without the API host.
- **Severity:** Could
- **Fix direction:** Move the claim, lease and attempt-limit logic behind an Application interface implemented in Infrastructure (like `OutboxStore` for the kitchen outbox), keep the dispatcher a thin loop in the host, and make the claim honour `AttemptCount` so a lease that keeps expiring ends in `Failed`. Delete or use `IsClaimable`. Add dispatcher tests with a fake sender: success clears the recipient, failure schedules a retry, the tenth attempt discards, a closed order discards, a crashed lease is reclaimed once and then fails. Add an architecture test that `WhitePlate.Api` types outside `Configuration/*Registration.cs` do not reference `WhitePlate.Infrastructure.Persistence`.
- **Regression test:** Sketch below
- **Status:** Confirmed

```text
Setup: OrderEmailDeliveries row Sending with LeaseUntil in the past and AttemptCount = 10
Action: run one dispatcher cycle with a fake sender that throws
Expected: row ends Failed, recipient and snapshots cleared, sender not called
Actual: no dispatcher test exists; the claim predicate ignores AttemptCount (source)
Arrange: reflect over WhitePlate.Api types other than the registration classes
Assert: none reference WhitePlate.Infrastructure.Persistence types   Actual: OrderEmailOutboxDispatcher, OrderEmailRenderer, DatabaseReadinessHealthCheck do
```

### CODE-08 — Six files exceed 600 lines; two test files exceed 1,100

- **Workstream:** W7
- **Location:** `apps/api/tests/WhitePlate.Tests/Api/OrganizationEndpointTests.cs`; `apps/api/tests/WhitePlate.Tests/Api/OrdersEndpointTests.cs`; `apps/api/WhitePlate.Infrastructure/Persistence/Repositories/OrderRepository.cs`; `apps/api/WhitePlate.Infrastructure/Persistence/Repositories/CatalogRepository.cs`; `apps/frontend/actions/catalog.test.ts`; `apps/api/WhitePlate.Api/Controllers/TenantCatalogController.cs`
- **Evidence:** Line counts (`apps`, excluding `node_modules`, `bin`, `obj`, `.next`, `Migrations`, `*.Designer.cs`, the model snapshot and `messages/*.json`; no other file exceeds 450 lines):
  - `OrganizationEndpointTests.cs` 1,376 lines, `OrdersEndpointTests.cs` 1,195 lines (already split into partial files `…K3.cs` and `…OrderEmails.cs`), `actions/catalog.test.ts` 663.
  - `OrderRepository.cs` 723 lines: checkout catalog and idempotent order creation (`:20-262`), staff list, dashboard metrics and history (`:263-503`), public tracking (`:504`), transition, archive and email cleanup (`:534-723`) in one class with 13 public methods.
  - `CatalogRepository.cs` 700 lines: availability, draft management reads and writes, reorder and the public menu (`GetMenuAsync` `:496`) in one class with about 35 public members.
  - `TenantCatalogController.cs` 649 lines with 39 actions in one `[Authorize]` controller (`:13`).
  - Frontend source files are all below 450 lines; `apps/frontend/eslint.config.mjs` enforces `max-lines` 350 on non-test files, which is the reason none grows large.
  - None of these mixes responsibilities in a way that blocks a W1-W4 fix: SEC-01's fix lands in `StaffMembershipRepository.cs`, SEC-08's in three handlers, DATA-04's in `ProductPhotoRepository.cs`. They do make tenant-filter review harder: each of `OrderRepository`'s four staff queries repeats its own `TenantId` predicate (`:266`, `:317`, `:332-345`, `:426`) next to anonymous checkout code.
- **Impact:** Review and merge friction in the two repositories that hold both anonymous and staff queries; the two test files make a failing test hard to find.
- **Severity:** Could
- **Fix direction:** Split `OrderRepository` into checkout, staff queries and maintenance (the Application interfaces already separate these concerns), `CatalogRepository` into management and public menu, and the test classes by feature (`…Catalog`, `…Roles`, `…Invitations`; `…Checkout`, `…Tracking`, `…StaffOrders`). Keep tenant predicates in one shared query helper so SEC-01's activity filter is one change.
- **Regression test:** None
- **Status:** Confirmed

### CODE-09 — Origin, tenant-selector, UUID and membership-precheck logic is copy-pasted across route handlers and actions with drifting rules

- **Workstream:** W7
- **Location:** `apps/frontend/app/api/brand-assets/route.ts:39-44`; `apps/frontend/app/api/product-photos/route.ts:42-47`; `apps/frontend/app/api/theme-settings/route.ts:37-42`; `apps/frontend/app/api/theme-publication/route.ts:24-29`; `apps/frontend/app/api/kitchen/signalr-token/route.ts:9-17`; `apps/frontend/lib/validation/common.ts:5-11`; `apps/frontend/actions/establishment-settings.ts:51`, `:86`
- **Evidence:**
  - Exact-Origin check, five copies, each with the `process.env.BETTER_AUTH_URL ?? "http://localhost:3000"` fallback: the four route files above plus `signalr-token` (with its own error handling for an invalid URL). A sixth variant is in `lib/api/index.ts:8-13` (Origin optional), a seventh in `app/api/public/order-quote/route.ts:7-10` (compares with the request URL), an eighth in `app/api/public/orders/[orderId]/tracking/route.ts:123-129` (compares host) and a ninth in `actions/checkout.ts:14-27`. The rules differ on missing Origin (refused in the first five, allowed in `lib/api/index.ts` and `order-quote`), on the fallback and on what they compare with.
  - UUID validation, six files with their own definition: `lib/validation/common.ts:5-11` and `lib/checkout/cart.ts:219-224` (both also reject the all-zero GUID), `lib/order-dashboard.ts:21` and `:244`, `lib/order-summary-parser.ts:12` and `:221`, `lib/orders/order-event-tracker.ts:3`, `services/analytics.ts:12` (these four accept the nil GUID), plus the looser `/^[0-9a-f-]{36}$/i` in the two establishment actions (`actions/establishment-settings.ts:51`, `:86`), which accepts strings such as 36 hyphens.
  - Tenant-selector parsing appears in at least six handlers, written two ways: `query.getAll("tenantId").length === 1` (`catalog-history/route.ts:20`, `establishment-settings/route.ts:8`, `kitchen/dashboard/metrics/route.ts:16`, `kitchen/dashboard/ordering-operations/route.ts:51`, `theme-settings/route.ts:18`) and `query.size === 1` (`theme-publication/route.ts:11`).
  - The membership and permission precheck against `/me` is copied in four handlers with four different permission lists (`kitchen/orders/route.ts:30-43`, `kitchen/dashboard/metrics/route.ts:19-32`, `kitchen/dashboard/ordering-operations/route.ts:13-45`, `catalog-history/route.ts:31-41`), each a second statement of rules the API owns (SEC-08 shows such copies diverging from the API).
  - `reply`/`noStoreHeaders` helpers are repeated in eight route files.
- **Impact:** A fix to one copy leaves the others behind; SEC-07 exists precisely because one action used a weaker ID check than the rest. The fallback to `http://localhost:3000` repeats wherever the check is copied.
- **Severity:** Could
- **Fix direction:** One `lib/security/origin.ts` (`isTrustedOrigin(request)` with a single decision on missing Origin and no localhost fallback in production), one `parseTenantQuery(request)`, and one `isUuid` in `lib/validation/common.ts` used by every consumer; replace the four permission prechecks with one helper that takes the permission set and reads the single rule table that `lib/analytics-access.ts` already starts. Add the table tests in CODE-03 against the shared helpers.
- **Regression test:** None
- **Status:** Confirmed

### CODE-10 — Prettier drift in 17 files and CI that checks only changed files

- **Workstream:** W7
- **Location:** `apps/frontend/app/[locale]/(workspace)/organization/restaurant-settings/loading.tsx`, `app/[locale]/not-found.tsx`, `components/demo/workspace/history/model.tsx`, `components/demo/workspace/studio/page.tsx`, `components/demo/workspace/team/view.tsx`, `components/workspace/analytics/page/model.tsx`, `components/workspace/dashboard/live-dashboard.test.tsx`, `components/workspace/settings/live-settings.tsx`, nine files under `components/workspace/shared/skeletons/`; `.github/workflows/ci.yml:54-78`
- **Evidence:** The README baseline: `npm run format:check` on a clean LF copy prints "Code style issues found in 17 files" (exit 1). The CI step formats only the `.ts` and `.tsx` files changed in the pushed range (`ci.yml:54-78`), so existing drift never fails a build and a file that drifted before its first edit is first flagged by an unrelated change. `.prettierrc` sets `endOfLine: "lf"` and the repository has no `.gitattributes`, so a Windows checkout with `core.autocrlf=true` fails `format:check` on nearly every file (README note); `AGENTS.md` and `docs/development.md` do not mention it. Not re-run for W7.
- **Impact:** The format gate is advisory for existing files, and contributors on Windows see failures that do not reflect real drift. Review diffs pick up formatting churn.
- **Severity:** Could
- **Fix direction:** Run `npm run format` once in a dedicated commit, then change the CI step to `npm run format:check` (the full check is cheap), as CFG-07 already anticipates. Add a root `.gitattributes` (`*.ts text eol=lf`, `*.tsx text eol=lf`, and the same for `.mjs`, `.json`, `.cs`) so working trees match Prettier's setting.
- **Regression test:** None
- **Status:** Confirmed

### CODE-11 — 19 `no-img-element` lint warnings: the `<img>` versus `next/image` decision is unmade

- **Workstream:** W7
- **Location:** `apps/frontend/components/demo/workspace/dashboard/view.tsx`, `components/demo/workspace/menu/sections/section-06.tsx`, `components/demo/workspace/menu/shared.tsx`, `components/marketing/landing/previews/menu-preview.tsx`, `components/marketing/landing/previews/setup-illustration.tsx`, `components/marketing/landing/sections/section-02.tsx`, `section-04.tsx`, `components/storefront/demo/**` (checkout, storefront, shared), `components/workspace/studio/page/shared.tsx`
- **Evidence:** README baseline: `npm run lint` exits 0 with 19 warnings, all `@next/next/no-img-element`, in 15 files under `components/demo`, `components/marketing`, `components/storefront/demo` and `components/workspace/studio`. A grep for `<img` in `apps/frontend/components` and `app` finds 19 tags in the same 15 files. The guest photo path (`components/product/photo-image.tsx`, PERF-05) already uses `next/image` with `unoptimized` and is not among them. Every warning is therefore in demo, marketing or studio-preview code, not in the guest ordering flow. The warnings are not suppressed with `eslint-disable` (a search of `apps/frontend` for `eslint-disable`, `@ts-ignore` and `@ts-expect-error` finds none), and CI lint passes with them because they are warnings.
- **Impact:** Noise that hides a new real warning, and unoptimized marketing images on the public landing page (a W9 concern, not a security one). Cross-reference PERF-05, which covers the guest photo path.
- **Severity:** Could
- **Fix direction:** Decide per area: convert marketing images to `next/image` with dimensions (W9's image decisions apply), keep `<img>` with a justified lint override for demo fixtures that render user-supplied data URLs, and run lint with `--max-warnings` set to the agreed ceiling so new warnings fail the build.
- **Regression test:** None
- **Status:** Confirmed

### CODE-12 — Stale lint-failure guidance and a test file still named for the removed weather sample

- **Workstream:** W7
- **Location:** `AGENTS.md:37`; `docs/development.md:267`; `docs/documentation-review.md:124`, `:155`, `:176`, `:190`, `:206`; `apps/api/tests/WhitePlate.Tests/Api/WeatherForecastEndpointTests.cs:10`
- **Evidence:**
  - `AGENTS.md:37` tells contributors to see `docs/documentation-review.md` "for the lint failure observed at the documentation baseline; do not silently waive it". That failure (`contextOrFilename.getFilename is not a function`) did not reproduce on a clean `npm ci` copy at `55f31a5` (README baseline, lint row: 0 errors); the flat config now wraps the legacy rules with `fixupConfigRules` (`apps/frontend/eslint.config.mjs:1-9`), and `docs/development.md:267` lists the error as a troubleshooting entry. `docs/documentation-review.md` still records the failure in five dated run logs without a resolution note.
  - `WeatherForecastEndpointTests.cs` is named for the removed sample, and its first test asserts the sample route is removed (`:12-24`), but the file holds the OpenAPI, Swagger, HTTPS-redirect and root-probe tests of the whole API (`:26-162`), including the only bearer-security spot check (CODE-01).
- **Impact:** The instruction to keep reporting a lint failure that no longer occurs wastes review effort and trains contributors to ignore baseline warnings; the stale test file name hides the OpenAPI and Swagger tests from anyone searching for them.
- **Severity:** Could
- **Fix direction:** Update `AGENTS.md:37` and `docs/documentation-review.md` to say the failure is resolved by a lockfile install (or remove it), keep `development.md:267` as a troubleshooting entry, and rename the test file and class to `OpenApiAndHostingTests`.
- **Regression test:** None
- **Status:** Confirmed

### CODE-13 — Catalog history shows raw OIDC subject and issuer to restaurant staff

- **Workstream:** W7
- **Location:** `apps/frontend/components/workspace/catalog/publication/catalog-publication-dialogs.tsx:195`; `apps/api/WhitePlate.Infrastructure/Persistence/Repositories/CatalogPublicationRepository.cs:321-324`
- **Evidence:** The history dialog renders `` `${revision.actorSubject} (${revision.actorIssuer})` `` for each revision (`catalog-publication-dialogs.tsx:195`). The API returns both raw values to every holder of `catalog.manage` on the tenant (`CatalogPublicationRepository.cs:321-324`). W1 recorded this as a hygiene note: the values are opaque identifiers of the same restaurant's staff, so there is no tenant-isolation effect. They are also an internal identity-provider identifier and issuer URL shown in the UI, where a name or email (already held in the organization's member list) would serve. Read from source; not rendered.
- **Impact:** Users see an unreadable identifier instead of who changed the menu, and internal subject IDs are exposed to every staff member with the permission. Low risk, poor usability, and an avoidable disclosure if subject IDs are ever treated as sensitive.
- **Severity:** Could
- **Fix direction:** Resolve the actor to the member's display name or email on the server for members of the same organization, and return no issuer; show "Former member" when the actor no longer exists. Add an API test that history responses do not contain `actorIssuer`.
- **Regression test:** Sketch below
- **Status:** Confirmed

```text
Arrange: restaurant T with a published revision by member M (display name "Ada")
Request: GET /api/v1/tenants/T/catalog/history as a catalog.manage holder
Expected: revisions carry an actor display name and no actorSubject or actorIssuer; a former member shows null
Actual (source): actorSubject and actorIssuer returned raw; the dialog renders both (catalog-publication-dialogs.tsx:195)
```

### CODE-14 — No code-coverage measurement for either test suite

- **Workstream:** W7
- **Location:** `apps/frontend/vitest.config.ts`; `apps/frontend/package.json`; `apps/api/tests/WhitePlate.Tests/WhitePlate.Tests.csproj:14-18`; `.github/workflows/ci.yml`
- **Evidence:** `vitest.config.ts` defines no coverage provider and `package.json` has no coverage script or `@vitest/coverage-*` dependency. `WhitePlate.Tests.csproj` has no `coverlet` or coverage collector package, and CI runs `npm run test` and `dotnet test` only (`ci.yml:42-44`, `:112-113`). The test-gap matrix in this file therefore rests on manual search; no line or branch figure exists for the 729 frontend and 372 API tests, and no test is excluded from a threshold because none is set. 37 Playwright specs also never run in CI (`ci.yml` has no `test:browser` step, CFG-07).
- **Impact:** Gaps like CODE-01 to CODE-07 are found only by an audit like this one, and a PR that removes a test or adds untested code shows nothing.
- **Severity:** Could
- **Fix direction:** Enable Vitest's V8 coverage and the .NET Microsoft Testing Platform coverage extension in CI as report-only first, publish the numbers per area (`WhitePlate.Application`, `actions/`, `app/api/`), then set a floor for the security-relevant folders (`Application/**`, `app/api/**`, `actions/**`, `lib/validation/**`).
- **Regression test:** None
- **Status:** Confirmed

## Checked, no finding

- **Domain depends on nothing outward.** `WhitePlate.Domain.csproj` has no `ProjectReference` and no `PackageReference` (`apps/api/WhitePlate.Domain/WhitePlate.Domain.csproj`); no `using` of `WhitePlate.Application|Infrastructure|Api`, `Microsoft.AspNetCore` or `Microsoft.EntityFrameworkCore` exists in any Domain file. Enforced by `Architecture/DependencyRulesTests.cs:11-25` (project references) and `:28-38` (assembly references).
- **Application depends only on Domain.** `WhitePlate.Application.csproj:8` references Domain only and has no packages; no Application file uses `WhitePlate.Infrastructure`, `WhitePlate.Api`, EF Core, ASP.NET, Npgsql, Stripe or Magick namespaces (grep of `using`). Enforced by `DependencyRulesTests.cs:11-25`, `:41-51`.
- **Infrastructure does not reference the Api.** `WhitePlate.Infrastructure.csproj:8` references Application only; no `using WhitePlate.Api` or `Microsoft.AspNetCore` in Infrastructure. Enforced by `DependencyRulesTests.cs:54-60`.
- **Api to Infrastructure.** `WhitePlate.Api.csproj:24-25` references Application and Infrastructure, as documented (`apps/api/AGENTS.md`; `DependencyRulesTests.cs:22-24`). The `using WhitePlate.Infrastructure.*` lines are in registration classes (`ServiceRegistration.cs:10-11`, `:19`, `:99`, `:108`, `MediaRegistration.cs:2-3`), which is the composition root, plus the three internals recorded in CODE-07. Controllers depend on Application handlers and repository interfaces, never on Infrastructure types.
- **Language and compiler settings.** `Nullable` and `ImplicitUsings` are enabled in all four projects; the frontend has `"strict": true` (`apps/frontend/tsconfig.json`). A search of `apps` finds no `@ts-ignore`, `@ts-expect-error`, `eslint-disable`, `: any`, `as any`, `#pragma warning disable`, `[Obsolete]`, `TODO`, `FIXME` or `HACK`.
- **Frontend lint rules enforce structure.** `eslint.config.mjs` forbids raw `fetch` outside `lib/api/json-request-client.ts` (`whiteplate/shared-requests`), caps non-test files at 350 lines and library, action and service functions at 80 lines, and requires shared UI controls. This is why no frontend source file passes 450 lines.
- **Test hygiene.** The 258 API test methods are named for behaviour and the suite is organized by layer (`Api`, `Application`, `Domain`, `Infrastructure`, `Architecture`), as `apps/api/AGENTS.md` requires; the test hosts read (`OrdersEndpointTests.cs`, `BrandAssetsEndpointTests.cs`, `StripeConnectEndpointTests.cs`) use the `Production` environment with test authentication schemes rather than disabling authorization globally. The baseline passes 729 and 372 tests with 0 failures and 0 skips.
- **Baseline.** Lint 0 errors, typecheck pass, build pass: no failure to record other than format drift (CODE-10) and the warnings of CODE-11.
- **Controls with adequate tests.** Hub authorization and revocation (`Api/SignalRKitchenEventPublisherTests.cs:15-55`, `Api/KitchenSubscriptionsTests.cs:11-41`, `Application/KitchenSubscriptionAccessTests.cs:13`, `:26`), checkout idempotency (`Api/OrdersEndpointTests.cs:44`, `:415`, `:497`, `:571`), public tracking capability (`:323`, `:392`), safe error responses (`Api/ErrorResponseTests.cs:64`, `:82`), image decoder limits (`Infrastructure/BrandImageProcessorTests.cs:24-66`), S3 endpoint SSRF rules (`Infrastructure/S3MediaStorageTests.cs:20-55`), tenant host resolution (`Api/TenantEndpointTests.cs:43`, `Api/TenantHostResolverTests.cs`), storefront path routing (`proxy.test.ts:30`, `lib/storefront-preview-routing.test.ts:52-221`), composite tenant foreign keys (`Infrastructure/CatalogPersistenceTests.cs:48`).

## Not covered

- **W6 (accessibility).** In progress when this file was written; its findings and tests are excluded. The README coverage row for W7 should be read with that in mind.
- **Playwright specs.** The 37 spec files in `apps/frontend/tests/browser` were listed but not read or run; they need a running API and database (`docs/development.md`) and CI does not run them. Whether they cover any control in the matrix (some mention sign-in and `api/auth`) was not assessed.
- **Test quality beyond the cited tests.** The matrix says whether a test exists and what it asserts at the cited lines. It does not mutation-test the tests or judge every assertion; tests that mock the layer under audit (for example the Stripe handler stub) are noted where found.
- **Re-running the baseline.** Lint, typecheck, test, format, build and `dotnet test` were taken from `README.md` and not repeated for W7.
- **Coverage figures.** None exist (CODE-14).
- **W5, W8 and W9 findings.** Read for cross-references (CFG-07, CFG-09, PERF-05); their test gaps were not mapped, as the task covers W1-W4. Hosted environments were not touched.
- **Source of the 19 lint warnings.** Counted from the README baseline plus a grep for `<img`; ESLint was not re-run.

## ASVS / WCAG coverage

ASVS 4.0.3 Level 2, chapters named for this task. WCAG is not applicable to W7 (W6).

| Requirement | Result |
| --- | --- |
| V1.1.1 Secure development lifecycle | Partial: documented workflow (`AGENTS.md`), 15 decision records, CI with tests, lint, typecheck and build. No dependency, container or security gate (CFG-07) and no coverage measurement (CODE-14). |
| V1.1.2 Threat modeling | Gap: a search of `docs` finds no threat model; `docs/architecture/tenancy-and-security.md` records the tenant design and its open items, and this audit is the first systematic review. |
| V1.1.3 Security stories and constraints | Partial: `api-contracts.md`, the custom-roles design and ADRs state permission and tenancy rules. Rules and code disagree in places (SEC-08, SEC-06 versus `tenancy-and-security.md:55`). |
| V1.1.4 Trust boundaries and components documented | Partial: tenant, BFF, API and storage boundaries are documented (`tenancy-and-security.md`, ADR 0005, ADR 0007). Several statements are stale or contradicted (SEC-06, DATA-02). |
| V1.1.5 Architecture and component connections documented | Met: `docs/architecture/*`, `WHITEPLATE_BACKEND_ARCHITECTURE.md`, with the layering enforced by tests. |
| V1.1.6 Centralized, simple, vetted security controls | Partial: one `HasPermissionAsync` path and shared access helpers on the API; the BFF repeats Origin, selector, UUID and permission logic with different rules (CODE-09). |
| V1.1.7 Secure coding checklists, tests for security controls | Partial: ESLint boundary rules and TDD requirement (`coding-standards.md:49`). Security controls without regression tests: CODE-01 to CODE-06; JWT validation is AUTH-02. |
| V1.14.1 Segregation of components by trust level | Partial: layered projects and a separate BFF are enforced by `DependencyRulesTests.cs:11-60`; network segregation of the database is W8 (HOST-02). Layer leaks recorded in CODE-07. |
| V1.14.2 Deployment binaries signed and from trusted sources | Not covered here: image and deployment pipeline belong to W5 and W8 (CFG-08). |
| V1.14.3 Build pipeline warns of out-of-date or insecure components | Gap: no audit or vulnerability step in CI (CFG-07); the sweep found a Critical `next` (CFG-01). |
| V1.14.4 Pipeline builds and verifies a secure deployment | Partial: CI runs tests, lint, typecheck and a placeholder-secret build; no API image build, no PostgreSQL test stage (CODE-06), no browser specs, and a format check limited to changed files (CODE-10). |
| V1.14.5 Sandboxing of untrusted content | Not assessed in W7: image decoder limits are in W4 (`BrandImageProcessor` resource limits, covered by `BrandImageProcessorTests.cs:24-66`). |
| V1.14.6 No deprecated client-side technologies | Met by inspection of `apps/frontend/package.json` and the source: no plugin-style technology; not an exhaustive dependency scan (W5). |
| WCAG | Not applicable to W7. |
