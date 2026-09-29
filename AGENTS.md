# WhitePlate development instructions

## Read before changing code

1. Read [the documentation index](docs/README.md), [development guide](docs/development.md), and the architecture for the area being changed.
2. Read scoped `AGENTS.md` files. The frontend has additional rules in `apps/frontend/AGENTS.md`, including reading the installed Next.js documentation before writing Next.js code. The API has project-boundary instructions in `apps/api/AGENTS.md`.
3. Inspect source and manifests. If they disagree with documentation, describe the discrepancy and update documentation with the implementation.

## Repository boundaries

- Frontend: `apps/frontend`, with `app/`, `components/`, `i18n/`, and `lib/` directly in the package root. No `src/` folder.
- API: `apps/api/WhitePlate.Api/WhitePlate.Api.csproj`, targeting .NET 10, composes sibling Domain, Application, and Infrastructure projects. Read the [backend architecture](docs/architecture/WHITEPLATE_BACKEND_ARCHITECTURE.md) before changing their boundaries.
- `infrastructure/` has no runnable full-stack configuration. The API Dockerfile is inside the host project and uses `apps/api` as its build context.
- The root package is metadata only. Use package-local npm commands and explicit .NET project paths.
- Preserve existing user work. Check Git status before editing; a directory being untracked does not mean it is disposable.

## Implementation rules

- Separate implemented behavior, proposed design, and unresolved decisions. Do not implement a whole roadmap merely because a task references it.
- Follow [coding standards](docs/coding-standards.md). Keep changes focused on the requested feature and avoid speculative abstractions or dependency upgrades.
- Keep user-visible frontend copy in both translation catalogs. Keep secrets and server credentials out of client code and `NEXT_PUBLIC_*` variables.
- Tenant identity supplied by a browser is never authorization. When tenant features are introduced, enforce ownership on reads, writes, caches, and real-time subscriptions; see [tenant design](docs/architecture/tenancy-and-security.md).
- API/data changes need matching contract/schema updates. Do not describe EF filters, authentication, a database, or SignalR as active until runtime wiring and verification exist.
- Do not hand-edit generated `.next`, `node_modules`, `bin`, `obj`, IDE state, or generated API specifications. Change source/configuration instead.

## Verification and handoff

From `apps/frontend`: `npm run lint`, `npm run typecheck`, and `npm run build` as appropriate. From the repository root: `dotnet test apps/api/WhitePlate.slnx` for the API solution. Use the [test plan](docs/functional-test-plan.md) for broader runtime checks. The current backend tests cover the sample endpoint and project boundaries, not restaurant business behavior.

Record actual commands and results, including failures or checks that could not run. See [review findings](docs/documentation-review.md) for the lint failure observed at the documentation baseline; do not silently waive it for future work. Update affected docs in the same change and identify outstanding decisions without pretending they have been approved.

## Branch and commit workflow

- For each requested feature or fix, work on a descriptive `codex/<scope>` branch. Reuse the current branch only when it is already the appropriate task branch; otherwise create one from the current project state.
- After completing and verifying a feature or fix, commit it using Conventional Commits, such as `feat(api): add order checkout` or `fix(api): enforce tenant ownership`.
- Push the task branch to `origin` after committing when a remote is configured. Report the branch, commit, push result, and verification results in the handoff.
