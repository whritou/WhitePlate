# Documentation review baseline — 2026-09-28

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
