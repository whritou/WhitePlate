# WhitePlate authentication system design

**Status:** Conversational design approved on 2026-09-29; awaiting written spec review before implementation.

## Intent and scope

Provide a complete, localized account and organization-onboarding path for WhitePlate while retaining the existing .NET API as the authority for organization ownership, restaurant memberships, roles, invitations, and tenant access.

The authentication methods are email/password, Google, and Microsoft Entra ID through Better Auth. Resend sends account-verification, password-reset, and staff-invitation email. The UI uses the existing shadcn preset and has matching English and French messages.

Included routes and interactions:

- Sign in and sign out.
- Email/password sign up and email verification.
- Google and Microsoft sign in/sign up.
- Forgot-password request and reset-password completion.
- Organization signup that creates the authenticated user’s first owner membership.
- Owner-managed staff invitations for organization owners, restaurant managers, and kitchen staff; invitation acceptance supports new and existing accounts.
- Server-side authentication/session integration with protected API requests.

Restaurant creation and the wider authenticated catalog/order dashboard remain separate feature work already represented on the project board. No Better Auth organization or member database is introduced: the existing WhitePlate organization/membership schema remains authoritative.

## Existing implementation and conflicts

- `apps/api` validates bearer tokens using configured `Authentication:Authority` and `Authentication:Audience`. Its `ICurrentIdentity` abstraction maps validated `iss` and `sub` claims to the persisted owner and restaurant memberships.
- The API has operator-only first-organization provisioning, protected organization management, hashed seven-day single-use staff invitations, and protected invitation acceptance. It does not have anonymous/self-service organization creation.
- Existing staff invitations are not bound to an email address. Acceptance currently associates the token bearer’s issuer/subject with the role and scope in the invitation.
- The frontend has no authentication routes or API integration. The checked-in draft `apps/frontend/lib/auth.ts` configures only `dash()` from `@better-auth/infra`; the frontend manifest does not include Better Auth core.
- Current documentation explicitly excludes public organization signup and describes an unselected external OIDC provider. This design supersedes those statements once implementation is reviewed and approved.
- The existing Ready card, “Build authenticated staff dashboard for catalog and kitchen orders,” mentions OIDC sign-in. Its auth scope must be updated to this design; its dashboard scope remains.

## Decisions

### Authentication and session ownership

Better Auth owns authentication accounts, credentials, OAuth connections, verification records, and browser sessions. Store these tables in a PostgreSQL `auth` schema on the existing PostgreSQL service, separate from EF-managed application tables. Better Auth migrations remain owned by its CLI; EF migrations must not manage auth tables.

The Next.js `/api/auth/[...all]` route mounts Better Auth. Browser sessions use Better Auth’s secure, HTTP-only cookies. Server actions/route handlers perform authenticated API calls: they read the user session, obtain a Better Auth JWT for the API, and send it to .NET in the `Authorization` header. Do not place API bearer tokens in local storage or expose OAuth client secrets, database credentials, Resend keys, or Better Auth secrets in client code.

Use Better Auth’s JWT plugin as the service-token bridge. Set a stable HTTPS issuer and API audience, retain Better Auth user ID as `sub`, use a short expiration (15 minutes), and include only the identity fields the API requires: verified-email address and verification state. Use RS256 signing for compatibility with the API’s existing ASP.NET Core JWT bearer stack. Rotate signing keys on a 30-day schedule with a 30-day grace period. The .NET API validates signature against Better Auth’s JWKS endpoint, plus issuer, audience, expiry, and signing key ID; it does not trust role or tenant claims from the JWT. Membership repositories remain the permission source. Key refresh must handle rotation/new `kid` values.

### Email/password and social sign-in

Enable Better Auth email/password. Require email verification before a new password account receives an authenticated session. Password reset uses a one-hour single-use reset token, a localized reset link delivered by Resend, and revokes other active sessions when the password changes. Responses for unknown and known emails should not disclose account existence.

Configure Google and Microsoft as Better Auth social providers. Provider client IDs and secrets are server-side environment variables, and provider callback URLs use the default `/api/auth/callback/{provider}` path for each environment.

- Google sign-in requires a verified provider email. Better Auth may link a returning social account to an existing account only when the provider proves the same email; do not force-link based on a typed email.
- Microsoft uses the standard Entra authority with a configurable tenant ID defaulting to `common`, so personal and work/school accounts can be supported. Microsoft’s `email` claim is treated as contact data, not proof of identity. Require Better Auth email verification through Resend before issuing a session to an account whose Microsoft email is unverified. Do not list Microsoft as a trusted provider for implicit email-based account linking. Entra app setup must return an email claim for routable contact; missing email prevents the email-verification and invitation flows.
- The API identity remains the Better Auth JWT issuer and stable Better Auth `sub`, independent of whether the account authenticated with password, Google, or Microsoft. Never derive WhitePlate authorization from provider email, Google/Microsoft roles, or browser-supplied tenant data.

### Organization signup

The user first completes and verifies an email/password or social account. A localized organization signup page then collects the organization name and sends an authenticated request to a new `POST /api/v1/organizations` API route. The API creates the organization and its `OrganizationOwnerMembership` atomically for the validated `iss`/`sub`. Organization creation requires a verified email claim. The existing owner-scoped organization listing and later restaurant-creation operation remain in use.

The API endpoint is authenticated, despite being a signup route in the UI. It is not an anonymous provisioning endpoint. The existing operator command remains available for controlled administration/migration use.

### Staff invitations

The owner invitation form collects the recipient email, role, and, for restaurant-scoped roles, restaurant. The current authorization rule stays: only an organization owner can create/revoke invitations. The API normalizes and stores the intended recipient email with its existing hashed token, organization/tenant scope, role, expiry, revocation, and acceptance state. A reviewed incremental migration adds the email field; production schema is not changed by application startup.

The Next.js server action calls the protected API invitation endpoint, constructs a locale-aware acceptance URL containing the opaque one-time invitation token, and sends it through Resend. Raw tokens are not persisted or logged; the browser receives a success/error result rather than the API token. The API token remains single-use and expires after seven days. If Resend fails, the server action revokes the just-created invitation using its returned ID before reporting a retryable error. A later retry creates a fresh invitation. Listing/resending existing invitations is not in this slice.

The invitee may create an account or sign in with any supported provider, verify the same email address that received the invitation, then accept it. API acceptance checks that the validated JWT contains an email marked verified and that its normalized address matches the invitation’s stored email before adding the persisted owner/restaurant membership. A mismatched, expired, revoked, already-used, or unverified invitation receives the existing opaque not-found behavior. Invitee signup does not silently change the organization or role encoded by the API.

### Frontend routes and visual treatment

Use the app’s existing localized route layout under `apps/frontend/app/[locale]/` and the configured `base-lyra` shadcn preset. The auth callback handler stays at unlocalized `/api/auth/...` as required by Better Auth. Proposed user-facing paths:

| Path | Purpose |
| --- | --- |
| `/{locale}/sign-in` | Email/password, Google, and Microsoft sign-in |
| `/{locale}/sign-up` | Name/email/password and Google/Microsoft signup |
| `/{locale}/forgot-password` | Request a reset email |
| `/{locale}/reset-password` | Complete reset from a time-limited link |
| `/{locale}/verify-email` | Verification pending/success/expired states |
| `/{locale}/organization/sign-up` | Create an organization for the verified signed-in user |
| `/{locale}/invitations/accept` | Sign in/sign up as needed and accept the token for the invited email |
| `/{locale}/organization/team` | Owner selects invite email, restaurant scope, and role, then sends an invitation |

Use shadcn components already configured by the project, add focused components under `components/`, and provide the same visible messages, validation, loading, error, success, and empty states in `messages/en.json` and `messages/fr.json`. Auth UI and its route guards are not substitutes for API authorization.

## Required contracts and configuration

Frontend server configuration (names are proposed; document exact final names in implementation):

- `BETTER_AUTH_SECRET`, `BETTER_AUTH_URL`, and PostgreSQL `DATABASE_URL`.
- `API_BASE_URL` and expected API audience/issuer settings.
- `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `MICROSOFT_CLIENT_ID`, `MICROSOFT_CLIENT_SECRET`, and optional `MICROSOFT_TENANT_ID`.
- `RESEND_API_KEY` and a verified `RESEND_FROM_EMAIL`.

Document local and hosted redirect URIs for Google and Entra. Missing OAuth credentials may disable provider buttons in development, but production must fail configuration validation rather than silently present a nonfunctional provider. Production additionally needs HTTPS, a verified Resend sender/domain, durable PostgreSQL storage, secret management, and reviewed auth/API migrations.

API changes:

- Replace the current external-issuer-only configuration with explicit Better Auth JWKS URI, issuer, and audience validation settings. Keep the test authentication scheme isolated to tests.
- Add authenticated `POST /api/v1/organizations` with a name request and the same typed result/error conventions; create organization plus first owner in one database operation.
- Extend staff invitation creation with recipient email. Persist a normalized, bounded recipient address and preserve one-time token hashing and seven-day expiry.
- Extend the validated principal abstraction to expose verified email to application use cases without trusting request DTO claims. Invitation acceptance requires that verified identity and matching email.
- Preserve all existing role mappings and owner/manager/kitchen authorization behavior.
- Update OpenAPI, API contracts, database schema docs, security and tenancy docs, development configuration, functional auth scenarios, and the roadmap’s identity decision. Do not call auth active until route wiring and tests establish it.

## Security, privacy, and failure behavior

- Better Auth issues JWTs only for verified-email users; the API independently validates signature, issuer, audience, and lifetime.
- Organization and staff privileges come only from persisted API memberships. Auth UI, social claims, submitted organization IDs, and tenant IDs do not authorize access.
- Invitations bind to a verified normalized email as well as the hashed single-use token. Never put recipient email, token, password, OAuth code, or session credentials in logs or analytics.
- Keep API bearer traffic server-side in Next handlers/actions. Protect state-changing server actions against CSRF/origin abuse, validate `Origin`/trusted origins, and use secure cookie settings in HTTPS deployments.
- Resend sender failure is surfaced as a safe user error. No token is returned to the browser. The server revokes the just-created invitation on delivery failure so retry creates a fresh invite without leaving a pending token.
- Return generic password-reset/verification request responses to limit email enumeration. Show localized invalid/expired reset and invitation states.
- Email claim normalization uses a single documented invariant (trim and invariant case-fold); do not treat Microsoft email as the stable account ID.
- Set rate limits for public auth/email endpoints, protect callback URLs from open redirects, and avoid allowing arbitrary post-auth callback targets.

## Verification plan

Test-first slices should cover:

1. Better Auth API route, email/password signup/sign-in, session cookie, email verification, password reset expiry, and session revocation after reset.
2. Google and Microsoft callback configuration, both successful signup and sign-in, unverified-email handling, and safe same-email linking behavior.
3. API JWT validation for valid, expired, wrong-issuer, wrong-audience, tampered, unknown-key, and rotated-key tokens; preserve authenticated hub and protected route behavior.
4. Organization signup creates a single organization and matching owner membership atomically, rejects absent/unverified identity, and handles owner re-submission and database failure.
5. Invitation creation normalizes recipient email; acceptance succeeds only for the verified invited identity; wrong email, unverified email, tampered/expired/revoked/reused token, and cross-tenant scope do not create membership.
6. Resend message generation and failure behavior without sending production email in automated tests.
7. Playwright/browser acceptance for localized auth forms, OAuth buttons/callback errors, verification/reset links, invitation signup/sign-in/accept, role-specific UI access, keyboard interaction, and mobile layout.
8. Required package checks: frontend lint, typecheck, build; `dotnet test apps/api/WhitePlate.slnx`; auth/API migration generation and relational verification. Report unavailable provider credentials and do not claim live Google/Microsoft or Resend delivery without real configured credentials.

## Open deployment decisions

- Register Google and Microsoft OAuth applications and supply their client credentials; Microsoft tenant audience defaults to `common`, but final Entra account-type policy should be confirmed before production.
- Supply the Better Auth PostgreSQL connection, Better Auth secret, API issuer/audience/JWKS endpoint, and production origin.
- Verify a Resend sender domain/from address and provide its server-side API key.
- Decide the production Next.js hosting/API network topology and trusted origins; the frontend/API relationship is not currently configured.
- Review generated auth and .NET migration SQL and choose rollout/rollback procedure before production deployment.

## References

- [Better Auth Next.js integration](https://better-auth.com/docs/integrations/next)
- [Better Auth PostgreSQL adapter](https://better-auth.com/docs/adapters/postgresql)
- [Better Auth JWT and JWKS plugin](https://better-auth.com/docs/plugins/jwt)
- [Better Auth email/password, verification, and reset](https://better-auth.com/docs/authentication/email-password)
- [Better Auth social OAuth and account linking](https://better-auth.com/docs/concepts/oauth)
- [Better Auth Microsoft Entra provider](https://better-auth.com/docs/authentication/microsoft)
- [Better Auth account linking](https://better-auth.com/docs/concepts/users-accounts)
- [Better Auth organization invitations](https://better-auth.com/docs/plugins/organization) (reviewed for comparison; its organization/member schema is intentionally not selected)
- [Microsoft ASP.NET Core JWT configuration manager](https://learn.microsoft.com/en-us/dotnet/api/microsoft.aspnetcore.authentication.jwtbearer.jwtbeareroptions.configurationmanager?view=aspnetcore-10.0)
