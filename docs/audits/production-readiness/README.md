# Production-readiness audit

Docs-only audit of WhitePlate across workstreams W1-W9. Findings live in the per-workstream files in this directory; this file holds the verdict, coverage, baseline and links. Source is not changed by the audit.

## Verdict

**Not ready.**

Rule (audit plan, Task 14 step 2): `Not ready` while any Confirmed Blocker is unfixed; `Ready with conditions` when only Should and Could findings, or Suspected Blockers, remain; otherwise `Ready`. HOST-01 is a Blocker by controller ruling (a total production outage of the core journey), since an outage is not one of the spec's listed Blocker categories.

One Confirmed Blocker is unfixed: HOST-01, the production API returns 503 "no available server" on every route ([w8-hosted-posture.md](w8-hosted-posture.md)). Nothing else reached Blocker: no cross-tenant access, authentication bypass, price tampering, secret exposure or level A failure on a core journey was found.

Path to `Ready with conditions`: resolve HOST-01 under batch [B01](remediation-backlog.md#b01--production-api-recovery-and-migration-guardrails). Recovery order (DATA-01): Diagnose first (HOST-01 owner checks 1-4 are read-only). If recovery restarts the existing build, do it without applying these migrations. Then, in one maintenance window: take a fresh off-host backup, apply the pending migrations, and deploy the matching `main` SHA (record it, HOST-05). The role migrations are not backward-compatible with the older build, and readiness does not detect a schema that lags the code. Before real tenants are onboarded, the blocked runtime probes must also be re-run once B01 holds and Neon `test` is migrated: W1 cross-tenant, hub and custom-role replay on PostgreSQL, W3 checkout tampering on PostgreSQL, and W6 order placement, receipt and live tracking. This re-run is required whatever is decided under D13, which only settles whether Partial coverage closes the audit card. Once HOST-01 is resolved, the 43 Should findings become the conditions. The most important, in order:

1. B01 completed in full: readiness fails on pending migrations, external health alerting is in place, and deployed SHAs are recorded (DATA-01, HOST-06, HOST-05).
2. B09: upgrade `next` to 16.4.3 or later and `zod` to 4.6.6 or later (CFG-01, CFG-02). The pinned `next` 16.3.4 has a reachable High advisory and is in range of three Critical ones.
3. B02 and B03: stop exposing the general-purpose API token to browser JavaScript, and make JWT validation explicit and tested (SEC-06, AUTH-01, AUTH-02, CODE-02).
4. B05: enforce the documented restaurant permissions and test every permission key (SEC-08, SEC-09, CODE-01).
5. B08: per-client checkout and quote rate limiting behind the BFF (PUB-01, CODE-05).
6. B11, B12 and B13: close the Internet-reachable PostgreSQL port, add off-host backups with a restore test, and disable production OpenAPI (HOST-02, DATA-07, HOST-04).
7. B10: security headers on the frontend and the API (HOST-03, CFG-05).
8. B04, B06 and B07: password, session and reset-token policy; membership removal; creation quotas and name reservation (AUTH-03, AUTH-04, AUTH-06, SEC-02, SEC-04), each after its owner decision.
9. B17 to B21: the 15 WCAG 2.2 A/AA findings (one Suspected) (A11Y-01 to A11Y-14, A11Y-19).
10. B14, B15, B16, B22 and B23: Stripe Connect, BFF and PostgreSQL test gaps, and the guest-path performance problems (CODE-03, CODE-04, CODE-06, PERF-01, PERF-03).

Could findings are not conditions, with one exception: HOST-05 (Could) is part of condition 1 because recording the deployed SHAs is how B01's recovery is verified. The coverage gaps below limit the verdict: hosted API behaviour, PostgreSQL-specific behaviour and API-backed pages were not exercised at runtime, so those checks must be repeated once B01 holds and Neon `test` is migrated.

## Coverage

All nine workstreams ran. The audited source is `origin/main` `55f31a5`, which holds 40 EF migrations. Production is documented as three migrations behind (possibly fewer, see DATA-02) and Neon `test` is 13 behind, so no runtime probe could use the current schema on a shared database.

| Workstream | Status | Reason |
| --- | --- | --- |
| W1 | Partial | Source review of all 191 matrix rows plus the 372 passing API tests; runtime cross-tenant, custom-role and hub replay blocked because Neon `test` is 13 migrations behind; Stripe OAuth end to end and hosted checks not run (HOST-01) |
| W2 | Partial | Invitation runtime probes blocked by the Neon `test` schema; hosted session cookie attributes and rate limiting not observable without a hosted sign-in; live OAuth providers and JWKS rotation not exercised |
| W3 | Partial | Neon `test` 13 migrations behind, so probes ran in the SQLite test host (no PostgreSQL locking or races); hosted API 503; no Stripe test keys, and no payment flow exists |
| W4 | Partial | SQLite test host only; production migration and backup state from documentation; no `dotnet-ef`; no real object storage |
| W5 | Partial | `npm audit` output from the automated sweep reused (lockfile unchanged); API headers and CORS not observed hosted (HOST-01); gitleaks and Semgrep not run (install not approved) |
| W6 | Partial | Dev fixtures, demo and public pages swept; API-backed workspace pages, order placement, receipt, live tracking and the opening-hours editor not run; no screen reader, real zoom or touch testing |
| W7 | Covered | Test-gap matrix for the W1-W4 controls built by negative search over both suites; no coverage tooling exists (CODE-14). Not covered by W7 itself: W6 findings and tests were excluded (W6 was in progress), test gaps behind W5, W8 and W9 findings were not mapped, and the Playwright specs were listed but not read or run |
| W8 | Partial | API unavailable (503), TLS interception on the audit workstation, ZAP not run |
| W9 | Partial | Lighthouse not approved; no photo-bearing menu; no PostgreSQL plans or hosted timings |

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
| axe through Playwright | Ran in W6 | Not part of this sweep; W6 ran it through Playwright (192 runs), see [w6-accessibility.md](w6-accessibility.md). |
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

Recomputed from the nine finding files with the verifier's parser. The finding files are the source of truth.

| Workstream | Blocker | Should | Could | Confirmed | Suspected | Total |
| --- | --- | --- | --- | --- | --- | --- |
| [W1 tenant authorization](w1-tenant-authz.md) | 0 | 5 | 5 | 9 | 1 | 10 |
| [W2 authentication and session](w2-auth-session.md) | 0 | 5 | 2 | 6 | 1 | 7 |
| [W3 public surface](w3-public-surface.md) | 0 | 1 | 6 | 6 | 1 | 7 |
| [W4 input, media and data](w4-input-media-data.md) | 0 | 2 | 5 | 6 | 1 | 7 |
| [W5 supply chain and configuration](w5-supply-chain-config.md) | 0 | 3 | 7 | 9 | 1 | 10 |
| [W6 accessibility](w6-accessibility.md) | 0 | 15 | 4 | 17 | 2 | 19 |
| [W7 code health](w7-code-health.md) | 0 | 6 | 8 | 14 | 0 | 14 |
| [W8 hosted posture](w8-hosted-posture.md) | 1 | 4 | 4 | 5 | 4 | 9 |
| [W9 performance](w9-performance.md) | 0 | 2 | 6 | 5 | 3 | 8 |
| **Total** | **1** | **43** | **47** | **77** | **14** | **91** |

By severity and status:

| Severity | Confirmed | Suspected | Findings |
| --- | --- | --- | --- |
| Blocker | 1 | 0 | HOST-01 (Confirmed) |
| Should | 38 | 5 | Suspected: DATA-07, CFG-02, A11Y-19, HOST-04, HOST-06 |
| Could | 38 | 9 | Suspected: SEC-05, AUTH-07, PUB-05, A11Y-18, HOST-05, HOST-09, PERF-05, PERF-07, PERF-08 |

Every Blocker and Should finding is in a fix batch in [remediation-backlog.md](remediation-backlog.md) (28 batches, 13 owner decisions). Two Could findings wait for an owner decision and are listed there as unbatched.

## Owner actions

1. Recover the production API (HOST-01). Diagnose first (HOST-01 owner checks 1-4 are read-only). If recovery restarts the existing build, do it without applying these migrations. Then, in one maintenance window: take a fresh off-host backup, apply the pending migrations, and deploy the matching `main` SHA (record it, HOST-05). Confirm the pending set with `__EFMigrationsHistory` first (up to three are documented; DATA-01, DATA-02). The role migrations are not backward-compatible with the older build, so do not apply them under it, and do not redeploy `main` before the schema matches.
2. Apply the 13 pending migrations to Neon `test` before the next acceptance run, so the blocked runtime probes (W1-W4, W6, W9) can be repeated.
3. Grant the GitHub token the `project` scope so the cards in [Kanban cards (to create)](remediation-backlog.md#kanban-cards-to-create) and the umbrella card can be created.
4. Record decisions D1-D13 in [Owner decisions](remediation-backlog.md#owner-decisions), starting with D1 (session lifetime, AUTH-04), D2 (photo caching versus ADR 0008, PERF-02), D3 (storefront name reservation, SEC-04) and D4 (Vercel-to-PostgreSQL network path, HOST-02).
5. Remove the W2 audit probe accounts from Neon `test` (`w2-probe-*@whiteplate.invalid`; IDs in the ignored `apps/frontend/.acceptance/w2-probe-ids.json`). W1 created no accounts; its probe IDs are in `.acceptance/w1-probe-ids.json`.
6. The main checkout's `apps/frontend/node_modules` predates `origin/main`; run `npm ci` before using the dev server.

## Documentation corrections

The audit corrected documentation that disagrees with source or with recorded production evidence. Each correction is a dated "Audit 2026-10-25" note next to the stale statement. Design intent is not rewritten, and no fix is claimed.

| Document | Correction | Finding |
| --- | --- | --- |
| [docs/README.md](../../README.md) | Status paragraph with the verdict and HOST-01; reading-order row for this audit; note that the K3 cancellation-reason migration is applied in production | HOST-01, DATA-01, DATA-02 |
| [tenancy-and-security.md](../../architecture/tenancy-and-security.md) | "keeps them server-side" is not currently true | SEC-06 |
| [ADR 0002](../../architecture/decisions/0002-authentication.md) | "Do not expose API tokens to client-side JavaScript" is not currently true; recovery responses reveal account existence by timing | SEC-06, AUTH-05 |
| [frontend-conventions.md](../../architecture/frontend-conventions.md) | The SignalR token route returns the general-purpose token | SEC-06 |
| [api-contracts.md](../../api/api-contracts.md) | Analytics permission check; effective checkout rate-limit partition; ThemePublication applied in production | SEC-08, PUB-01, DATA-02 |
| [database-schema.md](../../database/database-schema.md) | OrderCancellationReason applied in production | DATA-02 |
| [Backend architecture](../../architecture/WHITEPLATE_BACKEND_ARCHITECTURE.md) | OrderCancellationReason and ThemePublication applied in production | DATA-02 |
| [Restaurant management backlog](../../planning/restaurant-management-backlog.md) | ThemePublication applied in production | DATA-02 |
| [Live Orders audit](../live-orders.md) | OrderCancellationReason applied in production (two statements) | DATA-02 |
| [Coolify/Vercel runbook](../../deployment/coolify.md) | 2026-10-25 outage status, pending migrations, missing rollout records | HOST-01, DATA-01, DATA-02 |
| [Documentation review](../../documentation-review.md) | The recorded ESLint failure did not reproduce at `55f31a5` | CODE-12 |

Checked and left unchanged:

- The S2 opening-hours paragraph in `docs/README.md` already says the migration is applied to production and Neon `test`; no finding contradicts it.
- `api-contracts.md:22` and `tenancy-and-security.md:3` still call the role migrations unapplied, which matches DATA-01.
- `AGENTS.md:37` (CODE-12) is outside the audit's docs-only scope and is left to batch B28.
- Other "source-only" migration statements outside DATA-02's list (for example `api-contracts.md:43`, `database-schema.md:48`, `:56` and `:113`) were not re-verified one by one. B01's per-environment migration table, built from `__EFMigrationsHistory`, is the place to settle them.

## Verification

Run on 2026-10-25 from the repository root for the remediation-backlog and verdict change (Task 14). Documentation only; no product command was re-run.

| Command | Result |
| --- | --- |
| `py -3 -m unittest discover -s docs/audits/production-readiness -p "test_*.py"` | Pass: 13 tests, OK |
| `py -3 docs/audits/production-readiness/verify.py` | Pass: `OK` (finding format, unique IDs, W1 matrix against the enumerated surface, README coverage table, and every Blocker and Should ID present in `remediation-backlog.md`) |
| `py -3 docs/design-system/verify.py` | Pass: 119 contrast pairs across light and dark, CSS and token parity, palette parity, 10 documentation link scans |

A citation-stability check compared every `file:line` citation (including `(lines N and M)` forms) in the audit files and in the corrected documents against the cited file at `0cf4121`: 164 cited lines checked, 0 mismatched, ignoring only the inline "Audit 2026-10-25" notes. Corrections are inline notes or a section at the end of a file, so no cited line moved.

Final review corrections (`bdd4aab`), run on 2026-10-25 from the repository root: the unittest suite passed (13 tests, OK), `verify.py` printed `OK`, and `docs/design-system/verify.py` passed (119 contrast pairs, parity, 10 link scans). A citation-stability check of every `coolify.md` and `documentation-review.md` citation in the audit files against `85d832a` checked 53 cited lines (55 citations), 0 mismatched, ignoring only the inline audit notes.

A relative-link check over the files changed by this task found every new link and anchor resolvable. It also found three anchors that were already broken before this change and are left as they are: `api/api-contracts.md#orders-and-history` (from `docs/README.md` and `database-schema.md`) and `../audits/establishment-settings.md#legal-profile-rollout--2026-10-12` (from `api-contracts.md`).

Not done in this task: kanban cards (GitHub `project` scope not granted) and the push and pull request.

## Links

- Spec: [production-readiness audit design](../../superpowers/specs/2026-10-25-production-readiness-audit-design.md)
- Plan: [production-readiness audit plan](../../superpowers/plans/2026-10-25-production-readiness-audit.md)
- Remediation backlog: [remediation-backlog.md](remediation-backlog.md)
- Kanban umbrella card: pending (gh project scope not yet granted). Once created, it stays open pending decision D13: the audit spec closes it only when every workstream is Covered or Not run, and eight of nine are Partial; batch and decision cards are listed in [Kanban cards (to create)](remediation-backlog.md#kanban-cards-to-create)
- Documentation index entry: [docs/README.md](../../README.md)
- Audited code: origin/main 55f31a5 (2026-10-19); local main 7e5b2e3 was 178 commits behind; a fresh git fetch failed on this workstation (TLS interception), so origin may be newer
