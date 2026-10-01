# Staff kitchen order dashboard design

Status: Approved in conversation on 2026-10-01. Source implementation and verification are tracked by the companion implementation plan; browser acceptance and production configuration remain open.

## Intent

Give verified restaurant staff an authenticated, tenant-scoped view of current orders, safe lifecycle controls, and reliable updates during connection loss. The scope follows the existing kanban card “Build staff kitchen order dashboard with live recovery.” It does not include the separately tracked implementation of localized checkout snapshots or production hosting work.

## Current system

- `GET /api/v1/tenants/{tenantId}/orders` returns a cursor-paginated summary and authorizes organization owners, restaurant managers, and kitchen staff against current membership. The summary currently has no order lines.
- `PATCH /api/v1/tenants/{tenantId}/orders/{orderId}/status` applies server lifecycle and role rules and requires a quoted `If-Match` version. A stale version returns `412`; invalid transitions return `409`.
- `/hubs/orders` accepts an authenticated JWT. `JoinRestaurant(tenantId)` checks membership on the server. The server sends at-least-once `order.changed` events with event ID, tenant, order, event type, status, and version.
- The Next.js app has a server-only API request factory that obtains a verified user's short-lived Better Auth JWT. It currently supports GET, POST, PUT, and DELETE, but not PATCH or custom headers.
- The frontend has no order dashboard or SignalR connection. `@microsoft/signalr` is already installed. The authenticated organization page reads restaurant IDs, names, and roles from `/api/v1/me`.
- Current order line and option names are saved snapshots, but the effective menu locale has not yet been implemented. The dashboard displays the labels stored with each order and does not retranslate them.

## Approved architecture

Use a server-backed dashboard with SignalR notifications. The existing API remains the authority for order reads, tenant membership, lifecycle rules, and persistence. SignalR events are refresh hints; clients reload REST state after a reconnect and whenever an event indicates that the queue may have changed.

The browser may obtain a short-lived API JWT only through an authenticated, same-origin Next.js endpoint for the SignalR connection. The token stays in memory, is never placed in persistent browser storage, and is requested again as SignalR establishes or re-establishes its connection. The API continues to authorize each restaurant-group join from persisted membership.

## Components and data flow

1. Add a locale-aware staff orders page below the authenticated organization area. Link to it for each restaurant returned by the authenticated `/api/v1/me` response. The restaurant ID in the route selects the resource; it is not permission. A denied or unknown tenant shows no order data.
2. The server page checks the Better Auth session and verified-email requirement, then loads an initial tenant-scoped order page through `whitePlateApi`. Use `no-store`; do not share order data between users, tenants, or locales.
3. Add line and option snapshots to the paged order summary contract: product ID and saved product name, quantity, and each selected option's ID and saved name. These fields are read-only order snapshots; do not look up current catalog labels to render old tickets. Preserve cursor pagination and the existing tenant authorization checks.
4. Add a same-origin POST route, for example `/api/kitchen/signalr-token`. It requires a verified Better Auth session, rejects a mismatched `Origin`, returns the API JWT with `Cache-Control: no-store`, and has no cross-origin access. It issues no tenant-specific permission. The API still checks membership in `JoinRestaurant`.
5. The client connection targets the configured browser-reachable API hub URL, uses the token endpoint as SignalR's access-token factory, and joins only the restaurant currently displayed. An initial REST reload after connection closes the gap between server-rendered data and hub subscription.
6. `order.changed` notifications are validated against the selected tenant, deduplicated by event ID, and ignored when their version is not newer than the known version for that order. A new or newer event schedules a coalesced REST refresh. Events never replace order or ticket data directly.
7. Status controls call an authenticated Next.js server action. Extend the server-only API request factory to support PATCH and an `If-Match` header. The action uses the user's current verified session; the API independently rechecks tenant membership and role. Only show transitions allowed for the current role and status; the API remains the final validator. Do not optimistically advance a ticket.
8. For a status-filtered view, keep each query's cursor with that status and offer a way to load older tickets. Refresh the affected queue after a mutation. Final visual grouping or list treatment is left for the implementation plan and spec review; no drag-and-drop is in scope.

## Error and recovery behavior

- Show empty queue and load failure as different states. On a transient refresh failure, keep already loaded tickets visible as stale and expose retry.
- Display the SignalR connection state. A live-connection failure does not hide loaded orders or disable server-validated status actions.
- After reconnect, rejoin only the selected restaurant, then reload the authoritative REST page(s). Do not imply that the event stream is a durable client-side queue.
- Coalesce event bursts. Bound the event-ID deduplication state to the active client session and selected tenant.
- After `412` or lifecycle `409`, reload current REST state and show a translated conflict message. Other API failures also keep the API response authoritative and avoid optimistic state changes.
- Keep user-visible text in both English and French. Session expiry follows the app's existing sign-in behavior. Do not expose raw server exception details.

## Security and deployment boundaries

- Browser-supplied tenant IDs are selectors only. Reads, mutations, and `JoinRestaurant` must remain membership-authorized by the API.
- The token route is same-origin, authenticated, verified-email-only, POST-only, and non-cacheable. The JWT is short lived, scoped to the existing API audience, and contains no tenant grant.
- The browser needs an HTTPS-reachable hub URL and the API must allow the configured frontend origin for SignalR negotiation. Production domains, CORS, proxy behavior, and deployment verification remain within the separate hosting/operations task; this feature does not change production configuration.
- Keep API signing credentials and server secrets on the server. The public API URL may be passed to the browser if needed, but no secret may be exposed as `NEXT_PUBLIC_*`.

## Verification plan

- API tests verify tenant-authorized order summaries include saved line/option labels and quantities across cursor pages, without weakening existing foreign-tenant, membership, role, lifecycle, or concurrency behavior.
- Frontend tests cover empty versus failed load, translated states, tenant isolation, status conflict reload, no optimistic mutation, event ID/version handling, event coalescing, and REST reload after reconnect/rejoin.
- Token-route tests cover absent/unverified sessions, mismatched origin, successful same-origin response, and no-store headers.
- Run frontend lint, typecheck, unit tests, and build as appropriate; run `dotnet test apps/api/WhitePlate.slnx` for the API changes. Record exact commands and results.
- Keep the kanban card In progress until implementation acceptance criteria and verification are complete. Record live two-tenant browser/SignalR verification and any production-only checks separately; automated tests do not claim those live checks.

## Acceptance criteria

1. A verified staff member can open the order view only for a tenant the API authorizes for that member.
2. Tickets show the server-saved product and option names, quantities, status, and version needed for the kitchen workflow.
3. Status changes include the known version in `If-Match`; stale or invalid transitions reload authoritative state and present a useful localized message.
4. A restaurant receives its own `order.changed` notifications only. Duplicate and stale events do not regress visible state.
5. On disconnect and reconnect, the client rejoins the currently selected authorized tenant and recovers changes through the REST endpoint.
6. English and French cover all new visible states and errors. Existing orders continue to display their saved labels without inferred menu locale.
7. The kanban card records completed checks and remaining live or production verification before it moves to Done.

## Implementation detail

The initial page is implemented as a status-filtered ticket list with cursor pagination; drag-and-drop is out of scope. The production API hub URL and SignalR CORS behavior must be confirmed against deployment configuration before browser verification against a hosted environment.
