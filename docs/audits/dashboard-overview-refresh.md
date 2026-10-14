# Dashboard overview presentation refresh — 2026-10-14

## Approved scope

Apply the user-approved Lovable dashboard direction to the real restaurant workspace: visibly colored “Today at a glance” metric cards, a compact order-status summary, and saved product covers in Quick availability. Keep the full order workflow on the Orders board and preserve D3 rush/pause behavior. No new API contract or database change is part of this presentation update.

## Implementation

- KPI cards use the existing info, warning, success and secondary design-system surfaces. Loading placeholders use the same tones.
- The dashboard order panel shows counts for all five order states from the currently loaded page. It links to the full Orders board and retains loading, refresh, stale, error, retry, empty, access-revocation and live-refresh behavior. Copy explicitly says the counts cover only the loaded page; D2 metrics remain restaurant-wide.
- Quick availability cards show saved covers to owners and managers. Kitchen sees the same saved availability with the neutral no-photo fallback, but no mutation control. This follows the existing API authorization and the user's 14 October confirmation; product-photo queries are disabled when the role has no access.
- English and French copy describe the loaded-page counts and Kitchen's read-only view.

## Local verification

All commands ran from `apps/frontend` unless noted.

| Check | Result |
| --- | --- |
| Focused Vitest for order overview, metric cards, availability cards, cover access and dashboard role composition | Passed: 5 files, 10 tests. |
| `node node_modules/vitest/vitest.mjs run --configLoader runner` | Passed: 92 files, 542 tests. |
| `node node_modules/typescript/bin/tsc --noEmit` | Passed. |
| `node node_modules/eslint/bin/eslint.js .` | Passed with 0 errors and 19 existing `<img>` warnings in Lovable reference components. |
| Targeted Prettier `--check` for changed TS/TSX/JSON | Passed. |
| `git diff --check` | Passed. |
| `node node_modules/next/dist/bin/next build --webpack` with process-only inert auth/API URLs | Could not complete: webpack received `EPERM` opening an existing `.next/cache/webpack/{server,client}-production/*.pack_` cache file. No generated build output was edited or removed. |

## Rollout and remaining acceptance

This is source-only and creates no migration. The first dashboard refresh is on open PR #93; a pushed source change is not a deployment. Hosted visual review and authenticated owner/manager/Kitchen browser acceptance remain outstanding. Existing API tests continue to enforce Kitchen read access and deny Kitchen availability updates; this change does not expand that permission.

## Review revision — 14 October 2026

The first rendered revision did not match the requested Lovable hierarchy closely enough. Before changing the authenticated dashboard again, a separate development-only review page has been added with a top row of tinted metrics, recent orders as the main content, and a narrow right rail for order state, quick availability photos, and the storefront. All visible values are fictitious; it performs no API reads or mutations. The review route is disabled in production. Live dashboard integration remains pending the user's review of this preview.

Local review: `http://127.0.0.1:3039/fr/dashboard-preview-test?tenantId=22222222-2222-4222-8222-222222222222` returned HTTP 200 and was visually inspected at a 1150px viewport. The four KPI surfaces render with the existing semantic tint tokens; the order list, compact status summary, photo availability list and storefront all fit without horizontal scrolling. Targeted ESLint, frontend typecheck and both translation JSON parses passed. No test suite or production build was run for this review-only route.
