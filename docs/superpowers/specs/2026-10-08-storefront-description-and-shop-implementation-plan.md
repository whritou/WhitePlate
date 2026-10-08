# Localized restaurant description and shop implementation plan

**Date:** 2026-10-08  
**Design:** [Localized restaurant description and shop design](2026-10-08-storefront-description-and-shop-design.md)  
**Execution:** Approved by user to draft manually and implement

## 1. Start task tracking

- Move WhitePlate issue #50 from Backlog to In progress before code changes.
- Keep issue #48 closed; it covers the already-merged first storefront and checkout implementation.

## 2. Add tenant description behavior in the API (test first)

- Add domain tests for resolving the selected description, falling back to the default menu locale, returning null when both are absent, clearing blank input, retaining unrelated locale entries, rejecting unsupported locales, and enforcing the 500-character limit.
- Add application/API tests for owner and manager access, unauthorized and cross-tenant denial, enabled-locale validation, and the read/write management contract.
- Add public menu tests proving only the resolved description is returned with each localized menu.
- Implement tenant-owned localized description storage and behavior in `WhitePlate.Domain/Tenants/Tenant.cs`; map the new value in EF configuration and generate the additive migration plus snapshot updates.
- Add request/response contracts and an authorized management controller/handler/repository path under the tenant API boundaries. Keep membership checks server-side and use the existing safe not-found policy.
- Resolve the public description in the existing menu query using the requested menu locale and tenant default locale. Return null when neither value is set.

## 3. Add restaurant-language management UI (test first)

- Add frontend validation/parser and action/service tests for one-locale reads and writes, empty clearing, length, and response/error mapping.
- Add a description editor to the restaurant language page. Support enabled locales, default-language fallback guidance, 500-character feedback, saving state, acknowledged success, and rejected-save draft retention.
- Add matching English and French copy; use existing server actions, services, request adapters, form controls, and feedback components.
- Add API/browser coverage for membership-protected reads and writes and a second-tenant denial.

## 4. Refresh the public shop UX (test first)

- Add/extend storefront fixture and component tests for the optional resolved description, category navigation, selected product modal, option selection bounds, quantity, valid add/update, and unchanged checkout navigation.
- Replace inline product option controls with an accessible product modal. Initialize edits from current cart items, validate selections before applying changes, and preserve the current cart store and server-priced checkout behavior.
- Add category navigation and product cards using current localized product data and price formatting; do not invent image assets or fields.
- Keep the cart summary beside products on wide screens. Add a sticky mobile cart entry that opens the current cart view and exposes its existing checkout action.
- Verify keyboard dialog focus, Escape, focus restoration, screen-reader labels/live feedback, light/dark themes, EN/FR, and 320/375/768/1024/1440 px layouts.

## 5. Align documentation and verify end to end

- Update API contracts, backend/frontend architecture, database schema, functional test plan, and roadmap status to match behavior that is actually implemented and verified.
- Review the generated EF migration for an additive nullable/default-empty translation column and safe behavior for existing restaurants.
- Run focused API and frontend tests during each red/green cycle.
- Run `dotnet test apps/api/WhitePlate.slnx`, and from `apps/frontend` run `npm run test`, `npm run lint`, `npm run typecheck`, `npm run format:check`, and `npm run build` as appropriate. Record exact failures and baseline findings.
- Run the existing guarded browser acceptance on a non-production environment when available. Do not apply feature acceptance mutations against Production.
- Review `git diff --check`, update issue #50 with implementation results and remaining rollout work, commit with a Conventional Commit message, and push the task branch if the remote is configured.

## Dependencies and delivery order

The storefront response depends on the persisted locale resolution and contract. Management UI depends on the authorized translation read/write contract. The shop interaction work can proceed after the description field is present on the frontend menu type. Documentation and broad verification follow the source changes, with focused tests in each phase.

## Delivery record — 2026-10-08

Implemented on `feat/storefront-description-shop`:

- Added the tenant translation map and generated additive EF migration `RestaurantDescriptionTranslations`; existing/new tenants resolve to no description until text is saved.
- Added owner/manager GET/PUT description endpoints, enabled-locale checks, trimming, blank clearing, the 500-character rule, and public selected-locale/default-locale resolution.
- Added the EN/FR language-page editor and shop page description, category links, product cards, accessible product-options/quantity dialogs, desktop cart, and mobile cart entry.
- Updated API, persistence, frontend architecture, functional-test, and roadmap documentation. Issue #50 remains In progress while browser acceptance and migration rollout are pending.

Verification recorded for this working tree:

| Check | Result |
| --- | --- |
| `dotnet build apps/api/WhitePlate.slnx --no-restore` | Passed; 0 warnings, 0 errors. |
| `dotnet test apps/api/WhitePlate.slnx --no-restore` | Passed; 163 tests. |
| Frontend `node node_modules/vitest/vitest.mjs run` | Passed; 57 files, 382 tests. |
| Frontend `node node_modules/eslint/bin/eslint.js .` | Passed with no errors or warnings. |
| Frontend `node node_modules/typescript/bin/tsc --noEmit` | Passed. |
| Frontend `node node_modules/next/dist/bin/next build --webpack` | Passed compilation and all 49 generated pages with inert HTTPS `.invalid` URLs and unavailable local DB; expected Better Auth schema-connection errors were logged for the placeholder database. |
| Frontend Prettier repository-wide check | Not clean at baseline: 215 existing files report formatting differences. Changed TS/TSX files were formatted individually. |
| Local storefront fixture walkthrough | Passed on desktop: EN/FR descriptions and menu content, required-option validation, adding two configured items, €22 estimated subtotal, Escape dismissal with focus restoration, and checkout navigation retaining `menuLocale=fr`. The local fixture used no shared database. |

Remaining: verify narrow mobile layout with a responsive viewport, apply the migration only in a reviewed target environment, and perform hosted acceptance after deployment. No migration was applied to a shared or production database in this task.
