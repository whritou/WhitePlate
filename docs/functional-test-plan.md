# Functional test plan

This is an acceptance plan with dated verification notes below. The API suite covers tenant/organization/staff/catalog CRUD, verified email and invitation binding, checkout pricing/idempotency, order workflow, body/rate limits, outbox dispatch, and hub authorization. Dashboard API contracts and frontend unit behavior are automated. Localization, real-database checkout snapshots, catalog editing, owner/manager/kitchen permissions, cross-tenant denial, open-dashboard revocation recovery, live outbox retry/delivery and reconnect REST recovery have local acceptance on Neon `test`; the guarded discount-management browser flow and checkout redemption/receipt-history remain separate acceptance items. Production SignalR configuration and actual token-expiration recovery remain open. Catalog-localization and localized-order migrations are applied on Neon `test` and Coolify Production. Vercel Production has completed hosted email/password signup and verification, organization creation/listing, an authenticated protected API request, restaurant creation, and owner access over TLS. The operator reports that signed-out and alternate-account attempts to open the protected restaurant route both redirected to `/fr?error=invalid_code`; accept this hosted frontend access-denial check without repeating it. The operator also reports Production `DATABASE_URL` targets Coolify PostgreSQL over verified TLS with `DATABASE_SSL_CA`, while Preview's target remains the old Render database; full Preview environment isolation remains open. Local email/password signup/invitation acceptance is verified on Neon `test`. Real Resend delivery beyond the hosted verification email, OAuth providers, and broader browser auth flows remain open. The earlier documentation audit is in [documentation review](documentation-review.md).

## Organization and catalog lifecycle acceptance

- An owner archives an organization from its settings danger zone. Its overview card offers restore, and the organization, restaurant, catalog, invitation, and order records remain stored.
- While archived, restaurants are omitted from active workspace memberships; staff access, public tenant/menu resolution, and new checkout orders are rejected. Pending invitations remain stored and cannot be accepted during archive.
- An owner restores the organization from the overview or settings. Existing restaurant activation and product availability values are unchanged.
- An owner or manager restores an archived product under an active category. The product is unarchived but remains unavailable, and archived option descendants remain archived. There is no permanent product purge action.

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
| CUR-07 | Run frontend tests, lint, typecheck, format:check, and build separately | Each exits successfully; record tool/runtime failures separately rather than calling the whole set passed |
| CUR-08 | Run the API solution tests and request `/WeatherForecast` | API tests pass; the removed sample route returns `404` |
| CUR-09 | Fetch `/openapi/v1.json` and `/swagger` in Development | OpenAPI JSON documents current API routes, omits `/WeatherForecast`, and Swagger UI returns `200` |
| CUR-10 | Start API with Production environment and no Development launch profile, then request OpenAPI | `404`; use an explicit test port and the intended HTTP/HTTPS configuration |
| CUR-11 | Request `/api/v1/menu` on a configured tenant host | `200` for an active provisioned tenant; unknown tenant host returns `404` |
| CUR-12 | Run the API against the Neon `test` branch and request `/api/v1/tenant` on an unknown subdomain | Database resolution completes and returns the expected `404`; the test uses Neon `test` and does not query or mutate Coolify Production |
| CUR-13 | Request `/health/live` and `/health/ready` with the API database reachable, then repeat readiness with the database unavailable | Liveness remains `200`; readiness returns `200` when connected and `503` when disconnected, with no provider details in the response |

PowerShell 7 API smoke check, while the HTTP profile is running:

```powershell
$spec = Invoke-RestMethod http://localhost:5182/openapi/v1.json -NoProxy
if ($spec.paths.'/WeatherForecast') { throw 'Removed weather route remains in OpenAPI' }
if (-not $spec.paths.'/api/v1/orders') { throw 'Public order route is missing from OpenAPI' }
if (-not $spec.paths.'/api/v1/tenants/{tenantId}/catalog') { throw 'Catalog management route is missing from OpenAPI' }
Invoke-WebRequest http://localhost:5182/swagger -NoProxy | Select-Object -ExpandProperty StatusCode
```

The local Neon `test` branch and the OpenAPI/Swagger endpoints were verified on 2026-09-29. The EF `CatalogLocalization` and `LocalizedOrderSnapshots` migrations are now applied there. The branch has test-only signup, organization, and membership records from the local invitation flow; do not treat it as an empty database. The xUnit API tests use a relational test provider and do not detect every local port, external OAuth, or Windows logging issue.

## 2. Live integration and frontend acceptance scenarios

Automated tests cover catalog locale resolution, translation fallback, checkout label snapshots, idempotency and persisted staff label reads. The dated Neon/browser records below show completed localization, checkout snapshot, role/isolation, revocation, live SignalR delivery/retry and reconnect scenarios. Remaining live work is specific to hosted OAuth/real email, hosted hub URL/CORS/TLS and token-expiration renewal, public tenant DNS/TLS, and Preview isolation. The guarded discount-management browser flow and checkout redemption/receipt-history are distinct acceptance scenarios and are not implied by catalog UI implementation. Use two tenants A/B with distinct staff identities and menus; include an unavailable product, stale order version, and malformed/expired credentials.

### Authentication and onboarding

The local email/password signup, email verification, organization creation, and invitation acceptance path was exercised against the Neon `test` database on 2026-09-29 with test-only `.invalid` addresses and locally intercepted email delivery. The remaining browser scenarios, OAuth providers, and broader real email delivery remain unverified; configure Google and Microsoft callback URLs and a verified Resend sender before running those checks.

On 2026-09-30, a dedicated verified `local-tester@whiteplate.invalid` account was added using intercepted verification, and a JWT minted with the current signing key passed live `GET /api/v1/me` with HTTP 200. The real frontend sign-in endpoint returned 200 and its session cookie loaded `/en/organization` with HTTP 200 using Webpack dev mode; Turbopack hit the documented Windows process error 5. The account has no organization membership by default. Browser interaction and Swagger UI interaction remain separate acceptance checks.

On 2026-10-06, the operator completed hosted email/password signup and verification through Vercel Production and created one organization. The signed-in organization page loaded successfully, and the server-side frontend API client completed protected `GET /api/v1/me` against Coolify over verified TLS. Using the organization ID as a restaurant tenant selector correctly returned the no-membership/access-denied state. This verifies one hosted identity's session, token, API validation, and membership lookup. A later owner flow created a test restaurant; see the dated restaurant acceptance below. The operator later reported that a signed-out browser and a browser using a different account were both redirected from the protected restaurant route to `/fr?error=invalid_code`. Treat that as completed hosted access-denial acceptance; the observed result is the frontend redirect and does not assert an API status code.

### Hosted restaurant and owner access acceptance — 2026-10-06

Through the signed-in Vercel Production app, the operator created `WhitePlate Acceptance Test` with the subdomain `acceptance-check-20261006` and currency EUR in the current Coolify database. The team-management page listed the restaurant. Opening `/fr/organization/orders?tenantId=<restaurant-id>` displayed the restaurant, its localized owner role, and the empty-order state. This verifies creation, persisted owner membership, the protected server-side API path and membership-gated kitchen page for the signed-in account. No order was created. The public tenant storefront was not tested because its wildcard DNS/TLS is not configured.

Operator-reported follow-up on 2026-10-06: opening the protected restaurant route while signed out and while signed in with a different account redirected to `/fr?error=invalid_code` in both cases. The operator asked that this be considered complete and not retested. This records frontend access-denial behavior; no API response status was separately reported. The operator also reports Production `DATABASE_URL` is Coolify PostgreSQL over verified TLS with `DATABASE_SSL_CA`; its Vercel description is `Coolify PostgreSQL over verified TLS using DATABASE_SSL_CA; replace placeholder with URL-encoded whiteplate_auth password.` Preview `DATABASE_URL` remains on the old Render target. The actual URLs/passwords are deliberately not recorded here. Confirming the remaining Preview variables is still needed before calling the whole Preview environment isolated.

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
| AUTH-11 | Open the organization team page as an owner; inspect roster and invitation states, then revoke pending, accepted, expired, and foreign invitations | Member rows omit OIDC keys, invitation reads omit token material, statuses are localized, only pending invitations show revoke, and non-pending/foreign resources share the API's safe `404` |

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
| SF-18 | Save restaurant descriptions in English and French; load each enabled menu locale with present, missing, and empty translations | The public menu displays the selected-locale description, falls back to the restaurant default, renders no empty placeholder when no description exists, and owner/manager saves are scoped to enabled locales and limited to 500 characters; kitchen and foreign tenant access are denied | High |
| SF-19 | Browse categories, open a product options dialog, adjust quantity/options, save or cancel, and use the cart at mobile and desktop widths | Keyboard accessible category links and dialog; unsaved modal changes do not alter cart; saved choices and quantities show in the cart; the mobile cart entry opens the same cart and can proceed into the existing checkout | High |
| SF-10 | Owner/manager edits menu languages and translations; attempt to remove the final language and use a duplicate or invalid tag | At least one enabled language and one included default always remain; translations can be saved only for enabled languages; kitchen staff cannot change settings or translations | High |
| SF-12 | Change the default while active catalog items lack translations; then translate all active items and retry | The first change is rejected without changing settings; the change succeeds after every active category, product, option group, and option has a translation in the new default language | High |
| SF-11 | Request storefront on the configured base host, a one-label tenant subdomain, a nested subdomain, and an unrelated host | Only a validated one-label subdomain routes to the matching public menu; raw/forwarded host values do not select another tenant | High |
| SF-02 | Add/configure items, edit quantities, remove, switch menu language, reload, switch tenant | In-memory cart retains one line per product and preserves selections on same-tenant menu-language changes; removal works, reload clears it, and another tenant starts empty | High |
| SF-03 | Submit valid order through the storefront | Existing API creates the order; frontend displays only validated server receipt/totals/tax/discount and reference. No payment is included. Local fixture browser checks are verified; real database acceptance remains. | Critical |
| SF-04 | Submit an unavailable product | Safe validation/error response, no partial order | High |
| SF-05 | Send negative/zero/fractional quantities, duplicate IDs, empty/oversized payloads, or forged prices | Automated API tests cover validation, the 16 KiB body cap, and server-derived prices | Critical |
| SF-06 | Send foreign-tenant product IDs | No foreign data exposed, no order inserted | Critical |
| SF-07 | Double-submit or retry after response loss; submit changed content with the same key | Browser guard blocks rapid duplicate calls. Uncertain outcome locks editing and reuses original payload/key; fixture stores one order and replays its receipt. API rejects changed content with `409`. | Critical |
| SF-13 | Reject choices, invalid promo code, rate limit, and conflict | No raw API error details are displayed; cart stays editable after definite rejection, corrected input uses a new key, and unchanged retries reuse their key | High |
| SF-08 | Edit product price/name after an order | Historical line snapshots and total remain unchanged | High |
| SF-09 | Concurrent checkout and availability change | Outcome follows the selected stock/availability policy; no unjustified stock guarantee | High |
| SF-14 | Check out in a non-default menu locale, an enabled locale with missing item translations, and an omitted/unsupported locale | New receipt records the effective locale and exactly the localized or default-fallback product/option labels used at checkout; changing catalog translations later does not change historical receipt or staff detail; omitted/unsupported locale resolves to the tenant default | High |
| SF-15 | Replay checkout with the same key and same locale, then reuse it with a different effective locale | Same request replays the same localized receipt; changed effective locale returns `409`; existing pre-migration orders keep their labels and expose unknown `menuLocale` as `null` | High |
| SF-16 | Complete a guest checkout and open its receipt tracking link | Receipt contains the server receipt and a capability URL fragment; cart, guest fields, idempotency attempt and receipt are held in a tenant-scoped in-memory Zustand store and clear on reload or tenant change | High |
| SF-17 | Read tracking with a valid, wrong, expired, malformed, or foreign-tenant token; advance the order through the staff Kanban | Only the capability and matching restaurant host reveal `id`, `status`, `version`, and `createdAt`; other cases share `404`; no customer or totals are returned; status refresh follows `Pending`, `Preparing`, `Ready`, `Completed` or terminal `Cancelled`; responses are no-store | Critical |

### Restaurant descriptions and shop presentation — 2026-10-08

The implementation adds API/domain coverage for per-locale persistence, selected/default description fallback, blank clearing, 500-character limits, and owner/manager versus kitchen/foreign-tenant access. The full API suite passed (163 tests), and the frontend suite passed (57 files, 382 tests). Frontend lint, typecheck, changed-file formatting, API build, and Next production build passed. The Next build used inert HTTPS `.invalid` endpoints and an unavailable local database; Better Auth logged expected schema-connection errors. A local fixture walkthrough verified EN/FR menu descriptions, required-option validation, confirmed cart updates, estimated subtotal, Escape dismissal/focus restoration, and checkout locale preservation on desktop. The EF migration is generated but not applied to a shared database. Narrow mobile viewport and hosted acceptance remain open.

### Catalog management

The public tracking implementation has focused coverage in `OrdersEndpointTests.PublicTrackingRequiresTenantAndCapabilityAndReturnsOnlyOrderStatus` and the frontend tracking BFF/client/store tests. It verifies tenant isolation, stored token hash, expiry, status transition visibility, minimal response fields, exact-origin rejection, API-factory host routing, and per-tenant Zustand isolation. The production migration was applied and its history row, two columns, and zero order rows were verified on Coolify Production on 2026-10-08. Hosted tracking remains unverified until the feature code is deployed.

`tests/browser/catalog-management.spec.ts` covers owner category/product and option-group/option creation and editing, GBP amounts and selection bounds persisting after reload, localized archive descriptions, Escape and Cancel, focus restoration, descendant archival, and safe error feedback that keeps a failed confirmation open. `tests/browser/discount-management.spec.ts` covers localized owner creation of fixed and percentage codes, uppercase normalization, immutable codes during edits, Escape and focus restoration, a pending action that cannot be dismissed or submitted again, successful close-after-mutation behavior, and safe failure feedback. Run both only with the explicitly guarded non-production acceptance database and the local API/frontend configured as described in the browser test setup. Input/action tests reject malformed IDs, files, browser authorization fields, unsupported archive targets, excessive lengths, invalid decimals, tax, selection bounds, discount percentages and ordering. Response tests reject foreign tenant data and malformed management DTO fields. The API remains responsible for owner/manager authorization and cross-tenant isolation; kitchen/foreign-account authorization is covered in the separate staff acceptance suite. Discount redemption through guest checkout, one-discount-per-order behavior, totals/tax rounding, invalid/inactive rejection, tenant isolation and historical receipt snapshots still require real database acceptance.

### Owner restaurant creation

`npm run test:browser -- tests/browser/restaurant-creation.spec.ts --reporter=line` runs the localhost-only owner creation flow against the existing non-production account/database. It creates an acceptance organization and GBP restaurant, submits an uppercase subdomain, verifies the created restaurant in the team list, and checks French duplicate-subdomain feedback with editable fields restored. Frontend boundary tests additionally cover reserved labels, malformed/file inputs, unsupported currencies, input normalization, safe permission errors and malformed API responses. Existing `OrganizationEndpointTests` independently enforce owner-only creation and foreign-organization denial.

### Kitchen and authorization

| ID | Scenario | Required outcome | Priority |
| --- | --- | --- | --- |
| DB-01 | Commit a new order while A/B dashboard clients are connected | Outbox write is transactional; live non-production verification confirmed only tenant A's authorized connection received A's event | Critical |
| DB-02 | Advance status, repeat same status, attempt skipped/backward transition | Agreed lifecycle enforced; repeat is no-op success; invalid transition proposed `409` | High |
| DB-03 | Make a status update under latency, rejection, and stale version | UI does not advance optimistically; stale `409`/`412` shows a localized conflict and reloads the authoritative REST state | High |
| DB-04 | Call protected endpoints with missing/expired token, wrong role, or foreign-tenant ID | `401`, `403`, or non-disclosing `404` as specified; UI login redirect tested separately | Critical |
| DB-05 | Request another tenant's SignalR group or reconnect after permissions change | API membership checks reject unauthorized subscription; live non-production verification rejected both cross-tenant joins | Critical |
| DB-06 | Disconnect, miss events, reconnect; duplicate or reorder messages | Rejoin and authoritative refetch restore state; frontend unit tests cover deduplication and stale versions; live non-production REST recovery passed | High |
| DB-07 | Fail notification delivery after database commit | The dispatcher retries; order remains durable and REST recovery stays authoritative | High |

### Staff dashboard browser acceptance

These cases exercise the Next.js page and its same-origin token route as a signed-in user. They are separate from the existing direct API/SignalR acceptance above.

| ID | Scenario | Required outcome | Priority |
| --- | --- | --- | --- |
| UI-ORD-01 | Open a restaurant listed by `/api/v1/me`, then forge a different `tenantId` in the URL | The server only fetches orders for a listed membership; an unauthorized or unknown tenant shows no order data | Critical |
| UI-ORD-02 | View tickets, apply a status filter, and load an older page in English and French | Saved product/option labels and quantities render without catalog lookup; links retain tenant/status context; copy and accessible labels use the selected app locale | High |
| UI-ORD-03 | Advance orders as kitchen staff, manager, and owner; submit a stale version | Only allowed controls appear; each update uses `If-Match`; no optimistic status change appears; stale state is reloaded with a translated conflict message | Critical |
| UI-ORD-04 | Request the SignalR token route while signed out, unverified, with absent/wrong Origin, and with a verified same-origin session | Failures do not expose a token; success is POST-only, same-origin, verified-session-only, and `Cache-Control: no-store` | Critical |
| UI-ORD-05 | Receive same-tenant, foreign-tenant, duplicate, stale, and burst order events; interrupt and restore the hub | Only new events for the selected tenant trigger a coalesced REST refresh; reconnect rejoins that tenant and reloads REST state; loaded tickets remain visible while offline | High |
| UI-ORD-06 | Render the dashboard for each staff role, then revoke membership while a ticket page is cached | The current role is visible, each transition action has an order-specific accessible name, and a forbidden response removes cached tickets and status filters | High |
| UI-ORD-07 | Use the kanban by mouse, touch and keyboard; try skipped stages, kitchen cancellation, duplicate/pending and rejected updates | Only permitted transitions submit; next-step buttons remain accessible; no optimistic column change; Escape cancels; focus follows the moved ticket; tabs, counts and lanes remain readable in FR/EN, both themes and mobile layouts | High |
| UI-ORD-08 | Open the orders page with no matching orders, then with active orders | Empty data shows only “Aucune commande pour le moment” (localized in English) and no lane columns; active data renders the usual Kanban lanes and tickets | High |
| UI-ORD-09 | Open order history as owner, manager, kitchen staff, and a non-member; search by customer/reference and combine status/date filters, sorting, and pagination | Owner/manager see all retained orders; kitchen/non-members are denied by both page and API; filters and sort are applied server-side, page navigation retains filters, and no-result/error states are distinct | Critical |
| UI-ORD-10 | Complete and cancel orders, then allow the UTC day boundary or restart the API after it | Terminal orders leave the kitchen list on the daily archive run, retain their status and saved details in history, and missed runs are recovered on startup without duplicate effects | High |

On 2026-10-06, the development-only kanban fixture verified UI-ORD-07 interactions without database access. Unit tests cover stale snapshot/version rejection and dashboard rendering; existing mutation/query tests cover conditional requests, conflict refresh and access-denied cache handling. This run does not repeat the database-backed staff suite or hosted acceptance.

On 2026-10-07, frontend unit tests covered UI-ORD-08 empty versus populated Kanban rendering, owner/manager navigation visibility, order-history table filters/sort/page links and no-results state. API tests used in-memory SQLite to create and complete/cancel orders, archive them, confirm they leave the kitchen list but remain searchable in owner/manager history, and deny kitchen history access; dispatcher tests verified the UTC midnight calculation. The full frontend suite passed (353 tests), and the API solution passed (152 tests). SQLite-backed API test hosts remove the new hosted archive worker so it cannot race fixture database initialization; production continues to register the worker. The automated checks invoke the archive operation directly; waiting for the deployed worker across a UTC boundary and applying its migration remain deployment acceptance work.

On 2026-10-02, frontend unit coverage for UI-ORD-06 passed for the kitchen-role label/action name and forbidden-access ticket/filter removal. At that date the manager/owner browser matrix and hosted membership-revocation flow remained open. Follow-up: the local owner/manager/kitchen matrix and REST revocation recovery passed on 2026-10-04; hosted SignalR revocation behavior remains unverified.

### Run the live OIDC and SignalR check

Run this manually against a local database or the Neon `test` branch only. You need two verified Better Auth accounts, each with membership in only its own test tenant, two active tenants with at least one available product each, and the business plus Better Auth schemas migrated. Use kitchen-staff accounts or separate organizations so neither test identity is an owner with access to both tenants. Keep the API configured with `Tenancy__BaseDomain=localhost`, `Authentication__Issuer=http://localhost:3000`, and `Authentication__Audience=whiteplate-api`. Do not use Production credentials or a Production database.

1. Start the API and frontend in separate terminals using the [development guide](development.md). In PowerShell, confirm OIDC discovery and signing keys return `200`; an unauthenticated `GET http://localhost:5182/api/v1/me` should return `401`.
2. In `apps/frontend`, mint a short-lived API token for each verified test user. The helper reads the existing `.env.local` values, and process environment variables override them:

   ```powershell
   $env:WHITEPLATE_DEV_EMAIL = 'staff-a@whiteplate.invalid'
   $secret = Read-Host 'Client A password' -AsSecureString
   $env:WHITEPLATE_DEV_PASSWORD = [System.Net.NetworkCredential]::new('', $secret).Password
   $tokenA = node .\scripts\dev-token.mjs
   $env:WHITEPLATE_DEV_PASSWORD = $null

   $env:WHITEPLATE_DEV_EMAIL = 'staff-b@whiteplate.invalid'
   $secret = Read-Host 'Client B password' -AsSecureString
   $env:WHITEPLATE_DEV_PASSWORD = [System.Net.NetworkCredential]::new('', $secret).Password
   $tokenB = node .\scripts\dev-token.mjs
   $env:WHITEPLATE_DEV_PASSWORD = $null
   ```

   A bearer-authenticated `GET /api/v1/me` should return `200` for both tokens. Tokens expire in 15 minutes. Keep them in the local shell; do not paste them into a browser or share them.

3. Resolve tenant IDs and a product ID from the tenant hosts. The explicit `Host` header keeps the call on localhost while exercising tenant host resolution:

   ```powershell
   $hostA = 'bistro.localhost:5182'
   $hostB = 'harbor.localhost:5182'
   $tenantA = Invoke-RestMethod http://localhost:5182/api/v1/tenant -Headers @{ Host = $hostA }
   $tenantB = Invoke-RestMethod http://localhost:5182/api/v1/tenant -Headers @{ Host = $hostB }
   $menuA = Invoke-RestMethod http://localhost:5182/api/v1/menu -Headers @{ Host = $hostA }
   $productA = $menuA.Categories | ForEach-Object { $_.Products } | Where-Object IsAvailable | Select-Object -First 1
   ```

   Use a product with no required option selections, or submit its valid option IDs. If these example hosts are not provisioned locally, replace them with your two test tenant subdomains.

4. Export the two tokens and tenant IDs to the local process, then run the Node REPL from `apps/frontend`:

   ```powershell
   $env:WHITEPLATE_TOKEN_A = $tokenA
   $env:WHITEPLATE_TOKEN_B = $tokenB
   $env:WHITEPLATE_TENANT_A = $tenantA.id
   $env:WHITEPLATE_TENANT_B = $tenantB.id
   node
   ```

   In the REPL, start two independent authenticated SignalR clients:

   ```js
   const { HubConnectionBuilder, LogLevel } = await import('@microsoft/signalr')
   const connect = (token) => new HubConnectionBuilder()
     .withUrl('http://localhost:5182/hubs/orders', { accessTokenFactory: () => token })
     .withAutomaticReconnect()
     .configureLogging(LogLevel.Warning)
     .build()
   const eventsA = [], eventsB = []
   const a = connect(process.env.WHITEPLATE_TOKEN_A)
   const b = connect(process.env.WHITEPLATE_TOKEN_B)
   a.on('order.changed', event => eventsA.push(event))
   b.on('order.changed', event => eventsB.push(event))
   await a.start(); await a.invoke('JoinRestaurant', process.env.WHITEPLATE_TENANT_A)
   await b.start(); await b.invoke('JoinRestaurant', process.env.WHITEPLATE_TENANT_B)
   ```

   Confirm client A cannot `JoinRestaurant` for tenant B and client B cannot join tenant A; each invocation must reject with a hub error:

   ```js
   await a.invoke('JoinRestaurant', process.env.WHITEPLATE_TENANT_B)
   await b.invoke('JoinRestaurant', process.env.WHITEPLATE_TENANT_A)
   ```

   Keep this REPL open to observe events.

5. From the PowerShell terminal, create an order for tenant A and retry the exact same payload with the same idempotency key:

   ```powershell
   $body = @{ customerName = 'SignalR smoke'; discountCode = $null; items = @(@{ productId = $productA.Id; quantity = 1; optionIds = @() }) } | ConvertTo-Json -Depth 5
   $key = [guid]::NewGuid().ToString()
   $headers = @{ Host = $hostA; 'Idempotency-Key' = $key }
   $first = Invoke-RestMethod http://localhost:5182/api/v1/orders -Method Post -ContentType 'application/json' -Headers $headers -Body $body
   $replay = Invoke-RestMethod http://localhost:5182/api/v1/orders -Method Post -ContentType 'application/json' -Headers $headers -Body $body
   $first.Id; $replay.Id
   ```

   The IDs should match. In the REPL, client A should receive one `order.changed` event with tenant A's ID and the same order ID; client B should receive none. Compare event IDs to deduplicate at-least-once deliveries.

6. For reconnect recovery, stop client A with `await a.stop()`. Create another tenant A order using a new idempotency key while it is offline. Start client A again, rejoin tenant A, and fetch `GET /api/v1/tenants/{tenantA.id}/orders` with token A. The REST page must contain the missed order. REST is the recovery source; SignalR groups are not automatically restored after a reconnect.
7. Verify REST isolation by requesting tenant A's order list with token B; expect `403`. Record the two token-authenticated `/me` results, both denied hub joins, event ID/order ID seen by A, no A event seen by B, matching idempotent receipt IDs, and the recovered order ID from REST. Clear the local token/password environment variables and close both SignalR connections when finished.

### Verification attempt — 2026-10-01

Source baseline: `0d2ed19` (`feat/guest-cart-checkout`), with a pre-existing unrelated edit in `apps/frontend/.env.example`. Tool versions: .NET SDK `10.0.401`, Node.js `v24.19.0`. The initial attempt started the local API and Next.js issuer. OIDC discovery and JWKS returned `200`; unauthenticated `GET /api/v1/me` returned `401`. A local JWT was minted, but authenticated `GET /api/v1/me` timed out while the API outbox worker logged database connection errors. This attempt did not establish SignalR delivery or reconnect recovery. See the successful follow-up below.

### Live verification follow-up — 2026-10-01

Re-running the local API and frontend issuer with the required Windows profile access allowed the test database connection and local Better Auth issuer to work. The checks below ran against the configured non-production test database and `http://localhost:3000`; production services and credentials were not used. Two new local Better Auth accounts with `.invalid` email domains were verified using a loopback-only email capture shim, then invited as kitchen staff into separate test restaurants. Their credentials and access tokens were kept out of the report.

| Check | Result |
| --- | --- |
| OIDC discovery and JWKS | `200` from `/.well-known/openid-configuration` and `/api/auth/jwks`; two signing keys available. |
| Independent staff membership | Both authenticated `GET /api/v1/me` calls returned exactly one restaurant, with distinct tenant IDs and `Kitchen` role. |
| Hub authorization | Both clients joined their own restaurant group; both cross-tenant `JoinRestaurant` attempts were rejected. |
| Event isolation and delivery | Tenant A received one `order.changed` event for order `2e4aa9bd-4b1e-4f82-8eff-6b4dd2c33284` (event `058c6b1a-c53a-4ff3-9bed-f74543c77406`); tenant B received no event for that order. |
| Status event | An authorized transition to `Preparing` returned `200` with version `2`; the subscribed client received `order.created` (event `6be1570f-ef6f-424c-bef9-8392a56ab2e8`) and `order.status_changed` (event `4a5a89dd-d363-4757-bc8b-1220bc00a98d`) for order `d162a7a8-8b33-4094-a70c-0ebf3b4e28d6`. |
| Idempotent checkout | Repeating the same request and idempotency key returned the same order ID: `2e4aa9bd-4b1e-4f82-8eff-6b4dd2c33284`. |
| Reconnect recovery | After client A disconnected, order `c8222353-9da8-467d-bfd1-51b675cd9488` was created. Client A reconnected, rejoined its group, and recovered that order from the authoritative REST list. |
| REST tenant isolation | Tenant B’s token received `403` when requesting tenant A’s orders; tenant A’s token received `200`. |

The API and frontend issuer were run locally with the development launch profile. The test used `@microsoft/signalr` from the frontend package and `Host: <tenant-subdomain>.localhost` for checkout requests. The replay returned the same order and emitted no second event. A loopback-only Resend shim captured local verification links; no email was sent to an external service. Test fixtures were created in the non-production database using the `sig-a-20261001160454` and `sig-b-20261001160454` restaurant subdomains.

This follow-up supersedes the earlier timeout-only result for OIDC, DB-01, DB-05, and DB-06. The run did not verify production issuer configuration, production domains, or production operations.

Commands and results:

```text
dotnet test apps/api/WhitePlate.slnx --no-restore
  Failed: 131 passed, 1 failed. TenantRepositoryTests.PostgreSqlModelAndMigrationProduceExpectedSchema expected 7 migrations; the checked-in source produces 8.

dotnet run --project apps/api/WhitePlate.Api/WhitePlate.Api.csproj --launch-profile http --no-build
  Started on http://localhost:5182. Existing protected Data Protection keys logged DPAPI decryption errors under this Windows context. The outbox could not connect to PostgreSQL.

node scripts/dev-token.mjs
  Minted a local Better Auth API JWT; token omitted from this report.
GET http://localhost:5182/api/v1/me (without token)
  401
GET http://localhost:5182/api/v1/me (with the minted token)
  Client timed out; no successful authenticated API response.
```

To complete acceptance, restore API connectivity to the configured non-production PostgreSQL test database, provide two verified staff identities with distinct tenant memberships, then run DB-01, DB-05, and DB-06 using two live SignalR connections and record event IDs, REST state before/after reconnect, and membership-denial results. The migration-count assertion reported above was corrected in the follow-up below.

Follow-up on 2026-10-01: updated `TenantRepositoryTests.PostgreSqlModelAndMigrationProduceExpectedSchema` to expect the eight checked-in migrations. The focused test passed, then `dotnet test apps/api/WhitePlate.slnx --no-restore` passed all 132 tests. A later live non-production run also verified two-client SignalR delivery, membership isolation, and reconnect recovery as recorded above; production configuration remains open.

### Staff dashboard implementation verification — 2026-10-01

The approved dashboard design and implementation plan are implemented in source. Commands ran from `apps/frontend` unless a repository-root path is shown. `npm` is not available on this shell's PATH, so the checked-in package-local executables were used directly.

| Command | Result |
| --- | --- |
| `node_modules/.bin/vitest.cmd run` | Passed: 13 files, 86 tests. Includes API request factory, order-action, token-route, dashboard parsing, event filtering/versioning/coalescing, reconnect join, and refresh tests. |
| `node_modules/.bin/tsc.cmd --noEmit` | Passed. |
| `node_modules/.bin/eslint.cmd .` | Passed with zero errors and five existing warnings in `components/auth/organization-forms.tsx` and `lib/api/request-factory.test.ts`; no warnings in the new dashboard files. |
| `node_modules/.bin/next.cmd build --webpack` | Passed, including TypeScript, page-data collection, and route generation. It ran from a temporary same-drive source copy because the existing development server on port 3000 held the shared `.next` manifest. The copy excluded local environment files except a hard link to the existing non-production `.env`; production auth/provider values were local placeholders. Better Auth validated its local database schema during build. The temporary copy was removed afterward. |
| `dotnet test apps/api/WhitePlate.slnx` | Passed: 132 tests, 0 failures. |

## Localized order snapshots — 2026-10-02

`LocalizedOrderSnapshots` adds nullable `Orders.MenuLocale`; checkout resolves the effective tenant locale before idempotency comparison and saves translated product/option labels into the order snapshots. Legacy orders retain a null locale. The migration is applied on Neon `test` and Coolify Production. Automated tests cover supported and fallback locales, snapshot stability after catalog edits, and same-key retries/conflicts across effective locales. Browser acceptance on Neon `test` verified language configuration and fallback, a French menu, a persisted French checkout receipt, and owner kitchen status transitions with live refresh. Hosted storefront, checkout, and kitchen-role acceptance remain open.

| Command/check | Actual result |
| --- | --- |
| `dotnet test apps/api/WhitePlate.slnx --no-restore --configuration Release` | Passed: 133 tests, 0 failures. |
| `node node_modules/vitest/vitest.mjs run` from `apps/frontend` | Passed: 20 files, 132 tests. |
| `node node_modules/eslint/bin/eslint.js .` from `apps/frontend` | Passed with no errors or warnings. |
| `node node_modules/typescript/bin/tsc --noEmit` from `apps/frontend` | Passed. |
| `node node_modules/prettier/bin/prettier.cjs --check '**/*.{ts,tsx}'` from `apps/frontend` | Passed. |
| `node node_modules/next/dist/bin/next build` with inert HTTPS `.invalid` auth/API URLs and an unavailable local database | Passed compilation, TypeScript, and all 29 route/page generations. Better Auth emitted expected schema-validation errors because the build database was intentionally unavailable. |
| Neon `test` migration | `LocalizedOrderSnapshots` applied successfully after reviewing the generated nullable-column migration. |
| Authenticated browser and live checkout acceptance (2026-10-02) | Passed against Neon `test`; details follow below. |

The API integration tests assert saved product/option snapshot data across cursor pages. Frontend tests exercise the token route's session/origin/cache rules, conditional status updates, tenant/event validation, deduplication, reconnect rejoin, coalescing, and REST refresh callbacks. The authenticated browser run below covers the owner dashboard at this point in the dated record. Follow-up: the separate kitchen-staff/manager role matrix and local revocation checks passed on 2026-10-04; browser-reachable production hub URL, CORS, and TLS remain for hosting/operations acceptance.

## Neon localization, checkout, and kitchen acceptance — 2026-10-02

All live mutations below used only the Neon `test` branch and seeded test tenants. The tenant's French translations and enabled-language settings were added to the test fixture and left available for repeat acceptance. No production data was changed.

| Scenario | Actual result |
| --- | --- |
| Catalog language settings and default | Enabling French succeeded. Switching the default while translated item text was incomplete was rejected with the expected validation message. After category and product translations were added, the switch succeeded; the default was restored to English. |
| Public locale and fallback | The API returned French translations for `fr`, English base text for `en`, and English default fallback for unsupported `es`. The tenant storefront rendered the French category, product, and description; `menuLocale=es` used the effective English locale. |
| Localized checkout and persistence | A French browser checkout produced a receipt with “Plat de test” and 7.50 EUR. The authenticated staff list returned the same order with `menuLocale=fr` and the French product snapshot. |
| Checkout idempotency | Replaying the same key and effective locale returned the original receipt. Reusing that key with a different effective locale returned `409`. A second test-only order was created to check this path. |
| Authenticated kitchen workflow | The local dashboard listed the Neon test orders, rendered the French ticket label, connected to SignalR after allowing `http://localhost:3000` through the local API's process-only CORS setting, and refreshed after Preparing → Ready status actions. |
| Tenant access boundary | Opening the kitchen route with a fabricated tenant ID rendered the access-denied state and no order details. Both seeded tenants belong to the owner used for this browser run; this is not the separate-role isolation scenario. |
| Hosted Coolify/Vercel path | Coolify readiness returned HTTP `200 Healthy` over verified TLS. Vercel Production completed hosted Better Auth signup/email verification, organization listing, authenticated protected `GET /api/v1/me`, restaurant creation, and owner access to the restaurant's empty kitchen page. The operator reports signed-out and alternate-account attempts redirected from the protected restaurant route to `/fr?error=invalid_code`; accept this frontend denial behavior. Public tenant storefront, production SignalR, and token-expiry recovery remain unverified. |

The dashboard check used an owner account. Kitchen-staff and manager permission combinations, role revocation during an active session, and the production SignalR origin/TLS path remain outstanding. The test checkout rows remain in the non-production Neon test database for audit; do not treat that database as an empty fixture.

## 3. Automation strategy

### Public landing and demo responsive acceptance — 2026-10-08

The `responsive-layout` Playwright project includes `public-responsive.spec.ts` for both public locales and light/dark themes at 320, 375, 639, 640, 768, 1023, 1024, 1279, 1280, 1440 and 1536px. It waits for the main heading before geometry measurements, checks document/heading overflow, doubled French root text, hero action heights, KPI containment, 44px locale targets, category-label fit and height, product action insets, desktop search width, Escape/focus and mobile cart/search/quantity behavior. These routes require no database. Run the public spec alone against a production preview; the existing broader spec includes development-only fixtures. See the [audit](audits/landing-demo-responsive.md) for actual commands, failures, evidence and limits.

### Coolify cutover gates — 2026-10-05

The user selected an empty new Coolify database with one hosted main stack. Bootstrap queries confirmed 9 EF migrations, both business/auth schemas and no accounts/business rows. PostgreSQL is running/healthy with SSL enabled. API HTTPS domain/redirect, port 8080, exact frontend CORS, issuer/audience and database-readiness check are configured; application credentials/deployment and Vercel cutover remain pending. The regression suites pass (144 API / 204 frontend), but do not establish hosted behavior.

Migration #17's hosted access-denial acceptance is complete per the operator report: signed-out and alternate-account visits to the protected restaurant route both redirected to `/fr?error=invalid_code`. Other hosted checks verified Vercel-side database TLS, Coolify readiness, the main deployment, Better Auth signup/email verification, organization/restaurant creation, and owner membership access. The operator reports Production `DATABASE_URL` points to Coolify and Preview `DATABASE_URL` remains on Render; verify the other Preview variables before marking full environment isolation complete. Preserve Neon/local/Preview data. Use the [runbook](deployment/coolify.md); keep actual hosted SignalR/token-expiration acceptance on its existing card. Public tenant storefront checks await separate wildcard DNS/TLS.

### Staff role and revocation acceptance — 2026-10-04

`tests/browser/staff-dashboard.spec.ts` exercises distinct owner, manager, kitchen and foreign identities against the local API/frontend and Neon `test`. Invitations bind each staff identity to a restaurant; the foreign identity belongs to another real tenant. Checks cover displayed roles, permitted controls, kitchen Preparing, manager Ready/cancellation, owner completion with French feedback, 412 stale-version rejection and UI reload, manager catalog creation, kitchen catalog denial, foreign read/write denial, and active membership revocation. REST polling removes private tickets and cached filters after denial, and a reload remains denied. Only test identities' memberships/sessions are removed at cleanup. The pre-existing test data remains intact.

This supersedes the outstanding local staff-role/revocation notes from 2026-10-02. Revocation detection is bounded by the 30-second REST interval; immediate hub group eviction is not verified. The manager hub is deliberately disconnected to retain a stale order snapshot. The API logged `Kitchen outbox polling failed (InvalidOperationException)` during the run; successful REST assertions do not prove event publication or reconnect recovery. Diagnose dispatch and verify hosted hub URL/CORS/TLS on the existing event-delivery/operations cards.

### Live outbox and revoked-connection acceptance — 2026-10-05

On `fix/kitchen-outbox-delivery`, the guarded localhost API/Better Auth/Neon `test` acceptance first reproduced event delivery to a kitchen connection after its membership was removed. Publication now rechecks persisted access per connection and removes denied subscriptions. The previous polling `InvalidOperationException` did not reproduce on fresh startup or during this run; its cause is still unconfirmed, rather than claimed fixed. Safe operation/type diagnostics were added for a future recurrence. One additional pre-fix run timed out awaiting a status hint without logging that polling exception.

`node node_modules/playwright/cli.js test` passed all four projects in 3.2 minutes: restaurant, catalog, staff dashboard and real-time. The final real-time case took 39.1 seconds. Four actual authenticated SignalR connections verified owner/manager/kitchen delivery, foreign joins denied in both tenant directions, tenant B events reaching only its subscribed staff, exact localhost CORS and rejection of a foreign origin, persisted acknowledgements, duplicate event/version suppression, bounded retry after a malformed test-only payload, successful publication after restoring that payload, fresh same-origin token acquisition and explicit reconnect/rejoin, REST recovery of an offline order, and no later tenant A hints on the still-open revoked kitchen socket. A revoked rejoin was denied. The existing dashboard case independently verified REST denial and removal of tickets/filters. The final injected retry event was `720aa151-51ae-4a7b-a998-18f573d6e256`; its expected `JsonException` was followed by recovery/acknowledgement. The test does not wait for a real token to expire and does not force the browser's automatic reconnect callback; those remain distinct from explicit wire reconnect plus the existing frontend unit coverage.

Cleanup removes only generated identities' memberships/sessions; generated test organizations, restaurants, catalog, orders and outbox records remain for audit. No production data, credentials or schema changed. The payload is restored in `finally`; test failure or interruption must not be interpreted as a production outbox failure. Early harness runs removed a duplicated Playwright project and corrected the retry query to select by event ID while its payload was deliberately invalid.

The user selected **Coolify** for hosted verification. Read-only inspection showed main commit `bd8030e`, a restarting container, an HTTP application link and startup failure: `Production requires an HTTPS Authentication:Issuer and Authentication:Audience.` Hosted delivery is blocked until the API starts with its configured issuer/audience and HTTPS routing, then the frontend targets the browser-reachable hub origin with exact CORS. Deploy the reviewed fix before checking live revocation, actual token expiry/renewal and reconnect on that host. The existing SignalR and operations kanban cards retain this work; neither is Done.

Vitest runs the frontend unit suite with `npm run test`; it includes focused checks for the shared API request factory methods, authorization header, safe error mapping, and path boundary. Playwright has a localhost-only configuration using installed Chrome and the ignored acceptance fixture. Run browser specs with `npm run test:browser` after starting the documented local services. The backend has xUnit v3 tests under `apps/api/tests/WhitePlate.Tests`, organized into `Api`, `Application`, `Architecture`, `Domain`, and `Infrastructure`. The backend suite covers restaurant domain, application, persistence, ownership, and HTTP behavior. Run `dotnet test apps/api/WhitePlate.slnx` from the repository root.

Prioritize backend integration tests for tenant boundaries, persistence constraints, transactions, and concurrency against the selected real PostgreSQL version. Browser tests should cover localized navigation, checkout, and dashboard recovery. Unit tests should cover pricing/lifecycle invariants rather than duplicate framework behavior. Avoid timing-only assertions such as “instantly”; define observable synchronization and a bounded wait.

For each run, record source revision (or working-tree baseline before the first commit), environment/tool versions, fixture setup, scenario IDs, commands, outcome, and diagnostics. Proposed tests remain pending until both the feature and assertions exist. CI should eventually run these checks with isolated test data and deterministic cleanup; no such pipeline exists today.

### Catalog/modal presentation acceptance — 2026-10-07

The isolated `catalog-design` browser project verifies saved lists without inline edit inputs; Products/Categories/Discounts tabs; search and archived-parent guards; product and nested option dialogs; cancellation resetting drafts; keyboard Escape and focus restoration; pending dismissal protection; rejected input retention and close after synthetic acknowledgement. Menu checks separate enabled/default language summaries from translation rows, filter saved/missing translations without counting fallback text, and discard cancelled language/translation edits. Both English/French and light/dark are exercised at 320, 375, 768, 1024 and 1440 px. This suite uses fixed data and intercepts save requests, so it does not write to a database. The authenticated catalog, discount and manager tests now open the appropriate tab and modal before editing; rerun them in the guarded acceptance database to verify persisted mutations. Order history is intentionally unchanged.
