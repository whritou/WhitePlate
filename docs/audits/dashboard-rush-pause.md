# D3 rush hold and emergency pause verification — 2026-10-14

## Approved operating policy

Decision 0011 records the user-approved policy: organization owners and restaurant managers can change the controls; Kitchen is read-only. Rush hold adds ten minutes to the minimum lead time for newly offered pickup slots and remains active until manually cleared. Emergency pause hides pickup slots and rejects new checkout creation. Orders, reservations, slot capacity and successful idempotent retries remain unchanged.

## Source implementation

- Tenant settings persist `AcceptingOrders`, `RushHoldEnabled` and a concurrency version. Migration `20261014150246_OrderingOperations` is generated and the EF model snapshot includes it.
- Owner/manager reads and conditional updates expose quoted ETags; Kitchen can read but receives the standard not-found denial on update.
- Checkout and pause serialize against the tenant row on PostgreSQL. Checkout checks for a successful idempotent replay first, then rejects new order creation when pause wins.
- Public availability adds `orders_paused` and rush metadata. The live dashboard polls the protected state every 15 seconds, presents confirmation before changes, and only renders server-confirmed values. Guest checkout reports the pause/rush state and refreshes the schedule following a conflict.
- English and French dashboard and checkout text are included.

## Local verification

Commands were run from `apps/frontend` unless the table names another directory. Package CLIs were invoked directly because the configured `npm` shim points to a missing global `npm-cli.js`.

| Check | Result |
| --- | --- |
| `dotnet test apps/api/WhitePlate.slnx --no-restore` (repository root) | Passed: 265 tests, 0 failed. Includes ordering permissions, pause/stale-cart rejection, preserved order/reservation and idempotent replay, resume, rush slot timing, and EF migration/model checks. |
| `node node_modules/vitest/vitest.mjs run --configLoader runner` | Passed: 534 tests across 88 files. |
| `node node_modules/typescript/bin/tsc --noEmit` | Passed after the route handler's discriminated authorization result was made explicit. |
| `node node_modules/eslint/bin/eslint.js .` | Passed with 0 errors and 19 existing `<img>` warnings in Lovable reference components. |
| Prettier `--check` on changed frontend TypeScript, TSX and JSON | Passed. |
| `node node_modules/next/dist/bin/next build --webpack` with process-only `BETTER_AUTH_URL=https://auth.build.invalid` and `API_BASE_URL=https://api.build.invalid` | Passed; Next compiled and generated all pages. The build emitted the existing `pg-connection-string` SSL-mode compatibility warning during static page generation. |
| `dotnet build apps/api/WhitePlate.Api/WhitePlate.Api.csproj --no-restore` | Passed with 0 warnings and 0 errors. |
| `git diff --check` | Passed. |

The focused API run also passed the four ordering-control cases plus the shared order-endpoint baseline. Frontend unit coverage exercises the ordering-state BFF membership/no-store behavior, role visibility, paused checkout copy, rush notice and public availability parsing.

## Migration rollout — 2026-10-14

The earlier rollout in this task applied 14 pending migrations from `20261008195344_CategoryVisibility` through `20261014150246_OrderingOperations` to Neon `test` before the user clarified that Coolify was the intended target. That Neon application was unintended. After clarification, Coolify Production was checked separately: `whiteplate-postgresql-main` had D2 as its latest EF migration, two tenants, zero orders and none of the D3 columns.

Before changing Coolify, a 69.7 KiB `pg_dump -Fc` was created inside the database container at `/tmp/whiteplate-before-ordering-operations-20261014.dump`. `dotnet ef migrations script` could not rebuild because MSBuild was denied writing a generated `obj` cache (`MSB3491`), so the source migration was reviewed and its three additive column operations plus history row were applied in one PostgreSQL transaction. The transaction added non-null `AcceptingOrders` (default `true`), `OrderingOperationsVersion` (default `1`) and `RushHoldEnabled` (default `false`) and recorded `20261014150246_OrderingOperations` at EF product version `10.0.12`. A subsequent read-only query confirmed this is the latest migration, all three columns and defaults, and the initial settings on both tenants. One concatenated terminal command produced a syntax error after the successful `COMMIT`; the separate verification confirmed the committed state. The in-container dump is temporary and is not off-host backup retention or a restore test.

The D3 schema is now applied to both Neon `test` and Coolify Production. The D3 API/frontend change remains on open PR #92. Coolify Production and Vercel Production were not deployed during this rollout; migration history does not establish independent-session concurrency or browser behavior.

## Remaining acceptance and rollout

Deploy the API/frontend change after PR #92 is merged. Exercise independent-connection pause-versus-checkout lock ordering against PostgreSQL. Owner/manager/Kitchen and foreign/revoked access checks against the hosted API, plus two-session browser polling in English and French, remain open. The selected rush policy has no automatic expiry. Source tests and migration-history verification do not claim hosted or PostgreSQL concurrency acceptance.
