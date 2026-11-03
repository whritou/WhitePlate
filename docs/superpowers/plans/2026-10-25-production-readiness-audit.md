# Production-Readiness Audit Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Produce the evidence-backed production-readiness audit of WhitePlate (W1–W9), a verdict, and a remediation backlog mapped to kanban cards, without changing product code.

**Architecture:** One findings document per workstream under `docs/audits/production-readiness/`, all following one finding format. A standard-library Python verifier (modelled on `docs/design-system/verify.py`) is the audit's "test suite": it enforces the finding format, ID uniqueness, W1 attack-surface coverage computed from source, backlog coverage of Blocker/Should findings, and README coverage. Each workstream task ends with the verifier passing and a commit.

**Tech Stack:** Python 3 standard library (verifier and tests), existing frontend toolchain (Vitest, ESLint, tsc, Next build, Playwright with the transitive `axe-core` package), .NET 10 SDK, `gh` CLI, `curl`. Optional scanners only with user approval (see Global Constraints).

**Spec:** `docs/superpowers/specs/2026-10-25-production-readiness-audit-design.md`

## Global Constraints

- No product code, schema, dependency, lockfile, CI or deployment change. Only files under `docs/` change. No test file is added to product suites; probes are recorded as test sketches inside findings.
- Branch `docs/production-readiness-audit`; one commit per task; Conventional Commits with the `docs(audit):` prefix; each message ends with `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`.
- Accessibility target: WCAG 2.2 AA. Security completeness check: OWASP ASVS 4.0.3 Level 2 chapters named per task.
- Severity: **Blocker** (cross-tenant access, authentication bypass, price or payment tampering, secret exposure, data loss, WCAG level A failure blocking a core journey), **Should** (WCAG AA failures, missing headers or rate limits, reachable vulnerable dependencies, security controls without regression tests, guest-path performance problems), **Could** (hygiene, refactoring, improvements).
- Every finding is Confirmed (reproduced or cited in source with `file:line`) or Suspected. Nothing unverified is written as Confirmed. Subagent findings are re-verified by the coordinating session before entering a file.
- A Blocker found at any time: stop the task, report it to the user in chat with its evidence, and continue only after the user decides on a hot-fix outside the audit.
- Hosted environments (Vercel and Coolify, Production and Preview): unauthenticated `GET`, `HEAD`, `OPTIONS` only; at most 20 requests per rate-limit probe; no sign-in, account creation or write.
- Local runtime probes: local API (HTTP profile, `http://localhost:5182`) and frontend (`http://localhost:3000`) per `docs/development.md`, against the documented Neon `test` branch only after confirming `DATABASE_URL` targets it and setting `WHITEPLATE_ACCEPTANCE_DATABASE='neon-test'`. Use the existing verified `.invalid` local account; a second tenant account is created only through the local sign-up page and its non-secret identifiers go in the ignored `.acceptance/` folder. Never print or record passwords or tokens.
- Downloads and installs require explicit user approval each time (state tool, source and size): Semgrep (pip into a scratchpad virtual environment), gitleaks (GitHub release binary), Node 24.19.0 through nvm, Lighthouse, ZAP. Without approval, use the listed fallback and record the tool as Not run.
- Raw tool output stays in the session scratchpad; findings quote only the relevant lines.
- Finding format (exact; the verifier parses it):

```markdown
### PUB-03 — Checkout accepts client-supplied unit price

- **Workstream:** W3
- **Location:** `apps/api/WhitePlate.Application/Orders/CreateOrderHandler.cs:88`
- **Evidence:** `curl -X POST … ` returned `201` with `total: 0.01`
- **Impact:** A guest can pay any amount.
- **Severity:** Blocker
- **Fix direction:** Recompute line prices from the catalog snapshot server-side.
- **Regression test:** Sketch below
- **Status:** Confirmed
```

  ID prefixes: `SEC` (W1), `AUTH` (W2), `PUB` (W3), `DATA` (W4), `CFG` (W5), `A11Y` (W6), `CODE` (W7), `HOST` (W8), `PERF` (W9), then two digits. `Regression test` is `None`, `Existing <path>` or `Sketch below` (a fenced request/expected/actual block follows the bullets).

### Workstream procedure (applies to Tasks 4–12)

1. Read the listed docs and source.
2. Answer every listed question; each answer is either a finding or one line under `## Checked, no finding` citing `file:line` evidence.
3. Run the listed probes; record commands and actual results.
4. Write the file: `# Wn — <title>`, `## Scope and method`, `## Findings`, `## Checked, no finding`, `## Not covered` (with reasons), `## ASVS / WCAG coverage`.
5. Run `py -3 docs/audits/production-readiness/verify.py` from the repository root; expected `OK`.
6. Commit.

## Review Focus

1. A controller action, hub method, route handler or server action added after the matrix was written — the verifier recomputes the surface from source, so a stale matrix fails (Task 1 test `test_missing_matrix_row_is_reported`).
2. Findings files edited by hand with a typo in a field label or severity (for example `Severity: blocker`) — must fail verification, not silently drop the finding (Task 1 test `test_invalid_severity_is_reported`).
3. The same ID reused in two workstream files — must fail (Task 1 test `test_duplicate_ids_across_files`).
4. A Should finding left out of every fix batch — must fail (Task 1 test `test_unbatched_should_finding_is_reported`).
5. A route handler exporting several HTTP methods, or an `async function` export in a server action file that is a helper rather than an action — every exported async function in a `"use server"` file counts as an action because Next exposes it (Task 1 test `test_surface_enumeration`).

---

### Task 1: Audit verifier

**Files:**
- Create: `docs/audits/production-readiness/verify.py`
- Test: `docs/audits/production-readiness/test_verify.py`

**Interfaces:**
- Produces:
  - `parse_findings(text: str, source: str) -> tuple[list[dict], list[str]]` — finding dicts with keys `id`, `title`, `workstream`, `location`, `evidence`, `impact`, `severity`, `fix`, `regression`, `status`, `source`; plus error strings.
  - `enumerate_surface(repo_root: pathlib.Path) -> set[str]` — keys `Controller.Method` (each method preceded by an `[Http…]` attribute in `apps/api/WhitePlate.Api/Controllers/*.cs`), `KitchenHub.<Method>` (public non-override methods in `apps/api/WhitePlate.Api/Realtime/KitchenHub.cs`), `app/api/<path>/route.ts#<METHOD>` (exported `GET|POST|PUT|PATCH|DELETE|HEAD|OPTIONS`, including `export const { GET, POST } = …`), `actions/<file>.ts#<name>` (exported async functions in files starting with `"use server"`).
  - `matrix_rows(text: str) -> set[str]` — backticked first cells of table rows under `## Endpoint × role × tenant matrix` in W1 files.
  - `check_backlog(findings: list[dict], backlog_text: str) -> list[str]`
  - `check_readme(readme_text: str) -> list[str]` — requires a `## Coverage` table with rows `W1`…`W9`, each status `Covered`, `Partial` or `Not run`, and `Not run`/`Partial` rows with a non-empty reason.
  - `main(argv: list[str]) -> int` — runs all checks on `docs/audits/production-readiness/*.md`; prints `OK` and returns 0, or prints one error per line and returns 1. Files not yet created are skipped, except that matrix coverage is checked only once `w1-*.md` contains the matrix heading, and backlog coverage only once `remediation-backlog.md` exists.

- [ ] **Step 1: Write failing tests** in `test_verify.py` (`unittest`, inline Markdown strings and a temporary directory tree):
  - `test_valid_finding_parses` — the Global Constraints example yields one finding with `id == "PUB-03"`, `severity == "Blocker"`, no errors.
  - `test_missing_field_is_reported` — dropping `**Impact:**` yields an error containing `PUB-03` and `Impact`.
  - `test_invalid_severity_is_reported` — `Severity: blocker` yields an error.
  - `test_invalid_id_prefix_is_reported` — `### XYZ-01 — t` yields an error.
  - `test_duplicate_ids_across_files` — two sources with `SEC-01` yield an error naming both sources.
  - `test_surface_enumeration` — temp tree with a controller containing `[HttpGet]` and `[HttpPost("x")]` methods `List` and `Create` plus an unattributed helper, a hub with `JoinRestaurant` and `OnDisconnectedAsync` override, a route file `export async function GET` and `export async function POST`, and a `"use server"` file with `export async function placeOrder` and a non-exported helper; expect exactly `{"OrdersController.List", "OrdersController.Create", "KitchenHub.JoinRestaurant", "app/api/kitchen/orders/route.ts#GET", "app/api/kitchen/orders/route.ts#POST", "actions/checkout.ts#placeOrder"}`.
  - `test_missing_matrix_row_is_reported` — surface `{"A.B", "C.D"}`, matrix with only `` `A.B` `` reports `C.D`.
  - `test_unbatched_should_finding_is_reported` — a Should finding whose ID is absent from backlog text yields an error; a Could finding absent does not.
  - `test_readme_requires_reason_for_not_run` — `| W5 | Not run | |` yields an error; `| W5 | Not run | Docker unavailable |` does not.

- [ ] **Step 2: Run tests to verify they fail**

Run: `py -3 -m unittest discover -s docs/audits/production-readiness -p "test_*.py" -v`
Expected: errors importing `verify`.

- [ ] **Step 3: Implement the interfaces above in `verify.py`** using `re` and `pathlib` only; repository root is `Path(__file__).resolve().parents[3]`.

- [ ] **Step 4: Run tests to verify they pass**

Run: same command. Expected: 9 tests OK.

- [ ] **Step 5: Run the verifier on the empty audit folder**

Run: `py -3 docs/audits/production-readiness/verify.py`
Expected: `OK`.

- [ ] **Step 6: Commit**

```bash
git add docs/audits/production-readiness/verify.py docs/audits/production-readiness/test_verify.py
git commit -m "docs(audit): add production-readiness audit verifier"
```

### Task 2: Setup gate, kanban and baseline

**Files:**
- Create: `docs/audits/production-readiness/README.md`

**Interfaces:**
- Consumes: `check_readme` (Task 1).
- Produces: README sections `## Verdict` (value `Pending`), `## Coverage` (W1–W9 all `Not run`, reason `Pending`), `## Baseline`, `## Automated sweep`, `## Findings by severity`, `## Links`.

- [ ] **Step 1: Kanban access.** Ask the user to run `gh auth refresh -s read:project,project`, then confirm with `gh project item-list 1 --owner whritou --format json --limit 300`. List open cards touching security, accessibility, testing, deployment or performance in chat so overlaps are known.
- [ ] **Step 2: Umbrella card.** Find or create **Full production-readiness audit** with the spec path, scope W1–W9 and the spec's success criteria; set status `In progress`. Record its URL in README `## Links`.
- [ ] **Step 3: Node version.** Repository requires Node `^24.19.0` (`apps/frontend/package.json`, `.nvmrc`); this machine runs 20.18.3. Ask approval for `nvm install 24.19.0`. If declined, run the baseline on 20.18.3 and record the mismatch as finding input for W5.
- [ ] **Step 4: Run the baseline** from `apps/frontend`: `npm run lint`, `npm run typecheck`, `npm run test`, `npm run format:check`, `npm run build`; from the root: `dotnet test apps/api/WhitePlate.slnx`. Record each command, pass/fail and counts in `## Baseline`. Failures stay listed as findings input for W7 (lint, format, test) or W5 (build, toolchain).
- [ ] **Step 5: Verify**

Run: `py -3 docs/audits/production-readiness/verify.py`
Expected: `OK`.

- [ ] **Step 6: Commit** — `docs(audit): record audit baseline`.

### Task 3: Automated sweep

**Files:**
- Modify: `docs/audits/production-readiness/README.md` (`## Automated sweep`)

- [ ] **Step 1: Dependency scans.** `npm audit --json` from `apps/frontend`; `dotnet list apps/api/WhitePlate.slnx package --vulnerable --include-transitive`. Record counts by severity and each advisory with the package path; reachability is decided in W5.
- [ ] **Step 2: Secret scan.** With approval, gitleaks `detect --source . --log-opts="--all"` and `--no-git`. Fallback: `git log --all -p | grep -nE` for `password=|secret|BEGIN .*PRIVATE KEY|AKIA[0-9A-Z]{16}|postgres(ql)?://[^ ]*:[^ ]*@`, plus `git ls-files | grep -iE '\.env|appsettings|\.pem|\.key'`. Write matches to the scratchpad only and quote them redacted (first 4 characters). Any real secret is a Blocker: stop and report.
- [ ] **Step 3: Static analysis.** With approval, Semgrep `p/csharp`, `p/typescript`, `p/react`, `p/nextjs`, `p/secrets` on `apps/`, excluding `node_modules`, `bin`, `obj`, `.next`. Fallback: Not run. Results are leads for W1–W5, not findings.
- [ ] **Step 4: Record** each tool as Ran / Not run (reason) with counts.
- [ ] **Step 5: Verify** (`verify.py` → `OK`) and **commit** — `docs(audit): record automated sweep`.

### Task 4: W1a — API and hub authorization matrix

**Files:**
- Create: `docs/audits/production-readiness/w1-tenant-authz.md` (sections `## Endpoint × role × tenant matrix` and the standard sections)

**Interfaces:**
- Consumes: `enumerate_surface`, `matrix_rows` (Task 1).
- Produces: matrix columns `Surface | Anonymous | Kitchen | Manager | Owner | Foreign-org account | Tenant source | Enforcement (file:line) | Finding`. Cell values `Allow`, `Deny`, `Allow (own tenant)`, `n/a`.

Read: `docs/architecture/tenancy-and-security.md`, `docs/api/api-contracts.md`, `Tenancy/*`, `Identity/HttpCurrentIdentity.cs`, all 12 controllers (60 `[Http…]` actions), `Realtime/KitchenHub.cs`, `KitchenSubscriptions.cs`, the Application handlers each action calls, and EF configuration/query code in `WhitePlate.Infrastructure`.

Questions: Is the tenant taken from route, host, header or body, and is membership checked against the authenticated account for that tenant? Are role checks in the handler (not only the UI)? Do list queries filter by tenant before paging? Can an ID from tenant B be passed with tenant A's route? Does `JoinRestaurant` verify membership and role, and are groups left when membership is revoked? Do `Public*` controllers expose only published data?

Probes: with two local tenant accounts, for each mutating action replay one request with the foreign tenant/resource ID and a kitchen-role token where a higher role is required; for the hub, join the foreign tenant's group.

ASVS: V1.4, V4.1–V4.3, V13.1–V13.2.

- [ ] **Step 1:** Generate the surface list (`py -3 -c "import sys; sys.path.insert(0,'docs/audits/production-readiness'); import verify, pathlib; print(*sorted(k for k in verify.enumerate_surface(pathlib.Path('.')) if '/' not in k), sep='\n')"`) and fill the matrix rows for controllers and hub.
- [ ] **Step 2:** Apply the workstream procedure.
- [ ] **Step 3:** Add every `app/api/…` and `actions/…` surface key as a row with `Pending (W1b)` in the `Finding` column; Task 5 completes them.
- [ ] **Step 4: Verify** — `verify.py` → `OK`.
- [ ] **Step 5: Commit** — `docs(audit): record W1 API authorization findings`.

### Task 5: W1b — Next route handlers, server actions, caches

**Files:**
- Modify: `docs/audits/production-readiness/w1-tenant-authz.md`

Read: the 10 `app/api/**/route.ts` files, 6 `actions/*.ts` files, `lib/` API client and session helpers, `proxy.ts`, `docs/architecture/frontend-conventions.md`.

Questions: Does each handler/action derive the account from the server session and never trust a browser-supplied tenant ID as authorization? Does it forward the user's token rather than a privileged one? Can `api/kitchen/signalr-token` mint a token for a foreign tenant? Do `fetch` caches, `unstable_cache`, `revalidate*` or React `cache` key by tenant and account? Is the Zustand guest cart scoped per tenant host? Does `proxy.ts` path matching leave any protected route unmatched?

ASVS: V4.1–V4.2, V13.2.

- [ ] **Step 1:** Replace every `Pending (W1b)` row and apply the workstream procedure.
- [ ] **Step 2: Verify** — `verify.py` → `OK` (matrix complete).
- [ ] **Step 3: Commit** — `docs(audit): record W1 frontend authorization findings`.

### Task 6: W2 — Authentication and session

**Files:** Create `docs/audits/production-readiness/w2-auth-session.md`

Read: `lib/auth.ts` and Better Auth plugins, `app/api/auth/[...all]/route.ts`, `scripts/dev-token.mjs`, API JWT setup in `Program.cs` / `Configuration/ServiceRegistration.cs`, `StaffInvitationsController.cs`, `docs/architecture/decisions/0002-authentication.md`, sign-in/sign-up/reset/verify/invitation pages.

Questions: JWT signing algorithm, key source and rotation; `ValidateIssuer/Audience/Lifetime`, clock skew; token lifetime and what happens to API tokens after sign-out or membership revocation; session cookie `HttpOnly`, `Secure`, `SameSite`, prefix; CSRF/origin checks on server actions and route handlers; reset and invitation tokens: entropy, expiry, single use, bound to email; enumeration through sign-up, sign-in, reset responses or timing; password policy and Better Auth rate limit settings; `dev-token` script unusable in production.

Probes (local): reuse a used reset/invitation link; compare sign-in error text and status for existing vs unknown email; call the API with an expired and an algorithm-`none` token.

ASVS: V2, V3, V6.4.

- [ ] **Step 1:** Apply the workstream procedure.
- [ ] **Step 2: Verify** and **commit** — `docs(audit): record W2 authentication findings`.

### Task 7: W3 — Public surface

**Files:** Create `docs/audits/production-readiness/w3-public-surface.md`

Read: `OrdersController.cs`, `MenuController.cs`, `PublicBrandAssetsController.cs`, `PublicProductPhotosController.cs`, `Configuration/CheckoutRequestRateLimiter.cs`, order/discount handlers and domain, idempotency records, `actions/checkout.ts`, `app/api/public/**`, `docs/architecture/decisions/0006-public-order-tracking.md`, `Errors/`.

Questions: Does the server ignore client prices, tax and totals and recompute from the catalog (including option prices, archived/hidden/unavailable products and categories)? Quantity bounds (zero, negative, huge, non-integer)? Discount: inactive, expired, foreign-tenant code, repeated use limits, percentage over 100, rounding? Idempotency key scope (tenant + key), replay with a different body? Tracking capability entropy, expiry, constant-time compare, enumeration of `orderId`, data exposed? Rate limiter partition key (IP behind proxy? `X-Forwarded-For` trust)? Problem responses: stack traces, internal IDs, SQL text? Opening hours: any closed-time ordering not enforced is recorded against S3 scope, not as a finding.

Probes (local, Neon `test`): tampered price/quantity/option payloads; foreign discount code; idempotency replay with changed body; tracking with altered capability; 25 rapid checkouts to observe 429.

ASVS: V5.1, V7.4, V11.1, V13.2.

- [ ] **Step 1:** Apply the workstream procedure.
- [ ] **Step 2: Verify** and **commit** — `docs(audit): record W3 public surface findings`.

### Task 8: W4 — Input, media and data

**Files:** Create `docs/audits/production-readiness/w4-input-media-data.md`

Read: `BrandAssetsController.cs`, `ProductPhotosController.cs`, `Configuration/MediaRegistration.cs`, `RequestBodySizeLimitMiddleware.cs`, media services in Infrastructure, request contracts in `Contracts/`, EF migrations folder and model snapshot, outbox and archive dispatchers, `apps/api/brand-media-migrations.sql`, `docs/database/database-schema.md`, `docs/deployment/coolify.md` migration records.

Questions: Upload type detection by content (magic bytes) not extension; decoding limits (pixel dimensions, decompression bombs); re-encoding strips metadata and scripts (SVG?); object keys tenant-prefixed and unguessable; public delivery cannot read another tenant's or a draft object; private endpoint and `AllowPrivateHttp` cannot be pointed at by user input (SSRF); request contracts bind only intended fields; string length limits match the schema; `If-Match`/version on every mutating management write; outbox retry idempotent and poison messages bounded; which migrations are unapplied per environment and whether `brand-media-migrations.sql` matches EF migrations.

Probes (local): upload a renamed non-image, an oversized-dimension PNG, an SVG with script; request another tenant's asset path through the public routes.

ASVS: V5.1–V5.3, V12.1–V12.5, V8.1.

- [ ] **Step 1:** Apply the workstream procedure.
- [ ] **Step 2: Verify** and **commit** — `docs(audit): record W4 input and data findings`.

### Task 9: W5 — Supply chain, secrets and configuration

**Files:** Create `docs/audits/production-readiness/w5-supply-chain-config.md`

Read: Task 3 results, `.github/workflows/ci.yml`, `apps/api/WhitePlate.Api/Dockerfile`, `apps/api/.dockerignore`, `next.config.ts`, `proxy.ts`, `Program.cs` (CORS, headers, HTTPS, forwarded headers, OpenAPI), `appsettings*.json`, `.env.example` files, `.gitignore`, every `NEXT_PUBLIC_` use (`grep -rn NEXT_PUBLIC_ apps/frontend --include=*.ts --include=*.tsx -l` excluding `node_modules`).

Questions: Which advisories are reachable from shipped code? CI: pinned actions, token permissions, API tests and build run in CI or not? Container runs as non-root, minimal runtime image, health check? Security headers (CSP, HSTS, `X-Content-Type-Options`, `Referrer-Policy`, `Permissions-Policy`, `frame-ancestors`) set by Next or API? CORS origins explicit, no credentials with wildcard? Forwarded headers trusted only from the proxy? Does any `NEXT_PUBLIC_` value expose server data? Are the 10 `*-test` routes and `__test__` under `app/[locale]` excluded from production builds — confirm with `npm run build` output plus `next start` requests returning 404 for each? Stray tracked artifacts: `git ls-files apps/api/TestResults apps/api/WhitePlate.Api/apps "*.csproj.user" "*.tsbuildinfo"`. Node engine mismatch from Task 2.

- [ ] **Step 1:** Apply the workstream procedure.
- [ ] **Step 2: Verify** and **commit** — `docs(audit): record W5 supply chain and configuration findings`.

### Task 10: W8 — Hosted posture (read-only)

**Files:** Create `docs/audits/production-readiness/w8-hosted-posture.md`

Ask the user in chat for the Production and Preview frontend and API origins and one public tenant storefront host; use only those. Record them in the file.

Probes (each origin): `curl -sSI` on `/`, `/fr`, `/en/sign-in`; API `/health/live`, `/health/ready`, `/openapi/v1.json`, `/swagger`, a nonexistent route, and a CORS preflight `OPTIONS` with `Origin: https://evil.example`; TLS protocol and certificate via `curl -vI` / `openssl s_client` if available; protected page signed out (expect redirect, no data); public order tracking with a random ID (expect generic 404). At most 20 sequential checkout-endpoint `OPTIONS`/`GET` probes for rate-limit headers; no `POST`. With approval, ZAP baseline (passive); fallback Not run.

Questions: headers match W5 expectations; no stack traces, versions (`Server`, `X-Powered-By`) or internal hostnames; OpenAPI absent in Production; CORS rejects the foreign origin; Preview uses separate database and secrets (record documented status only).

ASVS: V9.1, V14.3–V14.5.

- [ ] **Step 1:** Apply the workstream procedure.
- [ ] **Step 2: Verify** and **commit** — `docs(audit): record W8 hosted posture findings`.

### Task 11: W6 — Accessibility (WCAG 2.2 AA)

**Files:** Create `docs/audits/production-readiness/w6-accessibility.md`

Read: `docs/design-system/README.md`, `docs/audits/ui-state-density.md`, existing Playwright projects (`design-system`, `orders-kanban`, `menu-builder`, `establishment-settings`, `mobile-workspace-settings`).

Journeys: (a) guest: `bistro.localhost:3010` checkout fixture per `docs/development.md` — menu, options dialog, cart, discount error, checkout, receipt, tracking; (b) kitchen: `/en/orders-kanban-test` and `/fr/…`; (c) owner: `/en/catalog-design-test?view=builder`, `/en/establishment-design-test`, opening-hours editor, sign-in/sign-up/reset.

Probes: a scratchpad Playwright script (outside the repo) that injects `node_modules/axe-core/axe.min.js` with `page.addScriptTag` and runs `axe.run` tagged `wcag2a, wcag2aa, wcag21a, wcag21aa, wcag22aa` on each page in both locales and themes at 320 and 1280px; record violations by rule and node. Manual keyboard-only completion of each journey; focus visibility and return after dialogs/sheets; screen-reader names and live-region announcements via the accessibility tree (`read_page`); 200% text; 2.5.7 drag alternative in the kanban; 2.5.8 targets (≥24px); 3.3.7 redundant entry and 3.3.8 accessible authentication on sign-in; `lang` on FR/EN pages.

Every axe violation is verified in the page before becoming a finding. A level A failure blocking a journey is a Blocker.

- [ ] **Step 1:** Apply the workstream procedure; `## ASVS / WCAG coverage` lists each WCAG 2.2 AA criterion as Pass, Fail (finding ID), Not applicable or Not tested.
- [ ] **Step 2: Verify** and **commit** — `docs(audit): record W6 accessibility findings`.

### Task 12: W9 — Performance (lightweight)

**Files:** Create `docs/audits/production-readiness/w9-performance.md`

Read: catalog, public menu and order-history query handlers and EF configurations/indexes; migration snapshot indexes; storefront page components; product-photo delivery route and sizes; `next build` route size output from Task 2.

Questions: queries inside loops or lazy loading producing N+1; unbounded `ToList` on tenant data; indexes for `(TenantId, …)` filters and order-history cursor ordering; public menu cached or recomputed per request; images sized/`srcset`/lazy below the fold; largest client bundles and their causes.

Probes: enable EF command logging locally and count SQL statements for one public menu load and one order-history page; with approval Lighthouse mobile on the guest fixture, fallback a scratchpad Playwright script with CDP 4× CPU throttling and Slow 4G collecting LCP and CLS via `PerformanceObserver` and INP proxy via event timing on add-to-cart. Thresholds: LCP ≤ 2.5s, CLS ≤ 0.1, INP ≤ 200ms; misses on the guest path are Should.

- [ ] **Step 1:** Apply the workstream procedure (skip the ASVS section; write `n/a`).
- [ ] **Step 2: Verify** and **commit** — `docs(audit): record W9 performance findings`.

### Task 13: W7 — Code health and test gaps

**Files:** Create `docs/audits/production-readiness/w7-code-health.md`

Read: `docs/coding-standards.md`, `docs/architecture/WHITEPLATE_BACKEND_ARCHITECTURE.md`, `apps/api/tests/WhitePlate.Tests`, frontend `tests/` and colocated `*.test.ts(x)`, Task 2 baseline.

Questions: For each Confirmed or Suspected finding in W1–W4, and for each implemented security control in the W1 matrix, does an automated test exist (cite it) — gaps are Should; layer violations (Api referencing Infrastructure internals, Domain depending outward); source files over 600 lines (`find apps -name '*.cs' -o -name '*.ts*' | xargs wc -l` excluding generated folders); duplicated request/validation logic between server actions and route handlers; baseline lint/format/test failures.

- [ ] **Step 1:** Apply the workstream procedure (ASVS section: V1.1, V1.14).
- [ ] **Step 2: Verify** and **commit** — `docs(audit): record W7 code health findings`.

### Task 14: Remediation backlog, verdict, kanban and pull request

**Files:**
- Create: `docs/audits/production-readiness/remediation-backlog.md`
- Modify: `docs/audits/production-readiness/README.md`, `docs/README.md` (reading-order row and status paragraph), any doc the audit showed to disagree with source

**Interfaces:**
- Consumes: all findings, `check_backlog`, `check_readme`.

- [ ] **Step 1: Batches.** Group findings into fix batches that each land as one change. Per batch: `## B<nn> — <title>`, covered finding IDs, highest severity, size (S/M/L), dependencies on other batches, `Design: written spec` or `Design: in-chat`, acceptance criteria drawn from the findings' fix directions and test sketches. Order: Blocker batches first, then by dependency.
- [ ] **Step 2: Verdict.** `Not ready` if any Confirmed Blocker is unfixed; `Ready with conditions` if only Should/Could or Suspected Blockers remain (list the conditions); otherwise `Ready`. Fill `## Coverage` with final W1–W9 statuses and reasons, and `## Findings by severity` counts per workstream.
- [ ] **Step 3: Doc corrections** for discrepancies recorded during the audit; link the audit from `docs/README.md`.
- [ ] **Step 4: Verify**

Run: `py -3 -m unittest discover -s docs/audits/production-readiness -p "test_*.py"` then `py -3 docs/audits/production-readiness/verify.py` and `py -3 docs/design-system/verify.py`
Expected: tests OK, `OK`, design-system verifier passes (link scans).

- [ ] **Step 5: Commit** — `docs(audit): record remediation backlog and verdict`.
- [ ] **Step 6: Kanban.** One card per batch (Blocker batches `Ready`, others `Backlog`) with finding IDs and acceptance criteria; unresolved decisions as `Backlog` cards. Update the umbrella card with the verdict, verification commands and results, coverage gaps; move it to `In review`.
- [ ] **Step 7: Push and open the PR** (`git push -u origin docs/production-readiness-audit`, `gh pr create`) with the verdict, Blocker list, coverage and verification results; body ends with `🤖 Generated with [Claude Code](https://claude.com/claude-code)`. Move the umbrella card to `Done` after merge.
