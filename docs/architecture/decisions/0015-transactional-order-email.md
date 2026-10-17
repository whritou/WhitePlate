# Decision 0015: Transactional order email

- Date: 2026-10-17
- Status: accepted; source implementation complete and Coolify Production schema applied; provider and hosted verification pending
- Scope: S4 guest order notifications and restaurant-managed email templates

## Context

Orders are committed with immutable product and pickup-time snapshots. The API writes authoritative order events to its outbox and dispatches them to tenant-authorized SignalR subscribers. Guest checkout currently collects a name but no email address. The frontend's existing Resend integration is server-only and sends account verification, password reset, and staff invitation email; it is not a durable order notification worker. Restaurant identity, localized pickup instructions, published theme assets, menu locales, and capability-based order tracking already exist.

S4 needs to add email without coupling provider failures to kitchen event delivery or exposing guest recipients to staff order reads. The design card identified recipient collection, event timing, sender scope, and provider configuration as decisions before implementation. The user selected optional checkout email with an explicit order-update opt-in, notifications at committed order creation and the `Preparing`/`Ready` transitions, and Resend with the platform sender and restaurant branding in the message.

## Decisions

1. **Recipient collection and privacy.** Checkout offers an optional “email me updates about this order” choice. When selected, a valid email address is required. WhitePlate stores the address and the server-recorded consent time only for that order, sends only order-related messages, and never uses it for marketing. The address is not returned by public tracking or staff order APIs. Clear the order address when the order becomes terminal or reaches the 30-day tracking expiry. Keep the recipient on a pending delivery until provider acceptance or final failure so every committed order event can finish independently; clear it when the tracking period expires.
2. **Events.** Enqueue an email delivery in the same database transaction as the order event for `order.created` and transitions to `Preparing` or `Ready`, and dispatch only after commit. Do not send for cancellation, completion, manual/phone orders, or a payment event that does not exist yet. Existing idempotency-key replay must not enqueue another notification.
3. **Templates and localization.** Store tenant-owned templates per enabled menu locale for the three events. Templates contain plain text subject, heading, and body; they do not accept arbitrary HTML. Only the documented placeholder allowlist is accepted. The renderer substitutes values and HTML-escapes every value. Resolve text from the order locale, then the restaurant's default locale, then the built-in English template. Owners and restaurant managers can edit templates; every read and write checks persisted membership and active tenant/organization state.
4. **Order content and identity.** Use the order's immutable item, price, locale, pickup-time, and time-zone snapshots. Resolve the localized pickup instructions and restaurant identity from the current S1 settings. Use the published T3 logo, banner and colors when available through the configured tenant storefront URL; otherwise use a text-only restaurant header. The banner and logo are decorative, with empty banner alt text and a restaurant-name logo alt text. The sender address remains the platform's verified Resend address; the restaurant name is shown in the email body. Per-restaurant sender domains and editable reply-to addresses are deferred.
5. **Tracking capability.** Keep existing browser tracking tokens hash-only. For emails, derive a separate 30-day capability from tenant ID, order ID, expiry, and a server-only signing key. Persist only its SHA-256 hash on the order. Regenerate the same capability for each notification; never put it in the order-event payload, delivery database row, logs, or staff API responses. The tracking endpoint accepts the existing browser capability or the email capability and continues to return only status metadata.
6. **Delivery reliability and status.** Use a separate email delivery outbox, with a unique link to the committed order event, bounded exponential retry, and a terminal failed state after ten attempts. Send through Resend from the API process using server-only `RESEND_API_KEY` and `RESEND_FROM_EMAIL`. Use the event ID as the provider idempotency key. Record provider acceptance and its message ID as `Accepted`; this is not proof of inbox delivery. Never claim success because a form was saved or an event was queued. The email worker does not share the SignalR dispatch acknowledgement.
7. **Configuration and limits.** The API receives the Resend credentials in its own runtime, an HTTPS tenant storefront URL template, and a stable email-tracking signing key encoded as Base64 with at least 32 bytes. The signing key must remain stable for at least the tracking lifetime. Missing provider configuration leaves email delivery pending and visible in the internal delivery record; it must not reject an otherwise valid order. No SMS is included.

## Alternatives considered

- Sending from the checkout action was rejected because a browser request cannot durably retry after the order commits and would couple receipt behavior to the client connection.
- Reusing the SignalR outbox acknowledgement was rejected because a provider outage must not replay or block kitchen event delivery.
- Sending from restaurant-owned domains or setting restaurant reply-to values was deferred because no per-tenant sender verification workflow exists.
- Sending only after payment was deferred because payment processing is not implemented.

## Consequences

The implementation adds guest email consent fields, tenant template settings with optimistic concurrency, an independent order-email delivery table and worker, a provider adapter, and an API configuration contract. Its additive schema was applied to Coolify Production with the `whiteplate_api` grants verified; the API code has not been deployed. It adds no payment, marketing, SMS, or invitation-email behavior. Source-level tests can prove tenant isolation, transactionality, retry, and rendering behavior; actual Resend delivery, PostgreSQL concurrency and hosted tenant acceptance remain environment checks.

## Affected documents

- [Restaurant management backlog](../../planning/restaurant-management-backlog.md)
- [API contracts](../../api/api-contracts.md)
- [Database schema](../../database/database-schema.md)
- [Development guide](../../development.md)
- [Functional test plan](../../functional-test-plan.md)
- [Backend architecture](../WHITEPLATE_BACKEND_ARCHITECTURE.md)
