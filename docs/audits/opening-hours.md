# S2 weekly opening hours — 2026-10-12

## Implemented source behavior

- Nullable `Tenants.OpeningHoursJson` distinguishes an unconfigured legacy restaurant from an explicitly all-closed week.
- Domain validation requires one entry per ISO weekday, allows up to eight ordered non-overlapping local-time windows per open day, allows adjacent periods and `24:00` as an end only, and rejects overnight intervals atomically.
- Owner/manager PUT and DELETE use the S1 establishment version; the scalar settings update preserves the stored schedule. Public establishment/menu projections return the schedule and its IANA time zone.
- The restaurant settings editor supports independent weekday changes, closed days, split periods, explicit copy/apply into selected unsaved days with confirmation, and restore-to-unconfigured. Guest collection details show each day and local times. English and French catalogs contain the added copy.

## Verification

`dotnet test apps/api/WhitePlate.slnx --no-restore` passed: 235 tests, 0 failures. The API regression verifies an independently closed Monday, two Tuesday services, different Wednesday hours, rejection for a foreign account, persistence through the legacy scalar update, and clearing to unconfigured. Domain tests cover malformed schedules, overlap, overnight rejection, missing/unordered weekdays and the `24:00` closing boundary.

Frontend `npm run test` passed: 76 files and 481 tests. `npm run typecheck` passed. `npm run lint` passed with 19 existing `<img>` optimization warnings and no errors. `npm run build` passed with temporary `https://localhost` values for the two build-time production URL checks (`BETTER_AUTH_URL` and `API_BASE_URL`); no project configuration was changed. Prettier check passed for all changed frontend TypeScript files. `git diff --check` passed. Repository-wide `npm run format:check` reports 139 existing files with formatting differences, so formatting was verified on the changed frontend files only.

An intermediate parallel frontend test run had four unrelated brand-assets/product-photos assertions receive 403 where they expected route-specific statuses; the final sequential full run passed all 481 tests. An earlier API run also had one transient tenant-host endpoint 500; subsequent full API runs passed, including the final 235-test run. The first build attempts exposed sandbox write restrictions for Vite/Next generated temporary files and production HTTPS URL validation; rerunning with workspace access and temporary HTTPS build variables succeeded. No shared database migration or hosted acceptance has been performed.

## Remaining acceptance

- Apply and verify `20261012171223_OpeningHours` on a local PostgreSQL database, then confirm public host/menu projection and all-closed versus unconfigured read-back.
- Complete the functional plan's responsive, keyboard, localization and two-tenant denial checks. No open-now calculation or checkout enforcement is part of S2.
- Update the WhitePlate project kanban card with final evidence and move it to Done only after the requested local implementation scope and checks are complete; record hosted/database checks as remaining acceptance.
