# S3 pickup scheduling design

12 October 2026. Status: user-approved design; implementation plan review pending.

## Intent and scope

Restaurant owners and managers configure pickup cadence, minimum lead time, and the number of orders accepted at each pickup time. Guests see server-derived availability, choose ASAP or a scheduled pickup, and receive an order whose pickup time the server accepted. The API is authoritative for opening hours, tenant ownership, available capacity, and checkout.

This work depends on S2 weekly opening hours and uses the restaurant's saved S1 IANA time zone. It does not add payment, inventory, manual/phone orders, holidays/date-specific overrides, a manual order on/off switch, or saturation forecasts. A missing opening-hours schedule is not a claim that the restaurant is closed; S3 availability is unavailable and checkout requires the owner or manager to save hours before accepting orders.

## Approved product decisions

- Horizon: a rolling seven restaurant-local calendar days, including the local current date.
- Slot interval: one of 10, 15, 20, or 30 minutes; default 15 minutes.
- Slot alignment: each opening service window anchors its own sequence. A slot lasts one configured interval. Include it only when the full interval fits within that window's half-open `[start, end)` bounds. Do not carry remainder minutes into another window.
- Lead time: minimum elapsed time from checkout to pickup; default 20 minutes, range 0–1,440 minutes. Compare instants in UTC so the saved time zone and DST are applied consistently.
- Capacity: maximum orders per slot, default 8, range 1–50. An order consumes one place regardless of line count or quantity.
- ASAP: resolve to the earliest currently available slot. If no slot is available, do not create the order.
- Reservation: reserve one place atomically with order, receipt/idempotency record, and outbox creation. An unchanged idempotent retry replays its original order and never reserves twice.
- Cancellation: release capacity only when a staff cancellation commits before the reserved slot starts. At or after slot start, do not release the reservation. Cancellation continues to follow the existing order-state and staff-authorization rules.
- Existing orders retain `null` pickup time and have no inferred reservation. New orders always store the server-accepted UTC pickup instant.
- If a restaurant has no saved S2 opening schedule, it receives no available slots and checkout rejects new orders until hours are configured. No hours are fabricated during migration.
- DST follows S2: nonexistent spring-forward wall times produce no slots; repeated fall-back wall times produce both real instants. When a local label repeats, guest UI distinguishes occurrences by UTC offset.
- Saving new settings affects future availability. Existing orders keep their accepted pickup instants. A capacity reduction below current reservations leaves the slot full until cancellations that qualify under the release rule.

The design reference's operating examples supply the defaults: 15-minute cadence, 20-minute lead time, and capacity 8. They do not establish forecast data or current kitchen saturation.

## Data and authority

Extend tenant-owned establishment settings with `PickupIntervalMinutes`, `MinimumPickupLeadMinutes`, and `PickupCapacity`. Existing restaurants receive the approved defaults through an additive migration. The existing establishment version and conditional `If-Match` writes protect these values alongside S1/S2 settings; a pickup-scheduling save changes no identity, legal profile, menu language, pickup text, or opening-hours data.

Add a nullable UTC pickup-time snapshot to orders. Null remains valid only for historical orders. Add tenant-scoped persistence for slot usage and one reservation associated with each new order. The order, reservation, usage increment, idempotency receipt, and outbox event commit or roll back together. Capacity reservation must use a database-atomic conditional update so independent concurrent checkouts cannot exceed the configured capacity. A reservation is unique per order; a successful early cancellation marks it released and decrements usage exactly once in the same status transaction. Tenant keys are derived from the host-resolved restaurant for public operations and from persisted owner/manager membership for settings; browser-supplied tenant IDs never grant access.

Slot generation is a pure domain operation over the saved weekly schedule, time zone, settings, current instant, and persisted usage. Availability reads never mutate capacity. Results contain UTC instants and remaining order capacity, not customer information. No-store behavior applies to public availability and authenticated settings.

## Contracts and user flows

- Extend the existing owner/manager establishment-settings read with pickup settings. Add a conditional `PUT /api/v1/tenants/{tenantId}/establishment-settings/pickup-scheduling`, requiring the current quoted establishment version. The server validates interval choices, lead-time/capacity ranges, active tenant state, and membership.
- Add host-resolved public `GET /api/v1/pickup-slots` for the next seven local dates. It returns a safe availability state (`available`, `schedule_not_configured`, or `no_slots_available`), the saved time zone, slot UTC instants, and remaining capacity. It accepts no tenant selector.
- Extend checkout with an optional pickup-slot instant. Omission means ASAP for older clients; when a schedule is configured, the API resolves and snapshots the earliest available slot. A supplied instant must exactly match a currently available generated slot. A stale/full slot returns a safe conflict without creating an order; the guest reloads availability and selects another time.
- Include the saved pickup instant in the receipt, capability-protected tracking response, staff order summaries/tickets, and order history. Public tracking continues to reveal only its existing minimal status fields plus the pickup instant; it does not reveal customer names, lines, or prices.
- Include the chosen ASAP/scheduled intent in the idempotency fingerprint. The stored receipt remains the source for replay, including its original pickup instant. Existing price, tax, discount, locale, and line-snapshot calculations do not change.
- Extend the real restaurant-settings editor with cadence, lead time, and capacity controls using the existing save/cancel, ETag conflict, pending, error, retry, authorization, and localization patterns. Extend the real guest checkout with an accessible ASAP/scheduled choice, local-date/time slot list, clear empty/unconfigured states, and stale-slot recovery. Keep all new user-facing copy in English and French. Do not claim forecasts or manual order controls.

## Failure handling and boundaries

Invalid settings use the existing safe validation contract; stale settings use the established 412 precondition response. An unconfigured schedule and exhausted availability are explicit safe states. A checkout selection that became unavailable returns a conflict so the guest can refresh choices. Unexpected persistence failures keep the existing safe server-error mapping. Checkout retries preserve tenant-scoped idempotency and never change prices or duplicate reservations. Settings and availability are tenant-scoped, and tests must cover foreign/revoked users and host isolation.

## Verification expectations

Add Domain tests for interval, range, window boundary, lead-time, seven-day horizon, time-zone/DST, and no-schedule rules. Add Application/API tests for authorization, checkout revalidation, idempotent replay, stale/full slots, cancellation release timing, and staff/tracking projections. Add relational tests for persisted reservations and atomic capacity under concurrency; where SQLite cannot establish PostgreSQL concurrent-transaction behavior, run the acceptance against the configured PostgreSQL test database and record the evidence separately. Add EN/FR frontend parser/action/component tests and browser coverage for settings save/conflicts, slot selection, unavailable states, refresh/recovery, responsive layout, and keyboard operation. Review the additive migration before any shared rollout; applying it to Production is a separate operational change.

## Affected documents

- `docs/api/api-contracts.md`
- `docs/database/database-schema.md`
- `docs/architecture/WHITEPLATE_BACKEND_ARCHITECTURE.md`
- `docs/architecture/WHITEPLATE_FRONTEND_ARCHITECTURE.md`
- `docs/planning/restaurant-management-backlog.md`
- `docs/functional-test-plan.md`
- `docs/development-roadmap.md`
- S3 verification audit under `docs/audits/`
