# Decision 0002: Better Auth and server-side API tokens

- Date: 2026-09-29
- Status: Accepted
- Scope: Web account authentication, organization onboarding, staff invitations, and API authentication

## Context

WhitePlate has persisted organization ownership and restaurant memberships in its .NET API. It needs account signup, password recovery, Google and Microsoft sign-in, verified-email organization onboarding, and staff invitations. The API must continue to authorize using its persisted issuer/subject memberships, and browser JavaScript must not receive a bearer token that can call protected API endpoints.

## Decision

- Use Better Auth in the Next.js server for email/password, Google OAuth, Microsoft OAuth, email verification, password reset, sessions, and RS256 API JWT issuance.
- Use Resend for verification, reset, and staff invitation mail.
- Keep the organization, restaurant, and staff-role model in the .NET business database. Do not adopt Better Auth's organization plugin as a second source of authorization truth.
- Store Better Auth's generated PostgreSQL tables in a separate `auth` schema managed by Better Auth CLI. EF Core owns only the business schema.
- Keep the Better Auth session in an HttpOnly cookie. Next.js server actions validate the session, obtain a short-lived API JWT, and call the .NET API server-to-server. Do not expose API tokens to client-side JavaScript.
- Issue RS256 JWTs with the user's ID as `sub`, verified email claims, a 15-minute expiry, and a 30-day JWKS rotation/grace interval. The API discovers metadata/JWKS from the configured issuer and validates both issuer and audience.
- Allow organization creation only for an authenticated, email-verified identity. Bind each staff invitation to a normalized intended email and require the accepted JWT's email to be verified and match.
- Require provider and mail credentials in production; use generic recovery responses and server-side route rate limits.

## Alternatives considered

- Use an external hosted identity provider: rejected for this feature because Better Auth is already in the frontend and directly supports the approved provider and account flows.
- Store passwords and sessions in the .NET API: rejected because it duplicates identity infrastructure and expands the API's credential handling.
- Use Better Auth's organization plugin for restaurant membership: rejected because the API already owns tenant roles and enforces them on every protected operation.
- Send API bearer tokens to browser code: rejected because the server-side BFF can preserve the session boundary without making tokens accessible to client scripts.

## Consequences and deployment status

The frontend, API validation, and API contracts are wired in source. On 2026-09-29, all seven EF migrations and Better Auth's generated schema were applied to Neon `test`; the email/password signup and invitation acceptance path was exercised against that database with local email interception. Neither migration runs at application startup. On 2026-10-06, Vercel Production successfully queried Better Auth for a synthetic nonexistent email and returned the expected `401 User not found`; its JWKS endpoint returned HTTP 200 and initialized one persisted signing key in the Coolify auth database. The operator subsequently completed one hosted email/password signup and email verification, created one organization and one restaurant, and opened the restaurant's owner-protected kitchen page. Its authenticated Vercel session also completed protected `GET /api/v1/me` over the configured TLS connection. This verifies token issuance, API validation, and owner membership lookup for that identity; no order was created. The operator reports that signed-out and alternate-account visits to the protected restaurant route redirected to `/fr?error=invalid_code`; accept this frontend access-denial behavior without repeating the check. Google/Microsoft OAuth and hosted SignalR remain outstanding. The Better Auth CLI has reported a `rateLimit.lastRequest` type difference (`int8` in PostgreSQL versus `number` expected) on Neon `test`; review its effect during the remaining auth acceptance before treating the production flow as complete.

See [API contracts](../../api/api-contracts.md), [database schema](../../database/database-schema.md), [tenant security](../tenancy-and-security.md), and [local setup](../../development.md#authentication-configuration).
