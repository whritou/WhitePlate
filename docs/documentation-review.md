# Documentation review baseline — 2026-09-28

## Coolify PostgreSQL migration preparation — 2026-10-05

Issue #17, branch `chore/coolify-postgresql-hosting`: the user approved one hosted development stack, empty Coolify business/auth schemas and retaining Vercel. Neon/local/Preview settings are preserved; a second dev stack is deferred. Added explicit proxy-owned HTTPS redirection, server-only PostgreSQL CA verification with rejection of conflicting URL SSL settings, a curl-capable API image, settings examples and a deployment/rollback runbook. Replaced the concrete local-test password in `.env.example` with a placeholder; real local credentials remain outside source.

| Check | Actual result |
| --- | --- |
| API regression red/green | The delegated-redirection test first returned a redirect instead of 200, then passed with the configuration change; the targeted file passed 11 tests. |
| `dotnet test apps/api/WhitePlate.slnx --no-restore --configuration Release` | Passed 144 tests. The initial restricted build failed writing generated obj state; normal-permission rerun passed. |
| Auth database TLS red/green | Seven tests failed against an unimplemented helper, then passed, including actual `pg.Client` configuration and all five SSL URL conflicts. |
| `node node_modules/vitest/vitest.mjs run` | Initially passed 25 files / 204 tests; the public-IP TLS regression follow-up passed 25 files / 205 tests. |
| `node node_modules/eslint/bin/eslint.js .` | Passed. |
| `node node_modules/typescript/bin/tsc --noEmit` | Passed. |
| `node node_modules/prettier/bin/prettier.cjs --check '**/*.{ts,tsx}'` | Passed across the frontend. |
| `node node_modules/next/dist/bin/next build --webpack` | Passed compilation, TypeScript and 33 page generations with process-only inert auth/API settings and an unavailable localhost database. Expected Better Auth schema diagnostics and nonfatal restricted Webpack cache EPERM warnings. |
| Coolify bootstrap query | Database `whiteplate`, 9 EF migrations, 16 public tables, 6 auth tables; zero auth users, organizations, restaurants and orders. PostgreSQL running/healthy, SSL on. |
| External TLS and access rules | Public `204.168.231.15:5433` accepted PostgreSQL SSL negotiation with TLS 1.3, trusted CA and IP identity verification. Public administrator TLS and auth-role plaintext connections were rejected with PostgreSQL code 28000. The proxy appears as `10.0.1.11`, so source-subnet rules cannot exclusively separate external/internal application roles. |
| Runtime-role bootstrap | Applied to the new database. Both SCRAM verifiers are present (boolean inspection only; no hash or secret printed), and the operator activated LOGIN for both accounts. Schema and all-table privilege inspection confirmed own-schema read/write and cross-schema denial. HBA parsed without errors and reloaded successfully. |
| Public-IP regression red/green | An external `pg` probe first failed with `ERR_TLS_CERT_ALTNAME_INVALID` for `localhost` despite the IP SAN. The new regression failed against the existing helper, then passed with Node's standard identity check bound to the configured URL host; a mismatched IP remains rejected. Typecheck initially caught an incorrect test-only type assertion; corrected and passed. |

Commands used the installed package CLIs because npm is absent from this shell. Temporary generated schema SQL is not committed. Public exposure was explicitly approved and activated. The operator entered both role passwords in Coolify; boolean inspection confirmed password verifiers without reading their values, then the operator enabled LOGIN. API connection string and Vercel auth-role DATABASE_URL are staged for human secret entry. API deployment, authenticated database checks, Vercel redeployment and hosted auth/API flows remain pending. Docker is unavailable locally, so the image build and live curl probe await Coolify deployment. No successful hosted migration, backup restore or SignalR acceptance is claimed.

Scope: all repository-authored Markdown, manifests/configuration, and application source present before the Clean Architecture change. Generated/vendor documentation was used only for framework verification. There were no commits and the existing application/docs were untracked when reviewed, so this is a historical working-tree baseline, not a commit-tagged release audit. The [backend architecture](architecture/WHITEPLATE_BACKEND_ARCHITECTURE.md) and [development guide](development.md) describe the current API solution.

## Documentation issues corrected

| Finding | Correction |
| --- | --- |
| README described a finished platform, .NET 8, a nonexistent backend path, and nonexistent Compose setup | Replaced with actual .NET 10/frontend scaffold status and runnable project paths |
| System architecture said the API directory was empty | Documented the controller project, weather route, OpenAPI, launch profiles, and API Dockerfile |
| Technology stack claimed configured database, CI, containers, and tests | Separated integrated dependencies, installed-but-unused libraries, and proposals |
| Frontend template README encouraged regenerating an existing button | Added package-specific commands and source/navigation guidance |
| Frontend architecture omitted locale-cookie precedence and mixed repository documentation languages | Clarified request lifecycle, matcher, client boundary, theme behavior, and English reference documentation |
| API guide presented future routes/header trust as implemented, and every success as `200` with a data envelope | Documented actual array response and marked business contracts as proposals; clarified authorization, `201` creation, `409` conflicts, validation and open DTO decisions |
| Database diagram was unclosed and omitted category/item definitions | Completed the diagram and added tenant-aware relationships, historical snapshots, constraints, lifecycle and migration considerations |
| Query filters were described as a guarantee against all tenant leaks | Added read/write ownership, foreign-key, cache, job, and real-time isolation requirements |
| Coding standards assumed MediatR/EF layers and Tailwind 3 configuration | Adapted guidance to the scaffold, Tailwind 4, Server Components and optional future architecture |
| Test plan treated nonexistent journeys as executable and confused API `401` with a browser redirect | Split present smoke checks from future acceptance scenarios and aligned proposed response semantics |
| No repository-wide development handoff | Added documentation index, development guide, root agent rules, API README, security boundaries, and roadmap/decision register |

The existing frontend `AGENTS.md` framework instructions were reviewed and preserved. Its installed Next.js guides confirmed the engine requirement and `proxy.ts` convention. The API error proposal references [RFC 9457](https://www.rfc-editor.org/rfc/rfc9457); the isolation clarification references [EF Core query filters](https://learn.microsoft.com/en-us/ef/core/querying/filters).

## Verification performed

Environment: Windows, Node 24.19.0, .NET SDK 10.0.401. npm was unavailable on the agent shell PATH; frontend checks used the already-installed local CLI entry points. Fresh `npm ci` and network restores were not tested.

| Check | Result |
| --- | --- |
| Earlier API scaffold build, before the host-folder rename | Passed, zero warnings/errors; use the current solution commands in the development guide |
| `node node_modules/typescript/bin/tsc --noEmit` from frontend | Passed |
| `node node_modules/eslint/bin/eslint.js .` from frontend | Failed in React plugin: `contextOrFilename.getFilename is not a function` with ESLint 10.11.0 |
| `node node_modules/next/dist/bin/next build` from frontend | Failed spawning a Node worker with Windows access-denied error 5; same result on an outside-sandbox retry |
| API HTTP profile startup and requests | Initial restricted run hit Windows Event Log access errors; outside-sandbox rerun succeeded |
| `GET /WeatherForecast` | Passed: five items with expected camelCase fields |
| `GET /openapi/v1.json` in Development | Passed: OpenAPI 3.1.1 document contains `/WeatherForecast` |
| `GET /api/v1/menu` | Returned expected `404` for an unimplemented route |
| Documentation structure | Checked all 17 Markdown files: 82 relative links resolve, 19 code fences are balanced, and all 4 JSON examples parse |

The 2 Mermaid blocks were checked for closed fences and diagram declarations, but not rendered. Browser interactions, Production-only OpenAPI behavior, HTTPS certificate setup, Docker builds, clean installs, and future business scenarios were not executed. No application source or dependency versions were changed during this documentation review.

## Remaining engineering issues

| Priority | Issue | Next action |
| --- | --- | --- |
| High | Frontend lint command fails inside installed tooling | Select compatible ESLint/React plugin/Next config versions, update lockfile deliberately, and rerun lint |
| High | Frontend production build is unverified due to worker-spawn access failure | Reproduce in a supported complete Node environment; inspect executable permissions/runtime restrictions before changing application CSS |
| Medium | No pinned runtime/package-manager policy and npm absent from review shell | Choose toolchain policy and verify setup on a clean checkout |
| Resolved for backend | No root/backend ignore policy | Root `.gitignore` now excludes .NET build output and IDE user state |
| Partly resolved | No test harness or CI | Backend xUnit suite now covers the sample and dependency direction; business coverage and CI remain future work |
| Planned | Product/security/storage decisions unresolved | Resolve dependent entries in the roadmap before claiming working restaurant functionality |

These findings capture the earlier review. The [development guide](development.md) records current commands, and the [roadmap](development-roadmap.md) records remaining decisions without silently choosing product requirements.

## Authentication implementation verification — 2026-09-29

The Better Auth feature was added after the historical baseline above. The frontend's existing lint/build toolchain failures reproduced unchanged; these are not authentication-specific results. `apps/frontend/.env.example` contains placeholders only and is now exempted from the package ignore rule.

| Check | Result |
| --- | --- |
| `dotnet test apps/api/WhitePlate.slnx --no-restore -c Release` | Passed: 129 tests, 0 failures |
| `node node_modules/typescript/bin/tsc --noEmit` from frontend | Passed after the auth routes and forms were added |
| `node node_modules/eslint/bin/eslint.js .` from frontend | Failed at existing ESLint 10 / eslint-plugin-react incompatibility: `contextOrFilename.getFilename is not a function` |
| `node node_modules/next/dist/bin/next build` from frontend | Failed when Turbopack attempted to spawn a Node worker: Windows access denied, OS error 5 |
| Better Auth auth schema | Initially unconfigured; applied to Neon `test` on 2026-09-29 and verified by querying all six expected tables. Production unchanged. |
| EF migration `StaffInvitationRecipientEmail` | Applied to Neon `test` on 2026-09-29 and verified in EF history and `StaffInvitations.RecipientEmail`. Production unchanged. |
| Local email/password signup and invitation acceptance | Passed against Neon `test` on 2026-09-29 using `.invalid` addresses and locally intercepted Resend messages. Signup, email verification, organization creation, invite creation, acceptance, and resulting membership succeeded. |
| Browser OAuth, real verification/reset email, and provider acceptance | Not run; OAuth/Resend credentials are not configured. |

The test database now contains test-only signup and organization/membership records from the local acceptance flow. The test email delivery was intercepted locally; no email was sent. The Better Auth CLI also reported that `rateLimit.lastRequest` is `bigint/int8` in PostgreSQL while it expected `number`; signup worked, but this type warning should be reconciled before production. The database credential appeared in a tool result during connection-string inspection and should be rotated. The API process on port 5182 pre-existed this work and was left running; the verification API used a separate Release build on port 5184 and was stopped afterward.

The exact runtime prerequisites and migration ownership are documented in the [auth setup](development.md#authentication-configuration), [schema guide](database/database-schema.md), and [authentication decision](architecture/decisions/0002-authentication.md).

## Restaurant menu localization implementation verification — 2026-09-30

The restaurant-configurable locale and translated catalog source was added after the earlier verification. These are compile/build checks only; no API, xUnit, Vitest, or browser behavior tests were run for this change. `CatalogLocalization` is checked in and its SQL script was generated, but it has not been applied to Neon `test` or production.

| Check | Result |
| --- | --- |
| `dotnet build apps/api/WhitePlate.Api/WhitePlate.Api.csproj --no-restore -p:BaseOutputPath=.codex-build/bin/` | Passed, zero warnings/errors. A pre-existing API process held the normal output DLLs, so the build used isolated output folders and left that process untouched. |
| `dotnet ef migrations script 20260929123238_IdempotencyTenantOwnership 20260930160026_CatalogLocalization ... --no-build` | Passed. Generated SQL contains the tenant defaults (`en`, `["en"]`) and empty translation JSON (`{}`); no database was contacted. |
| Bundled Node executable with `node_modules/typescript/bin/tsc --noEmit` from `apps/frontend` | Passed. The ordinary `npm` command was unavailable on PATH; the bundled pnpm command attempted a network install and aborted because registry access was unavailable, so the installed TypeScript CLI was called directly. |
| Parse `messages/en.json` and `messages/fr.json` with PowerShell `ConvertFrom-Json` | Passed. |
| Focused ESLint run for changed frontend files | Failed at the known ESLint 10 / `eslint-plugin-react` mismatch: `contextOrFilename.getFilename is not a function`. |
| `node node_modules/next/dist/bin/next build` | Failed when Turbopack tried to spawn a Node worker; Windows returned access denied, OS error 5, matching the documented baseline. |
| API solution tests, frontend unit tests, database migration application, and browser acceptance | Not run. The latest migration and its end-to-end flows remain to be accepted after migration rollout. |

An offline `dotnet restore` attempt for the EF Design package could not read the user NuGet configuration because access was denied. The existing restored assets were sufficient for the isolated API build and migration-script generation. No database was changed.

## API request and locale refactor verification — 2026-09-29

The authenticated server API client now centralizes GET/POST/PUT/DELETE calls, returns sanitized result codes, and records bounded server diagnostics. Locale is established by the localized root layout; components use next-intl request/client locale context, leaving explicit locale only on the intentional language switcher. See the [frontend architecture](architecture/WHITEPLATE_FRONTEND_ARCHITECTURE.md) for the request and locale lifecycle.

| Check | Result |
| --- | --- |
| `node node_modules/vitest/vitest.mjs run` from frontend | Passed: 6 API request factory tests |
| `node node_modules/typescript/bin/tsc --noEmit` from frontend | Passed |
| `node node_modules/eslint/bin/eslint.js` from frontend | Failed in the existing ESLint 10 / `eslint-plugin-react` incompatibility (`contextOrFilename.getFilename is not a function`); it fails while loading `react/display-name` before reporting file findings |
| `node node_modules/next/dist/bin/next build` from frontend | Failed when Turbopack tried to spawn a Node worker (Windows access denied, OS error 5), matching the prior environment limitation |
| `dotnet test apps/api/WhitePlate.slnx --no-restore -c Release` | Passed: 129 tests, 0 failures |

The shell did not expose `npm` on `PATH`; installed package-local CLIs were run with the bundled Node runtime. Resend provider requests remain direct server-only calls; no browser page or component performs an API fetch. No commit or push was created.

## Guest cart and checkout verification — 2026-10-01

Implemented on `feat/guest-cart-checkout`: tenant-scoped component-memory cart, quantity/option editing and removal, same-origin checkout BFF, UUID idempotency keys, immutable uncertain-response retries, and validated server-priced receipts. Both language catalogs and relevant architecture/contracts/acceptance docs are updated. No API schema, database, provider credentials, payment, or pickup changes were made. The pre-existing `apps/frontend/.env.example` edit was preserved outside this feature.

The shell did not expose npm, so checks used the bundled Node executable and installed package-local CLIs. Tests were written and observed failing for cart updates, unchanged retry keys, input validation, option constraints, idempotency-header forwarding, safe host/origin handling, and removal of client-supplied prices from the outbound payload before the implementation was completed.

| Command/check | Actual result |
| --- | --- |
| `node node_modules/vitest/vitest.mjs run` from frontend | Passed: 9 files, 51 tests. Includes cart/selection, BFF origin/host, public order request/receipt, retry/conflict, and rate-limit tests. |
| `node node_modules/typescript/bin/tsc --noEmit` from frontend | Passed after the final component refactor. |
| `node node_modules/eslint/bin/eslint.js .` from frontend | Failed at the existing ESLint 10 / React plugin incompatibility: `contextOrFilename.getFilename is not a function`, while loading `react/display-name`. |
| `node node_modules/next/dist/bin/next build` from frontend | Failed at the existing Turbopack Windows worker-spawn access-denied error 5. |
| `node node_modules/next/dist/bin/next build --webpack` from frontend | Compilation and production TypeScript completed; page-data collection failed because existing local `BETTER_AUTH_URL` is HTTP and the production auth guard requires HTTPS. Production build is not verified. |
| `dotnet test apps/api/WhitePlate.slnx --no-restore -c Release` from repository root | 131 passed, 1 failed, 132 total. `TenantRepositoryTests.PostgreSqlModelAndMigrationProduceExpectedSchema` expects 7 migrations but source now has 8. This pre-existing assertion was not changed by frontend checkout. |
| Chrome + Webpack dev server with local API fixture | Passed: required option validation, product add/quantity/remove, unavailable item, menu-language switching retaining cart, reload clearing cart, a second tenant starting empty, safe invalid-promo/rate-limit/conflict messages, corrected promo success, English/French receipt, and mobile layout without horizontal overflow. |
| Response lost after fixture order creation | Passed: UI locked edits and preserved the key/payload; retry displayed the original receipt. At that point the fixture had 2 writes for 2 distinct orders and 1 replay. Final fixture totals were 5 writes/5 stored orders, 1 replay, 1 conflict across the full smoke run. |
| Browser diagnostics | No Next.js error overlay; initial confirmed-receipt error logs were empty. Later navigation produced `MessageNotSentError` and a Chrome-extension `RegisterClientLocalizationsError`; these logs are recorded separately from successful order acceptance. |
| `git diff --check` | Passed. |

The browser fixture uses no database or email provider and intentionally covers a narrow deterministic API contract. It is not proof of real PostgreSQL persistence, production host routing, or production rate policy. Real API/database browser checkout still needs the previously unapplied `CatalogLocalization` migration and appropriate test data. Menu locale is still absent from order snapshots, as required by the separate unresolved D11 decision. The known lint/toolchain and migration-count test failures remain open. The checkout card belongs in **In review**, not Done, pending this acceptance. Test processes were stopped; no production data was changed.

## Frontend toolchain baseline — 2026-10-01

Added exact Node.js `24.19.0` / npm `11.17.0` pins, a .NET 10 SDK minimum feature band, a supported ESLint 10 adapter for the legacy React plugin bundled by Next.js 16.3.4, local system font stacks, and a GitHub Actions workflow. The frontend dev/build scripts select Webpack because this Windows environment previously denied Turbopack worker startup. The repeatable OIDC/SignalR procedure is in the [functional test plan](functional-test-plan.md#run-the-live-oidc-and-signalr-check).

| Command/check | Actual result |
| --- | --- |
| Standard `npm ci --no-audit --no-fund` using Node.js 24.19.0/npm 11.17.0 on this Windows host | Failed in the existing `@parcel/watcher@2.6.0` install hook with `MODULE_NOT_FOUND` (`node-gyp` source build); this is a machine-specific lifecycle failure. |
| `npm ci --no-audit --no-fund --ignore-scripts --engine-strict=false` | Installed 753 packages. The available `npm` launcher used Node.js 20.18.3, so engine strictness was explicitly bypassed for this local diagnostic only; subsequent checks invoked package CLIs using Node.js 24.19.0 directly. |
| `node node_modules/eslint/bin/eslint.js .` from frontend | Passed with 0 errors and 3 pre-existing unused-variable warnings (`organization-forms.tsx`, `request-factory.test.ts`). The former React plugin crash is fixed by `@eslint/compat`. |
| `node node_modules/vitest/vitest.mjs run` from frontend | Passed: 9 files, 51 tests. |
| `node node_modules/typescript/bin/tsc --noEmit` from frontend | Passed after the production build generated `.next/types`. |
| `node node_modules/next/dist/bin/next build --webpack` with test-only auth environment values | Passed production build. Better Auth logged expected schema-validation connection errors because no database was supplied to this isolated build; no application database was changed. |
| `dotnet test apps/api/WhitePlate.slnx --no-restore --configuration Release` | Passed: 132 tests, 0 failures. |
| `git diff --check` | Passed. |

The [pushed GitHub Actions run](https://github.com/whritou/WhitePlate/actions/runs/36883112545) completed successfully on 2026-10-01 (52 seconds total). Both `Frontend checks` and `API tests` passed from clean Ubuntu runners with the pinned Node/npm and .NET SDK toolchain; the frontend job ran `npm ci`, all 51 Vitest tests, lint, typecheck, and production build. The Windows `@parcel/watcher` failure remains a local Windows install-hook issue and did not occur in the Linux clean install. ESLint reported the three pre-existing unused-variable warnings listed above.

## Frontend architecture cleanup — 2026-10-01

Tracked in [issue #7](https://github.com/whritou/WhitePlate/issues/7), on `codex/frontend-architecture-cleanup`, starting from the staff dashboard implementation. The audit found mixed UI/request/validation responsibilities, local named contracts, raw form controls, unused feature-level Query integration and outdated architecture/stack prose. The cleanup adds shadcn Base UI controls, exported `types/`, validated thin `actions/`, server-only feature `services/`, parsed JSON boundaries and an account/tenant/view-scoped TanStack Query kitchen lifecycle. Components now separate auth framing/fields/state, organization forms, catalog rows, checkout state/presentation and order tickets/connections. ESLint enforces those mechanical boundaries; CI adds read-only formatting verification. See [canonical conventions](architecture/frontend-conventions.md).

Two behavior regressions were exposed with failing tests before their fixes: HTTP 412 was mapped to unavailable instead of conflict, and order-event cache eviction deleted a Map value instead of its key, preventing the over-limit loop from terminating. Both now pass regression coverage. New tests cover untrusted action/response data, foreign-tenant BFF selectors, safe no-store browser requests, SignalR token parsing and scoped query invalidation.

This host does not expose npm on PATH; the package-local CLIs ran with Node.js 24.19.0. No dependency versions or lockfile changed. The pre-existing `.env.example` edit remains outside this change. No API project, database schema, production data or provider credentials were changed.

| Command/check | Actual result |
| --- | --- |
| `node node_modules/vitest/vitest.mjs run` from frontend | Passed: 18 files, 120 tests; baseline was 13 files, 86 tests. |
| `node node_modules/eslint/bin/eslint.js .` | Passed, no warnings or errors. The previously recorded React-plugin crash and unused-variable warnings are not waived. |
| `node node_modules/typescript/bin/tsc --noEmit` | Passed when run without a concurrent build. An earlier concurrent run failed with missing `.next/types` files as Next regenerated them; the subsequent standalone run passed. |
| `node node_modules/prettier/bin/prettier.cjs --check '**/*.{ts,tsx}'` | Passed for all matched frontend source. |
| `node node_modules/next/dist/bin/next build --webpack` | Passed for final source, including compilation, production types and route generation. Used inert CI auth/provider values and a nonexistent local test database; Better Auth logged expected schema-connection diagnostics. This is build verification, not live auth/database verification. |
| Chrome with `node tests/fixtures/checkout-api.mjs` and Webpack dev on port 3100 | Passed: shared select/checkbox/input/button interaction, option selection and cart addition, lost-response edit lock and retry to a validated original receipt, receipt reset, menu-language switch, French interface rendering, sign-in form and password visibility toggle. Fixture and dev processes were stopped. |
| Browser diagnostics | Chrome's LastPass extension inserted `data-lastpass-icon-root` markup before hydration and caused a hydration warning on storefront/auth forms. No suppression or extension settings were changed. The in-app browser timed out, so the working Chrome session was used. Extension-free hydration remains an unverified browser check. |
| `git diff --check` | Passed. |
| API tests | Not rerun: this change does not modify API source or schema. Kitchen BFF authorization and contracts are covered by frontend route tests. |

Live authenticated kitchen browser acceptance (two tenants/accounts, role revocation, conflicts and reconnect), real checkout persistence, OAuth/Resend and production routing remain on their existing separate cards. The cleanup does not claim that those acceptance tasks are complete. Semantic JSX layout remains valid; shadcn is used for shared controls and UI surfaces, not as a replacement for TypeScript or every HTML element.

## Frontend request and UI follow-up — 2026-10-01

Continued [issue #7](https://github.com/whritou/WhitePlate/issues/7) on `codex/frontend-architecture-cleanup` following user review of factory size, repeated fetch options, incomplete shadcn composition and missing blank lines. `createApiRequestFactory` now composes methods in a short function; URL/auth preparation, shared JSON transport, request options and response/diagnostic handling have separate responsibilities. Kitchen and SignalR browser requests use `browserRequest`, and email delivery shares the transport without parsing its unused provider acknowledgement. Existing checkout uses that transport through the public API factory. The only application raw fetch invocation is in `json-request-client.ts`.

Cards now use shared headers, semantic titles, descriptions, content and footers across auth, invitations, organization, checkout/receipt and order tickets. Button-shaped links use the installed Base UI Button render API with `nativeButton={false}`; plain text links remain links. Alerts use AlertDescription and default language/translation indicators use Badge. Card row direction and outer padding were checked against the installed primitive defaults. ESLint now enforces statement/JSX blank lines, shared transport calls and an 80-line non-UI function limit, alongside the existing type-placement and file-size rules. [Conventions](architecture/frontend-conventions.md) and frontend AGENTS describe these requirements.

New request tests were observed failing before implementation, including the provider acknowledgement regression found during review. Intermediate type/lint checks exposed duplicate declarations/imports and a JSX rule conflict with Prettier's inline spaces; these were corrected before final verification. A temporary import-organizing helper initially failed on Windows path normalization, then completed and was removed. Final checks use Node.js 24.19.0 and package-local CLIs; elevated source formatting explicitly selected that runtime because the elevated shell's plain node resolved to Node 20.

| Command/check | Actual result |
| --- | --- |
| `node node_modules/vitest/vitest.mjs run` | Passed: 20 files, 129 tests. New cases cover reusable request defaults, body/headers, cancellation, safe errors/diagnostics, browser path restrictions and acknowledgement-only responses. |
| `node node_modules/eslint/bin/eslint.js .` | Passed with no errors or warnings. |
| `node node_modules/typescript/bin/tsc --noEmit` | Passed separately from the build; final production build also passed TypeScript. |
| `node node_modules/prettier/bin/prettier.cjs --check '**/*.{ts,tsx}' eslint.config.mjs eslint-rules/*.mjs` | Passed. |
| `node node_modules/next/dist/bin/next build --webpack` | Passed compilation, production types and route generation with inert test-only auth/provider values. Expected Better Auth schema diagnostics came from the intentionally unavailable local test database. |
| Chrome with the checkout API fixture and Webpack dev on port 3100 | Passed option/cart interactions, lost-response edit lock, retry returning the original receipt, receipt reset, menu-language switching, home Button-to-Link navigation, sign-in rendering and password visibility toggle. Card bottom padding measured 20px, with no horizontal overflow or error overlay. |
| Browser diagnostics | The storefront recorded the existing LastPass `data-lastpass-icon-root` hydration mismatch. The home-to-sign-in navigation check recorded no console errors/warnings. Full-page screenshot capture timed out; the native screenshot API succeeded and the card layout was inspected. Extension-free hydration and authenticated kitchen pages remain unverified. |
| `git -c core.safecrlf=false diff --check` | Passed. |
| API tests | Not rerun: no API source, schema or contracts changed. |

Fixture/dev processes were stopped. No dependencies or lockfile changed. The existing `.env.example` edit remains excluded. Live provider delivery, database acceptance and authenticated kitchen acceptance retain their separate task scope.

## Vercel engine compatibility — 2026-10-02

The reported Vercel install failed because `engine-strict=true` enforced exact Node 24.19.0/npm 11.17.0 engines against the platform's Node 24.21.0/npm 11.19.0. On `fix/vercel-engine-compatibility`, package engines now accept `^24.19.0` and `^11.17.0`. Exact local/CI references remain in `.nvmrc` and `packageManager`; strict engine validation remains enabled. npm regenerated the lockfile's root engine metadata only, with no dependency version or integrity changes. Setup and stack documentation now distinguish reference versions from supported ranges.

| Command/check | Actual result |
| --- | --- |
| Semver check against the original engines | Failed as expected: the reported Vercel pair was rejected. |
| npm `npm-install-checks.checkEngine` against updated manifest | Passed: both reference and reported Vercel versions accepted; older Node/npm and Node 25/npm 12 rejected. Manifest and lockfile engine metadata match. |
| `npm install --package-lock-only --ignore-scripts --offline --no-audit --no-fund` | Failed with `EBADENGINE`: this host's available npm CLI is 11.1.0, below the supported minimum. |
| `npm pack npm@11.17.0 --pack-destination .tmp --ignore-scripts --silent` | Failed with `ETARGET`: the available registry did not provide that version. No replacement npm was installed. |
| `npm install --package-lock-only --ignore-scripts --offline --no-audit --no-fund --engine-strict=false` using Node 24.19.0/npm 11.1.0 | Passed with the expected npm engine warning. The override was limited to offline lockfile metadata generation, with no installation or lifecycle scripts; checked-in strict validation remains enabled. This is not clean-install verification. |
| `node node_modules/vitest/vitest.mjs run` from frontend | Passed: 20 files, 129 tests. |
| `node node_modules/eslint/bin/eslint.js .` | Passed with no errors or warnings. |
| `node node_modules/typescript/bin/tsc --noEmit` | Passed, separately from the production build. |
| `node node_modules/next/dist/bin/next build --webpack` | Passed compilation, production types and all 29 generated pages with inert test-only auth/provider values. Better Auth logged schema validation errors against the deliberately unavailable test database. |
| `node node_modules/prettier/bin/prettier.cjs --check package.json package-lock.json` | Passed. |
| `git -c core.safecrlf=false diff --check` | Passed. |
| API tests | Not rerun: no API code or schema changed. |

Fresh `npm ci` and hosted Vercel deployment are not verified in this follow-up. Rerun the hosted build after merging the fix; keep the toolchain card In review until deployment acceptance succeeds. The pre-existing `.env.example` edit remains excluded. No application source, production data, provider credentials or dependency versions changed.

## Staff acceptance and final verification — 2026-10-04

Added a repeatable real-database browser suite for distinct owner/manager/kitchen identities and a foreign tenant member. Playwright project dependencies run restaurant creation, catalog editing and staff acceptance in order. The latest combined run passed all three scenarios in 2.3 minutes, including owner completion with French feedback. The staff-only run passed in 52.5 seconds before that added completion assertion. Random test credentials stay in memory; cleanup removes only generated staff memberships/sessions. No backend contract, migration, production or dependency changes.

| Command/check | Actual result |
| --- | --- |
| `$env:WHITEPLATE_ACCEPTANCE_DATABASE='neon-test'; node node_modules/playwright/cli.js test` | Passed: 3 browser tests against localhost and Neon `test`, with real auth, invitation acceptance, checkout, conditional mutations, catalog edits and revocation polling. |
| `node node_modules/vitest/vitest.mjs run` | Passed: 24 files, 197 tests. |
| `node node_modules/eslint/bin/eslint.js .` | Passed without errors/warnings. |
| `node node_modules/typescript/bin/tsc --noEmit` | Passed after removing duplicate configuration/type properties introduced during editing. |
| `node node_modules/prettier/bin/prettier.cjs --check '**/*.{ts,tsx}'` | Passed. |
| `node node_modules/next/dist/bin/next build --webpack` | Passed compilation, TypeScript and 33 page generations with inert build settings. Expected Better Auth unavailable-database diagnostics and nonfatal restricted Webpack cache warnings were recorded. |
| `dotnet test apps/api/WhitePlate.slnx --no-restore --configuration Release` | Passed: 136 tests, zero failures/skips. Initial restricted run failed MSB3491 because build-cache writes were denied; normal-permission rerun passed. |

Early staff runs corrected expected accessible names and narrowed a French status selector that also matched the filter. The passing suite checks the actual localized controls and persistent state. A manager hub disconnect deliberately preserves the stale snapshot; REST polling is authoritative for revocation and hides tickets/filters within the 30-second interval. The API logged `Kitchen outbox polling failed (InvalidOperationException)` during runtime acceptance. Event publication/reconnect recovery, immediate hub group eviction on membership removal and hosted URL/CORS/TLS remain unverified and are recorded on the existing SignalR/operations kanban work. REST success does not establish event delivery. Test-only data remains on Neon `test`; production was untouched. Both agent-started local servers were stopped after acceptance.

## Category and product management — 2026-10-04

Implemented localized owner/manager catalog editing against the existing API, with validated management DTOs and mutation inputs, safe authorization errors, duplicate-submit guards, server refresh and explicit archive confirmation. Option-group and discount editors remain deferred. No schema or production changes.

| Command/check | Actual result |
| --- | --- |
| `node node_modules/vitest/vitest.mjs run` | Passed: 24 files, 197 tests. New mutation tests first failed against stubs (11 failures); management response acceptance first failed against a null parser. Both then passed after implementation. |
| `node node_modules/eslint/bin/eslint.js .` | Passed without errors/warnings. |
| `node node_modules/typescript/bin/tsc --noEmit` | Passed. |
| `node node_modules/prettier/bin/prettier.cjs --check '**/*.{ts,tsx}'` | Passed. Restricted-shell formatting initially encountered EPERM; normal-permission formatting succeeded. |
| `node node_modules/next/dist/bin/next build --webpack` | Passed compilation, TypeScript and 33 page generations using inert build auth/API URLs and unavailable local database. Expected Better Auth schema diagnostics and nonfatal restricted-shell Webpack cache EPERM warnings were recorded. |
| `node node_modules/playwright/cli.js test catalog-management.spec.ts` | Passed (44 seconds) against localhost and Neon `test`: category/product CRUD, GBP values, persisted availability after reload, French UI, archive cancellation/confirmation and read-only retained history. |

Staff-role and foreign-account catalog checks continue in the next acceptance task. Test-created rows are retained on Neon `test`; archived rows are restricted to this test's own category/product.

## Owner restaurant creation — 2026-10-04

Tracked in issue #13 on `feat/restaurant-management-and-staff-acceptance`. Added an owner-only English/French restaurant form, validated server action and authenticated service, organization/team navigation, normalized subdomain and EUR/USD/GBP input, and localized conflict/permission errors. The existing API owns authorization and persistence; no API/schema/dependency changes were needed.

Commands ran from `apps/frontend` with Node 24.19.0; npm is absent from this shell.

| Command | Actual result |
| --- | --- |
| `node node_modules/vitest/vitest.mjs run` | Passed: 22 files, 155 tests; includes 21 creation-boundary cases. Success/error tests failed against the initial stub before implementation. |
| `node node_modules/eslint/bin/eslint.js .` | Passed after correcting statement/JSX spacing. |
| `node node_modules/typescript/bin/tsc --noEmit` | Passed after correcting the table-driven test input type. |
| `node node_modules/prettier/bin/prettier.cjs --check '**/*.{ts,tsx}'` | Passed from the package. Source formatting needed normal permissions for sandbox-denied files; an accidental root invocation could not resolve the package-local plugin. |
| `node node_modules/next/dist/bin/next build --webpack` | Passed compilation, TypeScript and 31 route/page generations with process-local inert production settings. Better Auth emitted expected schema diagnostics against the unavailable build database; restricted cache writes warned but did not fail the build. |
| `node node_modules/@playwright/test/cli.js test tests/browser/restaurant-creation.spec.ts --reporter=line` | Passed (19.6 seconds): verified local account, real test-database GBP restaurant creation, uppercase subdomain, team navigation, French duplicate-subdomain feedback and unlocked fields. |

Initial browser runs exposed exact-label/duplicate-element selector issues and a cold-route assertion timeout. The currency control now has an explicit accessible name and tests scope selectors to the relevant form/restaurant. One later run hit a transient Better Auth database connection termination; the final rerun passed without bypassing authorization. Sandbox-denied Next cache writes required a normal-permission dev server. Initial API restore could not access a NuGet lock; the API started using restored assets with `--no-restore`, and `/health/ready` returned 200. Test-only acceptance organizations/restaurants remain on Neon `test`; non-secret fixture IDs are in ignored `.acceptance/restaurant.json`. No production data or credentials changed.

## SignalR delivery and membership revocation — 2026-10-05

On `fix/kitchen-outbox-delivery` from main `bd8030e`, a real four-client acceptance test failed because an open kitchen socket received an order hint after its membership was removed. Publication now rechecks current persisted membership per connection, removes revoked subscriptions/groups, ignores left/disconnected recipients and propagates authorization failures to outbox retry. SignalR is configured to close connections at token expiration. The registry supports the existing single API instance; multi-instance coordination and actual hosted expiry verification remain open. Outbox polling now logs safe operation/type diagnostics. The historical polling exception did not reproduce and has no confirmed cause; successful REST or live tests do not retroactively diagnose it.

| Command | Actual result |
| --- | --- |
| `dotnet test apps/api/WhitePlate.slnx --no-restore --configuration Release` | Passed all 142 API tests, including subscription cleanup and revoked/fail-closed publication. |
| `node node_modules/vitest/vitest.mjs run` | Passed all 197 frontend tests in 24 files. |
| `node node_modules/eslint/bin/eslint.js .` | Passed from `apps/frontend`. |
| `node node_modules/typescript/bin/tsc --noEmit` | Passed after removing a duplicated fixture type field. |
| `node node_modules/prettier/bin/prettier.cjs --check '**/*.{ts,tsx}'` | Passed across the frontend. |
| `node node_modules/next/dist/bin/next build --webpack` | Passed compilation, TypeScript and 33 page generations with process-only inert production settings. Better Auth schema diagnostics were expected against the deliberately unavailable local build database. |
| `node node_modules/playwright/cli.js test --project=realtime --no-deps` | Initially failed on revoked-socket delivery; passed after the fix and correcting the retry harness query. |
| `node node_modules/playwright/cli.js test` | All four projects passed in 3.2 minutes; the final real-time case took 39.1 seconds. |

The live suite used localhost and the existing Neon `test` database with its explicit acceptance guard. It checked delivery for owner/manager/kitchen, events and denied joins in both tenant directions, exact local CORS, persisted dispatch, same-event duplicate suppression, real retry scheduling after a malformed test-only payload and recovery after restoring it, fresh token acquisition on explicit reconnect/rejoin, REST recovery of an offline order and no subsequent hints to revoked kitchen access. Existing staff acceptance still verified REST/cache removal. An early duplicate project declaration and malformed-payload lookup were corrected; another pre-fix run timed out awaiting a status hint without a polling exception. The initial sandbox API build and formatting writes were denied; normal-permission reruns succeeded. Both agent-started servers were stopped after acceptance. No production data, credentials or schema changed.

The user selected Coolify for hosted checks. Read-only inspection showed a restarting API on main `bd8030e` with an HTTP application link and startup error `Production requires an HTTPS Authentication:Issuer and Authentication:Audience.` Hosted checks await working issuer/audience and HTTPS routing, then deployment of this fix, exact frontend CORS, browser-reachable hub URL and actual token-expiration/renewal/reconnect. See the dated [test plan](functional-test-plan.md#live-outbox-and-revoked-connection-acceptance--2026-10-05); the SignalR card stays In review rather than Done.

## Catalog option-group and option management — 2026-10-06

Added localized owner/manager option-group and option forms to the existing catalog page. The UI sends only validated API fields, displays option prices in the restaurant currency, keeps archived descendants read-only, and uses the existing shadcn Base UI form controls, cards, badges, and action feedback. The API remains responsible for tenant ownership and authorization; no API, schema, or production changes were made. Discount-code editing remains proposed work.

| Command/check | Actual result |
| --- | --- |
| `node node_modules/vitest/vitest.mjs run` | Passed: 27 files, 239 frontend tests. Includes parser, mutation-payload, and option-editor rendering coverage. |
| `node node_modules/eslint/bin/eslint.js .` | Passed. |
| `node node_modules/typescript/bin/tsc --noEmit` | Passed. |
| `node node_modules/prettier/bin/prettier.cjs --check "**/*.{ts,tsx}"` | Passed. |
| `node node_modules/next/dist/bin/next build --webpack` | Passed compilation, TypeScript, and generation of all 33 pages with process-only HTTPS placeholders for the local auth/API origins. The build still reported sandbox-denied `.next` cache writes and the installed PostgreSQL driver's upcoming `sslmode` compatibility warning. The initial build without HTTPS placeholders stopped on local HTTP settings. |
| `node node_modules/@playwright/test/cli.js test tests/browser/catalog-management.spec.ts --reporter=line` | Not run. The expanded browser scenario writes acceptance organizations/catalog records and depends on its prerequisite browser flow; `WHITEPLATE_ACCEPTANCE_DATABASE=neon-test` was not explicitly enabled, so the test database could not be authorized. |

The browser acceptance scenario now covers group/option create, edit, reload persistence, French archive cancellation/confirmation, descendant archive, and read-only archived history. Live browser/database acceptance remains open on the kanban card. No hosted denial-route checks, production writes, or credentials were used.

## Roadmap and setup documentation alignment — 2026-10-06

Aligned current status summaries with the implementation and dated acceptance records. The roadmap no longer reports obsolete test totals or an open staff-role matrix. Current guidance distinguishes completed Neon `test` role, tenant-isolation, checkout-snapshot, revocation, outbox and reconnect acceptance from hosted SignalR, tenant DNS/TLS, token-expiration, OAuth/email-provider and operational work. Catalog, option-group, option and discount editors are described as implemented; guarded discount-browser and checkout-redemption/receipt-history acceptance remain separate scenarios. Historical dated entries retain their original results and include a follow-up where later acceptance closed an earlier item. Browser commands now use the package's `test:browser` script, configured `tests/browser` paths, and documented project dependencies. Troubleshooting describes the active menu routes, tenant host resolution, server-side BFF and SignalR CORS requirements.

| Check | Result |
| --- | --- |
| `git diff --check` | Passed with no whitespace errors. |
| Relative Markdown file-link scan over the 10 changed documentation files | Passed; every relative target exists. |
| Compare browser commands against `apps/frontend/package.json`, `apps/frontend/playwright.config.ts`, and `apps/frontend/tests/browser` | Passed by source inspection; script name, test paths, project dependencies, and worker configuration agree. |
| Search active status/setup documents for the identified obsolete counts, proposed editor status, missing menu/BFF claims, stale CLI paths, and open staff-matrix claims | Passed; no stale claims remain in the active documents checked. Dated history remains intact. |
| Frontend/API suites or guarded database acceptance | Not run; this change only updates documentation, and the database-backed browser suite was not authorized for this documentation task. |
