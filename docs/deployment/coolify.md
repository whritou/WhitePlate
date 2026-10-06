# Coolify and Vercel deployment

This is the runbook for the user-approved, single hosted development stack ([decision 0005](../architecture/decisions/0005-coolify-hosting.md)). Runtime credentials belong in Coolify/Vercel settings, never this file, client code or `NEXT_PUBLIC_*` variables. The migration is tracked in [issue #17](https://github.com/whritou/WhitePlate/issues/17).

## Current verified state — 2026-10-06

| Component | Evidence and remaining work |
| --- | --- |
| PostgreSQL | Coolify resource `whiteplate-postgresql-main` (`0uwdtjpwtqrokjcpnwe7wtfq`), `postgres:18-alpine`, database `whiteplate`, Docker network `coolify`. Running/healthy with a persistent volume and SSL enabled. User-approved public TCP proxy on `204.168.231.15:5433` is active. |
| Schemas | Reviewed empty-target EF SQL plus SQL from the installed Better Auth configuration initialized the new volume. Bootstrap queries confirmed 9 EF migrations, 16 `public` tables, and 6 `auth` tables with no users or business records. The Vercel JWKS probe initialized one required signing-key record. Since then, the operator created and verified one hosted account, one organization and one acceptance restaurant. No order was created. No Neon data was imported or changed. |
| Database TLS | External PostgreSQL SSL negotiation passed with TLS 1.3, trusted Coolify CA and IP identity verification. Certificate expires 2027-10-05. The API readiness probe and Vercel Better Auth user/JWKS probes both succeeded with their configured TLS connections. |
| Database access | Runtime-role SQL is applied; both least-privilege roles have LOGIN enabled. Schema/table privilege queries confirm own-schema access and cross-schema denial. HBA rules require TLS/SCRAM, allow the API's observed IPv4 and IPv6 Coolify subnets, and reject other TCP connections. Plaintext and administrator TCP refusals were verified through the public proxy. |
| API | Existing resource `wqyrztj6uyuwlveq75qrl68t` is deployed from `main` at `e13860e`. After saving the eight pending Coolify configuration changes, the manual redeploy at 2026-10-06 00:20 UTC succeeded in 21 seconds; its container passed the `/health/ready` healthcheck and Coolify reports Running. The pending-changes banner cleared. An immediate VPS request to `/health/ready` returned HTTP 200 `Healthy` with normal certificate verification. **This deployment predates merge `8a2f835` (PR #26), which added the owner-protected team-member and invitation-list API routes. Redeploy the API from `main` before accepting the hosted team page; the current database already includes all nine EF migrations, so this symptom does not call for a schema migration.** |
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

Keep Neon and the old Render resource until the new path is accepted. Before the first new write, restoring saved old Vercel variable values and redeploying can restore the old connection topology. After new writes, old Neon and new Coolify diverge: an application-image rollback does not move records or undo migrations. Decide the authoritative data source and export/restore procedure before changing database targets again.

Schedule encrypted off-VPS backups with retention, then restore into a separate disposable database and verify both schemas. A local volume or a backup-success notification is not a restore test. Record monitoring/alerts, TLS expiry/CA renewal, secret rotation, and any required durable Data Protection storage on the existing operations work. A dedicated dev environment is deferred until its need and isolation are agreed.

Official references: [Coolify PostgreSQL](https://coolify.io/docs/databases/postgresql), [SSL and CA mounting](https://coolify.io/docs/databases/ssl), [backups](https://coolify.io/docs/databases/backups), and [node-postgres SSL precedence](https://node-postgres.com/features/ssl).
