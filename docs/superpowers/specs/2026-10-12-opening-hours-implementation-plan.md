# S2 weekly opening hours implementation plan

12 October 2026. The design and written specification are approved. The user requested implementation in the current chat and clarified that each weekday can have different hours. Plan review is pending before code changes.

## Task 1 — Add the weekly schedule to the tenant domain

- Add an optional normalized weekly schedule to the existing `Tenant` aggregate and JSON persistence property. Null remains distinct from an explicitly saved closed week.
- Define weekdays as ISO Monday=1 through Sunday=7. Store each day's own closed flag and windows; never infer one day's hours from another.
- Validate exactly seven unique days, closed/open consistency, no more than eight windows per day, `HH:mm` boundaries, ascending order, positive ranges and no overlap. Permit adjacent windows and `24:00` only as an end.
- Ensure invalid saves do not mutate the aggregate and clearing removes only the saved hours.

## Task 2 — Add authorized conditional management operations

- Include nullable `openingHours` in the existing owner/manager management GET and preserve it in the returned establishment version/ETag.
- Keep the existing scalar establishment PUT from changing opening hours, so older clients cannot clear a new field accidentally.
- Add owner/manager `PUT /api/v1/tenants/{tenantId}/opening-hours` for a complete schedule and `DELETE` to clear it. Require the existing positive quoted `If-Match` version on both operations.
- Validate active tenant ownership on every operation. Persist hours and increment the shared establishment version atomically; reject stale versions with existing 412 behavior.
- Bound the API request body to 64 KiB and return field-level validation errors through the existing problem contract.

## Task 3 — Persist and expose the public schedule

- Map nullable `Tenants.OpeningHoursJson` with no fabricated default and generate an additive EF migration. Do not edit generated migration or snapshot files by hand.
- Extend `PublicEstablishmentDto` with nullable normalized opening hours and the existing IANA timezone. Project it only from the host-resolved tenant in `GET /api/v1/menu`; preserve no-store behavior and tenant isolation.
- Keep menu catalog, pickup details, ordering and checkout rules unchanged. S3 remains responsible for slot generation and checkout enforcement.

## Task 4 — Connect the frontend settings editor

- Extend the management contract/parser, query/service/BFF boundary, server action and establishment form props with opening hours and the current ETag.
- Add an Opening hours section to the existing restaurant settings route, with seven independent day cards/rows, closed toggles and add/remove window controls.
- Add explicit copy/apply that selects targets, lists affected days and changes only the unsaved draft. Cancel restores the saved baseline. Save/clear use the conditional operations and preserve dirty edits through validation, transient failures and version conflicts.
- Add all visible copy to English and French. Follow the current light workspace recipe, shared controls, focus handling, 44px desktop/48px tablet controls, responsive reflow and distinct not-configured state.

## Task 5 — Show saved hours to guests

- Add an accessible weekly hours view to the real public storefront using only the host-resolved menu response.
- Render every weekday's own state and windows in the restaurant timezone. Show a localized not-configured state when the schedule is null. Do not calculate open-now status, promise pickup time or disable checkout from these hours.

## Task 6 — Update contracts and handoff evidence

- Update API contracts, database schema, backend/frontend architecture, development and functional acceptance documentation, and add an S2 audit with actual outcomes and remaining shared-database/hosted work.
- Keep production migration application and deployment separate from source implementation. Keep the S2 board In progress until implementation is complete; record actual verification before moving it to In review.
- Review generated migration SQL and inspect the full diff. Preserve the unrelated untracked `.cloudflare/` directory.
