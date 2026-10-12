# S3 pickup scheduling verification

**Status:** implemented in source; shared database rollout and hosted acceptance remain open.

## Implemented

- Restaurant-local pickup slots follow saved S2 opening windows, the approved rolling horizon, interval, minimum lead time, and capacity settings.
- Public availability is resolved from the request host and is not cached. Checkout requires saved opening hours, resolves ASAP to the earliest available slot, and rejects unavailable or full selections.
- Successful order creation reserves slot capacity transactionally with the order, idempotency record, and outbox event. Replayed checkout does not reserve twice. Cancellation releases capacity only when committed before pickup starts.
- New orders carry the pickup instant and timezone snapshot through receipts, tracking, and staff views. Older orders retain an unknown pickup time.
- Restaurant settings expose interval, lead time, and per-slot capacity with the approved defaults and bounds.

## Verification

- `dotnet test apps/api/WhitePlate.slnx --no-restore` — passed, 251 tests.
- `npm run test` from `apps/frontend` — passed, 77 test files and 484 tests.
- `npm run typecheck` from `apps/frontend` — passed.
- `npm run build` from `apps/frontend` — passed with temporary placeholder production environment values. Better Auth could not connect to the local placeholder database during build-time schema validation; no database was available and no migration was applied.
- Targeted ESLint on changed frontend files — passed. A full lint rerun was started, but its process ended before the final result could be collected; do not treat the full lint command as verified.
- `git diff --check` — passed; only Git line-ending conversion notices were emitted.

## Rollout and acceptance still required

Three additive EF migrations have been generated and reviewed but not applied to shared PostgreSQL. Apply them through the normal reviewed deployment process, then verify the migration against the deployed schema. Exercise concurrent checkout requests against PostgreSQL to confirm the conditional capacity increment prevents overselling. Run hosted browser acceptance for saved-hours enforcement, slot selection, receipts/tracking, and owner/manager scheduling settings. These checks are not represented by the local unit suite or frontend build.
