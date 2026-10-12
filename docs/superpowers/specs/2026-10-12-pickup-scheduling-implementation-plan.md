# S3 pickup scheduling implementation plan

12 October 2026. Execution selected by the user after approving the design. This plan was prepared directly because the optional planning skill was unavailable.

## Work sequence

1. **Domain rules and red tests**
   - Add tenant pickup settings with approved defaults and validation.
   - Implement pure slot generation from weekly opening windows, IANA timezone, UTC `now`, lead time, horizon, and slot usage.
   - Cover missing/all-closed schedules, allowed intervals/ranges, window alignment/closing boundaries, lead time, seven local dates, spring gaps, fall folds, full slots, and ASAP selection.
2. **Order and persistence model**
   - Add nullable historical-compatible pickup-time snapshots to orders and DTO projections.
   - Add tenant-scoped per-slot usage plus one reservation per order, with migrations and indexes.
   - Extend checkout and cancellation repositories so reservation, counters, order, idempotency, and outbox changes are transactional and capacity is atomically bounded.
   - Prove capacity release and duplicate/replay behavior with relational/API tests; use PostgreSQL acceptance for true concurrent transactions if SQLite cannot prove the race behavior.
3. **Application and HTTP contracts**
   - Add owner/manager pickup-settings update through the establishment version/If-Match boundary.
   - Add public host-resolved availability; no browser-selected tenant ID.
   - Revalidate ASAP or exact selected slot inside checkout, preserve all current pricing rules, and map stale/full/schedule-required states safely.
   - Project pickup time onto receipts, status-only tracking, staff list/history summaries, and kitchen tickets.
4. **Frontend integration**
   - Add strict types/parsers, server services, BFF handlers, validated actions, and both EN/FR catalogs.
   - Add pickup controls to the real restaurant settings route using the existing editor/save/conflict patterns.
   - Add ASAP/scheduled slot choice and refresh/recovery to the real storefront checkout; format local instants and distinguish repeated DST times by offset.
   - Cover parser/action/component and browser flows, keyboard use, no-schedule/full states, and mobile/responsive behavior.
5. **Documentation and handoff**
   - Generate and review the additive migration; do not apply it to shared or production databases.
   - Update API/schema/architecture/roadmap/test-plan/backlog docs and add an audit with actual verification results.
   - Run the API and frontend checks that apply, inspect the final diff, commit with Conventional Commits, and push the task branch when remote access permits.
   - Keep the S3 card In progress or In review until the source scope and its required acceptance are complete; never claim hosted persistence or checkout verification from fixtures.

## Execution constraints

- Start each behavior with a failing test, then implement the smallest change that passes it.
- Keep the existing untracked `.cloudflare/` directory untouched.
- Preserve the existing branch ancestry and do not change production or shared database state.
- Reuse the existing API/BFF request boundaries and design-system controls; keep all user-facing copy in English and French.
