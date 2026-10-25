# Production-readiness audit design

25 October 2026. Status: design approved in conversation; written specification review pending.

## Intent and approved scope

WhitePlate is about to serve real restaurants, staff and guests. The user approved a full code audit whose purpose is a **production-readiness gate**: find what must be fixed before onboarding real tenants (security, tenant isolation, accessibility, data integrity, performance on the guest path) and turn it into an ordered remediation backlog.

The audit produces documentation and kanban cards only. It changes no product code, schema, dependency or deployment. Each remediation batch it identifies is a separate task with its own design (an in-chat design or a written spec, depending on size), plan, branch and verification.

Depth approved by the user: static source review, local runtime checks, and **read-only, unauthenticated** checks against hosted Production and Preview. Out of scope: load testing, penetration testing beyond read-only probes, authenticated hosted probes, account creation on hosted environments, and any fix.

Accessibility target: **WCAG 2.2 AA**, a superset of the WCAG 2.1 AA level referenced by EN 301 549 and the European Accessibility Act, which may apply to restaurant e-commerce. Security coverage uses OWASP ASVS 4 Level 2 sections as a per-boundary completeness check, not as the method.

## Selected approach

Risk-first audit by trust boundary. The attack surface is mapped first, then each boundary is reviewed in depth, with automated scanners as cheap input. Alternatives considered:

- **Checklist-first (full ASVS L2 + WCAG item by item):** strongest compliance evidence, but slow and dominated by inapplicable items.
- **Tools-only sweep and triage:** fast, but cannot find the highest risks here: cross-tenant authorization logic, capability-token tracking, checkout price/discount tampering and idempotency.

## Workstreams

Ordered by risk. W1–W3 decide the production gate.

| ID | Workstream | Examined | Key questions |
| --- | --- | --- | --- |
| W1 | Tenant isolation and authorization | API controllers, `Tenancy/`, `Identity/`, EF queries and filters, Next `app/api/*` routes, server actions, caches, SignalR `/hubs/orders` groups | Can an account in organization A read or write organization B data? Does every read apply ownership? Are owner/manager/kitchen roles enforced server-side on every mutation? Is hub group membership authorized per tenant? |
| W2 | Authentication and session | Better Auth configuration, API JWT issuance/validation (issuer, audience, expiry, keys), email verification, password reset, staff invitations | Token lifetime and revocation; reset/invitation tokens single-use and expiring; account enumeration; cookie flags; CSRF on route handlers and server actions |
| W3 | Public surface | Storefront, checkout, discount redemption, capability-based order tracking, public establishment and opening-hours disclosure | Does the server recompute prices, options, discounts and quantities? Idempotency replay; capability entropy and expiry; `CheckoutRequestRateLimiter` coverage; information leakage in problem responses |
| W4 | Input, media and data | MinIO uploads, `RequestBodySizeLimitMiddleware`, request validation, localized payloads, migrations, outbox | Content type, size and image re-encoding; URL signing; SSRF through the private endpoint; mass assignment; optimistic concurrency; migration drift between source and shared environments |
| W5 | Supply chain, secrets and configuration | `package-lock.json`, NuGet references, `.github/workflows/ci.yml`, API Dockerfile, `.env*`, `appsettings*`, `NEXT_PUBLIC_*`, committed artifacts | Reachable vulnerable packages; secrets in tree or history; container user; security headers and CSP; CORS; `*-test` routes reachable in production builds; stray artifacts such as `apps/api/TestResults`, `WhitePlate.Api.csproj.user` and `apps/api/WhitePlate.Api/apps` |
| W6 | Accessibility | Journeys: guest order (menu → checkout → tracking), kitchen kanban, owner management (menu builder, establishment settings, opening hours) | Keyboard-only completion; focus order and return; accessible names and live regions; 320px reflow; 200% text; target size (2.5.8); dragging alternatives (2.5.7); contrast in both themes; French and English |
| W7 | Code health and test gaps | Layer boundaries, oversized files, duplication, frontend and API test suites | Which business rules and W1–W4 controls have no regression test? |
| W8 | Hosted posture, read-only | Vercel and Coolify, Production and Preview | TLS; headers; CORS preflight; auth redirects; error leakage; exposed OpenAPI or health detail; a few rate-limit probes. Preview/Production isolation status is recorded, not exploited |
| W9 | Performance, lightweight | EF queries for catalog, menu and order history; storefront rendering; product photos; client bundle | N+1 and unbounded queries; indexes for tenant-scoped filters and order-history paging; LCP, INP and CLS on the guest menu with simulated mobile; image sizing; bundle weight. Lab measurements only |

## Method

### Phase 0: setup gate

1. Obtain kanban access (`gh auth refresh -s read:project,project`; currently missing the `read:project` scope). Find or create the umbrella card **Full production-readiness audit**, check existing cards for overlap, and move it to `In progress`.
2. Work on branch `docs/production-readiness-audit`.
3. Record the baseline from `apps/frontend`: `npm run lint`, `npm run typecheck`, `npm run test`, `npm run build`; from the root: `dotnet test apps/api/WhitePlate.slnx`. Existing failures are recorded as findings, not waived.

### Phase 1: automated sweep

Run as input to manual review: `npm audit`, `dotnet list package --vulnerable --include-transitive`, a secret scan of the working tree and Git history, Semgrep C# and TypeScript/React rule sets, axe through the existing Playwright setup on W6 journeys, Lighthouse on the storefront, and a passive ZAP baseline against Production and Preview. No dependency is added to the repository; tools run from temporary locations. A tool that cannot be installed or run is recorded as such, not substituted silently.

### Phase 2: manual review by boundary

- W1 produces an **endpoint × role × tenant matrix** covering every API controller action, hub method and Next route handler or server action. Each cell cites the enforcing `file:line`, or is a finding.
- W1, W3 and W4 include local runtime probes against the local development database, using test accounts from the project's seed or fixture files (cross-tenant requests, role escalation, tampered checkout payloads, upload abuse).
- Where practical, a probe is recorded in its finding as a test sketch (request, expected and actual result) that the later remediation adopts as its failing regression test. No test file is added to the product test suites during the audit.

### Phase 3: hosted read-only

Unauthenticated `GET`, `HEAD` and `OPTIONS` only, plus at most 20 requests per rate-limit probe. No account creation, sign-in or write on hosted environments.

### Subagents and verification

Workstreams may run as parallel review subagents with independent briefs. Every reported finding is verified by the coordinating session before it enters the report; a finding that cannot be reproduced or confirmed in source is labelled **Suspected**.

## Finding format and severity

Each finding records: ID (`SEC-`, `AUTH-`, `PUB-`, `DATA-`, `CFG-`, `A11Y-`, `CODE-`, `HOST-`, `PERF-` followed by a number), workstream, location (`file:line` or URL), evidence (the command or request and its actual output), impact, severity, suggested fix direction, regression-test status, and Confirmed or Suspected.

| Severity | Meaning |
| --- | --- |
| Blocker | Cross-tenant access, authentication bypass, price or payment tampering, secret exposure, data loss, or a WCAG level A failure that blocks a core journey |
| Should | Fix before scaling: WCAG AA failures, missing headers or rate limits, reachable vulnerable dependencies, security controls without regression tests, guest-path performance problems |
| Could | Hygiene, refactoring and improvements |

A Blocker discovered mid-audit is reported to the user immediately; the user decides whether to hot-fix it outside the audit.

## Deliverables

All under `docs/audits/production-readiness/`:

1. `README.md`: overall verdict (Ready, Ready with conditions, Not ready), finding counts by severity, W1–W9 coverage marked Covered, Partial or Not run with a reason, baseline command results, and links.
2. One findings file per workstream: `w1-tenant-authz.md`, `w2-auth-session.md`, `w3-public-surface.md`, `w4-input-media-data.md`, `w5-supply-chain-config.md`, `w6-accessibility.md`, `w7-code-health.md`, `w8-hosted-posture.md`, `w9-performance.md`.
3. `remediation-backlog.md`: findings grouped into fix batches that can land as one change, each with covered findings, size estimate, dependencies, and whether it needs a written spec or an in-chat design.
4. Corrections to existing documentation where the audit shows it disagrees with source, made in the same change. `docs/README.md` links the audit.

## Kanban

- The umbrella card tracks the audit and closes only when every workstream is Covered or Not run with a stated reason, with verification evidence recorded.
- One card per fix batch, not per finding. Batches containing a Blocker go to `Ready`; others to `Backlog`. Cards cite finding IDs and acceptance criteria from the findings.
- Unresolved decisions surfaced by the audit become `Backlog` cards.

## Sequencing and commits

W1 → W2 → W3 → W4 first; W5 and W8 in parallel, being mostly tool-driven; then W6, W9 and W7. One commit per workstream, for example `docs(audit): record W1 tenant authorization findings`, on one branch and one pull request.

## Success criteria

- Every API action, hub method and frontend route handler or server action appears in the W1 matrix.
- Every finding has evidence and a severity; no unverified claim is stated as confirmed.
- The verdict is justified by the Blocker list.
- Every Blocker and Should finding belongs to a fix batch with a kanban card.
- Commands that could not run are recorded with the reason.
