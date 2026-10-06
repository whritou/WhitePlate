# Tenant isolation and security boundaries

Status: Better Auth RS256 JWT bearer validation, persisted organization/tenant ownership, owner and restaurant memberships, verified-email organization signup, recipient-bound invitation acceptance, public host resolution, manager catalog/discount management, order authorization/rate limiting, and tenant-scoped SignalR/outbox delivery are wired in source. Both schemas are migrated on Neon `test` and Coolify Production. Local acceptance covers email/password signup/invitation, owner/manager/kitchen permissions, two-tenant denial, REST revocation recovery, and live outbox/reconnect behavior. Vercel-to-Coolify protected API access over verified TLS is hosted and verified. Google/Microsoft/real Resend provider checks, hosted hub URL/CORS/TLS and token-expiry, public tenant DNS/TLS, Preview isolation, and production operations remain open.

## Implemented foundation

`[RequireTenant]` endpoints resolve one subdomain under `Tenancy:BaseDomain` after routing. The registry query filters both normalized subdomain and active status, without tracking. Invalid, nested, foreign-domain, unknown and inactive hosts receive the same 404; there is no fallback. Middleware populates a request-scoped context exactly once. Public metadata/error responses are not cached.

`X-Tenant-Id`, `X-Tenant-Subdomain`, and `X-Forwarded-Host` do not influence resolution. Changing the actual Host can select another public tenant, which is intentional and grants no private access. Protected operations separately validate persisted restaurant membership and role; owner/manager/kitchen, foreign-tenant denial, and REST revocation behavior have local browser acceptance. Tenant creation is an authenticated owner operation or a local operator command; there are no anonymous administration or registry-list routes. Two-tenant HTTP tests verify selection, request-scope separation, inactive tenants and spoofed headers.

Catalog and order rows are tenant-owned and use same-tenant composite foreign keys; idempotency and outbox rows reference their tenant. Reads, writes, archive operations, and relationship assignments explicitly scope the tenant. Role checks use the validated issuer/subject. `CatalogLocalization` and `LocalizedOrderSnapshots` are applied to Neon `test` and Coolify Production. Vercel's server-side BFF reaches the Coolify API over verified TLS; public tenant DNS/TLS and hosted SignalR URL/CORS/TLS are not yet verified. Custom domains are deferred.

## Tenant resolution is not authorization

A public storefront needs a restaurant identity to select branding and catalog data. A staff operation additionally needs authenticated membership and permission for that restaurant. A tenant slug, ID, hostname, or `X-Tenant-Subdomain` header supplied by a browser cannot grant that permission.

The API currently uses a public restaurant subdomain to select tenant metadata/catalog/checkout. Protected catalog and staff-order routes use a tenant ID as a resource selector and separately check persisted membership. They do not need a tenant header or a public restaurant host. The deployed frontend BFF calls the Coolify API server-side; public storefront routing uses the validated one-label tenant host. Deployment-specific requirements still to verify are:

1. Configure public wildcard DNS/TLS and verify unknown, inactive, nested, and reserved tenant-host behavior through the deployed proxy.
2. Trust forwarded host/protocol headers only from configured proxies. The BFF must replace client tenant headers rather than blindly forward them; the API authenticates callers independently.
3. Resolve a server-side tenant context for public tenant requests and reject missing/ambiguous tenant context. Never fall back to the first tenant or an unscoped query.
4. Keep protected operations authenticated and authorize role/membership separately. If host and identity tenant disagree, reject the request.

The current `AllowedHosts: "*"` remains broad; the tenant route performs its own exact base-domain check. The locale-only Next Proxy performs no tenancy/authentication. Frontend route guards and redirects cannot protect the API.

## Data access

Every future tenant-owned record needs an explicit tenant association. Scope lookups, counts, joins, exports, updates, deletes, and inserts. Assign tenant identity server-side and validate relationships with composite tenant foreign keys where applicable.

EF query filters may help scope reads but can be disabled; they do not replace write ownership checks, constrained relationships, or authorization. Raw SQL and privileged/background operations need explicit scoping and tests. See [Microsoft's filter documentation](https://learn.microsoft.com/en-us/ef/core/querying/filters) and the [schema proposal](../database/database-schema.md).

Background jobs must carry a validated tenant context. Elevated cross-tenant maintenance needs a separate, explicit authorization path; do not add a request-controlled “ignore tenant” switch. Unknown or foreign-tenant resource IDs should not reveal another tenant's data or existence.

## Caches, browser state, and real-time delivery

- Include tenant identity in relevant server/client cache keys; include locale where it changes the response. Cache invalidation must have the same scope.
- Keep personalized staff responses out of shared public caches. A different URL alone is not a complete cache-isolation design.
- The guest cart uses component memory keyed by tenant ID and clears on reload/navigation. The BFF derives its public API target from validated Host and fixed configuration, never from browser tenant IDs. The API revalidates products/options and prices. The remote-address limiter can group guests behind the same BFF into one tenant bucket; untrusted forwarded addresses are not used to bypass it.
- Authenticate SignalR connections and resolve allowed groups from current membership on the server. `JoinRestaurant(tenantId)` accepts an ID selector, checks membership, then derives the group name; a client-chosen group name is never permission to subscribe.
- Recheck persisted owner/manager/kitchen access before each connection receives an event. Remove revoked subscriptions and groups; database authorization failures must trigger outbox retry rather than bypass authorization. Leave/disconnect invalidates captured recipients. The in-memory registry assumes one API instance; horizontal scaling needs shared subscription and publication coordination.
- Close authenticated hub connections at token expiration, acquire a fresh token on reconnect, then reauthorize the restaurant and recover authorized REST state. Already queued events cannot be recalled after a revocation.
- Do not broadcast order data globally. Revalidate authorization across reconnect/token refresh and resynchronize from an authorized API after missed events.
- Define durable notification/retry behavior and ensure publishing occurs after the order transaction commits.

## Authentication and operational decisions

Better Auth issues short-lived RS256 JWTs. The API validates discovery/JWKS from `Authentication:Issuer` and the configured `Authentication:Audience`; production fails closed when either setting is missing. The Next.js server exchanges a valid Better Auth session for API tokens and keeps them server-side. Browser session cookies use same-origin server actions for protected work. Role permissions come from persisted memberships; browser-supplied tenant identity never grants access. Email-bound invitations require a verified JWT email that matches the normalized intended recipient. Coolify's business/auth schemas are applied and Vercel-to-Coolify protected access is verified over TLS. Configured Google/Microsoft and broader Resend delivery, hosted SignalR URL/CORS/TLS and token-expiry checks, and production backup/restore/monitoring remain open. Public checkout enforces a 16 KiB body cap, validation bounds, per-tenant/client rate limits, and 24-hour idempotency.

Keep secrets on the server, avoid logging tokens/customer payloads, and define order/customer retention. Production needs TLS, trusted proxy configuration, and error responses without diagnostic internals. These are requirements to implement when the corresponding services exist, not claims about the scaffold.

## Verification requirement

Automated tests use two tenants with distinct staff and data. They exercise foreign IDs, spoofed headers, relationship assignments, public tenant reads, catalog writes/archives, order reads/status changes, checkout idempotency, hub negotiation, verified email, invitation email binding, and authorized subscription checks. Neon `test` browser acceptance records the role matrix, cross-tenant denial, dashboard revocation recovery, and live outbox retry/delivery/reconnect. Verify both response and persisted state: an error response alone does not prove that a forbidden write was not applied. Hosted OAuth/email callbacks, public tenant DNS/TLS, browser-reachable hub configuration, token-expiration renewal, and production operations still need end-to-end verification.

See the [functional test plan](../functional-test-plan.md), [API contract](../api/api-contracts.md), and [open decisions](../development-roadmap.md).
