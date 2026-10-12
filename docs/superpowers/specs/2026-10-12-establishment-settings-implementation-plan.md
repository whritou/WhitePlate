# S1 establishment settings implementation plan

12 October 2026. Status: specification approved; plan awaiting review and execution selection. Written directly with the user's authorization because `writing-plans` is unavailable. Application implementation has not started.

## Goal and execution

Implement the [approved specification](2026-10-12-establishment-settings-design.md) on `feat/establishment-settings`. Establishment identity, contact, address, timezone and pickup instructions become persisted, tenant-authorized settings; guests see current saved collection details. Existing taxes, order snapshots, descriptions, menu-language operations, UTC archival and other roadmap cards retain their defined boundaries.

Recommended execution: carry out the following tasks sequentially in this chat, with failing behavior tests before each implementation, focused verification after each step, then complete-suite and browser verification. No subagents or separate chats are required. Use the current checkout and preserve `.cloudflare/` and any new user changes discovered before editing. This plan is an execution proposal; review/selection precedes product code.

## Task 1: Domain fields and validation

Files to change/create:

- `apps/api/WhitePlate.Domain/Tenants/Tenant.cs`: add settings properties, establishment version, atomic settings update and pickup fallback entry points. Keep name on the existing property.
- `apps/api/WhitePlate.Domain/Tenants/EstablishmentSettings.cs`: focused normalized input/value records and validation rules, extracted so the tenant entity stays readable.
- `apps/api/tests/WhitePlate.Tests/Domain/EstablishmentSettingsTests.cs`: real aggregate behavior tests.

Steps:

1. Add failing tests for valid identity/contact/address saves, UTC defaults, optional clearing, incomplete addresses, international postal codes, string bounds, phone character/digit limits and required trade name.
2. Add failing tests for coordinate pairing, bounds before rounding, zero coordinates and six-decimal storage; rejected updates must preserve every original field/version.
3. Implement normalization and validation before committing field assignments. All optional text trims to null. Use checked version advancement, with an overflow refusal rather than wraparound.
4. Add failing tests for normalized enabled locale keys, duplicate keys after normalization, empty clearing, default fallback with actual text locale, omitted-locale preservation and disabled/re-enabled translations. Implement the pickup JSON map using existing locale normalization.
5. Keep platform timezone and actual country-list validation out of Domain; Domain still enforces required timezone text/length and country-code shape. No scheduling/date-boundary changes.

Focused command from root: `dotnet test apps/api/WhitePlate.slnx --filter FullyQualifiedName~EstablishmentSettingsTests`. Confirm a meaningful initial failure, then passing domain behavior. If the configured test runner needs a different filtering argument, use its supported syntax and record the actual command.

## Task 2: Authorized use cases and runtime options

Files to change/create:

- `apps/api/WhitePlate.Application/Tenants/EstablishmentSettingsHandler.cs`.
- `apps/api/WhitePlate.Application/Tenants/EstablishmentSettingsDto.cs` and public projection DTO/mapping.
- `apps/api/WhitePlate.Application/Tenants/IEstablishmentSettingsRepository.cs`: management/public operations with explicit tenant IDs and conditional-save results.
- `apps/api/WhitePlate.Application/Tenants/IEstablishmentOptions.cs`: supported timezone/country lookup capability.
- `apps/api/WhitePlate.Infrastructure/Tenants/EstablishmentOptions.cs`: platform IANA validation and country-code catalog.
- `apps/api/tests/WhitePlate.Tests/Application/EstablishmentSettingsUseCaseTests.cs` and focused Infrastructure options tests.

Steps:

1. Test denial before repository access for kitchen/foreign/revoked memberships, and success for persisted owners/managers. Reuse `IStaffMembershipRepository` and the existing role/access semantics; introduce no browser-authorized path.
2. Test runtime options including UTC, `Europe/Paris`, another DST-aware IANA zone, invalid identifiers, Windows identifiers and offset labels. Implement using available .NET timezone data with explicit IANA conversion/validation. On Windows convert platform IDs to IANA for offered options; on Linux use IANA IDs. Validation and offered options must agree; do not send Windows IDs to the frontend.
3. Define a checked-in ISO alpha-2 catalog for country validation/options, with no network dependency during requests. Test FR, a non-European country, lowercase normalization and unknown codes. Use `Intl.DisplayNames` on the frontend for EN/FR display names with the code as fallback.
4. Test optional clearing, invalid fields and safe field issues, independent authorization of options reads, and enabled-locale checks using current persisted settings.
5. Define typed missing/updated/stale/validation outcomes for the conditional repository save. Keep wire preconditions in the API and domain error conversion in the Application handler.
6. Provide one public projection from saved tenant fields, resolving requested/default pickup text and excluding versions, membership and translation maps.

Exit evidence: meaningful initial failures and green application/options tests; references still point inward; `ITenantRepository` remains registry-only.

## Task 3: EF persistence, migration and management HTTP

Files to change/create:

- `apps/api/WhitePlate.Infrastructure/Persistence/Repositories/EstablishmentSettingsRepository.cs`.
- `apps/api/WhitePlate.Infrastructure/Persistence/Configurations/TenantConfiguration.cs`.
- Generated migration/snapshot under `apps/api/WhitePlate.Infrastructure/Persistence/Migrations/`.
- `apps/api/WhitePlate.Api/Controllers/EstablishmentSettingsController.cs`.
- `apps/api/WhitePlate.Api/Contracts/UpdateEstablishmentSettingsRequest.cs` and settings/options response contracts.
- `apps/api/WhitePlate.Api/Configuration/ServiceRegistration.cs`.
- `apps/api/tests/WhitePlate.Tests/Infrastructure/EstablishmentSettingsPersistenceTests.cs`.
- `apps/api/tests/WhitePlate.Tests/Api/EstablishmentSettingsEndpointTests.cs`.

Steps:

1. Test persisted save/read-back, nullable values, precision, defaults and preservation of currency/subdomain/description/languages. Use real relational test contexts, not assertions on mock write calls.
2. Test two-context concurrent saves: one succeeds, the stale write fails with no changed fields. Implement conditional updates scoped to the active tenant and active organization, expected establishment version and the menu-language state used during validation. Only establishment columns are updated; unrelated tenant fields are not replaced.
3. Cover a language change between reading/validating/saving. A changed enabled-locale document makes the conditional write fail and triggers revalidation/reload of the current state; reject disabled submitted locales without deleting translations or overwriting the language configuration. No unlimited automatic retries or silently rebased establishment write.
4. Wire GET/PUT `/api/v1/tenants/{tenantId}/establishment-settings` and GET `/options`. Independently authorize all operations. GET/PUT return normalized results and quoted version ETags.
5. Test authentication, role/tenant/active-state denial, invalid request binding, field issues and headers. Follow the approved S1 contract: missing or malformed If-Match is 400; a stale valid version is 412. Reuse existing error categories/mapping without altering other endpoints' precondition behavior.
6. Use no-store responses, cancellation propagation and explicit dependency registration. The frontend uses server-to-server API calls; do not broaden CORS as part of S1.
7. Generate `EstablishmentSettings` with `dotnet ef migrations add EstablishmentSettings --project apps/api/WhitePlate.Infrastructure --output-dir Persistence/Migrations`. Inspect the installed tool before using it; do not upgrade dependencies or edit generated output manually.
8. Generate/review migration SQL with `dotnet ef migrations script --idempotent --project apps/api/WhitePlate.Infrastructure`. Verify UTC/version 1/empty-map defaults, null contact/location backfill, decimal precision and unrelated-table preservation. Do not run database update against a shared environment without the existing authorized migration workflow.

Exit evidence: relational and endpoint tests pass, stale/forbidden writes leave persisted state unchanged, migration SQL review recorded. Generated/applied/hosted states remain separate.

## Task 4: Public establishment contracts and host routing

Files to change/create:

- `apps/api/WhitePlate.Application/Tenants/TenantDto.cs`: carry the public saved establishment projection through host resolution.
- `apps/api/WhitePlate.Application/Catalog/MenuDto.cs` and `apps/api/WhitePlate.Infrastructure/Persistence/Repositories/CatalogRepository.cs`: additive menu establishment field using the same projection.
- `apps/api/WhitePlate.Api/Controllers/TenantsController.cs`: host-resolved establishment read, preserving existing tenant response.
- `apps/api/WhitePlate.Application/Orders/OrderCheckoutModels.cs` and `apps/api/WhitePlate.Infrastructure/Persistence/Repositories/OrderRepository.cs`: additive nullable tracking menu locale from the saved order.
- `apps/frontend/types/establishment-settings.ts`, `types/storefront.ts`, `types/checkout.ts`.
- `apps/frontend/lib/validation/establishment-settings.ts`, `lib/validation/responses.ts`, `lib/validation/public-order-tracking.ts`.
- `apps/frontend/lib/api/public-establishment.ts`, `lib/api/establishment-browser.ts`.
- `apps/frontend/app/api/public/establishment/route.ts` and route tests.
- API host/public projection tests, frontend parser/adapter/host-routing tests.

Steps:

1. Add failing API tests for two-host isolation, inactive/unknown hosts, ignored tenant headers/query selectors, menu locale/default fallback and public response shape. Extend existing host-resolved middleware rather than introducing a tenant selector.
2. Implement GET `/api/v1/tenant/establishment?locale=…` and the additive public menu field. The same projection carries actual pickup text locale; no privileged fields are serialized.
3. Test saved tracking locale and legacy null locale while retaining capability hashing, tenant binding, 30-day expiry and generic failed-link behavior. No order schema change is needed for the existing MenuLocale column.
4. Test frontend parser boundaries for malformed public data/coordinates/timezone/maps. Treat absent additive fields from an older API as unavailable collection details so a rollout does not make the existing catalog/tracking unusable.
5. Implement the public BFF using `getTenantSlug`, `getTenantApiBaseUrl` and `createApiRequestFactory`. Propagate cancellation and a bounded timeout. No-store responses and explicit input/host checks apply; do not forward bearer tokens or trust browser tenant IDs.
6. Add one pure directions/telephone helper in `lib/establishment-links.ts`, with tests for valid zero coordinates, encoded international addresses, missing data, fixed HTTPS origins, optional Waze and absence of tracking tokens/arbitrary URL input.

Exit evidence: additive contracts preserve older fixtures/rollout behavior, public reads are tenant-host scoped, and safe links only reflect validated saved information.

## Task 5: Real establishment editor, navigation and translations

Files to change/create:

- `apps/frontend/services/establishment-settings.ts`, `actions/establishment-settings.ts` and action tests.
- `apps/frontend/app/api/establishment-settings/route.ts` and route tests for protected settings/options reads.
- `apps/frontend/hooks/use-establishment-settings.ts`: query lifecycle and local form baseline/drafts.
- `apps/frontend/components/organization/restaurant-settings.tsx`, plus focused establishment identity/address/pickup form modules and tests.
- `apps/frontend/app/[locale]/(workspace)/organization/restaurant-settings/page.tsx` and `loading.tsx`.
- `apps/frontend/lib/live-workspace-navigation.ts` and tests.
- `apps/frontend/components/organization/live-settings.tsx` restaurant card entry points.
- Both existing EN/FR translation catalogs.

Steps:

1. Read installed Next.js docs for Server/Client Components, Server Actions, Route Handlers, async request APIs and loading UI before Next.js edits. Inspect the actual shared Base UI control APIs before composing them.
2. Add failing parser/action/BFF tests for UUID/value validation, safe result parsing, no bearer exposure, independent session/membership checks and 400/401/404/412/503 handling. Services own operations; request factories own transport policy.
3. Implement authorized initial reads and TanStack queries keyed by account/tenant/interface locale/view. Mutation uses the validated Server Action with the saved version forwarded as If-Match; it returns the normalized result/version and safe field issues.
4. Build Identity, Address/location and Pickup sections within the existing light Lovable workspace using shared cards/controls and semantic tokens. Retain catalog/language/Studio/shop links. Use native or shared keyboard-operable selectors for country/timezone and enabled menu language; avoid adding a new component library.
5. Test dirty comparison, disabled/valid Save, Cancel, retained per-locale drafts, synchronous duplicate guard, normalized success and saved-only preview links. A write failure retains input; conflict requires an explicit discard/reload confirmation.
6. Test read retry, untouched-versus-dirty refetch, authorization invalidation, account/tenant remounts and offline feedback. Register beforeunload only while dirty; navigating away discards component-local drafts as documented.
7. Match page/query skeletons and localize every label/state/error in EN/FR. Keep frontend file/function limits and type-placement/request-boundary lint rules.
8. Route restaurant Settings to the establishment editor for both roles; preserve Staff and organization-context settings. Add the editor link on real restaurant cards. Update navigation assertions for actual new behavior; do not redirect legacy organization URLs based on tenantId alone.

Exit evidence: form/action/route/navigation tests pass and settings can save/read back through the real API in the authorized local acceptance environment when available.

## Task 6: Guest collection views, browser acceptance and handoff

Files to change/create:

- `apps/frontend/components/storefront/collection-information.tsx` and tests.
- `apps/frontend/hooks/use-public-establishment.ts` and query/adapter tests.
- `apps/frontend/components/storefront/restaurant-menu.tsx`, `live-checkout.tsx`, `receipt.tsx`, `order-tracking.tsx` and their existing tests/fixtures.
- A focused development-only establishment fixture following existing guarded fixture patterns.
- `apps/frontend/tests/browser/establishment-settings.spec.ts` and the scoped Playwright project configuration.
- `docs/audits/establishment-settings.md`, API/schema/architecture/security/development/test-plan/Lovable notes, documentation index and S1 backlog.

Steps:

1. Add failing tests for saved/empty storefront collection details, checkout Collect at details, localized plain text, missing location links and actual instruction-language metadata. Reuse one collection panel without putting HTTP in components.
2. Add receipt/tracking collection queries scoped to tenant host and saved order locale. Receipt/status remains usable when collection reads fail. Legacy tracking locale falls back to default; render tracking collection details only with a successful capability result.
3. Label receipt/tracking details as current restaurant information; leave monetary and item snapshots untouched. Refresh fetches latest collection data without checkout resubmission or token-bearing directions links.
4. Add a no-production-access-bypass presentation fixture. Browser checks exercise saved/cancel/failed/stale drafts, keyboard selectors/focus, authorized navigation, links, guest views and clear unsupported scheduling/payment disclosures. Deterministic mocked acknowledgements prove UI behavior only.
5. Check 320/375/390/768/1024/1440/wide widths, 200% text zoom, reduced motion, light-only runtime, EN/FR, 44px minimum actions and 48px tablet actions. Inspect screenshots for overflow, field/action clipping and readable collection instructions. Record any temporary deviation explicitly.
6. Run the complete API suite and frontend unit/lint/type/format/build checks. Run scoped Playwright acceptance on a local server; verify fixture routes are unavailable in production mode. Broaden tests only for newly discovered failures or changed behavior.
7. If a documented authorized test database is available, apply/review the migration there and exercise real owner/manager save/read-back plus kitchen/foreign/revoked denial. Otherwise record this environment acceptance as remaining work. Do not seed/change production restaurant settings for tests.
8. Update contracts and documentation with implemented behavior, migration state and exact evidence, including failures by name and command. Keep legal/default-tax/S2–S5 and hosted rollout outstanding where applicable.
9. Review the final diff against the approved specification. Preserve unrelated changes, commit with `feat(settings): add establishment settings`, push `feat/establishment-settings` and update the existing S1 card with result/evidence/remaining work. Use `git -c http.sslBackend=schannel push` if the observed OpenSSL trust failure recurs; TLS verification remains enabled. Do not mark the card Done while required acceptance remains unfinished.

## Final verification commands

From the repository root:

```powershell
dotnet test apps/api/WhitePlate.slnx
git diff --check
```

From `apps/frontend` with the declared/bundled Node/npm runtime:

```powershell
npm test
npm run lint
npm run typecheck
npm run format:check
npm run build
npm run test:browser -- --project=establishment-settings --reporter=line
```

The scoped Playwright project is added during implementation and requires its local server/fixture. Inspect scripts/runtime first; these commands are planned, not executed evidence. If global formatting/lint/build fails, report the actual named failures and separate pre-existing untouched files from changed files; never silently claim a green check.

## Plan review

Reviewed for coverage of the approved fields, independent authorization, saved-locale/current-info semantics, language/edit concurrency, clear module ownership and additive rollout. Implementation is bounded to S1; no unrelated catalog rewrite, scheduling, financial mutation or external provider configuration is proposed. Application code, generated migrations and runtime tests are unchanged at this planning stage.
