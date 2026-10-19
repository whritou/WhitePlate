# Decision 0006: Capability based public order tracking

- Date: 2026-10-08
- Status: accepted for implementation at the user's direction
- Scope: public click-and-collect checkout receipt and read-only order follow-up

## Context

The approved API design excluded public order lookup. The requested storefront now needs a receipt link and a way for its guest to follow the existing organization order workflow. A public order ID alone must not grant access. The initial status-only restriction is superseded by the approved safe-summary amendment below; customer identity and contact data remain excluded.

## Decision

1. Checkout accepts an optional `trackingToken` for compatibility with existing clients. The storefront creates 32 random bytes with the browser cryptographic random generator and encodes them as unpadded base64url.
2. The API stores only the SHA-256 hash of the token and a 30-day UTC expiry. The token is included in the idempotency request fingerprint as a hash, never in the order receipt or server logs.
3. `POST /api/v1/orders/{orderId}/tracking` resolves the tenant from the actual restaurant host and accepts the token in a JSON body. Unknown order, invalid token, expired token, and tenant mismatch share the same `404` response. The API uses fixed-time hash comparison.
4. The initial endpoint returned order ID, lifecycle status, version and creation time. Pickup snapshots were added by S3, and the approved amendment below adds an immutable item/totals summary. Responses remain `no-store` and exclude personal fields.
5. The same-origin Next.js BFF validates `Origin`, the restaurant host, and token shape, then calls the API using the shared custom API request factory. The browser uses the existing custom browser API client. Route pages do not make API calls directly.
6. The tracking capability is placed in the receipt URL fragment. Fragments are not sent in HTTP requests; the client reads it and submits the token only in the tracking request body. The tracking page refreshes status until `Completed` or `Cancelled`.
7. Guest cart, customer name, idempotency attempt, and receipt state live in a tenant-scoped, in-memory Zustand store. They are not persisted to local or session storage.
8. Status follows the established staff order workflow: `Pending -> Preparing -> Ready -> Completed`, with `Cancelled` shown as a terminal state when an authorized staff member cancels an incomplete order. Pickup scheduling was subsequently implemented by S3 and its saved pickup instant/time zone are returned.

## Consequences

### Approved amendment — 2026-10-18

For Studio fidelity the user explicitly approved displaying order articles and amounts to holders of the existing secret tracking link, without personal contact details. The capability-protected response may now include a `summary` containing currency, subtotal, discount, tax, total and immutable product/option snapshots. Customer name, email, phone, addresses and internal preparation notes remain excluded. Tenant resolution, token checks, expiry, identical 404 responses and no-store behavior remain mandatory. This supersedes the status-only field restriction above; it does not introduce lookup by order ID. No schema migration is needed. Source/runtime verification and deployment are recorded separately in the storefront parity audit.

- The API's previous exclusion of public order lookup is amended only for capability-protected tracking and its approved safe summary as specified here. It is not a general public order lookup.
- The schema adds nullable `TrackingTokenHash` and `TrackingTokenExpiresAt` fields so existing orders and older clients remain valid.
- The frontend and API tests cover host isolation, unguessable capability access, expiry, minimal response data, status progression, and same-origin forwarding.
- Receipt and summary values come from immutable checkout snapshots. Public tracking excludes personal details and order notes.
