# Dashboard overview refresh — 2026-10-14

## Current approved composition

The authenticated restaurant dashboard follows the reviewed `/demo/dashboard`-inspired composition that was previewed at `/dashboard-preview-test`. The temporary preview page is retired after its layout was transferred to the real page. Live data, role checks and existing backend operations remain authoritative.

- The page header puts the service title and pause/resume action above the metrics strip.
- Four unboxed metric cells show today’s orders, active queue, order value and average preparation. Order value stays hidden from Kitchen.
- A two-column service row places colored order-stage links and pickup timing on the left. The right rail keeps payment connection details above the compact order-status panel.
- The final row shows the latest four orders from the currently loaded order page and the restaurant storefront. Counts, overdue pickups and recent orders describe the loaded page (up to 50); D2 metrics remain restaurant-wide.
- Owner/manager controls retain D3 confirmations and versioned updates. Kitchen can see status but cannot pause or change Rush. Rush changes newly offered pickup times by the server-configured ten minutes until manually cleared; emergency pause blocks new checkouts and hides offered slots while existing orders and reservations remain unchanged.
- Quick availability is intentionally absent from the dashboard by the user’s latest direction. Existing availability API behavior is unchanged; the dashboard no longer requests availability data. Storefront shortcuts remain available to managers.
- The development-only dashboard preview route, its sample components and its translation namespace have been removed. No database migration was added for this UI transfer.

## Verification

All frontend commands ran from `apps/frontend` unless noted.

| Check | Result |
| --- | --- |
| Targeted ESLint on changed TS/TSX files | Passed. |
| TypeScript with a temporary config that includes current `.next/types` and excludes stale `.next/dev/types` | Passed; the temporary config was removed. |
| Standard `tsc --noEmit` | Blocked only by a stale generated `.next/dev/types/app/[locale]/dashboard-preview-test/page.ts` reference to the deleted route. Generated `.next` files were not edited. |
| Prettier check on changed TS/TSX/JSON; both locale JSON parses | Passed. |
| `git diff --check` | Passed. |
| Local authenticated dashboard browser view | Redirected to sign-in; no local session was available. The deleted preview route returns 404 as intended. |
| Vitest and production build | Not run. The existing dev server is using the default `.next` directory; the installed Next CLI has no per-build output-dir option. |

## Rollout and remaining acceptance

This is source-only and creates no migration. A pushed source change is not a deployment. Hosted visual review and authenticated owner/manager/Kitchen browser acceptance remain outstanding. Availability API behavior and its existing tenant/role checks remain unchanged.
