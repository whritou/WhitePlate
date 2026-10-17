# Live analytics page matching the demo

**Status:** Approved by product owner
**Date:** 2026-10-17
**Scope:** Authenticated organization analytics page and its API/data support

## Goal

Rebuild the authenticated analytics page so it keeps the same sections, metrics, filters, and export interaction as `demo/analytics`, while using real tenant order data. Complete the API capabilities needed by those sections. Keep the demo page on its fictional dataset.

The earlier dashboard-only implementation is not sufficient: this feature covers the full demo page and its data contract.

## Approved product rules

These rules were confirmed by the product owner during design:

- Date ranges are 7, 30, or 90 days. Compare each range with the immediately preceding period of the same length.
- Use the restaurant timezone for calendar grouping and peak hours. Use stored timestamps for preparation and pickup performance.
- Cancelled orders remain in order counts and the cancellation rate. Exclude them from revenue, average order value, and best-seller revenue/quantity.
- Repeat-customer analytics only use explicitly consenting customers identified by an email fingerprint. Do not backfill older orders. A repeat is a consenting customer with a previous, non-cancelled, consented order in the previous 365 days.
- WhitePlate commission is 0%, as a product-policy value; do not derive it from payment records.
- Refunds are unavailable until a real payment/refund flow exists. Phone orders are untracked until phone-order creation exists. Historical orders without source metadata remain unattributed.
- Do not estimate missing or unsupported values. Display them as unavailable or untracked.
- Customer fingerprints are HMACs of normalized email and are scoped to a tenant. Never match identities across tenants.
- Analytics consent is separate from order-update email consent, optional, and unchecked by default.
- Analytics fingerprints expire within 365 days. Provide a customer-accessible withdrawal control that accepts the email used at checkout, computes its fingerprint transiently, and deletes retained fingerprints for that tenant.
- Persist a fingerprint only for the current HMAC key version on each new order. During lookup, compute hashes for the current and retained previous key versions so returning-customer matching and withdrawal work across rotation without extending old-key retention.
- In multi-currency views, sum counts and quantities, but keep monetary totals and trends grouped by currency. Preserve restaurant identity in dish rows.

## Page requirements

The authenticated page at `/organization/analytics` must retain the composition and behavior of the demo page:

- Restaurant selector including an all-restaurants selection where the user has access.
- 7/30/90-day range selector with the demo default of 30 days, the demo Revenue chart selected by default, the Revenue/Orders chart toggle, and an export CSV action.
- Six KPI cards in demo order: Revenue, Orders, Avg basket, Returning customers, Avg prep time, and Commission paid.
- Revenue and order-count trend chart.
- Peak hours, channel mix, and best-selling dishes sections.
- Kitchen performance section with on-time pickups, orders accepted in under one minute, cancellations, fastest and slowest preparation times, discount uses, and refunds.
- Reuse the demo page composition and shared section components in the authenticated page so the layout is not approximated from scratch. Preserve its visual hierarchy, chart types, labels, ordering, and responsive behavior; replace only demo restaurant names and values with authorized live data, and add the live-data states and controls required here. Follow the canonical design-system tokens and accessibility rules without changing global tokens.
- Keep the demo route and its fictional data intact.

All new user-visible copy must be localized in English and French. The page must provide loading, empty, partial/untracked, error, and retry states. A failed refresh must preserve the last complete result rather than replacing it with partial data. Keep analytics responses out of shared caches.

### Metric definitions

- Calendar buckets follow each restaurant's configured timezone. The selected period contains the latest N local calendar dates including today, and its comparison period is the N dates immediately before it.
- Order counts and cancellations count orders by creation time, including cancelled orders. Trend counts, channel counts, and peak-hour counts follow that rule.
- Revenue is the stored order total for non-cancelled orders, grouped by currency and creation date. It is an order-value measure, not collected or settled payment volume.
- Average order value is non-cancelled order total divided by non-cancelled order count, per currency.
- Returning-customer rate is the number of distinct consented customer fingerprints with at least one non-cancelled order in the selected range and a qualifying previous order in the 365 days before an in-range order, divided by distinct consented fingerprints with a non-cancelled order in the selected range. Both numerator and denominator use only consented order records. Store a per-order repeat indicator and short-lived prior-order links when a new order is placed; these links let cancellation recompute affected indicators even after the prior fingerprint expires. Delete links on withdrawal and expire them with the candidate order's analytics retention (365 days). This honors the 365-day fingerprint limit without retaining fingerprints for up to 455 days. Return “unavailable” when the selected range has no eligible consented customers (zero denominator); do not present that as a measured 0%.
- Best-selling dish quantity and revenue use immutable order-line snapshots from non-cancelled orders. Preserve restaurant and currency on each row.
- Preparation duration is the elapsed time from preparation start to ready time, using only non-cancelled orders with valid timestamps; fastest, slowest, and average use eligible orders in the selected period. On-time pickup is the percentage of completed scheduled pickups whose completed order ClosedAt timestamp is no later than its scheduled PickupAt time, using only scheduled pickups with valid timestamps. Missing or invalid timestamps are excluded and reported as unavailable when no qualifying records exist.
- “Accepted < 1 min” is the percentage of eligible orders whose preparation start is within 60 seconds of creation, using orders with both valid timestamps. Cancelled orders may be included if both timestamps were recorded.
- Cancellation rate is cancelled orders divided by all orders created in the selected period. Discount uses count orders with a recorded discount code or positive discount amount; cancelled orders remain included in this operational count.
- Commission is always displayed as 0%, sourced from product policy. Refunds are unavailable, not zero.
- If a comparison baseline is zero or absent, show no percentage change and label the comparison unavailable.

## API and aggregation

Add the full analytics endpoint:

`GET /api/v1/tenants/{tenantId}/analytics?days=7|30|90`

The endpoint returns a versioned, documented contract containing:

- Tenant and timezone context.
- Selected and comparison period boundaries.
- KPI values with currency where applicable and an explicit availability state.
- Daily revenue and order-count buckets.
- Peak-hour counts, channel counts, best-seller rows, and kitchen performance values.
- Previous-period values or comparison-unavailable state.
- Data provenance for values that can be untracked or unavailable.

Require an authenticated tenant owner or manager. Resolve membership and role on the server; a browser-supplied tenant ID is only a selector and is never authorization. Keep the existing D2 dashboard metrics endpoint behavior separate. For an all-restaurants trend, merge the local calendar-date buckets for each restaurant by ISO date label and retain each restaurant timezone in response metadata.

The frontend BFF must obtain authorized restaurant memberships from `/api/v1/me`, request analytics for each authorized restaurant, and aggregate only those results for “all restaurants.” Do not accept a browser-provided list as proof of membership. Aggregate counts and quantities by summing. Keep revenue, average order value, and trends separate by currency. Preserve the restaurant ID on dish rows. Customer identities remain restaurant-tenant scoped; all-restaurant repeat rates aggregate per-tenant counts without cross-tenant matching.

The CSV export must use the same authorized, complete result currently shown by the page, preserve currency and restaurant identifiers, and make unavailable/untracked values explicit.

## Checkout attribution and consent

- When analytics consent is selected, attribute new orders to `web` by default or `qr` when opened through the restaurant's generated QR storefront URL. Accept only the documented channel values. Without analytics consent, do not persist channel attribution. A QR query parameter is attribution metadata, not proof of identity or authorization.
- Do not infer a channel for existing orders or phone orders. Label them unattributed/untracked.
- Add a separate optional analytics-consent control to checkout, unchecked by default. Do not couple it to order-update email consent. If analytics consent is selected, require the email needed to create the fingerprint and explain the purpose and withdrawal option in localized copy.
- Normalize the email consistently and compute a tenant-scoped HMAC using a server-only analytics privacy key. Use a separate key and purpose prefix from order-email tracking. Never persist or return the raw email for analytics-only consent.
- Persist consent and the HMAC only for that order. Do not apply new consent retroactively to historical orders. Include analytics consent in request validation and idempotency handling without changing the existing email-update semantics.
- If the privacy key is unavailable, do not silently accept and then lose an analytics opt-in: reject the opted-in analytics processing with a clear checkout error, while non-consenting orders continue normally.
- Store the HMAC key only in server-side secret configuration (Analytics:PrivacyKey), separate from order-email tracking. Version the key. Persist only the current version's fingerprint for new orders; use prior versions only for transient lookup. Keep prior key versions available for no longer than the 365-day retention window so cross-order comparisons and withdrawals work during rotation; document a controlled rotation procedure.

### Withdrawal control

Expose a localized withdrawal form from the checkout confirmation and a public privacy route scoped to the restaurant tenant. The customer can use it from any device by entering the same email used at checkout. The form sends the email over HTTPS in the POST body to the public endpoint POST /api/v1/tenants/{tenantId}/analytics/withdrawal; the API normalizes it and computes the tenant-scoped HMAC transiently. Do not persist the submitted email or write it to logs.

The narrowly scoped endpoint deletes all retained analytics fingerprints, consent flags, repeat indicators, and repeat-dependency links matching that email in that tenant. It does not alter order-update email consent or other order data. Return the same generic success response whether or not a fingerprint matched, so the endpoint does not reveal customer or order existence. Rate-limit requests and keep the endpoint out of shared caches. The operation is idempotent. Future orders are tracked only if the customer explicitly opts in again; consent is never preselected.

No customer account or withdrawal token is required. Because fingerprints are tenant-scoped, a withdrawal applies to the restaurant tenant shown by the control. Explain this scope in localized copy.

Add a scheduled cleanup that removes fingerprints and derived repeat indicators after 365 days. Existing order-email cleanup remains independent.

## Data, documentation, and verification

- Add a database migration for order source, analytics consent, fingerprint, and per-order repeat-indicator storage. Preserve existing order records without assigning invented channels or consent.
- Update API request/response schemas and contract documentation alongside implementation. Update the backend architecture and analytics documentation to describe what is actually wired.
- Update the affected frontend and API documentation, both translation catalogs, and the project kanban card.
- Do not claim refunds, collected revenue, phone orders, or cross-tenant customer matching are supported.
- No tests will be added or run unless requested separately. The implementation handoff must still record the actual checks performed and any that could not run.

## Acceptance criteria

1. The authenticated page contains the demo's full sections and controls, with the same layout and interactions, and no fictional values.
2. An owner or manager can only retrieve analytics for restaurants where server-verified membership grants access.
3. All KPI, time-series, channel, best-seller, preparation, pickup, discount, commission, and unavailable states follow the definitions above.
4. “All restaurants” aggregates only the current user's authorized restaurants and never combines currencies or tenant-scoped customer identities incorrectly.
5. New orders record web/QR attribution and optional analytics consent; existing orders remain unattributed and non-consented.
6. Repeat-customer rate uses only consented HMAC fingerprints with no retroactive identification.
7. A customer can withdraw consent from the checkout confirmation or tenant privacy route on any device; the API deletes all retained matching fingerprints and derived repeat indicators, and cleanup removes expired analytics data.
8. The page, errors, empty states, and consent/withdrawal flows are localized in French and English; CSV is consistent with the visible authorized data.
9. API contract, schema/migration, and documentation match the implemented behavior.
