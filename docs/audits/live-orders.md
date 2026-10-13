# K1 Live Orders verification and rollout

**Status:** implementation is in source. Frontend/API test acceptance and shared database rollout remain open.

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
- Manual/phone order entry, K2 timers/sound/preparation stations and K3 cancellation/payment/refund behavior remain out of this K1 implementation.

## Verification

- `dotnet build apps/api/WhitePlate.Api/WhitePlate.Api.csproj --no-restore` — passed with 0 warnings and 0 errors. An earlier build attempt caught expression-tree null-propagation errors in the new summary projection; those were fixed before the successful build.
- `dotnet ef migrations add OrderPickupMode --project apps/api/WhitePlate.Infrastructure/WhitePlate.Infrastructure.csproj --startup-project apps/api/WhitePlate.Api/WhitePlate.Api.csproj --output-dir Persistence/Migrations` — passed and generated `20261013191310_OrderPickupMode` plus the updated model snapshot.
- Frontend tests, lint, typecheck, build, API tests, browser responsive/keyboard/zoom acceptance and hosted SignalR acceptance were not run for this handoff.
- No database migration was applied and no hosted restaurant data was changed.

## Remaining rollout work

- Review and apply `20261013191310_OrderPickupMode` through the normal migration process after the S3 pickup-scheduling migrations. Until then, deploys must not run code expecting the new column; existing pickup-mode values remain unrecorded.
- Verify the migration on a disposable PostgreSQL branch, old-row null compatibility, new ASAP and explicit-slot round trips, and authorized cross-tenant summary reads.
- Run localized frontend tests and responsive/browser acceptance for search, pickup filters, pagination preservation, keyboard controls, 200% zoom and the 320–wide-desktop viewport matrix.
- Complete hosted SignalR delivery and reconnect acceptance tracked by its existing project card.
