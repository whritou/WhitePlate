# Decision 0011: dashboard ordering operations

Date: 2026-10-14
Status: Approved by the user for D3 implementation.

## Context

The restaurant dashboard needs persisted controls that affect the public pickup schedule and guest checkout. D3 left editor roles, rush delay and expiry, and the effect on existing orders and reservations open. These controls must remain tenant-scoped and safe across simultaneous staff updates and guest checkout requests.

## Decision

- Restaurant owners and managers may change the ordering controls. Kitchen members may read their current state but cannot change it.
- Rush hold is a fixed ten-minute buffer added to the configured pickup minimum lead time when generating new pickup slots. It stays active until an owner or manager clears it; there is no automatic expiry.
- Emergency pause hides all public pickup slots and blocks new checkout orders. Resuming allows new checkout using the current schedule.
- Existing orders, pickup reservations and their slot-capacity usage do not change. A retry of an already accepted idempotent checkout continues to return its original receipt.
- Each tenant stores `AcceptingOrders`, `RushHoldEnabled` and an `OrderingOperationsVersion`. Conditional versioned writes reject stale staff edits. Checkout shares a database row lock with those writes so pause and order creation have a defined serialization point.
- Staff dashboards read current state without caching and poll every 15 seconds. Public pickup availability is no-store and includes the pause/rush state so guest checkout can explain it.

## Consequences

The rush duration is intentionally not configurable and the hold does not expire by time. There is no transition or cancellation of an accepted order when service is paused. A public storefront may have been open in a guest browser before the pause, so the checkout API remains authoritative and rejects a new request after the pause wins the row-lock race.

The migration is additive with defaults that preserve existing behavior: accepting orders and no rush hold. Migration application, independent PostgreSQL concurrency evidence, hosted API/frontend deployment, and multi-session browser acceptance remain rollout work. The API does not apply migrations at startup.

## Alternatives considered

- Kitchen-triggered changes were excluded; Kitchen has visibility only.
- An automatic or scheduled expiry was excluded in favor of a clear manual hold that cannot resume ordering unexpectedly.
- Rewriting existing reservations or orders on pause was excluded because the request only concerns new demand and the accepted schedule snapshot must remain stable.

## Affected documents

- [Restaurant management backlog](../../planning/restaurant-management-backlog.md#d3--restaurant-dashboard-rush-hold-and-emergency-ordering-pause)
- [API contracts](../../api/api-contracts.md#d3-dashboard-rush-hold-and-emergency-pause--implemented-in-source-migration-rollout-pending)
- [Database schema](../../database/database-schema.md#d3-persisted-ordering-controls--2026-10-14)
- [D3 verification](../../audits/dashboard-rush-pause.md)
