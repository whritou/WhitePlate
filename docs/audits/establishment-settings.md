# S1 establishment settings — 12 October 2026

Implemented on `feat/establishment-settings`, merged through [PR #77](https://github.com/whritou/WhitePlate/pull/77), and rolled out to the production API from merge commit `a17d0346175bf5f13eaff7bd47d60fbddd53fc06`. The approved [design](../superpowers/specs/2026-10-12-establishment-settings-design.md) and [plan](../superpowers/specs/2026-10-12-establishment-settings-implementation-plan.md) define the delivered scope. Production migration and API deployment are complete; real hosted owner/manager and storefront acceptance remain open, so the project card stays In review.

## Implemented behavior

Owners/managers edit trade name, phone, optional international address and paired coordinates, required IANA timezone and pickup instructions per enabled menu language at `/[locale]/organization/restaurant-settings?tenantId=…`. Owners now reach the same restaurant Settings route as managers; organization settings and Staff remain separate. Existing catalog/language/Studio/shop links remain available.

The API independently checks persisted membership, active tenant and active organization. GET/PUT return quoted establishment-version ETags. PUT requires If-Match: missing/malformed headers return 400, stale conditional saves 412. Atomic persistence updates only establishment fields while checking both version and the menu configuration read during validation. Rejected changes leave the record intact. Disabled translations survive saves and reappear when enabled; explicit blank/null text clears only its language.

The editor uses account/tenant/interface-locale query keys, explicit Save/Cancel, synchronous duplicate-submit protection, accessible field errors, pending/retry states and explicit conflict-discard confirmation. Background reads preserve dirty input. Lost authorization hides the form and clears protected cache. Beforeunload warns about unsaved changes; successful saves use normalized values and refresh server navigation. Only bounded safe validation field names propagate through the shared adapter; raw API messages are never displayed.

The public menu adds a minimal establishment projection. A host-resolved public read supplies independent current receipt/tracking information using the saved menu locale. Requested-language text falls back to the default and declares its actual locale. Independent failure/retry leaves order/status/totals visible. Google Maps and Waze use fixed HTTPS origins; Waze requires coordinates, Google accepts a complete address or coordinates, and phone links use validated telephone syntax. Directions never include the tracking capability.

UTC initializes existing/new establishments. This does not change UTC archival or order snapshots, nor promise pickup timing. Legal/SIRET/default tax, currency/subdomain changes, hours/slots, email, Stripe and S2–S5 remain outside S1.

## Schema and rollout

EF generated `20261012113559_EstablishmentSettings`: optional bounded contact/address, `numeric(9,6)` coordinates, constant defaults `UTC`, `{}` and version `1`. Tracking uses existing nullable `Orders.MenuLocale`; no order column is added. Reviewed SQL contains additive Tenants ALTER statements and migration history in one transaction, with no destructive Up operation, unrelated change, dynamic backfill or new index. EF reports no pending model changes.

The production migration `20261012113559_EstablishmentSettings` was applied by the operator through the Coolify PostgreSQL terminal before deploying the API. No startup migration was added. The migration history row, EF product version, twelve tenant columns, defaults and nullability were verified in PostgreSQL. The API deployment from `main` commit `a17d034` completed successfully; Coolify's new container passed its `/health/ready` healthcheck before the old container was removed. A local public probe could not be completed because the browser blocked the host and local PowerShell Schannel failed before connecting. Hosted owner/manager save/reload and guest storefront acceptance remain unverified; this deployment evidence is separate from SQLite relational API tests. The approved plan's repository/options interfaces share the DTO file; query lifecycle stays in the focused editor instead of an additional hook. API tests use existing real relational HTTP fixtures rather than duplicating them in a new application test harness.

## Verification

Initial management/public API tests failed with missing endpoints before implementation. Frontend parser and safe-field error tests failed before their respective implementations; subsequently passed.

- Full `dotnet test apps/api/WhitePlate.slnx --no-restore`: 222 passed, 0 failed, 0 skipped.
- Frontend `node node_modules/vitest/vitest.mjs run`: 76 files / 480 tests passed.
- Frontend `node node_modules/typescript/bin/tsc --noEmit`: passed.
- Full `node node_modules/eslint/bin/eslint.js .`: 0 errors and 19 existing `<img>` warnings in Lovable components.
- Full Prettier `--check "**/*.{ts,tsx}"`: baseline fails on 133 files outside this feature's formatting scope; changed-file format checks passed earlier.
- The latest full Vitest rerun hit a denied `.vite-temp` write; rerunning with `--configLoader runner` passed 76 files / 480 tests.
- `node node_modules/next/dist/bin/next build --webpack`: passed with local HTTPS placeholders for `BETTER_AUTH_URL`, `API_BASE_URL`, and `PUBLIC_API_BASE_URL`; the repository's local HTTP values are correctly rejected by production route validation. No production credentials were printed or changed.
- `dotnet ef migrations add EstablishmentSettings --project apps/api/WhitePlate.Infrastructure --output-dir Persistence/Migrations`: generated using inert localhost design-time connection, without a database update.
- `dotnet ef migrations script ProductMenuMetadata EstablishmentSettings --project apps/api/WhitePlate.Infrastructure --no-build`: generated and reviewed. An earlier attempt named a nonexistent starting migration and failed; corrected to the observed migration name.
- `dotnet ef migrations has-pending-model-changes --project apps/api/WhitePlate.Infrastructure --no-build`: no changes.
- Chrome `--project=establishment-settings`: save/cancel, validation, conflict-discard, failure/retry, revocation, independent receipt details and EN/FR responsiveness. Initial assertions also matched Next's route announcer; corrected to the main region. A GET-count assertion was corrected to measure Retry's additional request because development remounts can start multiple reads. No failure was waived.

Development-only `/[locale]/establishment-design-test` exercises the real form/shared controls and BFF read with simulated mutations; production returns 404. It proves UI behavior, not hosted authentication or PostgreSQL deployment. API tests exercise actual HTTP handlers, persisted memberships and SQLite conditional writes.

## Design verification

Scoped light Lovable surface, semantic tokens, shared Base UI controls/cards, keyboard-operable native selectors, EN/FR labels, semantic heading/alert/status regions. No global token/style changes. Form targets are ≥44px desktop and ≥48px from tablet sizes. Browser matrix: 320, 375, 390, 768, 1024, 1440, 1920px, keyboard Tab, 200% CSS zoom and no horizontal document overflow. Global reduced-motion rules apply; no new animation. Final screenshot review/checks below.

## Remaining acceptance

Verify hosted owner/manager save/reload, tenant-host menu/checkout and receipt/tracking details, and revoked/inactive denial. Frontend production deployment and real hosted acceptance remain to be verified. Jurisdiction-specific legal/default-tax questions remain independent backlog decisions.
