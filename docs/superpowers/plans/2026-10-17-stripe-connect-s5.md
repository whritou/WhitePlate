# S5 Stripe Connect implementation plan

> Manually prepared at the user's request because the required writing-plans skill was unavailable. The user approved the plan and selected inline execution on 2026-10-17. The account-creation rule was updated after the user clarified on 2026-10-17 that Stripe may create the restaurant's account during OAuth.

**Goal:** Let organization owners connect each restaurant's Stripe Standard account through OAuth, whether they select an existing account or create one during the flow, and let owners and restaurant managers see Stripe-verified connection and readiness status. Support server-configured test and live modes. WhitePlate charges no application fee and S5 does not create payments or charges.

**Architecture:** Keep Stripe requests in API infrastructure behind application ports. A mode-matched provider uses fixed Stripe API/Connect origins and server-side HTTP clients for OAuth/account operations, with Stripe.NET webhook signature validation. Persist the restaurant/mode connection, one-time OAuth state digest, and webhook event IDs in PostgreSQL. The API owns authorization, OAuth state, mode selection, status mapping and webhook reconciliation. The localized restaurant settings page calls the API through the existing server-only service/action boundary and renders a Payments section in English and French.

**Plan status:** Implemented inline in source. Migration `20261017134031_StripeConnect` is already applied to Coolify Production. Manual Stripe test-mode OAuth/webhook acceptance remains open and this OAuth callback fix adds no schema change.

## Scope and invariants

- Use Standard OAuth to connect the returned Standard account; the owner may select an existing account or create one during OAuth. Do not create Express or API-provisioned accounts.
- One current account per tenant and mode. The active mode comes from server configuration; the browser cannot select credentials, mode, account ID, callback URI or return URL.
- OAuth state is cryptographically random, short-lived, single-use and tenant/owner/mode bound. The callback rechecks the initiating owner's current membership.
- Accept a Standard account created during OAuth. Persist its Stripe account ID and readiness snapshot; do not reject it based on `created` time or deauthorize it. Do not persist OAuth access or refresh tokens.
- Owners can start/retry OAuth and open the mode-correct Stripe Dashboard. Owners and restaurant managers can read status. Kitchen members and other tenants cannot.
- Derive readiness from Stripe Account v1 fields, signed webhooks and live status reads. A redirect never proves connection or verification. An outage reports unknown and keeps the last successful verification timestamp.
- Stripe processing fees stay with the restaurant; WhitePlate takes no application fee. S5 does not create charges, accept guest payments, or add unlink/replacement controls for an active account.
- Keep test/live keys, Connect client IDs, webhook secrets and callback URIs server-side. Local test secrets use .NET user-secrets; production secrets use the deployment secret store.

## File map

### API, domain and persistence

- Add domain records/enums under apps/api/WhitePlate.Domain/Payments for connection mode, connection state, readiness state and the Stripe connection snapshot.
- Add application contracts and handlers under apps/api/WhitePlate.Application/Payments, with ports for Stripe operations and persistence. Reuse IStaffMembershipRepository for owner/manager checks.
- Add Stripe SDK adapters and a mode-aware client factory under apps/api/WhitePlate.Infrastructure/Payments. Add EF entities/configurations for one-time OAuth state and webhook deduplication under Persistence.
- Modify WhitePlateDbContext, API service registration, and the API/Infrastructure project manifests. Add an additive migration and generated model snapshot.
- Add authenticated management endpoints and anonymous state-protected callback/signature-protected webhook endpoints under apps/api/WhitePlate.Api/Controllers.
- Add focused tests under apps/api/tests/WhitePlate.Tests for domain readiness mapping, authorization/state handling, persistence constraints and API/webhook behavior.

### Frontend

- Extend apps/frontend/types/establishment-settings.ts with the payments section value, and add Stripe Connect read/response types and parsers under types/ and lib/validation/.
- Add a server-only Stripe Connect service and server action following services/establishment-settings.ts and actions/establishment-settings.ts. Add a same-origin route only if the existing action boundary needs one for browser status refresh.
- Modify the restaurant-settings page and component to load the Payments section, add localized navigation, and render a focused Stripe Connect panel. Keep API authorization authoritative; frontend role hints only control presentation.
- Add English and French strings to apps/frontend/messages/en.json and fr.json. Add focused unit tests for response parsing, owner/manager states, localized labels and server-action behavior.

### Documentation

- Update docs/api/api-contracts.md, docs/database/database-schema.md, docs/development.md and docs/functional-test-plan.md.
- Update backend/frontend architecture references if implementation introduces a new boundary. Update docs/planning/restaurant-management-backlog.md and the S5 Kanban card with implemented behavior and actual verification at completion.

## Task 1: Add mode-specific Stripe configuration and a server-only Stripe adapter

**Files:** API and Infrastructure project files, API configuration/service registration, Infrastructure Payments adapter, application Stripe port.

- Add the Stripe.NET SDK to Infrastructure at a version compatible with the repository's target framework and current Stripe API guidance. Keep the dependency change focused.
- Define separate server-only Test and Live settings for API key, Connect client ID, webhook signing secret and registered callback URI. Define one server-side active mode per deployment; pin that mode into OAuth state and never accept a mode from the browser.
- Validate mode/URI/key consistency without logging values. If the active mode is not configured, return a safe unavailable response from Connect operations rather than returning secret details.
- Construct StripeClient instances through a mode-aware factory. Do not use static/global Stripe API-key configuration. Keep API keys and webhook secrets out of client configuration, errors and logs.
- Add fakeable application ports for OAuth code exchange, account retrieval and deauthorization so deterministic tests do not call Stripe.
- Add focused configuration/factory tests for test/live isolation, missing configuration and mode mismatch.

## Task 2: Persist account connections, OAuth state and webhook deduplication

**Files:** Domain Payments records, Infrastructure EF entities/configurations, WhitePlateDbContext, additive migration and tests.

- Model the connection separately from its readiness snapshot. Persist tenant ID, mode, Stripe account ID, connection state, minimal Stripe readiness fields, last successful verification time and last applied event timestamp.
- Enforce unique tenant+mode and mode+Stripe-account constraints. Keep test and live account IDs independent; an account cannot be attached to multiple tenants in the same mode.
- Persist OAuth state as a hash only, with initiating identity, tenant, mode, creation/expiry, single-use consumption state and a fixed allowed callback destination. Never persist raw state, OAuth codes or tokens.
- Persist processed webhook event IDs uniquely by mode. Make event registration and its state update atomic so event retries cannot duplicate or partially apply changes.
- Generate the additive EF migration and model snapshot using the repository's EF workflow. Do not apply the migration to a shared database.
- Test uniqueness, tenant isolation, atomic single-use state consumption, event deduplication and mode separation.

## Task 3: Implement owner-only OAuth start and the one-use callback

**Files:** Application OAuth handler/ports, API Connect controller, persistence repository, API tests.

- Add an authenticated start operation for a tenant. Require current organization-owner membership and no active connection in the configured mode. Permit a fresh flow for an unconnected or Stripe-revoked connection; reject replacement of an active account.
- Generate high-entropy state, store its digest with a short expiry, tenant, owner identity, mode and allowlisted locale/return route, then construct the Stripe authorization URL server-side with response_type=code and scope=read_write.
- Add a fixed anonymous callback protected by the state digest. Atomically consume state before exchanging a successful authorization code. Recheck that the stored initiating identity remains an owner of the tenant. Handle cancellation as navigation only.
- Exchange each authorization code at most once with the matching mode's server credentials. On an uncertain exchange failure, require the owner to start a new OAuth flow; never replay the code.
- Verify the returned livemode, account identity and Standard type. Accept the selected account even when Stripe created it during this OAuth flow. Persist its account ID and initial Stripe readiness only after every check passes; show onboarding/action-required readiness while Stripe's account setup is incomplete. Enforce the database account uniqueness rule and do not expose the account ID or OAuth tokens to the browser.
- Redirect only to the stored fixed Payments settings route. The frontend reloads status from the API; callback query parameters do not assert verification.
- Test owner-only start, foreign-tenant denial, state expiry/replay, owner removal before callback, cancellation, code exchange once, mode mismatch, successful existing-account linking, and successful linking of an account created during OAuth with its initial onboarding readiness.

## Task 4: Add authorized status reads and signed webhook reconciliation

**Files:** Application status/readiness handler, Stripe adapter, API status and webhook endpoints, persistence, tests.

- Add a no-store status operation. Permit owners and restaurant managers; deny Kitchen and foreign tenants. Return mode, connection state, readiness state, last successful verification time, and an owner capability hint only. Do not return bank data, requirement field names, secrets or full Stripe objects.
- Retrieve the account from Stripe on a status read and refresh the local snapshot. If Stripe is unavailable, return readiness unknown and the last successful verification time without treating cached status as current.
- Implement the readiness precedence from the approved spec exactly: action_required; pending_verification; onboarding; restricted; verified; otherwise unknown.
- Add an anonymous webhook endpoint that reads the exact raw body, verifies the Stripe signature against the configured mode-specific secret before processing, and checks verified event livemode against that mode. Accept only account.updated and account.application.deauthorized for S5.
- Deduplicate events transactionally. Ignore stale account.updated events and never let account.updated restore a deauthorized connection; only a new successful owner OAuth flow may reconnect it. Do not log raw payloads or signature data.
- Provide an owner-only mode-correct Stripe Dashboard link using a fixed Stripe origin. Open it in a safe new tab; do not create Express login links.
- Test every readiness mapping, owner/manager reads, Kitchen/foreign-tenant denial, unavailable status behavior, signature rejection, duplicate/out-of-order events and deauthorization.

## Task 5: Add the localized Payments settings section

**Files:** restaurant settings page/component and section types, Stripe Connect panel, service/action and response parser, EN/FR catalogs and frontend tests.

- Add a Payments navigation section to the existing tenant-scoped restaurant settings page. Keep the current shell, design tokens, responsive navigation and route/query conventions.
- Load authoritative status from the server-only service when Payments is selected. Do not use a browser tenant ID as authorization and do not trust query parameters from the OAuth callback as status.
- Show Connect Stripe for owners when no current connection exists; show localized connection/readiness state and last successful verification time for owners/managers; show the Dashboard action only to owners. Managers receive read-only status.
- Show onboarding, action-required, pending-verification, restricted, verified, disconnected, unknown, loading and unavailable states with accessible status semantics, focus behavior, retry and responsive controls.
- The owner action obtains a server-generated authorization URL and navigates to Stripe. On return, refresh status from the API. Do not offer in-app unlinking or active-account replacement.
- Keep the Dashboard destination fixed to the mode returned by the API. Open it with safe target/rel attributes.
- Add English/French copy and tests for locale parity, role-specific actions, redirect-not-proof behavior, error/loading/status states and safe dashboard URLs.

## Task 6: Update contracts, setup docs and verify the test-mode lifecycle

**Files:** API/database/development/architecture/functional-test docs, tests and Kanban card.

- Document management start/status routes, OAuth callback and webhook boundaries, response DTOs, authorization, no-store behavior, safe errors, state replay handling and readiness mapping in the API contract.
- Document tables, tenant/mode/account uniqueness, state-hash expiry/consumption and webhook deduplication indexes in the database schema reference.
- Document server-only Test/Live configuration names and local .NET user-secrets setup. Never add real keys or Stripe webhook secrets to source control, client bundles or NEXT_PUBLIC variables.
- Add a manual acceptance flow using Stripe test API key, test Connect client ID, test webhook secret and a reachable registered callback. Verify linking an existing account and an account created during OAuth, status refresh, revocation webhook, mode-correct Dashboard destination, and that no payment/charge is created.
- Add the required API authorization/invariant tests and focused frontend tests with fakes; tests must not call Stripe or require secrets. Run the full API/frontend verification commands after implementation; record failures and any hosted OAuth checks that could not run.
- Update the S5 Kanban card and planning documentation with implemented results, command output and remaining hosted/live setup work. Do not deploy or apply migrations to shared infrastructure.

## Verification commands and acceptance

- API solution: dotnet test apps/api/WhitePlate.slnx
- Frontend from apps/frontend: npm run lint, npm run typecheck and npm run build as appropriate.
- Review git diff --check, generated migration/model snapshot, English/French catalog parity, tenant ownership and secret/log exposure.
- Manual Stripe acceptance requires user-provided test-mode configuration in local user-secrets and a reachable callback. Do not put credentials in this plan, source control or the browser bundle. No actual charge is part of acceptance.

## Plan self-review

- All approved scope is represented: Standard OAuth account selected or created during the flow, zero WhitePlate application fee, owner management, owner/manager status reads, tenant isolation, test/live configuration, Stripe-sourced readiness and no payment execution.
- The plan keeps Stripe SDK types and secrets out of the frontend and application/domain boundaries.
- Callback and webhook trust derive from consumed OAuth state and verified Stripe signatures respectively; redirect parameters never establish readiness.
- The schema and API contracts are additive. Shared database migration, deployment, live credential activation, guest checkout and future charge behavior remain outside this plan.
- The user approved the written plan and chose inline execution before implementation began.
