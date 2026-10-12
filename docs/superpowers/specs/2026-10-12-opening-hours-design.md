# S2 weekly opening hours design

12 October 2026. Status: design and written specification approved; implementation plan review pending.

## Intent and approved scope

Owners and restaurant managers need to publish accurate weekly restaurant hours. Guests need to see those hours in the public restaurant menu. The user approved the S2 design: seven explicit weekdays, closed days, one or more local-time service windows, continuous service as one window, explicit copy/apply into an editable draft, persisted owner/manager-authorized changes with concurrency protection, and public menu disclosure.

The schedule is a weekly wall-clock schedule in the restaurant's saved S1 IANA timezone. Existing tenants use the S1 default of `UTC`; the browser timezone and address are never used to infer it. Windows cannot span midnight. An end of `24:00` means midnight at the end of that day and is valid only as a closing time. During a fall-back DST transition, a scheduled repeated wall-clock interval applies to both occurrences. A spring-forward gap has no matching local times. The weekly schedule itself does not shift or change at DST transitions.

Holidays, date-specific closures/overrides, overnight windows, pickup-slot generation, checkout enforcement, scheduling promises, and automatic open/closed status in the storefront are outside S2. Hours describe service availability; S3 will define when guests can order and collect. Existing restaurants with no saved schedule remain **not configured**, rather than being represented as closed.

## Source evidence and selected approach

- `Tenant` already owns establishment identity and the timezone added by S1.
- `EstablishmentSettingsHandler` independently authorizes owner and restaurant-manager reads/writes. Its version and `If-Match` flow provide optimistic concurrency.
- The public tenant menu is resolved by validated host and already includes `PublicEstablishmentDto`; this is the authoritative guest-facing boundary.
- The real restaurant settings route and localized editor already provide account/tenant-scoped reads, save/cancel drafts, request retry, conflict handling, and workspace navigation.

Keep the schedule on `Tenant` as a single optional JSON column, with invariants in the Domain and authorized management through the existing establishment settings use case. This retains one tenant-owned source of truth and avoids creating a second aggregate or a second settings concurrency token. The existing establishment version advances when either S1 fields or S2 hours change, so a stale editor cannot overwrite a newer save. The public menu projection reads the saved schedule and timezone from the host-resolved tenant.

An optional schedule distinguishes unconfigured legacy restaurants from an explicitly saved seven-day schedule. Once configured, all seven days are present, including closed days. A persisted schedule may have all days closed; that is an explicit operator choice, not the legacy default.

## Stored model and validation

`OpeningHoursJson` is nullable on `Tenants`. Null means no weekly schedule has been saved. A configured value contains exactly seven unique ISO weekdays (`1` Monday through `7` Sunday); each day has its own independently editable closed/open state and its own windows. Monday's windows do not determine Tuesday's hours. Copying is an optional draft convenience, never a weekly default. A closed day has no windows and an open day has one or more windows. No migration backfill fabricates business hours.

Each window has a start and an end in 24-hour `HH:mm` wall-clock format. Start accepts `00:00` through `23:59`; end accepts `00:01` through `24:00`. Each window must start before it ends. A day accepts at most eight windows. Windows must be supplied in ascending start order and must not overlap; adjacent windows are allowed. Windows are half-open (`start` inclusive, `end` exclusive), so adjacent services such as `11:00–14:00` and `14:00–17:00` do not overlap. `24:00` is a closing boundary only. A day ending at `24:00` does not continue into the next day; the next day must explicitly contain its own hours. The request limit is 64 KiB and the API enforces the same structural and temporal rules as the Domain.

An invalid day set, closed day with windows, open day without windows, malformed time, invalid range, unsorted windows, or overlapping window rejects the whole update without mutation. A stale If-Match version returns the existing precondition failure and leaves the saved schedule unchanged. Public and management responses return normalized days and ordered windows.

## Management and public contracts

Extend `GET /api/v1/tenants/{tenantId}/establishment-settings` with nullable `openingHours`; GET continues to return the establishment ETag. Keep the existing establishment `PUT` limited to its current identity, location, timezone and pickup fields, preserving hours when older clients save those fields. Add `PUT /api/v1/tenants/{tenantId}/opening-hours` for a complete seven-day schedule and `DELETE` on that route to clear the saved schedule. Both require the same `If-Match` establishment version and return the new version; PUT accepts a configured schedule only, so omitted/null bodies cannot be mistaken for a clear. Clearing is a distinct conditional operation. Hours saves do not mutate identity, pickup translations, menu languages, description translations, or product tax fields.

The API rechecks active-tenant owner/manager membership for every management read and write. Tenant IDs remain selectors, never grants. Kitchen users, foreign tenants, revoked memberships, inactive tenants, and archived organizations retain the existing safe denial behavior.

Extend `PublicEstablishmentDto` in the host-resolved `GET /api/v1/menu` response with nullable `openingHours`. The DTO includes all seven days when configured and null when unconfigured. It includes the existing IANA timezone so clients can label the schedule clearly. Do not return management version data. The menu response remains no-store and the host, not a query parameter, selects the tenant. The storefront renders the saved weekly schedule and its timezone; an unconfigured schedule gets an explicit localized unavailable state. Do not claim that displaying hours changes checkout availability.

## Frontend behavior

Add an Opening hours section/tab to the existing restaurant settings route and retain the verified restaurant context and query parameters. Use the current Lovable workspace recipe, canonical light tokens, shared Base UI controls, semantic headings, visible focus, and EN/FR translations. Keep the seven weekday labels and closed/open state visible. Desktop rows may use the current workspace grid; at phone widths each day becomes a readable card with its status and all window controls available without horizontal scrolling.

The editor keeps a local draft based on the last acknowledged server value. Every weekday can have a different closed/open state and different windows. Closed-day toggles clear that day's draft windows; reopening begins with one blank editable window. Add/remove controls support up to eight windows. Continuous service uses a single window. Copy/apply requires a source day, explicit target days, and confirmation listing those targets; it copies the current unsaved source draft into the selected unsaved target drafts. Cancel restores the last saved schedule. Save submits the complete seven-day schedule and the loaded establishment version. Pending, validation, transient failure/retry, success, authorization and stale-version conflict states use existing localized feedback patterns. A conflict preserves edits and requires an explicit reload before replacing them.

Time inputs use accessible labels and 24-hour controls; client validation provides prompt feedback while the API and Domain remain authoritative. Use a visible `24:00` closing option, never an opening option. A null saved schedule is shown as not configured, with a distinct editable draft state.

## Migration, documentation and rollout

Generate an additive EF migration that adds nullable `Tenants.OpeningHoursJson` with no fabricated default. Do not hand-edit the migration, model snapshot or generated API specification. Applying the migration remains an explicit operator action; startup does not apply it.

Update API contracts, database schema, backend/frontend architecture, restaurant settings docs, functional acceptance scenarios, and an S2 audit with actual commands/results. Update the roadmap to show implemented source only after implementation is complete and keep hosted acceptance separate. S3 remains responsible for slot generation and server-side checkout enforcement.

## Acceptance criteria

The user approved this written specification on 12 October 2026 and clarified that opening hours must be independently configurable for each weekday. The implementation and acceptance plan preserve that requirement directly.

- Save/read-back handles all seven days, explicit closed days, continuous windows, split shifts, adjacent boundaries and an explicit fully closed week.
- Validation rejects malformed, unordered, zero/negative, overlapping and closed-day windows without partial mutation; `24:00` is accepted as an end only.
- Concurrent stale writes fail without data loss; owner/manager access succeeds while anonymous, kitchen, foreign, revoked and inactive tenant access is denied.
- Existing null schedules remain unconfigured through migration and public projection. Configured guest schedules are host-tenant scoped and contain no management metadata.
- Copying selected days changes only the local draft, lists affected days for confirmation, and Cancel restores saved values.
- EN/FR copy, keyboard/focus operation and responsive presentation remain readable at 320, 375, 390, 768, 1024, 1440 and wide desktop widths, including 200% text zoom and reduced motion.
- DST behavior follows the stored IANA zone and the wall-clock policy above. No S2 behavior reserves pickup capacity or blocks checkout.
