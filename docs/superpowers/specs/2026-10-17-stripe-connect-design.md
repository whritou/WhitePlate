# S5 Stripe account connection and verification design

Date: 2026-10-17. Status: design approved in chat; written spec ready for user review.

## Intent and scope

S5 lets an organization owner connect a restaurant's existing Stripe account to WhitePlate and lets owners and restaurant managers see a Stripe-verified connection and readiness status. Stripe remains the restaurant's payment processor and charges its processing fees to that restaurant. WhitePlate takes no application fee.

The integration uses Stripe's Standard OAuth flow because the intended connection is the restaurant's existing Stripe account. S5 does not create an Express account, accept a customer payment, create a charge, issue a refund, show a balance or payout, or activate guest checkout. An active Stripe connection does not itself make WhitePlate checkout paid. Stripe's OAuth flow can also let a user create a Standard account if they don't already have one. The UI instructs owners to select their existing account, and the callback rejects and deauthorizes any account whose Stripe creation timestamp is not earlier than the OAuth state's start time. WhitePlate does not provision accounts through its API.

Stripe currently discourages OAuth for new Connect platforms and recommends hosted Connect Onboarding. Accounts v2 does not support OAuth. The exact-existing-account requirement selects OAuth and Accounts v1 despite that recommendation. This is a deliberate constraint, not an accidental API choice. See [Stripe's Standard OAuth guidance](https://docs.stripe.com/connect/oauth-standard-accounts) and [Accounts v2 limitations](https://docs.stripe.com/connect/accounts-v2#accounts-api-v2-limitations).

## Existing behavior and constraints

The API currently has no Stripe SDK, Stripe settings, or Connect routes. WhitePlate's `Tenant` is the restaurant boundary and references its parent organization. Organization-owner memberships and restaurant-manager memberships already exist. The restaurant-settings route and its client component provide the place for a Payments section.

Tenant IDs supplied by the browser are selectors only. Every protected operation must verify current membership against the requested restaurant and organization. OAuth state must bind the Stripe callback to the owner and restaurant that started it.

Stripe's OAuth platform scope must be `read_write`; `read_only` is available only to Stripe Extensions. The OAuth response's access and publishable tokens are deprecated in favor of the platform key with a `Stripe-Account` header. S5 stores the connected account ID and does not persist OAuth tokens. No code in S5 uses the granted scope to create or modify payments. See the [OAuth scope and token reference](https://docs.stripe.com/connect/oauth-reference).

## Account model and fee behavior

Create a Stripe connection per restaurant tenant and Stripe mode (`test` or `live`). Test and live connections have separate account IDs and status snapshots. Enforce one current Stripe account per tenant and mode, and prevent an account ID in one mode from being associated with more than one tenant in that mode.

The restaurant's Standard connected account owns its Stripe account and its payment relationship. When payment processing is added in a separate scope, it must use direct charges on the connected account, with Stripe processing fees charged to that account and no WhitePlate application fee. S5 contains no charge creation or checkout wiring. Stripe's [SaaS platform guide](https://docs.stripe.com/connect/saas) describes this Stripe-owned pricing model.

Do not create or prefill an account's country, currency, legal identity, bank account, or payout settings in S5. Those remain in the restaurant's Stripe account. Future payment acceptance must separately verify region and currency compatibility.

## OAuth lifecycle and persistence

1. An authenticated organization owner requests connection for a restaurant that has no current connection in the configured mode. The API checks the owner's active membership and creates a cryptographically random, short-lived, single-use OAuth `state`. Store only a hash of the state with the tenant ID, initiating identity, configured mode, and a fixed allowed post-callback route.
2. The API creates the Stripe authorization URL from server configuration, using `response_type=code`, `scope=read_write`, the configured mode-specific client ID, the fixed registered callback URI, and the state. The browser never supplies a Stripe account ID, callback URL, client ID, mode, or post-callback destination.
3. The callback validates and consumes the state once, rechecks that the initiating identity is still an organization owner for the tenant, handles cancellation without recording a connection, and exchanges a success code exactly once using the matching server-side API key. Stripe documents that authorization codes expire after five minutes and that exchanging one more than once can revoke the connection, so callback retry logic must start a fresh OAuth flow rather than replay the same code.
4. The callback validates the returned `livemode` against configured mode and retrieves the account from Stripe. It requires the Stripe account's `created` timestamp to be earlier than the OAuth state's start time (the state timestamp is compared at Stripe's seconds precision). If the account was created during the Stripe OAuth flow, the API immediately deauthorizes it using the matching mode's credentials, leaves the tenant unconnected, and returns an actionable message. Otherwise, the API saves its account ID, mode, connection state, readiness snapshot, and verification timestamp. It then returns the browser to the fixed restaurant settings route. The browser redirect is only a navigation result; it is never proof of connection or verification.

Persist a `StripeConnection` record keyed by tenant and mode, a one-use OAuth-state record, and a webhook-event deduplication record. Store only the Stripe account ID and the minimum status fields required for the UI. Do not store access/refresh tokens, bank data, or identity documents.

The account status endpoint reads the connected account from Stripe and refreshes the local status snapshot. Signed `account.updated` webhooks refresh the same snapshot. Signed `account.application.deauthorized` webhooks mark the connection disconnected. Persist a unique event ID per mode so retries are idempotent. Do not allow an older event to restore a deauthorized connection. If Stripe cannot be reached, return an unavailable/unknown result (and the last check time, if present) instead of presenting a cached status as verified.

## Connection and verification status

Connection and Stripe readiness are separate facts:

| Connection state | Meaning |
| --- | --- |
| `not_connected` | The restaurant has no current connection in this mode. |
| `connected` | Stripe authorized the connection and the account was successfully retrieved. |
| `disconnected` | Stripe revoked or removed the connection. |

For a connected account, derive readiness from verified Stripe Account v1 fields (`details_submitted`, `charges_enabled`, `payouts_enabled`, `capabilities.card_payments`, and current/past/pending verification requirements):

Apply readiness in this order so an account with multiple Stripe signals has one stable UI state: `action_required` for non-empty `currently_due` or `past_due`; otherwise `pending_verification` for non-empty `pending_verification` or a pending card-payments capability; otherwise `onboarding` when `details_submitted` is false; otherwise `restricted` when the card-payments capability is disabled/restricted or charges or payouts are disabled; otherwise `verified` only when card payments are active, charges and payouts are enabled, and no current, overdue, or pending requirements remain. A failed Stripe read is `unknown` and does not overwrite the last successful snapshot as though it were current.

| Readiness state | Meaning |
| --- | --- |
| `onboarding` | The account is connected but has not submitted its required account information. |
| `action_required` | Stripe reports current or overdue requirements. |
| `pending_verification` | Stripe is still reviewing submitted information or a required capability. |
| `restricted` | Stripe reports a disabled/restricted payment capability or the account cannot charge and/or pay out. |
| `verified` | The requested card-payments capability is active, charges and payouts are enabled, and no current, overdue, or pending verification requirements remain. This is a payment-readiness summary, not a legal identity certification. |
| `unknown` | Stripe status could not be retrieved or reconciled. |

The API response includes mode, connection state, readiness state, and last successful verification time. It does not expose bank information, tokens, full Stripe account objects, requirement field names, or Stripe error details. Do not infer these states from query parameters or frontend state.

## Authorization and user experience

- Organization owners can start OAuth while unconnected and open the restaurant's Stripe Dashboard. They can retry after a canceled or failed attempt and reconnect after Stripe revocation. Owner access is rechecked for every operation, including the OAuth callback.
- Organization owners and restaurant managers can view status. Kitchen members and unrelated tenants have no access.
- Add a Payments section to the existing restaurant settings UI, following the canonical WhitePlate design system and English/French catalogs. Show a Connect Stripe action when unconnected, localized state and last-check information when connected, and an Open Stripe Dashboard action for owners. Managers receive read-only status.
- Standard accounts do not use Express login links. Open the standard Stripe Dashboard directly; Stripe handles sign-in. Incomplete, pending, or restricted accounts are directed there for remediation.
- WhitePlate provides no in-app unlink control in S5. If the owner revokes the connection in Stripe, the webhook marks it disconnected and an owner may connect again. Replacing an active account is out of scope.
- The Stripe Dashboard link targets the configured mode (`/test` for test mode and live Dashboard for live mode), opens safely in a new tab, and does not grant access by itself. Because Standard accounts don't have Express login links, Stripe may ask a user with multiple accounts to select the restaurant's account after signing in.

## API and data boundaries

The API provides authenticated start and status operations, a fixed unauthenticated OAuth callback protected by one-use state, and a public webhook endpoint protected by Stripe signature verification. The OAuth start URL, API keys, client IDs, webhook secrets, and callback URI remain server-side. The Next.js UI calls the API through the existing server-side boundary; no secret belongs in `NEXT_PUBLIC_*` configuration.

The EF migration is additive. Update API contracts, the database schema reference, development configuration docs, and the functional test plan. Configure a Stripe `StripeClient` instance; never use static/global API-key configuration. Never log API keys, webhook secrets, authorization codes, OAuth tokens, or raw webhook payloads.

## Test-mode configuration

S5 must support Stripe test-mode platform credentials. Configure the test platform API key, test Connect client ID, exact registered OAuth callback URI, and test Connect webhook signing secret on the server. Keep the live values separate for production; never mix a live client ID/key with test OAuth codes or vice versa. Validate the OAuth response mode before saving. Stripe's test client ID supports localhost; Stripe permits linking an existing test account only when its email differs from the platform account. See [Stripe Connect testing](https://docs.stripe.com/connect/testing).

Test secrets belong in local user secrets or the deployment secret store, not source control or the browser bundle. Use fake Stripe API responses for deterministic application/API tests. Manual hosted OAuth acceptance requires configured Stripe test credentials and a reachable callback URL; no test API key or real payment is required in source control.

## Verification and rollout

Implementation coverage should include:

- Owner-only OAuth start, owner/manager status reads, Kitchen/foreign-tenant denial, and authorization rechecks at callback.
- Invalid, expired, replayed, mismatched-mode, canceled, and successful OAuth callbacks; an authorization code is exchanged at most once. Accept a pre-existing Stripe account; verify that an account created during OAuth is deauthorized and never persisted as the tenant connection.
- Stripe signature rejection, duplicate webhook handling, deauthorization, stale/out-of-order account updates, Stripe API unavailability, and each readiness mapping.
- Persistence uniqueness by restaurant and mode; test/live isolation; no token or bank-field exposure in API DTOs, client config, or logs.
- Payments settings in both locales, read-only manager state, owner actions, all loading/error/status states, and accessible responsive behavior.
- Manual Stripe test-mode OAuth with a test client ID, test API key, and test webhook signing secret. Confirm the restaurant dashboard remains the destination for setup and that no guest checkout can create a charge.

Record actual commands and results. Do not apply the migration to a shared database or deploy the application as part of source implementation. Production activation and hosted acceptance remain separate rollout work.

## Alternatives considered

1. **Standard OAuth for the restaurant's existing Stripe account (selected):** matches the explicit requirement and leaves Stripe fees and payment account control with the restaurant. It requires OAuth/Accounts v1 and uses Stripe's discouraged path for new Connect platforms. Stripe can reject a read/write connection to an account controlled by another platform.
2. **Accounts v2 with full Stripe Dashboard and Stripe-collected fees/losses:** Stripe's current recommended direction for a new SaaS Connect integration, but it creates a platform connected account rather than using OAuth to attach the restaurant's exact existing account. It does not meet the stated exact-account requirement.
3. **Express account:** creates a new account and fixes fees/loss liability on WhitePlate. It conflicts with the user's correction and is rejected.

## Scope boundary

S5 covers connecting the restaurant's existing Stripe account, Stripe-sourced connection/readiness status, owner and manager permissions, webhook reconciliation, settings UI, and test-key configuration. Although Stripe's OAuth screen may offer Standard account signup, S5 accepts only accounts created before the OAuth flow and deauthorizes a newly created account. WhitePlate does not provision connected accounts through its API. S5 excludes guest/customer checkout, direct-charge creation, application fees, subscriptions, refunds, disputes, balances, payout tools, bank/identity data collection, Express accounts, in-app disconnection, active-account replacement, and country/currency changes.
