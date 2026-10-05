# Coolify and Vercel deployment

This is the runbook for the user-approved, single hosted development stack ([decision 0005](../architecture/decisions/0005-coolify-hosting.md)). Runtime credentials belong in Coolify/Vercel settings, never this file, client code or `NEXT_PUBLIC_*` variables. The migration is tracked in [issue #17](https://github.com/whritou/WhitePlate/issues/17).

## Current verified state — 2026-10-05

| Component | Evidence and remaining work |
| --- | --- |
| PostgreSQL | Coolify resource `whiteplate-postgresql-main` (`0uwdtjpwtqrokjcpnwe7wtfq`), `postgres:18-alpine`, database `whiteplate`, Docker network `coolify`. Running/healthy with a persistent volume and SSL enabled. Public access remains private pending approval. |
| Schemas | Reviewed empty-target EF SQL plus SQL from the installed Better Auth configuration initialized the new volume. Queries confirmed 9 EF migrations, 16 `public` tables, 6 `auth` tables and zero users/organizations/restaurants/orders. No Neon data was imported or changed. |
| Database TLS | Server certificate signed by the Coolify CA; signature verified and SANs cover the resource hostname and `204.168.231.15`. Expires 2027-10-05. This verifies the certificate files, not a live connection from Vercel. |
| API | Existing resource `wqyrztj6uyuwlveq75qrl68t` still needs database credentials and deployment of the task branch changes. Port 8080, HTTPS domain/redirect, issuer/audience, exact CORS and readiness probe are configured. Last running container was restarting; no successful hosted API/auth acceptance is claimed. |
| Frontend | Existing Vercel `white-plate`, GitHub `main`, `https://white-plate.vercel.app`. Production variables and deployment are not switched until the new API/database connection passes. Existing Preview configuration is retained. |

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

Before exposing the database, review [the runtime-role bootstrap](postgresql-runtime-roles.sql) against the **new Coolify** database. It creates `whiteplate_api` and `whiteplate_auth` without LOGIN or passwords, removes inherited PUBLIC access and grants each role access only to its own schema. It is a one-time operator action and deliberately fails if the roles already exist. Neither role gets superuser, role creation, database creation or schema ownership. Keep migration privileges on the operator account. Set passwords interactively with `psql`'s `\password`, without putting them in shell history, SQL files or logs, then enable LOGIN. Reapply appropriate grants for new tables after reviewed migrations. Verify both positive access and denial of the other schema. This script is prepared but has not been applied to the hosted database.

## API settings

Build from GitHub `main`, Dockerfile strategy, base directory `/apps/api`, Dockerfile `/WhitePlate.Api/Dockerfile`. The Docker image listens on 8080 and includes `curl` for Coolify's HTTP healthcheck. Configure exposed/internal port **8080**, with no directly published API container port. Public traffic goes through the Coolify TLS proxy.

Use the existing assigned hostname:

```text
https://wqyrztj6uyuwlveq75qrl68t.204.168.231.15.sslip.io
```

Enable HTTP-to-HTTPS redirect and check DNS. Do not bypass a certificate warning: verify issuance before connecting Vercel.

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

Copy Coolify's internal connection details into this Npgsql format. A `postgres://...` URI is for the Node client and must not be pasted into the API's Npgsql connection-string setting. Mount the public CA file read-only from `/data/coolify/ssl/coolify-ca.crt` to `/etc/ssl/certs/coolify-ca.crt`; do not mount the CA private key. The API's Custom Docker options now contain `--mount type=bind,source=/data/coolify/ssl/coolify-ca.crt,target=/etc/ssl/certs/coolify-ca.crt,readonly`; verify the resulting mount after deployment. Keep database credentials runtime-only, out of Docker build arguments and Preview.

Configure a Coolify HTTP healthcheck: GET `http://localhost:8080/health/ready`, expected 200. Readiness checks database connectivity; it does not prove schemas, role privileges, OAuth or business flows work. `/health/live` is dependency-free. Verify both endpoints through the public HTTPS origin after deploying the reviewed changes. Avoid blanket forwarded-header trust; the actual request Host still controls tenant resolution. Forwarded client-IP handling and limits need a separate trusted-proxy decision if required.

## Vercel Production settings

The frontend stays in `apps/frontend`, Node 24.x, using the lockfile. Switch only **Production** variables after the new API is healthy and a verified external database connection works. Preserve Preview and branch-specific variables, OAuth credentials, `BETTER_AUTH_SECRET`, Resend configuration and Better Auth Dashboard configuration.

| Variable | New Production value |
| --- | --- |
| `API_BASE_URL` | API HTTPS origin above, no credentials |
| `PUBLIC_API_BASE_URL` | Same HTTPS origin for browser `/hubs/orders` access; this value may reach browser code |
| `DATABASE_URL` | `postgresql://<auth-role>:<URL-encoded-secret>@204.168.231.15:<approved-public-port>/whiteplate`, **without** `ssl`, `sslmode`, `sslcert`, `sslkey` or `sslrootcert` query parameters |
| `DATABASE_SSL_CA` | Public Coolify CA PEM, multiline or literal `\n`; server-only |
| `BETTER_AUTH_URL` | Retain `https://white-plate.vercel.app` |
| `API_AUDIENCE` | `whiteplate-api` |

`DATABASE_SSL_CA` makes the installed `pg` client verify the certificate and hostname. Conflicting URL SSL parameters fail early because node-postgres would otherwise overwrite the CA configuration. Never set `rejectUnauthorized=false` or weaken global TLS validation.

Vercel cannot resolve a Coolify Docker-only hostname. The proposed external endpoint is the VPS IP on port 5433, forwarded to the database's 5432 by Coolify. Public exposure requires explicit approval at the action; protect it with password authentication, TLS and bounded roles, and inspect host/provider firewall behavior. Do not assume a host firewall protects a Docker-published port. If fixed Vercel egress addresses/private connectivity are available, restrict the ingress accordingly. Otherwise the approved password/TLS endpoint remains Internet-reachable and must be monitored. Do not enable exposure or switch database variables while access/TLS is unverified.

Redeploy Vercel after settings change; existing deployments retain their previous variables. Verify discovery/JWKS, signup/sign-in and protected `/api/v1/me`, then organization/restaurant creation and a second-account denial. Old browser sessions refer to the discarded auth database and may require signing out. Hosted SignalR delivery, actual token expiry and reconnect remain on the existing SignalR card. Public storefront acceptance still needs matching tenant wildcard DNS/TLS; do not invent tenant domains under the shared Vercel domain.

## Rollback and operations

Keep Neon and the old Render resource until the new path is accepted. Before the first new write, restoring saved old Vercel variable values and redeploying can restore the old connection topology. After new writes, old Neon and new Coolify diverge: an application-image rollback does not move records or undo migrations. Decide the authoritative data source and export/restore procedure before changing database targets again.

Schedule encrypted off-VPS backups with retention, then restore into a separate disposable database and verify both schemas. A local volume or a backup-success notification is not a restore test. Record monitoring/alerts, TLS expiry/CA renewal, secret rotation, and any required durable Data Protection storage on the existing operations work. A dedicated dev environment is deferred until its need and isolation are agreed.

Official references: [Coolify PostgreSQL](https://coolify.io/docs/databases/postgresql), [SSL and CA mounting](https://coolify.io/docs/databases/ssl), [backups](https://coolify.io/docs/databases/backups), and [node-postgres SSL precedence](https://node-postgres.com/features/ssl).
