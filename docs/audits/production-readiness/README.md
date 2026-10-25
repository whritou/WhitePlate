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
| `npm run format:check` | clean copy (LF), Node 24.19.0 | Fail | "Code style issues found in 17 files" (exit 1). These are real formatting drift, not line endings: `app/[locale]/(workspace)/organization/restaurant-settings/loading.tsx`, `app/[locale]/not-found.tsx`, `components/demo/workspace/history/model.tsx`, `components/demo/workspace/studio/page.tsx`, `components/demo/workspace/team/view.tsx`, `components/workspace/analytics/page/model.tsx`, `components/workspace/dashboard/live-dashboard.test.tsx`, `components/workspace/settings/live-settings.tsx` and nine files under `components/workspace/shared/skeletons/`. CI does not gate this: its formatting step checks only the `.ts` and `.tsx` files changed in the pushed range (`.github/workflows/ci.yml:54-78`). | W7 |
| `npm run build` (`next build --webpack`) | clean copy, Node 24.19.0, placeholders | Pass | Compiled in 61 s, TypeScript finished in 29 s, 105 static pages generated, 2 m 11 s total. Better Auth logged 15 "Could not validate the database schema" errors because the placeholder database is deliberately unreachable; the build still exits 0. The route table lists dev-only fixture routes as production routes: dynamic `/[locale]/brand-design-test`, `catalog-design-test`, `design-system-test`, `live-workspace-test`, `order-history-test`, `orders-kanban-test`, `photo-design-test`, `photo-guest-design-test`, `workspace-toast-test`, and prerendered (SSG, `en` and `fr`) `establishment-design-test` and `studio-parity-test`. Whether they return 404 at runtime is for W5 to confirm. | W5 |
| `dotnet test apps/api/WhitePlate.slnx` | repository root, .NET SDK 10.0.401 | Pass | 372 total, 372 passed, 0 failed, 0 skipped (35 s test run, 64 s including build). | W7 |

Notes:

- Compared with the superseded baseline on `7e5b2e3`: tests grew from 481 (76 files) to 729 (116 files) in the frontend and from 235 to 372 in the API; the clean build now generates 105 static pages instead of 95; typecheck on a clean copy passes in both. Lint warnings are unchanged at 19.
- The clean-copy approach is a workaround for the stale in-place state, not a recommendation. A fresh clone running `npm ci` and the commands above should reproduce these results. `format:check` passing or failing in a working tree depends on the editor and Git line-ending settings, which is a W7 hygiene point.
- `dotnet test` writes to `bin/` and `obj/` under `apps/api`, which are ignored; Git status was unchanged afterwards.

## Automated sweep

Recorded 2026-10-25 on audited code `55f31a5` (HEAD `0ab8ba7`, branch `docs/production-readiness-audit`). Raw tool output is kept outside the repository; this section holds counts, advisories and triage only. Nothing was installed beyond `npm ci` into the clean copy described under Baseline: the owner did not approve installing gitleaks, Semgrep, Lighthouse or ZAP. Whether an advisory is reachable in WhitePlate is decided in W5, not here. Entries below are leads, not findings.

| Tool | Status | Result |
| --- | --- | --- |
| `npm audit --json` (clean copy of `apps/frontend`, Node 24.19.0, npm 11.17.0) | Ran | Exit 1 (vulnerabilities found). 14 vulnerable packages: 1 critical, 8 high, 5 moderate, 0 low, 0 info (949 dependencies scanned: 486 production, 404 dev, 169 optional). 37 distinct advisories behind them: 3 critical, 12 high, 18 moderate, 4 low. |
| `dotnet list apps/api/WhitePlate.slnx package --vulnerable --include-transitive` | Ran | Exit 0. `.slnx` was accepted. No vulnerable packages in any of the 5 projects (Tests, Api, Application, Domain, Infrastructure) against nuget.org. |
| Secret scan, gitleaks | Not run | Install not approved by owner. Fallback below used instead. |
| Secret scan, Git-history grep fallback (`7e5b2e3..HEAD`) plus tracked-filename check | Ran | No real secret found. 74 matching added/removed lines in 185 commits, all triaged as placeholder, test fixture, code reference or documentation. History before `7e5b2e3` was scanned earlier with the same method (427 commits, all refs): 215 matches, no real secret. One lead noted below. |
| Semgrep (`p/csharp`, `p/typescript`, `p/react`, `p/nextjs`, `p/secrets`) | Not run | Install not approved by owner. |
| axe through Playwright | Not run | Not part of this task (planned for a later task). |
| Lighthouse | Not run | Install not approved by owner. |
| ZAP passive baseline | Not run | Install not approved by owner. |

### npm audit

`npm audit --json` is read-only: no `audit fix`, no install of new packages, and the lockfile was unchanged. It ran in the clean copy, whose `package-lock.json` is byte-identical to the one at `55f31a5`. `next` is pinned at 16.3.4 (`apps/frontend/package.json`: `"next": "16.3.4"`). "fixAvailable" is npm's report, not a verified upgrade path; none of the fixes was applied or tested.

| Package | Severity | Direct | Via (advisory) | fixAvailable |
| --- | --- | --- | --- | --- |
| `next` | critical | yes (dependency) | GHSA-vcvr-r3jv-pc5j (critical, RCE in `next/og` ImageResponse); GHSA-2464-fhr4-w9xw (critical, unauthenticated RCE in Image Optimization API with SVG); GHSA-673q-mjm6-r5xr (critical, unauthenticated RCE in `use cache` functions returning typed arrays); GHSA-cjq9-62q9-8jv4 (high, SSRF in Image Optimization); GHSA-p3m5-59mp-jv5r (high, DoS in App Router Server Actions); GHSA-3w37-wq28-93x7, GHSA-4jqv-mc3x-m676, GHSA-f87g-xv8r-7p7x, GHSA-mcj8-r9mp-w47p, GHSA-h694-7cp9-m8p3 (moderate: Draft Mode leak, SSG/ISR cache poisoning, metadata image route disclosure, `use cache` leak); GHSA-39w2-rjm5-chcv (low, dev-server MCP endpoint disclosure). Range 16.0.0 - 16.4.0. | Yes: `next@16.4.3`, not semver-major |
| `shadcn` | high | yes (dependency) | Through `zod` | Yes |
| `zod` | high | no | GHSA-mrhx-c7xc-m3w5 (memory exhaustion validating oversized constrained collections), `<4.6.6`. Two copies: `node_modules/zod` and `node_modules/shadcn/node_modules/zod`. | Yes |
| `@modelcontextprotocol/sdk` | high | no | GHSA-6qxp-vccf-f47h, GHSA-22jm-h49p-29qw, GHSA-46jr-4wx8-v453 (high); GHSA-6prh-2h8m-c8cw, GHSA-rvq5-wwqv-78pq (moderate). Range `<=1.31.0`. | Yes |
| `body-parser` | high | no | GHSA-27r3-jxmh-p828 (DoS via trailing bytes after a compressed body), 2.0.0 - 2.3.0 | Yes |
| `follow-redirects` | high | no | GHSA-q3jh-wrc6-jgq8, GHSA-8r9p-f939-6h3c (credential header exposure on redirects), 1.16.0 | Yes |
| `source-map-js` | high | no | GHSA-68fv-2mgg-jv7q (event-loop DoS), 1.0.0 - 1.2.1 | Yes |
| `undici` | high | no | GHSA-xjj6-f33q-929c (high); GHSA-4qv8-2p9j-2685, GHSA-f72v-6w45-q472 (moderate), 7.0.0 - 7.30.0 | Yes |
| `vite` | high | no | GHSA-587h-7wmj-h5pm (high, via launch-editor); GHSA-698v-4r3x-3vcv, GHSA-r825-w8mm-5pxw, GHSA-rq7h-c2jc-7f22 (moderate); GHSA-9jrq-w75r-8gcw (low), `<=6.4.3` | Yes |
| `vitest` | moderate | yes (devDependency) | Through `@vitest/mocker` | Yes |
| `@vitest/mocker` | moderate | no | GHSA-qxg6-89mg-rqv8, GHSA-xp26-3454-mjgp (code injection via manual mock registration; Windows traversal), `<=4.1.11` | Yes |
| `fast-uri` | moderate | no | GHSA-w74x-v6f9-j3xg, GHSA-wjr9-j795-jxcr (moderate); GHSA-xhq7-xmqj-769h, GHSA-333x-w4r6-6crp (low), 3.0.0 - 3.1.8 | Yes |
| `hono` | moderate | no | GHSA-5r4p-p66f-jhc7 (`serveStatic` double path decoding), 4.12.4 - 4.13.10 | Yes |
| `ip-address` | moderate | no | GHSA-rxp7-6hxx-x8q5 (quadratic-time zone identifier matching), `<=10.7.3` | Yes |

Advisory URLs follow `https://github.com/advisories/<GHSA id>`. Package paths are all under `apps/frontend/node_modules/`. Not determined here and left for W5: which packages are production versus dev-only, which are reachable at runtime, and whether `shadcn`, `vite`, `vitest`, `@vitest/mocker` and `@modelcontextprotocol/sdk` ship in the deployed artifact. The `next` advisories matter most: it is a production dependency and the deployed frontend runs Next.js (see HOST-07).

### NuGet

All five projects report no vulnerable direct or transitive packages (sources: nuget.org, local Microsoft SDKs folder). The tool only sees advisories published to nuget.org at run time.

### Secret scan (fallback)

Method: `git log -p -U0` over `7e5b2e3..HEAD` (185 commits: the 178 commits of `origin/main` up to `55f31a5` plus the audit branch's documentation commits), piped through a case-sensitive match of `password=|secret|BEGIN .*PRIVATE KEY|AKIA[0-9A-Z]{16}|postgres(ql)?://[^ ]*:[^ ]*@`; each match was attributed to its commit and file and triaged. Extra checks over the same range: `sk_live_`, `rk_live_`, `ghp_`, `gho_`, Slack `xox*-` tokens, `sk_test_` and `whsec_` values of useful length, Resend `re_` keys, Google `AIza` keys and JWT-shaped strings. `git ls-files | grep -iE '\.env|appsettings|\.pem|\.key'` lists only `apps/api/WhitePlate.Api/appsettings.json`, `apps/api/WhitePlate.Api/appsettings.Development.json` and `apps/frontend/.env.example`; no `.env`, `.pem` or `.key` file is tracked. No gitleaks `--no-git` working-tree scan was run (gitleaks not installed); the Git history already contains every tracked working-tree file.

Counts: 74 matched lines. 65 in documentation, plans, specs and audit files; 9 in source and tests.

| Group | Count | Verdict |
| --- | --- | --- |
| Documentation, plans and specs (`docs/`, excluding audit files) | 61 | Prose or placeholders: `dotnet user-secrets set` examples with `..._REPLACE_WITH_...` values, `<secret>`-style text, variable names. No credential values. |
| Audit files (`docs/audits/`) | 4 | The word "secret" in prose, including this README's build-environment note. |
| Test fixtures (`StripeConnectProviderTests.cs`, commit `98884f2`) | 4 | Dummy values: two `whsec_...` webhook secret fixtures (test and live mode) and helper parameter names. |
| Code (`StripeConnectProvider.cs`, commits `6b5d6c9`, `98884f2`) | 5 | References to `settings.ApiKey` and `WebhookSecret` read from options; no literals. |

Extra patterns: 2 hits, both Stripe live-key prefix literals in the same commit (`98884f2`): a prefix check `StartsWith("sk_l...")` in `StripeConnectProvider.cs` and a test value `"sk_l...example"` in `StripeConnectProviderTests.cs`. Neither is a key.

Leads (not real credentials, and not findings):

- `apps/frontend/lib/auth.ts:53-55` falls back to a hard-coded development secret when `BETTER_AUTH_SECRET` is unset (value begins `whit...`). It predates this range (first added in `afbe686`, found by the earlier scan) and is unchanged at `55f31a5`. The same file throws in production when the variable is missing or shorter than 32 characters (`auth.ts:14-35`), so the fallback appears limited to non-production. For W5 to confirm, including that `NODE_ENV` is `production` on the deployed frontend.
- A literal public IPv4 address with port 5433 for the PostgreSQL host remains in `docs/deployment/coolify.md` (lines 111 and 238) and `apps/frontend/lib/auth-database.test.ts:14`, with placeholder credentials only (introduced in `87a1271`). This is infrastructure disclosure rather than a credential, and W8 already records that the port is reachable (HOST-02). The address is not repeated here.

Verdict: no live credential, private key, AWS key or real database password was found in `7e5b2e3..HEAD` or in tracked filenames, and none in the earlier scan of the history before it. The scan is pattern-based and not a substitute for gitleaks entropy and rule coverage; gitleaks remains Not run.

### Static analysis

Semgrep was not run (install not approved by owner), so there are no static-analysis leads for W1-W5 from this task.

## Findings by severity

Interim: Task 14 recomputes this section across all workstreams. Per-workstream finding files are the source of truth. Workstreams written so far:

| Severity | Count | Findings |
| --- | --- | --- |
| Blocker | 1 | HOST-01 (Confirmed) |
| Should | 4 | HOST-02, HOST-03 (Confirmed); HOST-04, HOST-06 (Suspected) |
| Could | 4 | HOST-07, HOST-08 (Confirmed); HOST-05, HOST-09 (Suspected) |

Source: `w8-hosted-posture.md`. W1-W7 and W9 are not written yet.

## Links

- Spec: [production-readiness audit design](../../superpowers/specs/2026-10-25-production-readiness-audit-design.md)
- Plan: [production-readiness audit plan](../../superpowers/plans/2026-10-25-production-readiness-audit.md)
- Kanban umbrella card: pending (gh project scope not yet granted; created in Task 14)
- Audited code: origin/main 55f31a5 (2026-10-19); local main 7e5b2e3 was 178 commits behind; a fresh git fetch failed on this workstation (TLS interception), so origin may be newer
