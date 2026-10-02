# Functional test plan

This is an acceptance plan with dated verification notes below. The API suite covers tenant/organization/staff/catalog CRUD, verified email and invitation binding, checkout pricing/idempotency, order workflow, body/rate limits, outbox dispatch, and hub authorization. Dashboard API contracts and frontend unit behavior are automated. Localization, real-database checkout, and owner kitchen workflow have browser acceptance on Neon `test`; staff-role matrix and production SignalR configuration remain open. Catalog-localization and localized-order migrations are applied on Neon `test`; production remains untouched. The prior test-database schema migrations and local email/password signup/invitation path are verified. Live OAuth, real Resend delivery, and broader browser auth flows remain open. The earlier documentation audit is in [documentation review](documentation-review.md).

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
| CUR-12 | Run the API against the Neon `test` branch and request `/api/v1/tenant` on an unknown subdomain | Database resolution completes and returns the expected `404`; production remains untouched |

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

Automated tests cover catalog locale resolution, translation fallback, checkout label snapshots, idempotency and persisted staff label reads. Live Neon/browser acceptance remains for these scenarios and also checks the configured Better Auth issuer, real SignalR connections, and frontend flows. Use two tenants A/B with distinct staff identities and menus; include an unavailable product, stale order version, and malformed/expired credentials.

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

`LocalizedOrderSnapshots` adds nullable `Orders.MenuLocale`; checkout resolves the effective tenant locale before idempotency comparison and saves translated product/option labels into the order snapshots. Legacy orders retain a null locale. The migration is applied on Neon `test`; production remains untouched. Automated tests cover supported and fallback locales, snapshot stability after catalog edits, and same-key retries/conflicts across effective locales. Browser acceptance on Neon `test` verified language configuration and fallback, a French menu, a persisted French checkout receipt, and owner kitchen status transitions with live refresh. Production deployment and kitchen-role acceptance remain open.

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

The API integration tests assert saved product/option snapshot data across cursor pages. Frontend tests exercise the token route's session/origin/cache rules, conditional status updates, tenant/event validation, deduplication, reconnect rejoin, coalescing, and REST refresh callbacks. The authenticated browser run below covers the owner dashboard. Complete the separate kitchen-staff/manager role matrix and verify the browser-reachable production hub URL, CORS, and TLS under the hosting/operations task.

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
| Production public endpoints | Render Swagger is available; unauthenticated `GET /api/v1/me` returned `401`. Production OpenAPI still describes `OrderStatus` as an integer, which identifies the currently deployed contract predating the source fix that serializes staff-list status names. Production deployment/hub behavior remains unverified. |

The dashboard check used an owner account. Kitchen-staff and manager permission combinations, role revocation during an active session, and the production SignalR origin/TLS path remain outstanding. The test checkout rows remain in the non-production Neon test database for audit; do not treat that database as an empty fixture.

## 3. Automation strategy

Vitest runs the frontend unit suite with `npm run test`; it includes focused checks for the shared API request factory methods, authorization header, safe error mapping, and path boundary. Playwright is installed but has no browser-test configuration. The backend has xUnit v3 tests under `apps/api/tests/WhitePlate.Tests`, organized into `Api`, `Application`, `Architecture`, `Domain`, and `Infrastructure`. The backend suite covers restaurant domain, application, persistence, ownership, and HTTP behavior. Run `dotnet test apps/api/WhitePlate.slnx` from the repository root.

Prioritize backend integration tests for tenant boundaries, persistence constraints, transactions, and concurrency against the selected real PostgreSQL version. Browser tests should cover localized navigation, checkout, and dashboard recovery. Unit tests should cover pricing/lifecycle invariants rather than duplicate framework behavior. Avoid timing-only assertions such as “instantly”; define observable synchronization and a bounded wait.

For each run, record source revision (or working-tree baseline before the first commit), environment/tool versions, fixture setup, scenario IDs, commands, outcome, and diagnostics. Proposed tests remain pending until both the feature and assertions exist. CI should eventually run these checks with isolated test data and deterministic cleanup; no such pipeline exists today.
