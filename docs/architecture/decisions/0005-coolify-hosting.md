# Decision 0005: Coolify API and PostgreSQL hosting

- Date: 2026-10-05
- Status: Accepted by the user; migration in progress in issue #17

## Context and choice

WhitePlate is still in development. The user already connected the Coolify `whiteplate` project's API to GitHub `main` and asked to replace Render and the hosted application database. The existing frontend stays on Vercel at `https://white-plate.vercel.app`.

Use one hosted development stack: Vercel frontend, Coolify API and a persistent Coolify PostgreSQL database. The platform environment labels `Production` and `production` do not establish production readiness. Start with an empty database containing both the EF business schema and the separately owned Better Auth `auth` schema. The user explicitly declined importing existing accounts, organizations, restaurants or orders. Preserve the existing Neon branches and local test configuration.

Do not create a `dev` branch, second backend, second database or second frontend now. Existing local acceptance runs use Neon `test`; Vercel Preview must retain separate configuration and must never inherit the new main database credentials. Reconsider a dedicated dev stack when stable users/data, parallel integration work or destructive experiments require it.

## Boundaries and consequences

- The API connects through Coolify's private Docker network. Vercel needs a separately reachable PostgreSQL connection with TLS and certificate verification. Provision dedicated runtime roles for business and auth tables; keep the database administrator out of application settings.
- Coolify owns public HTTPS and HTTP-to-HTTPS redirects. `HttpsRedirection__Enabled=false` delegates redirects to that proxy; it does not authorize public HTTP access. Do not trust arbitrary forwarded host/client-IP headers. Exact frontend CORS remains required for the browser SignalR connection.
- EF and Better Auth migrations remain explicit operator actions, never application startup actions. First-start SQL only initializes an empty PostgreSQL volume; it is not a repeatable rollout mechanism for an existing volume.
- The shared hosted API origin supports authenticated organization flows. Public tenant storefront DNS/TLS requires a separate matching wildcard domain and remains open; `white-plate.vercel.app` is not that wildcard.
- The API, auth database and Vercel deployment work together for readiness, Better Auth user lookup, JWKS storage, hosted signup/email verification, organization listing, an authenticated protected `GET /api/v1/me` call, restaurant creation, and owner access to the new restaurant's kitchen page over verified TLS. Keep the migration card open until second-account denial is verified; backups, restore drills, monitoring and hosted SignalR acceptance remain tracked work.

## Alternatives

Keeping Render/Neon as the application host conflicts with the requested migration. Adding a second dev stack now adds VPS cost and secret/schema drift before there is a stable production workload. Moving the frontend to Coolify would expand scope and is not needed for this migration.

## References

- [Deployment runbook](../../deployment/coolify.md)
- [Development guide](../../development.md)
- [Database ownership](../../database/database-schema.md)
- [Migration issue #17](https://github.com/whritou/WhitePlate/issues/17)
