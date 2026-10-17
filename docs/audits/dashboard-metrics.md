# Dashboard metrics verification — 2026-10-14

## Implemented in source

The restaurant dashboard and real-workspace analytics page read tenant-scoped server aggregates from `GET /api/v1/tenants/{tenantId}/dashboard/metrics`. It compares today with the previous calendar day in the tenant's saved IANA time zone. Order volume includes every retained order by `CreatedAt`, including cancelled orders; archived orders remain included. Order value sums saved `Order.Total` for currently non-cancelled orders, including tax and discounts. It is not payment revenue.

The current queue counts Pending, Preparing, and Ready orders across all creation dates. Hourly volume uses the local hour for the two compared dates. Top sellers use the saved product ID/name and quantity in order-line snapshots for today's non-cancelled orders. Preparation averages use nonnegative `PreparingAt` to `ReadyAt` intervals whose ready time falls on the business date; legacy rows without timestamps do not contribute. Empty samples return a null average and a zero sample count.

Owners and managers receive the two order-value aggregates. Kitchen responses contain null values; they do not receive those monetary figures. The same-origin BFF checks membership, both API and BFF responses are `no-store`, and the browser query key includes account, tenant, locale, and role. The chart includes a screen-reader-accessible hourly table. English and French explain the comparison dates, zone, cancellation treatment, and saved order-value meaning.

The API lifecycle now records nullable `PreparingAt` and `ReadyAt` fields on transitions. Generated migrations `20261014122001_DashboardMetricsPreparationTimestamps` and `20261014122436_DashboardMetricsTenantStatusIndex` add those fields and the aggregate indexes. Existing orders are not backfilled, and the app does not apply migrations at startup.

## Real-workspace analytics integration — 2026-10-17

`/[locale]/organization/analytics` now loads the authorized restaurant's initial metrics through the server-only API service and reuses the D2 metrics panel. The panel refreshes through the membership-checking same-origin BFF every 30 seconds, with account/tenant/locale/role-scoped query state, retry/error handling, and role-based monetary display. The screen presents only values supplied by D2. The fictional range, restaurant, channel, repeat-customer, commission, and unsupported kitchen-performance figures remain in `/[locale]/demo/analytics` only. No API contract, schema, or C# code changed. Hosted browser acceptance against real orders remains open.

| Check | Result |
| --- | --- |
| `node node_modules/typescript/bin/tsc --noEmit` | Passed. |
| `node node_modules/eslint/bin/eslint.js .` | Passed with 0 errors and 19 existing `<img>` warnings. |
| Targeted Prettier check for the analytics page/loading state and both locale catalogs | Passed. |
| `node node_modules/next/dist/bin/next build --webpack` with process-only HTTPS dummy endpoints | Passed. Build output included existing PostgreSQL SSL-mode warnings from `pg-connection-string`. |
| `git diff --check` | Passed. |

`npm run typecheck` could not start because the configured global `npm-cli.js` is missing; the installed local TypeScript, ESLint, Prettier, and Next.js CLIs were used directly. The first build attempt hit Windows `EPERM` on the generated `.next` cache; it passed when retried with cache-write permission. Automated tests and hosted real-order browser acceptance were not run for this page integration.

## PostgreSQL migration rollout — 2026-10-14

The two migrations were applied transactionally to Coolify's `whiteplate-postgresql-main` database before the API change was merged, so the schema is ready before deployment. Preflight confirmed the latest migration was `20261013191310_OrderPickupMode`, with no D2 history rows, columns, or indexes. A 68.7 KB `pg_dump -Fc` was saved at `/tmp/whiteplate-before-dashboard-metrics-20261014.dump` inside the database container before the change; this temporary copy is not an off-host backup. Post-checks confirmed both EF history rows at product version `10.0.12`, all four nullable columns with the expected PostgreSQL types, and both tenant indexes. Existing orders were not backfilled or otherwise changed.

## Verification evidence

Commands were run from `apps/frontend` unless stated otherwise.

| Check                                                                                                                                                                  | Result                                                                                                                                                                                                |
| ---------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `node node_modules/vitest/vitest.mjs run`                                                                                                                              | Passed: 526 tests across 84 files.                                                                                                                                                                    |
| `node node_modules/typescript/bin/tsc --noEmit`                                                                                                                        | Passed.                                                                                                                                                                                               |
| `node node_modules/eslint/bin/eslint.js .`                                                                                                                             | Passed with 0 errors and 19 existing `<img>` warnings in generated Lovable pages.                                                                                                                     |
| Prettier `--check` on changed TS, TSX, and JSON                                                                                                                        | Passed.                                                                                                                                                                                               |
| `node node_modules/next/dist/bin/next build --webpack` with process-only `BETTER_AUTH_URL=https://auth.build.invalid` and `API_BASE_URL=https://api.build.invalid`     | Passed. The HTTPS dummy endpoints were used because production mode rejects the repository's local HTTP defaults; static generation emitted PostgreSQL SSL-mode warnings from `pg-connection-string`. |
| `dotnet test apps/api/WhitePlate.slnx --no-restore -p:BaseOutputPath=D:\Documents\GitHub\WhitePlate\apps\api\WhitePlate.Api\bin\test-output\` from the repository root | Passed: 261 tests. The separate output path avoids the running API's locked normal binaries and remains under `apps/api` for the architecture test's source discovery.                                |
| `git diff --check`                                                                                                                                                     | Passed.                                                                                                                                                                                               |

The package-level npm shim could not start because its configured global `npm-cli.js` is missing, so the installed local frontend CLIs were invoked directly. An initial API test output path outside the repository caused the architecture source-discovery test to fail; rerunning with the in-repository isolated output path passed the complete suite. An initial Next build was denied access to the existing `.next` cache; the build then ran with generated-cache write permission. The first production-mode build also rejected the local HTTP auth URL and was rerun with process-only HTTPS dummy endpoints.

The API endpoint tests use deterministic SQLite integration fixtures for local-day boundaries, archived and cancelled orders, preparation samples, tenant separation, access control, and empty state. They do not validate PostgreSQL query plans or a shared database.

## Deferred acceptance

Representative-volume query-plan checks, real PostgreSQL behavior beyond the schema migration, hosted metrics against real orders, and responsive browser/accessibility acceptance remain open. The user explicitly deferred real-data validation of D1 and asked to proceed with D2; D2 real-data acceptance is likewise left for the application's later real-data acceptance phase. The rollout changed schema only; existing business rows were not modified.
