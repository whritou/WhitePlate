# Coding standards

These rules guide new work in the current scaffold. Architecture-specific guidance is conditional on introducing that architecture; it does not imply the infrastructure already exists.

## Scope and dependencies

Inspect existing code and the nearest `AGENTS.md` before editing. Prefer the smallest change that completes the requested behavior. Do not install a library, split projects, or introduce generic infrastructure solely because it appears in the proposed stack. Keep package manifests and lockfiles consistent when dependencies change.

Generated files are not source. Do not edit `node_modules`, `.next`, `bin`, `obj`, IDE state, or generated OpenAPI documents. Use the [development guide](development.md) for verification commands.

## Frontend

- Use strict TypeScript and explicit boundary types. Validate data received across network/storage boundaries; TypeScript alone does not validate JSON or guarantee C# interoperability.
- Default to Server Components. Use Client Components for browser APIs, interaction, or client hooks. Providers can wrap server-rendered children; client components are not restricted to leaf nodes.
- Use `getTranslations` on the server and the appropriate `next-intl` client APIs for client UI. Add matching keys and interpolation variables to both catalogs.
- Prefer `@/i18n/navigation` for internal localized links and navigation. Keep locale and tenant identity separate.
- Reuse `Button`, Base UI accessibility behavior, and the existing `cn` utility. Preserve keyboard focus, semantic controls, and accessible names.
- Tailwind 4 tokens belong in `app/globals.css`; there is no Tailwind config file. Use semantic theme tokens rather than duplicating hard-coded colors.
- Follow `.prettierrc`: two spaces, double quotes, no semicolons, LF, and Tailwind class sorting. Format touched files rather than reformatting unrelated code.

Server Components may fetch server data directly. Introduce TanStack Query when interactive client-side caching, refetching, or mutations are needed; it is not required for all async operations. Avoid ad hoc effect-driven request lifecycles when a server fetch or query abstraction fits. Effects remain appropriate for external subscriptions and cleanup, such as the existing theme keyboard listener.

Use local component state for simple interactions. If Zustand is introduced, reserve it for client-owned state such as a cart, not a duplicate authoritative cache of server orders. Tenant/locale must be included in relevant cache keys, and tenant changes or logout must clear or separate sensitive state.

Do not put secrets in `NEXT_PUBLIC_*` variables. Explicitly document data cache and revalidation behavior when adding API integration.

## Backend

The backend now has .NET 10 Domain, Application, Infrastructure, and API projects, with nullable reference types and implicit usings. Keep references pointing inward as documented in the [backend architecture](architecture/WHITEPLATE_BACKEND_ARCHITECTURE.md). Use normal C# naming: PascalCase for public types/members and camelCase for locals/parameters. Pass cancellation tokens through asynchronous I/O. Use async APIs instead of blocking on tasks.

For future business use cases:

- Validate DTOs at the boundary and enforce business invariants in the use case/domain. Never trust client totals, prices, tenant IDs, or roles.
- Separate predictable validation/business failures from unexpected exceptions. Use the implemented Application `Result<T>` and error categories for expected failures; use cases translate known domain rules. Map failures consistently at the HTTP boundary using the [API design](api/api-contracts.md).
- Name use cases clearly, for example `CreateTenantCommand` or `CreateOrderCommand`. Use plain handlers; MediatR is not a current dependency.
- Keep Domain free of ASP.NET Core, EF Core, and MediatR. Application expresses use cases and external capability interfaces; Infrastructure implements those interfaces; the API composes them and maps HTTP DTOs.
- For future EF reads, use projection and no-tracking when entity tracking is unnecessary. Reads participating in tracked updates may need tracking. Keep transactions explicit for multi-entity writes.
- Apply tenant checks to reads and writes. A query filter alone is insufficient. Never accept a tenant foreign key without confirming same-tenant ownership.
- Map entities to DTOs; do not expose password hashes, internal identity fields, or accidental navigation graphs. Use structured logs without customer-sensitive payloads or secrets.

## Tests and documentation

Run checks appropriate to the change and report failures honestly. The xUnit suite covers tenant use cases/host boundaries, verified-email organization/staff authorization, catalog invariants and management, relational persistence, safe errors, checkout HTTP pricing/idempotency/body/rate rules, order concurrency, outbox dispatch, hub authorization and project dependencies. Live OAuth/Resend/browser flows, SignalR connections, and production PostgreSQL concurrency still need broader validation. New behavior needs meaningful invariant, authorization, integration, or browser coverage as described in the [test plan](functional-test-plan.md).

Use test drivem development method to implement new features.

Update commands/configuration in the development guide, endpoint shapes in the API contract, persisted fields in the schema, and current/planned status in the architecture as features land. Keep unfinished decisions visible in the [roadmap](development-roadmap.md).
