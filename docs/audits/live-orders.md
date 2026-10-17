# K1 Live Orders verification and rollout

**Status:** implementation is merged and deployed to Coolify Production at `299b29d`; the nullable pickup-mode migration is applied. Hosted acceptance remains open.

## Implemented

- The real restaurant Orders route keeps its existing authorized five-lane lifecycle board, REST transitions, drag and keyboard actions, version guards, SignalR refresh hints, reconnect recovery and order-history boundary.
- Search matches loaded order references, customer names, saved product names and saved modifier names. ASAP/Scheduled/Unrecorded controls filter only the current loaded REST page; counts disclose that scope, and status/cursor links preserve the active filters.
- Orders now snapshot the guest's pickup intent as nullable `PickupMode`. The checkout's omitted `pickupAt` choice is saved as `Asap`; an explicit slot is saved as `Scheduled`. Staff order summaries and history return the field. Older orders remain null because a resolved pickup timestamp cannot recover the original choice.
- Tickets show the recorded mode, and five 18rem-minimum lanes auto-fit the available workspace width. Empty-page and no-filter-match states remain distinct. User-facing copy is localized in English and French.

## Decisions

- Default pickup filter: All. Lifecycle remains the primary lane grouping, with Pending, Preparing, Ready, Completed and Cancelled visible in the same board.
- Completed and Cancelled orders remain in Live Orders until the existing daily archival removes them from the kitchen list; Order History remains the historical view.
- Search and pickup filtering operate on the loaded REST page. Users can load older pages to continue searching; displayed counts do not imply restaurant-wide totals.
- Legacy/null pickup intent is shown as Unrecorded. No ASAP claim is inferred from `PickupAt`.
- Manual/phone order entry and K2 timers/sound/preparation stations remain outside this K1 implementation. K3 cancellation/service details are recorded below.

## Verification

- `dotnet build apps/api/WhitePlate.Api/WhitePlate.Api.csproj --no-restore` — passed with 0 warnings and 0 errors. An earlier build attempt caught expression-tree null-propagation errors in the new summary projection; those were fixed before the successful build.
- `dotnet ef migrations add OrderPickupMode --project apps/api/WhitePlate.Infrastructure/WhitePlate.Infrastructure.csproj --startup-project apps/api/WhitePlate.Api/WhitePlate.Api.csproj --output-dir Persistence/Migrations` — passed and generated `20261013191310_OrderPickupMode` plus the updated model snapshot.
- GitHub Actions `push` and `pull_request` workflows passed on `82a4b85`: 77 frontend test files and 484 tests passed, lint/typecheck/format/build passed, and API tests passed. CI caught synchronous filter-state updates in effects; `e526f7f` replaced them with prop-aware local drafts. ESLint reported 10 existing `<img>` performance warnings in Lovable components outside this feature.
- A second local API build after adding the pickup-mode invariant tests could not write a generated `obj` cache (access denied); the original feature build succeeded. No generated files were edited.
- On 2026-10-13, production migration history confirmed the three S3 pickup migrations were already applied and `Orders` had zero rows. A 68.5 KiB in-container `pg_dump -Fc` snapshot was created at `/tmp/whiteplate-before-order-pickup-mode-20261013.dump`, then `20261013191310_OrderPickupMode` was applied transactionally. The nullable `Orders.PickupMode` column and EF migration history row were verified.
- This shared-database rollout followed the user's explicit request. A disposable PostgreSQL migration test and off-host backup/restore check were not available in this rollout; the in-container snapshot is not a restore test.
- Coolify deployed merged commit `299b29d` on 2026-10-13. The image build completed, `/health/ready` passed on the new container, and the rolling update removed the old container. No order rows existed when the migration was applied.

## Remaining rollout work

- Verify the migration on a disposable PostgreSQL branch, old-row null compatibility, new ASAP and explicit-slot round trips, and authorized cross-tenant summary reads.
- Complete localized frontend tests and responsive/browser acceptance for search, pickup filters, pagination preservation, keyboard controls, 200% zoom and the 320–wide-desktop viewport matrix.
- Complete hosted SignalR delivery and reconnect acceptance tracked by its existing project card.

## K3 cancellation and service details

**Status:** Implemented in source on `feat/k3-order-cancellation-details`. The nullable migration is generated but has not been applied to a shared database. API deployment and hosted PostgreSQL/browser/provider acceptance remain open.

- New cancellations require `CustomerRequest`, `ItemUnavailable`, `RestaurantUnableToFulfill`, `DuplicateOrder`, or `Other`. The reason is saved with the terminal status, closed timestamp, version change and outbox event under the existing owner/manager and `If-Match` rules. Old cancelled rows remain null and show “not recorded.”
- The ticket action and drag-to-cancel both request the same required reason before calling the server. Dismissing the dialog leaves the order unchanged.
- Terminal ticket email details are mapped from actual S4 delivery rows. Only event type, state, creation time and provider acceptance time are sent. Provider `Accepted` is not presented as inbox delivery; absence of records does not imply whether updates were requested. Recipient addresses, provider IDs, message snapshots, attempts and failure codes remain private.
- WhitePlate has no online order payment or refund ledger. The ticket says no online payment record exists and offline settlement/refund activity is not tracked. No paid/unpaid/refunded state or financial mutation is introduced.
- The generated migration is `20261017170519_OrderCancellationReason`; no startup migration or data backfill is added.

Focused API tests cover required/invalid reasons and safe list/history email projections; focused frontend tests cover reason validation and safe delivery-state parsing.

### Verification (2026-10-17)

- `dotnet test apps/api/WhitePlate.slnx --no-restore --verbosity minimal` — passed: 331 tests, 0 failures.
- From `apps/frontend`, `node node_modules/vitest/vitest.mjs run` — passed: 99 files and 603 tests.
- From `apps/frontend`, `node node_modules/eslint/bin/eslint.js .` — passed with 0 errors and 19 existing `@next/next/no-img-element` warnings in unrelated Lovable components.
- From `apps/frontend`, `node node_modules/typescript/bin/tsc --noEmit` — passed.
- Prettier check over changed frontend TypeScript, TSX and JSON files — passed.
- `WHITEPLATE_ACCEPTANCE_URL=http://localhost:3039 node node_modules/@playwright/test/cli.js test --project=orders-kanban` — passed: 12 tests. Coverage includes click and drag cancellation, the required reason dialog, dismissal without mutation, English/French copy, keyboard interaction and responsive lanes. The stale column-count assertion was aligned with the existing 18rem auto-fit grid; no responsive layout behavior changed.
- `node node_modules/next/dist/bin/next build --webpack` — passed using process-only, non-secret build placeholders. Next emitted Better Auth schema-connection warnings because no local database was running; page generation and build tracing completed successfully.
- `git diff --check` — passed.

The isolated worktree used an offline install from the existing lockfile with Node 24.19.0 and cached npm 11.4.1. The project asks for npm 11.17.0, which was not cached, so strict engine enforcement was disabled for that temporary install only. No package manifest or lockfile changed; npm reported 0 vulnerabilities. The original checkout's dependency folder was left untouched.

The generated migration `20261017170519_OrderCancellationReason` has not been applied. Production deployment, disposable/shared PostgreSQL migration checks, authenticated real-route browser acceptance, email-provider retries and delivery acceptance, and any guest-payment/refund ledger remain open. The project card is in `In review`; hosted acceptance and the future payment/refund design remain unchecked.
