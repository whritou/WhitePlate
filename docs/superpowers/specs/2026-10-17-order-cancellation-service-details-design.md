# K3 — Order cancellation and service details

**Status:** Design approved in chat on 17 October 2026; implementation plan and code are pending review.

## Context

K1 already provides the five-lane Orders Kanban, role-protected status changes, optimistic concurrency through `If-Match`, and cancelled/completed tickets that remain visible until archival. K3 adds a recorded reason for new cancellations and makes notification/payment information truthful on terminal tickets.

S4 creates tenant/order-scoped email delivery records for opted-in `order.created`, `order.preparing`, and `order.ready` notifications. The records retain an outcome and timestamps but remove the recipient and message content when accepted, finally failed, or expired. `Accepted` means Resend accepted the message; it does not prove inbox delivery. S4 creates no cancellation or completion email.

S5 connects a restaurant's Stripe account, but WhitePlate checkout does not create charges. There is no payment or refund ledger and no provider-backed order payment state. A Stripe connection must not be presented as evidence that an order was charged or refunded.

## Approved scope

### Cancellation reason

Require a reason when an owner or manager cancels an incomplete order. Use this closed set of stable values:

| Value | English label | French label |
| --- | --- | --- |
| `CustomerRequest` | Customer request | Demande du client |
| `ItemUnavailable` | Item unavailable | Article indisponible |
| `RestaurantUnableToFulfill` | Restaurant unable to fulfill | Le restaurant ne peut pas honorer la commande |
| `DuplicateOrder` | Duplicate order | Commande en double |
| `Other` | Other | Autre |

Do not collect a free-text note. The Orders screen presents these as a required, keyboard-accessible choice when cancellation is initiated from either the card action or drag-and-drop. A drag to Cancelled opens the same reason dialog and leaves the order in its current lane until the server confirms the update.

Add nullable `Orders.CancellationReason` storage. Set it in the existing tenant-scoped, version-checked cancellation transaction together with the status, terminal timestamps, reservation release, and outbox event. Reject a missing/unknown reason for cancellation and reject a reason on other status transitions. Preserve existing owner/manager cancellation permissions; Kitchen members continue to progress orders but cannot cancel them. Do not change reasons on historical cancelled orders or infer backfilled values; those rows keep `null` and display as unrecorded.

### Terminal ticket details

Extend the existing order summary used by the live Orders list and history response with the cancellation reason and a safe list of email delivery events. Each event contains only the event type, delivery status, creation time, and accepted time. Query only rows matching the requested tenant and page order IDs. Never expose recipient addresses, provider message IDs, message content, attempt counts, or failure codes.

Show notification events on completed and cancelled tickets using localized labels. Present `Pending`, `Sending`, `Accepted`, and `Failed` as the S4 record states. Describe `Accepted` as accepted by the email provider, not delivered. If there are no event records, show that no email delivery record exists; do not infer a send or a guest preference from absence, including for pre-S4 orders.

Show the cancellation reason for cancelled orders, or explain that no reason was recorded for legacy rows. Do not add a cancellation email.

### Payment and refund disclosure

On terminal tickets, state that WhitePlate has no online payment record for the order and does not track any payment or refund collected outside WhitePlate. Do not display `Paid`, `Unpaid`, `Refunded`, a refund percentage, or a payment-provider state without a verified order-linked provider record. Add no payment/refund columns, ledger, webhook handler, charge, void, credit, or refund action in K3. A future financial mutation requires a separately approved payment-flow, ledger, reconciliation, and liability design.

### Authorization and privacy

Keep reads behind the existing tenant-scoped `CanViewAsync` authorization for organization owners, managers, and Kitchen members. The projected notification fields and reason contain no recipient or financial details. Keep cancellation writes behind the existing persisted owner/manager check. Do not rely on a browser tenant selector for authorization.

## Implementation boundaries

- Update the Domain transition, API request validation/contract, Infrastructure mapping and additive migration, and the bounded order-list/history projection.
- Update the current Lovable Orders ticket and cancellation interaction using the shared design-system controls, light-only tokens, responsive layout, semantic status labels, and English/French catalogs.
- Leave checkout, Stripe Connect, S4 delivery behavior, guest tracking, order history layout, and payment execution unchanged.
- Update the API contract, database schema, functional acceptance guidance, architecture status, and K3 project card to distinguish implemented behavior from deferred hosted/payment acceptance.

## Acceptance

1. A new cancellation always records one allowed reason through the existing role- and version-protected transition; invalid or missing values do not change the order.
2. Existing cancelled rows remain readable with no invented reason.
3. Terminal ticket notification details reflect only actual S4 delivery records and never expose recipient or provider-private fields.
4. Terminal ticket payment copy makes clear that WhitePlate has no payment/refund record; it does not imply settlement or refund.
5. Both cancellation entry paths require a reason, retain the existing pending/conflict/retry behavior, and work in English and French with keyboard access.
6. Tenant isolation and existing owner/manager/Kitchen permissions remain intact. No payment or refund mutation is introduced.

## Deferred decisions

Guest online payment, capture timing, restaurant liability, refunds, cancellation of provider intents, partial refunds, webhook reconciliation, and financial audit retention remain unapproved and outside K3. They require a separate design before any order-level financial mutation is built.
