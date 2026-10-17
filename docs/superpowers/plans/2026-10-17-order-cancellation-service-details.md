# K3 — Order cancellation and service details: implementation plan

**Status:** User approved this manual plan and isolated-branch execution. Prepared because the `writing-plans` skill is unavailable.

**Design:** [K3 design spec](../specs/2026-10-17-order-cancellation-service-details-design.md)

**Execution proposal:** Implement on an isolated `feat/k3-order-cancellation-details` branch based on `origin/main`, carrying forward the approved design commit only. The current checkout contains unrelated, unpushed Stripe/settings commits and a dirty settings test; leave that checkout and its untracked directories untouched. Do not deploy the API or apply the migration to a shared database as part of source implementation.

## 1. Add cancellation reason to the versioned domain transition

1. Write failing Domain/API tests for the approved reason set, missing and invalid reasons, reasons supplied for non-cancellation transitions, legacy cancelled rows with no reason, role restrictions, and stale versions.
2. Add `OrderCancellationReason` in Domain and a nullable reason to `Order`. Make the cancellation method require a defined reason and set it together with `Cancelled`, terminal timestamps, and the version increment.
3. Extend `UpdateOrderStatusRequest` and its controller validation. Require the reason only for `Cancelled`; return the standard validation problem for missing, unknown, or misplaced values. Pass the reason through the Application command and `IOrderRepository.TransitionAsync`.
4. Map the new nullable order property and generate an additive EF migration. Review the generated migration and model snapshot; do not backfill old rows or add startup migration behavior.
5. Update existing API/domain fixtures that issue cancellation requests so they provide a valid reason where appropriate.

Primary files: `apps/api/WhitePlate.Domain/Orders/Order.cs`, a new `OrderCancellationReason.cs`, `apps/api/WhitePlate.Api/Contracts/UpdateOrderStatusRequest.cs`, `apps/api/WhitePlate.Api/Controllers/OrdersController.cs`, `apps/api/WhitePlate.Application/Orders/UpdateOrderStatusCommandHandler.cs`, `apps/api/WhitePlate.Application/Orders/OrderCheckoutModels.cs`, `apps/api/WhitePlate.Application/Orders/IOrderRepository.cs`, `apps/api/WhitePlate.Infrastructure/Persistence/Configurations/OrderConfiguration.cs`, and `apps/api/WhitePlate.Infrastructure/Persistence/Repositories/OrderRepository.cs`.

## 2. Project safe notification details in tenant-scoped order reads

1. Add a safe delivery summary containing only event type, delivery state, created time, and accepted time.
2. In both live-order and order-history reads, load delivery rows with one bounded tenant-and-page-order query; never issue per-order queries. Map no recipient, provider ID, message content, attempt count, or failure code.
3. Include nullable cancellation reason and the safe delivery event list in order summaries. Keep the public tracking response and checkout receipt unchanged.
4. Add Infrastructure/API coverage for tenant isolation, actual email state mapping, empty delivery history, and omission of sensitive delivery fields.

## 3. Require a reason through both Orders cancellation paths

1. Update TypeScript types, unknown-value parsers, server action/service payloads, and fixtures for the optional cancellation reason field.
2. Intercept cancellation from both the ticket action and drag-and-drop in the shared Kanban update path. Open one required, controlled RadioGroup dialog before sending the request; if dismissed, leave the order unchanged. After selection, preserve existing pending, focus-restoration, conflict-refresh, and retry behavior.
3. Render service details on completed/cancelled tickets: the saved cancellation reason (or a legacy “not recorded” message), actual S4 notification events with provider acceptance clearly distinguished from inbox delivery, and the approved payment/refund disclosure. Do not render recipient data or financial claims.
4. Add matching English and French catalog entries. Use existing shared dialog, radio, card, and status components and canonical tokens.
5. Add focused component/parser/action coverage and update the Orders browser flow to choose a reason for click and drag cancellation.

Primary files include `apps/frontend/types/orders.ts`, the order dashboard parsers, `apps/frontend/lib/validation/orders.ts`, `apps/frontend/services/orders.ts`, `apps/frontend/actions/orders.ts`, `apps/frontend/components/orders/order-kanban.tsx` with its shared cancellation dialog, `apps/frontend/components/orders/order-ticket.tsx`, both `messages` catalogs, and the corresponding order tests/browser scenario.

## 4. Keep contracts and status documentation aligned

Update `docs/api/api-contracts.md`, `docs/database/database-schema.md`, `docs/architecture/WHITEPLATE_BACKEND_ARCHITECTURE.md`, `docs/development-roadmap.md`, `docs/functional-test-plan.md`, `docs/audits/live-orders.md`, and `docs/README.md`. Record that reasons apply only to new cancellations; email statuses come from S4 records; online guest charges/refunds remain unsupported; the additive migration is generated but not applied to shared environments; and hosted acceptance remains outstanding. Update the existing K3 card with the actual implementation/verification result and leave it in `In review` if hosted acceptance remains open.

## 5. Verification and handoff

From the repository root, run `dotnet test apps/api/WhitePlate.slnx`. From `apps/frontend`, run `npm run test`, `npm run lint`, `npm run typecheck`, `npm run format:check`, and `npm run build` as appropriate. Run the focused Orders browser scenario if its local test environment is available. Record actual commands and results; do not treat source tests as hosted PostgreSQL, email-provider, OAuth, or payment acceptance.

Review the final source diff and migration, preserve unrelated working-tree changes, and commit the implementation with a Conventional Commit message. Push the isolated K3 branch after committing; report the branch, commit, push result, and verification results.

## Implementation outcome and verification

Source implementation is complete on `feat/k3-order-cancellation-details`; the existing project card is in `In review`. New cancellations persist one of the five approved reasons through the existing versioned, role-checked transition. Live and history responses include only tenant-bounded S4 email event summaries (event, state, creation time, provider acceptance time), and completed/cancelled tickets disclose the unsupported online-payment/refund state. The nullable migration `20261017170519_OrderCancellationReason` is generated and remains unapplied.

- `dotnet test apps/api/WhitePlate.slnx --no-restore --verbosity minimal` — passed, 331 tests.
- Frontend Vitest — passed, 99 files and 603 tests.
- Frontend ESLint — passed with 0 errors and 19 existing image optimization warnings in unrelated Lovable components.
- Frontend TypeScript and Prettier checks — passed.
- Orders Kanban Playwright project — passed, 12 tests, including cancellation by button and drag, reason selection/dismissal, keyboard operation and responsive layout.
- Next.js production build — passed with process-only non-secret environment placeholders. Better Auth logged expected schema-connection warnings because no local database was available.
- `git diff --check` — passed.

Verification used Node 24.19.0 with the worktree's offline lockfile install. Cached npm 11.4.1 was used with strict engine enforcement disabled for the temporary install because npm 11.17.0 was unavailable offline; manifests and lockfile are unchanged. npm reported 0 vulnerabilities.

Remaining work is hosted/API deployment and acceptance, applying and verifying the migration on a disposable PostgreSQL database, real authenticated cross-tenant browser acceptance, email-provider retry/delivery checks, and a separately approved guest-payment/refund ledger design. No production database migration, charge, refund, or deployment was performed.
