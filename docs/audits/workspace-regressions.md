# Workspace UI regressions — 10 October 2026

Tracked by [issue #65](https://github.com/whritou/WhitePlate/issues/65), branch `fix/frontend-workspace-regressions`. This is the requested demo/live UI repair, not implementation of the entire settings roadmap.

## Implemented

- Removed dark-mode provider, toggle, hotkey, dependency and runtime dark CSS. OS preference and saved theme no longer change page appearance. Canonical light tokens remain active; historical dark values remain in the static design reference and its contrast checks.
- Source controls no longer inherit conflicting ghost-button pressed fills. Active navigation uses a contrast-safe selected style; native selects fit their containers and ellipsize long values.
- Shop cards use available width rather than desktop viewport breakpoints. Narrow Studio grid/list previews stack readable cards; names/descriptions wrap independently of add controls. The same card-width and long-text handling applies to live shop products.
- Product sheets are wider on desktop and stay viewport-bounded on mobile. Product category creation expands inside the same editor, with a separate valid HTML form, draft preservation, pending locks and selection of the saved category. No second modal opens.
- Demo and real history share search/status/date filters, sorting, pagination and table padding. Three KPI cells and CSV export appear with empty results. KPIs/export cover the loaded page only; totals and averages stay separate per currency and are order amounts, not paid revenue. CSV cells neutralize spreadsheet formulas. Demo receipts remain available.
- Demo interface locale switching retains the current route/query/hash. The independent menu-language selector continues to translate menu items.
- Sign-in/sign-up render locally bundled official Google and Microsoft marks. Provider enablement and OAuth behavior remain configuration-dependent. Asset attribution is in `apps/frontend/public/auth/README.md`.
- The organization overview lists each restaurant once, with entry links. Organization selection and Overview retain organization context and team/settings/create links; explicit breadcrumb links let users return to organizations or their authorized parent organization.
- Owners/managers have a restaurant settings page linking existing language/catalog/Studio operations. The shop shortcut verifies current membership server-side and builds its URL from the validated membership subdomain and server domain configuration. Browser tenant IDs remain selectors, never authorization.
- EN/FR copy is aligned. The API already returned organization ID/subdomain, so its contract and implementation did not change.

## Verification

Commands ran from `apps/frontend` using bundled Node 24.19.0 because npm was absent from the sandbox PATH.

| Check | Actual result |
| --- | --- |
| `node node_modules/vitest/vitest.mjs run` | 70 files, 441 tests passed after light-only runtime removal. |
| `node node_modules/typescript/bin/tsc --noEmit` | Passed. |
| `node node_modules/eslint/bin/eslint.js .` | 0 errors, 19 existing source-image warnings. New spacing errors were fixed before the successful full run. |
| `node node_modules/next/dist/bin/next build --webpack` | Passed, 91 static pages, with process-only inert HTTPS auth/API origins. Initial sandbox run hit Windows EPERM on existing webpack cache files; retry outside the sandbox passed. Existing PostgreSQL SSL-mode warnings remain. No environment file was edited. |
| Playwright `workspace-regressions`, `live-workspace`, `menu-builder`, `order-history` | Initial combined run: 29/30 passed; product-save fixture readiness timed out. Follow-up: 21/23 passed, exposing the old test's assumption that the labeled product wrapper was the HTML form and a missing link role on new entries. Both corrected; the two recovery scenarios passed. Coverage includes 320/390px live long copy, narrow desktop Studio preview, locale switching, selected contrast, inline category save/error/cancel, draft retention, pending locks and history filters. |
| Playwright `lovable-remaining` + `responsive-layout` | 15 passed: EN/FR accounts, live cart/checkout/team, public/demo 320–1536px breakpoint edges, saved light/dark preference and 200% root text. |
| Playwright `design-system --grep "sign-in controls"` | 4 passed: EN/FR sign-in controls remain contrast-safe and light-only with either old saved theme. Official Google/Microsoft marks were visually inspected on the enabled provider buttons; OAuth was not submitted. |
| `prettier --check` | All changed/new TS/TSX passed. Global TS/TSX check still reports 143 untouched files; these were not reformatted. |
| `python docs/design-system/verify.py`, `git diff --cached --check` | Passed: 119 contrast pairs, active light runtime parity, documentation links and whitespace. |
| npm dependency removal | Package-lock-only uninstall passed with Node 24.19.0 and npm 11.1.0 plus process-only `--engine-strict=false`. Initial attempts hit the engine guard; no package versions were upgraded and no npm configuration file was changed. |

In total, 52 distinct browser scenarios passed across the combined and recovery runs. The first responsive command used an unavailable project name; corrected to `responsive-layout` before the successful run. The final production build also passed after the product-submit guard/link-role changes.

Logs and a visually inspected mobile Studio capture are in ignored `apps/frontend/.acceptance/ui-regressions-*` files. Browser scenarios use local development-only fixtures and intercepted writes; this is not hosted business acceptance.

## Remaining acceptance and boundaries

After deployment, check the supplied live organization/restaurant accounts, configured public shop DNS/HTTPS, empty/filled real history and both configured OAuth buttons. No production data was modified for these checks. Shop links cannot assert DNS readiness. The settings page exposes existing operations; S1–S5 restaurant business settings and T3 theme publication remain separate kanban work. Analytics across the entire filtered history require an API aggregate/export contract. Backend code is unchanged, so `dotnet test` was not rerun. The pre-existing untracked `apps/api/brand-media-migrations.sql` was preserved and excluded from the change.
