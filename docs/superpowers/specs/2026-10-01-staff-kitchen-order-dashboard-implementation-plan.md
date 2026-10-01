# Staff kitchen order dashboard implementation plan

Status: Approved for implementation on 2026-10-01; implementation and verification are in progress.

Design: [Staff kitchen order dashboard design](2026-10-01-staff-kitchen-order-dashboard-design.md)

## Execution approach

Implement the vertical slices serially on the existing `feat/staff-kitchen-order-dashboard` branch. Use test-first changes for the API contract/projection, frontend request helper, token route, status action, and realtime behavior. Keep the existing `apps/frontend/.env.example` user edit out of all commits. Run the focused tests after each slice, then the full checks below. No new infrastructure or production setting is part of this feature.

## Tasks

### 1. Extend the authorized paged order summary with saved ticket lines

**Files:** `apps/api/WhitePlate.Application/Orders/OrderCheckoutModels.cs`, `apps/api/WhitePlate.Infrastructure/Persistence/Repositories/OrderRepository.cs`, and `apps/api/tests/WhitePlate.Tests/Api/OrdersEndpointTests.cs`.

1. Add an endpoint test that creates an order with a product and selected option, creates the authorized staff membership, calls the tenant order list, and asserts the response includes the saved product name, quantity, and option name/ID.
2. Add a pagination case and assert the ticket fields survive the next cursor page; retain existing authorization checks.
3. Run the targeted API test and observe the missing-field failure.
4. Add small summary line/option DTOs and project only persisted snapshot fields from order lines/options in the repository. Do not look up current catalog names. Keep tenant filtering, status filtering, ordering, cursor semantics, and page limits unchanged.
5. Run the targeted API tests and then the full API solution tests.

### 2. Add an authenticated server-side PATCH capability with a constrained version header

**Files:** `apps/frontend/lib/api/request-factory.ts` and `request-factory.test.ts`.

1. Add a test showing a PATCH request sends its JSON body, bearer token, and quoted `If-Match` value while preserving the factory's `no-store`, `credentials: omit`, and `redirect: error` defaults.
2. Add a `patch` method and a typed `ifMatch` request option. Do not permit arbitrary caller-supplied authorization headers. Include PATCH in safe diagnostic method typing.
3. Run `npm test -- lib/api/request-factory.test.ts` from `apps/frontend` and ensure existing request-method and safe-error tests pass.

### 3. Implement and test the status mutation server action

**Files:** new `apps/frontend/lib/order-actions.ts` and its Vitest coverage.

1. Add tests for malformed tenant/order IDs, invalid status/version input, correct PATCH path/body/If-Match, and safe handling of API `409`, `412`, and authorization errors.
2. Implement strict input validation and call `whitePlateApi.patch` with the known version. Preserve the API as the source of role and lifecycle decisions. Return only typed safe messages and current server data needed by the page.
3. Run action tests plus API-factory tests.

### 4. Add the same-origin SignalR token route

**Files:** new `apps/frontend/app/api/kitchen/signalr-token/route.ts` and route tests.

1. Test missing session, unverified email, absent or mismatched Origin, and a verified same-origin request. The successful response must contain the short-lived token and `Cache-Control: no-store`; failures must not mint or expose a token.
2. Implement POST-only route handling. Derive trusted origin from `BETTER_AUTH_URL` (local default consistent with `lib/api/index.ts`), require exact request Origin equality, get the session from request headers, require verified email, and call `auth.api.getToken` only after those checks.
3. Return JSON with no-store headers and no CORS grant. Do not include tenant ID or tenant permission in the token response.
4. Run route tests.

### 5. Build the server-rendered order page and authenticated mutation flow

**Files:** new route/page and client component under `apps/frontend/app/[locale]/organization/orders/`, the organization landing page, and both `apps/frontend/messages/en.json` and `fr.json`.

1. Add pure-function tests for tenant/status query parsing, cursor handling, role-appropriate action availability, and mapping API results to empty, loaded, stale, or failed view state. The frontend currently has no React Testing Library, DOM test environment, or Playwright config; do not add a test dependency just to render components.
2. Implement a server page that checks session and verified email, validates tenant/status query values, fetches the initial authorized order page with `whitePlateApi`, and never caches tenant order data. A denied tenant ID must render no order data.
3. Render a clear status-filtered ticket list from server snapshots. Preserve the cursor for the selected status and provide an explicit load-older action when a next cursor exists. Do not add drag-and-drop or catalog re-translation.
4. Add a localized entry from each restaurant membership in `/api/v1/me`. Keep menu-language settings limited to their current manager/owner roles.
5. Add localized accessible labels, status names, connection text, empty/error/retry messages, stale/conflict messages, and mutation labels in both catalogs.
6. Wire status changes to the server action. On successful mutation, update or refresh from the API response. On `409`/`412`, reload current REST state; never advance optimistically.
7. Run relevant Vitest tests and frontend typecheck. Verify the rendered empty, loaded, error, and status-action states through the browser acceptance check below.

### 6. Add SignalR connection lifecycle, isolation, deduplication, and REST recovery

**Files:** new client-side realtime hook/module and its unit tests, plus the orders page/component.

1. Add tests using a mocked SignalR connection for exact selected-tenant join, cleanup when tenant changes/unmounts, event tenant filtering, duplicate event IDs, stale versions, burst coalescing, reconnect rejoin, and authoritative REST refresh after reconnect.
2. Implement a SignalR client connection to the configured API `/hubs/orders` URL using `@microsoft/signalr`, automatic reconnect, and a token factory that POSTs to the same-origin token route. Keep the token in memory only.
3. Join only the selected restaurant group after connect/reconnect. On cleanup, stop the previous connection. Do not accept a group name from the client.
4. Treat `order.changed` only as a cue to refresh the server-rendered REST data. Filter to the selected tenant, bound deduplication state, coalesce bursts, and do not let older versions regress state.
5. On reconnect, rejoin and immediately refresh through REST. Show live connection status without hiding loaded tickets or blocking API-validated actions.
6. Run the realtime unit tests and relevant page tests.

### 7. Synchronize contracts, architecture, and acceptance documentation

**Files:** `docs/api/api-contracts.md`, `docs/architecture/WHITEPLATE_FRONTEND_ARCHITECTURE.md`, `docs/architecture/WHITEPLATE_SYSTEM_ARCHITECTURE.md`, `docs/development-roadmap.md`, and `docs/functional-test-plan.md`.

1. Update the order list contract with ticket line/option fields and state that these are persisted order snapshots.
2. Document the staff orders page, server action, same-origin SignalR token flow, tenant scoping, event-as-refresh-hint behavior, and reconnect REST recovery as implemented only after the code and tests prove it.
3. Add functional acceptance cases for two-tenant dashboard isolation, status concurrency, event deduplication, reconnect recovery, and locale copy. Separate automated results from live/staging checks.
4. Update the roadmap and board card with actual implementation and verification evidence; keep the card out of Done while any required acceptance or live check remains open.
5. Review all documentation for consistency with runtime code; do not describe unrun live or production behavior as verified.

### 8. Run the complete checks and hand off

From `apps/frontend`, run and record each result:

```text
npm test
npm run lint
npm run typecheck
npm run build
```

From the repository root, run and record:

```text
dotnet test apps/api/WhitePlate.slnx
```

Follow the functional test plan for authorized two-tenant browser/SignalR behavior where the local configuration supports it. Verify the rendered dashboard in a browser using existing installed tooling; do not add a test dependency solely for this. Do not use production credentials or alter production settings. If a live/staging prerequisite remains unavailable, document it and keep the card In progress. Commit the completed feature with a Conventional Commit message and push the existing branch after required checks; preserve and leave the `.env.example` edit unstaged.

## Review checkpoints

1. User approves this plan and execution approach before implementation starts.
2. After API, frontend, and docs changes, self-review the complete diff against the approved design and scoped instructions.
3. Report exact test commands and results, commit/push, remaining live checks, and final kanban status.
