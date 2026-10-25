# Production-readiness audit

Docs-only audit of WhitePlate across workstreams W1-W9. Findings live in the per-workstream files in this directory; this file holds the verdict, coverage, baseline and links. Source is not changed by the audit.

## Verdict

Pending

## Coverage

| Workstream | Status | Reason |
| --- | --- | --- |
| W1 | Not run | Pending |
| W2 | Not run | Pending |
| W3 | Not run | Pending |
| W4 | Not run | Pending |
| W5 | Not run | Pending |
| W6 | Not run | Pending |
| W7 | Not run | Pending |
| W8 | Partial | API unavailable (503), TLS interception on audit workstation, ZAP not run |
| W9 | Not run | Pending |

## Baseline

Recorded 2026-10-25 on branch `docs/production-readiness-audit` (HEAD `f0d63a9`). Audited code is `origin/main` `55f31a5` (2026-10-19); the audit branch adds only documentation on top (`git diff 55f31a5 HEAD -- apps` is empty). This baseline replaces an earlier one taken on the stale local `main` `7e5b2e3`, which is 178 commits behind.

Toolchain: Windows 11. Machine default Node is 20.18.3 (nvm-windows), but the repository requires `^24.19.0` (`apps/frontend/package.json` engines, `apps/frontend/.nvmrc`). With owner approval, Node 24.19.0 was installed with `nvm install 24.19.0` and invoked by its full install path without running `nvm use`; npm 11.17.0 came from that install. .NET SDK 10.0.401. Failures are recorded as input for W5 or W7 and were not fixed.

Where the frontend commands ran: the `apps/frontend/node_modules` and `.next` in this working tree were produced on the old base and are the owner's, so they were neither reinstalled nor modified. The frontend baseline ran on a clean copy outside the repository: `git -c core.autocrlf=false archive HEAD apps/frontend docs/design-system` (the design-token test reads `docs/design-system/tokens.json` two levels above the package), no `node_modules`, no `.next`, no `.env*`, then `npm ci` from the checked-in lockfile (792 packages, exit 0, lockfile unchanged). The in-place checkout was not run. The same commands there are expected to repeat the environmental failures seen on the old base: stale generated `.next/dev` and `.next/types` that `tsconfig.json` includes would break `typecheck` and `build` with `TS2307`, and the CRLF working tree (`core.autocrlf=true`, `.prettierrc` sets `endOfLine: lf`) would fail `format:check` on nearly every file. This is unverified on the new base.

Production context: on 2026-10-25 the production API returned 503 "no available server" on `/health/live`, `/health/ready` and `/api/v1/organizations` (Coolify proxy, no healthy backend) while the Vercel frontend served 200. This is HOST-01 in `w8-hosted-posture.md` (Blocker, Confirmed). Because of it, hosted checks of API-backed behaviour could not be made, and the W8 hosted TLS and ZAP checks are limited as stated in Coverage.

Build environment: the build used inert, process-only placeholder values in the shape CI uses (`.github/workflows/ci.yml` build step: `*.invalid` hosts, `ci-only-*` secrets, a loopback database URL on an unused port). No real credential was read or used, no `.env` file existed in the copy, and no real service was contacted.

| Command | Where | Result | Detail | Feeds |
| --- | --- | --- | --- | --- |
| `npm run lint` | clean copy, Node 24.19.0 | Pass | 0 errors, 19 warnings in 15 files, all `@next/next/no-img-element` (`<img>` instead of `next/image`, under `components/demo`, `components/marketing`, `components/storefront/demo` and `components/workspace/studio`). The lint failure recorded at the documentation baseline (`contextOrFilename.getFilename`) did not reproduce. | W7, W9 |
| `npm run typecheck` | clean copy, Node 24.19.0 | Pass | `tsc --noEmit` exit 0, no errors. | W7 |
| `npm run test` | clean copy, Node 24.19.0 | Pass | Vitest: 116 files passed, 729 tests passed, 0 failed (16.4 s). | W7 |
| `npm run format:check` | clean copy (LF), Node 24.19.0 | Fail | "Code style issues found in 17 files" (exit 1). These are real formatting drift, not line endings: `app/[locale]/(workspace)/organization/restaurant-settings/loading.tsx`, `app/[locale]/not-found.tsx`, `components/demo/workspace/history/model.tsx`, `components/demo/workspace/studio/page.tsx`, `components/demo/workspace/team/view.tsx`, `components/workspace/analytics/page/model.tsx`, `components/workspace/dashboard/live-dashboard.test.tsx`, `components/workspace/settings/live-settings.tsx` and nine files under `components/workspace/shared/skeletons/`. CI does not gate this: its formatting step checks only the `.ts` and `.tsx` files changed in the pushed range (`.github/workflows/ci.yml:54-77`). | W7 |
| `npm run build` (`next build --webpack`) | clean copy, Node 24.19.0, placeholders | Pass | Compiled in 61 s, TypeScript finished in 29 s, 105 static pages generated, 2 m 11 s total. Better Auth logged 15 "Could not validate the database schema" errors because the placeholder database is deliberately unreachable; the build still exits 0. The route table lists dev-only fixture routes as production routes: dynamic `/[locale]/brand-design-test`, `catalog-design-test`, `design-system-test`, `live-workspace-test`, `order-history-test`, `orders-kanban-test`, `photo-design-test`, `photo-guest-design-test`, `workspace-toast-test`, and prerendered (SSG, `en` and `fr`) `establishment-design-test` and `studio-parity-test`. Whether they return 404 at runtime is for W5 to confirm. | W5 |
| `dotnet test apps/api/WhitePlate.slnx` | repository root, .NET SDK 10.0.401 | Pass | 372 total, 372 passed, 0 failed, 0 skipped (35 s test run, 64 s including build). | W7 |

Notes:

- Compared with the superseded baseline on `7e5b2e3`: tests grew from 481 (76 files) to 729 (116 files) in the frontend and from 235 to 372 in the API; the clean build now generates 105 static pages instead of 95; typecheck on a clean copy passes in both. Lint warnings are unchanged at 19.
- The clean-copy approach is a workaround for the stale in-place state, not a recommendation. A fresh clone running `npm ci` and the commands above should reproduce these results. `format:check` passing or failing in a working tree depends on the editor and Git line-ending settings, which is a W7 hygiene point.
- `dotnet test` writes to `bin/` and `obj/` under `apps/api`, which are ignored; Git status was unchanged afterwards.

## Automated sweep

Pending (Task 3).

## Findings by severity

Per-workstream finding files are the source of truth. Workstreams written so far:

| Severity | Count | Findings |
| --- | --- | --- |
| Blocker | 1 | HOST-01 (Confirmed) |
| Should | 5 | HOST-02, HOST-03, HOST-05 (Confirmed); HOST-04, HOST-06 (Suspected) |
| Could | 3 | HOST-07, HOST-08 (Confirmed); HOST-09 (Suspected) |

Source: `w8-hosted-posture.md`. W1-W7 and W9 are not written yet.

## Links

- Spec: [production-readiness audit design](../../superpowers/specs/2026-10-25-production-readiness-audit-design.md)
- Plan: [production-readiness audit plan](../../superpowers/plans/2026-10-25-production-readiness-audit.md)
- Kanban umbrella card: pending (gh project scope not yet granted; created in Task 14)
- Audited code: origin/main 55f31a5 (2026-10-19); local main 7e5b2e3 was 178 commits behind; a fresh git fetch failed on this workstation (TLS interception), so origin may be newer
