# Coolify and Vercel deployment

This is the runbook for the user-approved, single hosted development stack ([decision 0005](../architecture/decisions/0005-coolify-hosting.md)). Runtime credentials belong in Coolify/Vercel settings, never this file, client code or `NEXT_PUBLIC_*` variables. The migration is tracked in [issue #17](https://github.com/whritou/WhitePlate/issues/17).

## S5 Stripe Connect schema rollout — 2026-10-17

Before applying migration `20261017134031_StripeConnect`, Coolify Production resource `whiteplate-postgresql-main` was checked through the PostgreSQL container terminal. Database `whiteplate` was current, the latest history row was `20261017104323_OrderEmailNotifications`, two tenants and zero orders existed, and all three S5 tables were absent. A custom-format dump at `/tmp/whiteplate-before-stripe-connect-s5-20261017.dump` was 92,754 bytes; `pg_restore --list` recognized its 13,641-byte listing. This temporary container-local backup is not an off-host copy or restore test.

The migration DDL, EF history row (`10.0.12`), and `whiteplate_api` `SELECT`, `INSERT`, `UPDATE`, and `DELETE` grants on all three tables were applied in one transaction with a 5-second lock timeout and 30-second statement timeout. The transaction checked the target database and absence of prior migration history/tables before creating schema. Post-checks confirmed latest migration `20261017134031_StripeConnect`, all three tables present with zero rows, ten indexes including primary keys, and all twelve expected API-role privileges. Tenant and order counts remained unchanged. No existing business rows were modified.

The schema was applied before merging PR #122 so the additive database changes precede the connected API version. Stripe credentials were not read or used; the Standard test-account OAuth/webhook lifecycle and hosted acceptance remain open. See [S5 API contract](../api/api-contracts.md#s5-stripe-connect--2026-10-17), [schema](../database/database-schema.md#s5-stripe-connect--2026-10-17), and [functional checks](../functional-test-plan.md#s5-stripe-connect--2026-10-17).

## S4 transactional order-email schema rollout — 2026-10-17

Preflight on Coolify Production resource `whiteplate-postgresql-main` confirmed database `whiteplate`, latest migration `20261016222355_M3CatalogTranslationWorkflow`, two tenants, zero orders, and no S4 columns/table/history row. A custom-format backup was created at `/tmp/whiteplate-before-order-email-20261017.dump` inside the PostgreSQL container (86.6 KiB); `pg_restore --list` recognized the archive with 186 entries. This temporary container-local dump is not an off-host backup or restore test.

The guarded additive `20261017104323_OrderEmailNotifications` DDL, EF history row (`10.0.12`), and `whiteplate_api` `SELECT`, `INSERT`, `UPDATE`, and `DELETE` grants on `OrderEmailDeliveries` were applied in one transaction with a 5-second lock timeout and 30-second statement timeout. Post-checks confirmed the history row, both tenant template columns and defaults, all three nullable order columns, the delivery table, its three indexes and order foreign key, and all four runtime-role privileges. Counts remained at two tenants and zero orders; the delivery table is empty. No existing order or tenant data was otherwise edited.

The API has not been deployed or restarted. Configure the API-side Resend sender, stable tracking signing key and HTTPS storefront URL before deployment; controlled provider delivery and hosted tenant acceptance remain open. See [S4 schema](../database/database-schema.md#s4-transactional-order-email--2026-10-17) and the [functional test plan](../functional-test-plan.md#s4-transactional-order-email).

## M3 translation-review schema rollout — 2026-10-17

After PR [#116](https://github.com/whritou/WhitePlate/pull/116) merged as `36da90c`, the Coolify Production preflight found `20261016155331_CatalogPublicationHistory` as the latest migration, two tenants, two publication heads, and no M3 tables. A custom-format backup was created at `/tmp/whiteplate-before-m3-translation-20261017.dump` inside the PostgreSQL container (81,505 bytes); `pg_restore --list` validated it. This temporary in-container file is not an off-host backup or restore test.

The additive `20261016222355_M3CatalogTranslationWorkflow` DDL and EF history row (`10.0.12`) were applied in one PostgreSQL transaction through the Coolify terminal. Post-checks confirmed the history row, both empty M3 tables, unchanged counts of two tenants and two publication heads, and `whiteplate_api` `SELECT`, `INSERT`, `UPDATE`, and `DELETE` grants on both tables. No existing translations were changed or backfilled. The API was not deployed or restarted; hosted workflow acceptance remains open. See [M3 rollout evidence](../audits/catalog-translation-workflow.md).

## D2 dashboard-metrics schema rollout — 2026-10-14

Applied `20261014122001_DashboardMetricsPreparationTimestamps` and `20261014122436_DashboardMetricsTenantStatusIndex` transactionally to `whiteplate-postgresql-main` before merging the dashboard API change, keeping the additive schema ready before code deployment. Preflight found `20261013191310_OrderPickupMode` as the latest EF migration and no D2 columns or indexes. A 68.7 KB `pg_dump -Fc` was created at `/tmp/whiteplate-before-dashboard-metrics-20261014.dump` inside the database container before applying the change. Post-checks confirmed both EF history rows at version `10.0.12`, all four nullable `Orders` columns with their expected types, and both tenant indexes. No existing orders were backfilled or modified. This temporary container-local dump is not an off-host backup or restore drill. Hosted metrics against real order data and query-plan checks remain open; see [D2 evidence](../audits/dashboard-metrics.md).

## D3 ordering-controls schema rollout — 2026-10-14

After the user clarified Coolify as the migration target, preflight on `whiteplate-postgresql-main` found `20261014122436_DashboardMetricsTenantStatusIndex` as the latest EF migration, two tenants, zero orders, and none of the three D3 columns. The pending migration chain through `20261014150246_OrderingOperations` had already been applied to Neon `test` earlier in this task due to a target misunderstanding; the separate Coolify rollout was then completed.

A 69.7 KiB `pg_dump -Fc` was created at `/tmp/whiteplate-before-ordering-operations-20261014.dump` inside the database container before applying the change. This temporary container-local dump is not an off-host backup or restore drill. The local `dotnet ef migrations script` build was blocked because MSBuild could not write a generated `obj` cache (`MSB3491`, access denied); the reviewed `20261014150246_OrderingOperations` source adds three non-null `Tenants` columns with defaults `AcceptingOrders=true`, `OrderingOperationsVersion=1`, and `RushHoldEnabled=false`. Those operations and the EF history row (`10.0.12`) were applied in one transaction. A later terminal command concatenation produced a SQL syntax error after that transaction's `COMMIT`; a separate read-only verification confirmed the D3 migration history row, all three columns with their expected defaults, and both tenants at the initial state.

The D3 API/frontend change is on open PR #92. Coolify Production was not deployed or restarted, and no Vercel Production deployment was performed as part of this schema rollout. PostgreSQL concurrency checks, hosted role/checkout behavior and multi-session browser acceptance remain open. See [D3 evidence](../audits/dashboard-rush-pause.md).

## Production T2 theme-draft schema rollout — 2026-10-15

After PR [#110](https://github.com/whritou/WhitePlate/pull/110) merged as `ece37f6eb25c25ce3e8d0aa5d4457a58b5c35b9f`, the user requested applying migrations in Chrome. Preflight on `whiteplate-postgresql-main` confirmed database `whiteplate`, latest migration `20261014211126_DiscountMinimumAndExpiration`, two tenants and no theme columns. A 70.7 KB custom-format backup was created at `/tmp/whiteplate-before-theme-t2-20261015.dump`; `pg_restore -l` read it successfully (171 listing lines). It is a temporary container-local backup, not an off-host copy or restore drill.

The Chrome Coolify PostgreSQL terminal applied `20261015171219_TenantThemeDraft` in one guarded transaction with 5-second lock/30-second statement timeouts and `ON_ERROR_STOP`: nullable `Tenants.ThemeDraftJson jsonb`, non-null `ThemeDraftVersion integer DEFAULT 1`, and its EF history row at version `10.0.12`. Separate post-checks confirmed definitions/history, both tenants at null JSON/version 1, and existing API SELECT/UPDATE access to the JSON column. No row contents were edited or theme published. No Neon environment was changed, and no API deployment/restart was triggered. See [verification and remaining hosted acceptance](../audits/theme-controls.md#production-schema-rollout--15-october-2026).

## Availability incident and recovery — 2026-10-10

The public API returned HTTP 503 (`no available server`) on `/health/live`, `/health/ready` and `/api/v1/organizations`. Coolify reported the API as Degraded: its process was running, but PostgreSQL readiness failed repeatedly. Authentication on Vercel still worked. The workspace could not load organizations or restaurant memberships, so its context-dependent navigation links were absent.

The API container `wqyrztj6uyuwlveq75qrl68t-20261009T092313` held a file bind mount of an older CA inode with mode `0700`, owned by UID 9999. The current host file `/data/coolify/ssl/coolify-ca.crt` had a different inode and mode `0644`. Both public certificates had identical SHA-256 fingerprints; the API's non-root user received `Permission denied` when reading its mounted copy. The earlier host permission check therefore did not establish container readability.

Recovery changed only the mounted **public CA certificate** to mode `0644`, through an operator session:

```sh
docker exec -u 0 wqyrztj6uyuwlveq75qrl68t-20261009T092313 \
  chmod 644 /etc/ssl/certs/coolify-ca.crt
```

The current host file remains `0644`. No private key, database credential, schema, application code or TLS verification setting was changed; the connection retains `SSL Mode=VerifyFull`. No restart or redeployment was required. Container names above identify the incident, not permanent command targets.

Verification after recovery:

- The actual non-root API container user could read the mounted CA, and internal `/health/ready` returned 200.
- External HTTPS `/health/live` and `/health/ready` returned 200 `Healthy` with normal certificate verification. Anonymous `/api/v1/organizations` returned the expected 401.
- The existing authenticated Vercel session loaded the organization and two restaurants at `/fr/organization` without the unavailable error.
- Opening a real restaurant's orders page restored the appbar links for dashboard, orders, history, analytics, catalog and theming. The page showed the empty-order state and connected live updates. This verifies connection establishment, not delivery of a new order event.

After replacing a CA file or changing its permissions, verify the **mounted file inside every affected container**, not only the host path. Check readability as the actual application user and compare public certificate fingerprints when host/container files differ. File bind mounts can retain the previous inode after an atomic replacement. If that happens, deliberately remount/recreate the affected container after validating the current certificate, or correct permissions on its identical mounted public CA as above. Never apply public certificate permissions to private keys or disable TLS verification to restore availability. The process that replaced the host inode has not been identified; automatic prevention/monitoring remains operational work.

## Production product-photo migration — 2026-10-11

The production EF history initially contained the 15 migrations through `20261008210000_BrandMediaPublicationState`; both T1 brand-media migrations were already applied. The only pending migration present in the deployed API source was `20261009112850_ProductPhotoGallery`. `apps/api/brand-media-migrations.sql` is the idempotent initial business/auth bootstrap through both T1 migrations, not the incremental M5 migration. It is now tracked and pushed with the fix branch; production already had these migrations, so the bootstrap script was not rerun.

Before applying M5, the PostgreSQL terminal created `/tmp/whiteplate-before-product-photo-20261011.dump` with `pg_dump -Fc` (60.4 KiB). This was a temporary database-container copy, not an off-host backup or restore drill. The preflight found seven `MediaAssets` rows and zero active rows. The migration's operations were applied atomically in one transaction: add nullable `ProductId` and non-null `SortOrder` defaulting to zero, replace the active brand-slot index with its product-null predicate, add the tenant/product ordering index and composite restricted-delete foreign key, and record EF product version `10.0.12`.

Post-checks confirmed the migration history row, both columns and their null/default rules, both expected indexes, and the foreign key. The production API `/health/ready` endpoint returned `Healthy`. Its deployed commit `0d51b91` already contains the M5 implementation, so no API redeploy or restart was needed. Real S3 gallery upload/read/delete and hosted gallery acceptance remain outstanding; the database still has no scheduled off-host backup or restore drill.

## Production establishment-settings rollout — 2026-10-12

After PR #77 merged to `main` as `a17d0346175bf5f13eaff7bd47d60fbddd53fc06`, the production PostgreSQL resource `whiteplate-postgresql-main` was backed up to `/tmp/whiteplate-before-establishment-settings-20261012.dump` with `pg_dump -Fc` (62.6 KiB). This is a temporary copy inside the database container, not an off-host backup or restore drill. Preflight found two tenant rows, latest migration `20261011125310_ProductMenuMetadata`, no S1 migration-history row and none of the twelve S1 tenant columns.

Applied the reviewed `20261012113559_EstablishmentSettings` SQL through the Coolify database terminal in one transaction. Post-checks confirmed the migration history row with EF product version `10.0.12` and all twelve columns with the expected types, nullability and defaults. The API resource `white-plate:main-wqyrztj6uyuwlveq75qrl68t` then deployed merge commit `a17d034` through Coolify. The new container passed its internal `/health/ready` healthcheck and the rolling update completed at 2026-10-12 14:19 UTC. A local public probe was blocked by the browser and failed before connecting in PowerShell's Schannel client; rely on the verified Coolify healthcheck until external probing is available. Hosted owner/manager settings and tenant-host storefront acceptance remain open, as does off-host backup retention and a restore drill.

## Production opening-hours rollout — 2026-10-12

After PR #81 merged to `main` as `0732e79325b10487a8d763af12b385415b10e191`, the production PostgreSQL resource `whiteplate-postgresql-main` was backed up to `/tmp/whiteplate-before-opening-hours-20261012.dump` with `pg_dump -Fc` (63.8 KiB). This was a temporary copy inside the database container, not an off-host backup or restore drill. Preflight confirmed the S1 migration `20261012113559_EstablishmentSettings` was latest and `OpeningHoursJson` was absent.

Applied `20261012171223_OpeningHours` transactionally: added nullable `Tenants.OpeningHoursJson` as `jsonb` and recorded EF product version `10.0.12` in `__EFMigrationsHistory`. Post-checks confirmed the migration history row, nullable JSONB column and zero existing schedules; no opening hours were fabricated for existing tenants.

Coolify deployed the merged `main` commit through API resource `white-plate:main-wqyrztj6uyuwlveq75qrl68t` as deployment `hrakmdnqubktj7ox4itq2b23`. The build imported commit `0732e79`; both `/health/ready` checks returned Healthy and the rolling update completed at 2026-10-12 17:54 UTC. The resource reports Running. Automated source checks passed before merge (235 API tests, 481 frontend tests, typecheck, lint and production build; all four PR checks passed). Hosted owner/manager save/read, tenant-host public projection, cross-tenant denial and responsive browser acceptance remain open; frontend deployment remains outstanding. No open-now calculation or checkout enforcement is included in S2. Off-host backup retention and a restore drill remain operational work.

## Production discount minimum and expiry rollout — 2026-10-15

PR #96 merged to `main` as `404d8409a7728fac4e3758a865b667494ea02ccf`. Before changing the production database, preflight confirmed database `whiteplate`, latest migration `20261014150246_OrderingOperations`, two tenants, zero orders, one promotion discount, and neither new discount column. The Coolify PostgreSQL terminal created `/tmp/whiteplate-before-discount-fields-20261015.dump` with `pg_dump -Fc` (70.1 KiB). `pg_restore -l` recognized the custom archive and listed 161 table-of-contents entries. The dump is a temporary copy inside the database container, not an off-host backup or restore drill.

Applied `20261014211126_DiscountMinimumAndExpiration` in one explicit transaction through the Coolify database terminal. It added nullable `PromotionDiscounts.ExpiresOn date`, non-null `PromotionDiscounts.MinimumOrderAmount numeric(12,2) DEFAULT 0`, and the EF history row with product version `10.0.12`. Post-checks confirmed the history row, both column definitions, precision 12/scale 2, and the existing discount's `0.00` minimum with no expiry. No order rows were changed.

GitHub API and Frontend checks and the Vercel Preview passed. Local verification passed 270 API tests, 557 frontend tests, and three targeted browser scenarios for discount/archive reachability, product drag ordering, and photo drag ordering. The Coolify API resource `white-plate:main-wqyrztj6uyuwlveq75qrl68t` was Running, but its latest successful deployment still served commit `dd1d812` (PR #92, 2026-10-14 16:18 UTC); the manual deployment of merge commit `404d840` and hosted end-to-end acceptance remain pending. Do not report checkout minimum/expiry enforcement as live until that deployment and acceptance are verified.

## Previous verified deployment state — 2026-10-08

| Component | Evidence and remaining work |
| --- | --- |
| PostgreSQL | Coolify resource `whiteplate-postgresql-main` (`0uwdtjpwtqrokjcpnwe7wtfq`), `postgres:18-alpine`, database `whiteplate`, Docker network `coolify`. Running/healthy with a persistent volume and SSL enabled. User-approved public TCP proxy on `204.168.231.15:5433` is active. |
| Schemas | Reviewed empty-target EF SQL plus SQL from the installed Better Auth configuration initialized the new volume. The current database has 12 EF migrations, 16 `public` tables, and 6 `auth` tables. The Vercel JWKS probe initialized one required signing-key record. One hosted account, one organization and one acceptance restaurant exist; there are no orders. `20261008084937_PublicOrderTracking` was applied on 2026-10-08 after confirming the prior 10 migrations, zero order rows and absence of both columns. Post-migration queries confirmed migration 11, both nullable columns and zero order rows. After opening PR #51, the additive `20261008094652_RestaurantDescriptionTranslations` migration was applied through the Coolify PostgreSQL terminal on 2026-10-08. Pre-checks confirmed migration 11 and that the column was absent; the reviewed migration added `Tenants.DescriptionTranslationsJson text NOT NULL DEFAULT '{}'` and recorded EF product version `10.0.12`. Post-checks confirmed the history row, non-null column/default and migration count 12. The feature branch's API/frontend is not yet deployed, so hosted storefront behavior remains pending. No Neon data was imported or changed. |
| Database TLS | External PostgreSQL SSL negotiation passed with TLS 1.3, trusted Coolify CA and IP identity verification. Certificate expires 2027-10-05. The API readiness probe and Vercel Better Auth user/JWKS probes both succeeded with their configured TLS connections. |
| Database access | Runtime-role SQL is applied; both least-privilege roles have LOGIN enabled. Schema/table privilege queries confirm own-schema access and cross-schema denial. HBA rules require TLS/SCRAM, allow the API's observed IPv4 and IPv6 Coolify subnets, and reject other TCP connections. Plaintext and administrator TCP refusals were verified through the public proxy. |
| API | Existing resource `wqyrztj6uyuwlveq75qrl68t` is deployed from `main` at `d2738dc` (merge of PR #49). The manual redeploy at 2026-10-08 09:23 UTC succeeded in 51 seconds; its container passed the `/health/ready` healthcheck and Coolify reports Running. The feature branch in PR #51 has not been deployed. The new description migration is applied ahead of deployment; public storefront behavior remains pending a deploy and hosted acceptance. |
| Frontend | Existing Vercel `white-plate`, GitHub `main`, `https://white-plate.vercel.app`. The `e13860e` Production deployment is Ready and the custom domain is assigned. Production database/API variables are configured. Existing Preview configuration is retained; verify its isolation separately. |

## PostgreSQL initialization and credentials

Create a PostgreSQL resource in Coolify `whiteplate` / `production`, on the API's Docker network. Set database `whiteplate`, use the generated administrator credential, enable SSL before first start, and retain PostgreSQL 18's `/var/lib/postgresql` persistent mount. Never reset a volume to rerun initialization.

For an empty target, review and export EF SQL from the repository root with the restored SDK/toolchain:

```sh
dotnet ef migrations script --idempotent \
  --project apps/api/WhitePlate.Infrastructure \
  --startup-project apps/api/WhitePlate.Api \
  --output whiteplate-business-init.sql
```

The EF tooling needs an external `ConnectionStrings__WhitePlate` in Npgsql format even for offline generation; use inert local settings for that step. The 2026-10-05 bootstrap used official `dotnet-ef` 10.0.12 in a temporary tool directory. Better Auth SQL was compiled from the installed `auth.options`, a PostgreSQL dialect and an explicitly empty offline introspector; it made no database connection. The normal `npm run auth:generate` introspects its configured target, so never use inherited Neon credentials to generate a supposedly empty target. Review its target before generation or migration.

Install reviewed business SQL followed by auth SQL in a first-start Coolify initialization script. On an existing database, use reviewed incremental EF/Better Auth migrations with an operator account. The CLI owns schema `auth`; EF owns the business tables in `public`. Neither app auto-migrates. The generated auth schema uses `bigint` for `rateLimit.lastRequest`; the historical Neon CLI type warning does not prove the new deployment fails or succeeds.

Confirm from the database terminal, without printing credentials:

```sh
psql -U "$POSTGRES_USER" -d "$POSTGRES_DB" <<'SQL'
SELECT current_database();
SELECT table_schema, count(*) FROM information_schema.tables
WHERE table_schema IN ('public','auth') GROUP BY table_schema;
SELECT count(*) FROM "__EFMigrationsHistory";
SELECT count(*) FROM auth."user";
SELECT count(*) FROM "Organizations";
SELECT count(*) FROM "Tenants";
SELECT count(*) FROM "Orders";
SQL
```

The counts above are bootstrap evidence only: later application usage should create rows.

Before exposing a fresh database, review [the runtime-role bootstrap](postgresql-runtime-roles.sql) against the **new Coolify** database. It creates `whiteplate_api` and `whiteplate_auth` without LOGIN or passwords, removes inherited PUBLIC access and grants each role access only to its own schema. It is a one-time operator action and deliberately fails if the roles already exist. Neither role gets superuser, role creation, database creation or schema ownership. Keep migration privileges on the operator account. This script was applied to the hosted database on 2026-10-05; do not rerun it there. Reapply appropriate grants for new tables after reviewed migrations.

Set two distinct passwords interactively in the Coolify database terminal. The operator must enter, confirm and submit these credentials; do not paste them into chat, shell command text, SQL files or logs:

```sh
psql -U "$POSTGRES_USER" -d "$POSTGRES_DB" \
  -c '\password whiteplate_api' -c '\password whiteplate_auth'
```

After successful password entry, verify that both roles have SCRAM credentials without printing their hashes, then enable LOGIN if the roles still show `false`:

```sql
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM pg_roles
        WHERE rolname IN ('whiteplate_api', 'whiteplate_auth')
        GROUP BY true HAVING count(*) <> 2
    ) OR EXISTS (
        SELECT 1 FROM pg_authid
        WHERE rolname IN ('whiteplate_api', 'whiteplate_auth')
          AND rolpassword IS NULL
    ) THEN
        RAISE EXCEPTION 'Set passwords for both runtime roles before enabling login';
    END IF;
END $$;
ALTER ROLE whiteplate_api LOGIN;
ALTER ROLE whiteplate_auth LOGIN;
```

Apply through an operator-local `psql` session. Authenticated own-schema and cross-schema checks remain a cutover requirement; privilege inspection alone is not a successful application connection.

The existing volume's `/var/lib/postgresql/18/docker/pg_hba.conf` was backed up beside the original file with suffix `.before-whiteplate-access`. Before adding the API's observed IPv6 source, a second backup was made as `pg_hba.conf.before-api-ipv6-20261006-0059`. The following rules are active and were reloaded successfully (the original broad rules follow the terminal reject and are unreachable):

```text
local all postgres trust
local all all scram-sha-256
hostssl whiteplate whiteplate_api 10.0.1.0/24 scram-sha-256
hostssl whiteplate whiteplate_api fde4:75c5:b9d4::/64 scram-sha-256
hostssl whiteplate whiteplate_auth all scram-sha-256
host all all all reject
```

The current Coolify network is `10.0.1.0/24` over IPv4 and `fde4:75c5:b9d4::/64` over IPv6. PostgreSQL logs identified the API source as `fde4:75c5:b9d4::10`; without the IPv6 rule, `pg_hba.conf` rejected the API even though its IPv4 rule existed. Reinspect both address families if the Docker network changes. Coolify's public TCP proxy appears to PostgreSQL as `10.0.1.11`, so the subnet rules do **not** guarantee API-role exclusion from the public endpoint. Both roles require SCRAM and TLS and have separate bounded permissions. The PostgreSQL administrator is limited to the local operator socket. Review HBA persistence after volume recreation or PostgreSQL upgrades; retain operator access for migrations and backups.

## API settings

Build from GitHub `main`, Dockerfile strategy, base directory `/apps/api`, Dockerfile `/WhitePlate.Api/Dockerfile`. The Docker image listens on 8080 and includes `curl` for Coolify's HTTP healthcheck. Configure exposed/internal port **8080**, with no directly published API container port. Public traffic goes through the Coolify TLS proxy.

Use the existing assigned hostname:

```text
https://wqyrztj6uyuwlveq75qrl68t.204.168.231.15.sslip.io
```

Enable HTTP-to-HTTPS redirect and check DNS. Coolify currently warns that HTTPS with this temporary `sslip.io` hostname is not recommended because Let's Encrypt may rate-limit certificate validation. The current certificate verified successfully from the VPS, and the post-redeploy Vercel Better Auth probes succeeded, but certificate issuance or renewal may still be unreliable. Use a domain you control for stable external access. Never bypass a certificate warning; verify issuance from the actual client environment before connecting Vercel.

| Runtime variable | Value |
| --- | --- |
| `ASPNETCORE_ENVIRONMENT` | `Production` |
| `ASPNETCORE_HTTP_PORTS` | `8080` |
| `Authentication__Issuer` | `https://white-plate.vercel.app` |
| `Authentication__Audience` | `whiteplate-api` (must equal frontend `API_AUDIENCE`) |
| `Cors__AllowedOrigins__0` | `https://white-plate.vercel.app` |
| `HttpsRedirection__Enabled` | `false`, with public HTTPS/redirect enforced by Coolify |
| `Swagger__Enabled` | `true` for current development verification; reassess before production use |
| `ConnectionStrings__WhitePlate` | Npgsql key/value string using the internal resource hostname and dedicated API role |

Example shape, with placeholders only:

```text
Host=0uwdtjpwtqrokjcpnwe7wtfq;Port=5432;Database=whiteplate;Username=<api-role>;Password=<secret>;SSL Mode=VerifyFull;Root Certificate=/etc/ssl/certs/coolify-ca.crt
```

Copy Coolify's internal connection details into this Npgsql format. A `postgres://...` URI is for the Node client and must not be pasted into the API's Npgsql connection-string setting. Add a **Host File Mount** under Persistent Storage with source `/data/coolify/ssl/coolify-ca.crt` and destination `/etc/ssl/certs/coolify-ca.crt`. Keep the source readable by the API's non-root user (the deployed source file is mode `0644`) and do not mount the CA private key. Do not put `--mount` in Custom Docker options: Coolify only applies its documented allow-listed Docker options. The deployed container was checked and the public CA file was readable. Keep database credentials runtime-only, out of Docker build arguments and Preview. See [Coolify file mounts](https://coolify.io/docs/core/persistent-storage/storage-mounts/file-mounts) and [supported custom Docker options](https://coolify.io/docs/applications/builds/custom-docker-options).

Configure a Coolify HTTP healthcheck: GET `http://localhost:8080/health/ready`, expected 200. Readiness checks database connectivity; it does not prove schemas, role privileges, OAuth or business flows work. `/health/live` is dependency-free. On 2026-10-06, the main deployment passed the readiness probe and `GET /health/ready` returned `Healthy` over HTTPS when requested from the VPS with normal TLS verification; `GET /` returned HTTP 200. The browser verification tool could not open the temporary hostname (`ERR_BLOCKED_BY_CLIENT`), so independently recheck from Vercel or a user's browser before switching live traffic. Avoid blanket forwarded-header trust; the actual request Host still controls tenant resolution. Forwarded client-IP handling and limits need a separate trusted-proxy decision if required.

## Vercel Production settings

The frontend stays in `apps/frontend`, Node 24.x, using the lockfile. Switch only **Production** variables after the new API is healthy and a verified external database connection works. Preserve Preview and branch-specific variables, OAuth credentials, `BETTER_AUTH_SECRET`, Resend configuration and Better Auth Dashboard configuration.

| Variable | New Production value |
| --- | --- |
| `API_BASE_URL` | API HTTPS origin above, no credentials |
| `PUBLIC_API_BASE_URL` | Same HTTPS origin for browser `/hubs/orders` access; this value may reach browser code |
| `DATABASE_URL` | `postgresql://whiteplate_auth:<URL-encoded-secret>@204.168.231.15:5433/whiteplate`, **without** `ssl`, `sslmode`, `sslcert`, `sslkey` or `sslrootcert` query parameters |
| `DATABASE_SSL_CA` | Public Coolify CA PEM, multiline or literal `\n`; server-only |
| `BETTER_AUTH_URL` | Retain `https://white-plate.vercel.app` |
| `API_AUDIENCE` | `whiteplate-api` |

`DATABASE_SSL_CA` makes the installed `pg` client verify the certificate against the hostname or IP in `DATABASE_URL`. The helper explicitly binds Node's standard identity check to that host: `pg` omits SNI for IP endpoints and would otherwise verify `localhost`. Conflicting URL SSL parameters fail early because node-postgres would otherwise overwrite the CA configuration. Never set `rejectUnauthorized=false` or weaken global TLS validation.

Vercel cannot resolve a Coolify Docker-only hostname. The user explicitly approved exposing the VPS IP on port 5433, forwarded to the database's 5432 by Coolify. External TLS and rejection of plaintext/administrator connections passed. Runtime LOGIN is active, and the API role's database connectivity is confirmed by the healthy API readiness probe. Production `API_BASE_URL`, `PUBLIC_API_BASE_URL`, `DATABASE_SSL_CA`, and the auth-role `DATABASE_URL` are configured. The operator describes Production `DATABASE_URL` as Coolify PostgreSQL over verified TLS using `DATABASE_SSL_CA`, with the `whiteplate_auth` password URL-encoded in the URL; its Vercel variable description is `Coolify PostgreSQL over verified TLS using DATABASE_SSL_CA; replace placeholder with URL-encoded whiteplate_auth password.` The operator reports that Preview `DATABASE_URL` still targets the old Render database. These environment targets are operator-reported; do not copy database URLs or credentials into documentation. On 2026-10-06, the current `main` deployment (`e13860e`) was redeployed with the saved Production settings and reached **Ready**; `white-plate.vercel.app` is assigned to it. After the Coolify API redeploy, VPS requests to `GET /api/auth/ok` and `GET /api/auth/jwks` again returned HTTP 200; JWKS returned one public signing key. The earlier synthetic `POST /api/auth/sign-in/email` for `auth-db-probe@example.invalid` returned HTTP 401 with Better Auth's expected `User not found` warning; Vercel Logs showed zero Error/Fatal entries. The operator subsequently completed a real hosted email/password signup and verification, and the signed-in organization page returned one organization. The authenticated server-side frontend API client completed protected `GET /api/v1/me`; passing the organization ID as a restaurant tenant then produced the expected no-membership response. The operator then created the EUR acceptance restaurant through Vercel; the team page listed it, and the protected kitchen route displayed the owner role and empty-order state. This confirms hosted session/token issuance, API validation, restaurant provisioning, and owner membership access over the configured verified TLS connection. The operator reports that signed-out and alternate-account visits to that route both redirected to `/fr?error=invalid_code`, which completes the requested hosted access-denial acceptance. One account, organization and restaurant now exist in Coolify; no order has been created. Google/Microsoft OAuth and public restaurant storefront remain unverified. The local Chrome profile blocks Vercel (`ERR_BLOCKED_BY_CLIENT`) and local PowerShell failed its TLS handshake, so hosted connectivity probes were run from the VPS. Do not assume a host firewall protects a Docker-published port. If fixed Vercel egress addresses/private connectivity are available, restrict the ingress accordingly. Otherwise the approved password/TLS endpoint remains Internet-reachable and must be monitored.

After the Coolify redeploy, the refreshed Vercel Production request-log window from 2026-10-06 00:01 to 00:31 UTC showed 38 HTTP 200 responses, 13 HTTP 307 redirects, one HTTP 401, and one HTTP 404; the status filter showed no HTTP 503, with zero runtime Error/Fatal entries. Together with the passing API readiness check, the reported 503 was not reproduced in this window. A 503 still seen by a client needs its exact URL and timestamp (or request ID) to identify the layer generating it; this time-bounded log sample does not establish behavior outside the window.

Redeploy Vercel after settings change; existing deployments retain their previous variables. Hosted signup, email verification, organization listing, protected `/api/v1/me`, restaurant creation, owner kitchen access, and the operator-reported signed-out/alternate-account redirect to `/fr?error=invalid_code` are accepted. Preview's old Render database target is also operator-reported; full Preview environment isolation remains to be reviewed. Old browser sessions refer to the discarded auth database and may require signing out. Hosted SignalR delivery, actual token expiry and reconnect remain on the existing SignalR card. Public storefront acceptance still needs matching tenant wildcard DNS/TLS; do not invent tenant domains under the shared Vercel domain.

## Rollback and operations

Keep Neon and the old Render resource until the new path is accepted. Before the first new write, restoring saved old Vercel variable values and redeploying can restore the old connection topology. After new writes, old Neon and new Coolify diverge: an application-image rollback does not move records or undo migrations. Decide the authoritative data source and export/restore procedure before changing database targets again. As of 2026-10-08, Coolify reports zero scheduled backups; the additive `PublicOrderTracking` migration was applied with zero order rows, but automated backup retention and a restore drill remain operational work.

Schedule encrypted off-VPS backups with retention, then restore into a separate disposable database and verify both schemas. A local volume or a backup-success notification is not a restore test. Record monitoring/alerts, TLS expiry/CA renewal, secret rotation, and any required durable Data Protection storage on the existing operations work. A dedicated dev environment is deferred until its need and isolation are agreed.

Official references: [Coolify PostgreSQL](https://coolify.io/docs/databases/postgresql), [SSL and CA mounting](https://coolify.io/docs/databases/ssl), [backups](https://coolify.io/docs/databases/backups), and [node-postgres SSL precedence](https://node-postgres.com/features/ssl).
