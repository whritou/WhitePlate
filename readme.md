# WhitePlate

WhitePlate is an early-stage multi-tenant restaurant platform. The .NET API implements organizations, restaurant tenancy, catalog/pricing, staff authorization, checkout, order workflow, and kitchen notifications. The frontend connects localized account/team flows, tenant menu browsing, and guest cart/checkout to the API. Vercel Production, the Coolify API/PostgreSQL connection, one hosted account and organization, and owner access to a newly created restaurant have passed initial acceptance; broader hosted isolation and operations checks remain.

## What runs today

| Area | Implemented | Still planned |
| --- | --- | --- |
| Frontend | English/French auth/team flows, tenant menu/language settings, in-memory guest cart, checkout BFF, server-priced receipt, light/dark theme; hosted account, organization, restaurant creation and owner access verified | Remaining catalog editors, tenant wildcard DNS/TLS and broader hosted acceptance |
| API | ASP.NET Core .NET 10 Clean Architecture host; organizations/tenants, OIDC membership, catalog/pricing, checkout, order workflow, idempotency, transactional outbox, SignalR, OpenAPI/Swagger, tests; Coolify deployment and authenticated access verified | Hosted access-denial behavior is operator-reported; operational acceptance remains |
| Infrastructure | Nine EF migrations, Better Auth schema on Neon `test` and initialized Coolify PostgreSQL, API Dockerfile; Vercel/Coolify connection cutover verified | Backups/restore and hosted operations |

The frontend and API run independently. The API uses PostgreSQL; the local Neon `test` branch is connected through .NET User Secrets. The weather sample has been removed. See the development guide for migrations, local provisioning, and the current runtime status.

## Quick start

Prerequisites: supported Node 24/npm 11 and the .NET 10 SDK. `.nvmrc`, package engines and `global.json` record the toolchain references; see the development guide. Commands below start from the repository root, in separate terminals.

Frontend:

```sh
cd apps/frontend
npm ci
npm run dev
```

Open [the English page](http://localhost:3000/en) or [the French page](http://localhost:3000/fr). `/` negotiates a locale; the `d` key toggles the theme outside text-entry controls.

API:

```sh
dotnet restore apps/api/WhitePlate.slnx
dotnet run --project apps/api/WhitePlate.Api/WhitePlate.Api.csproj --launch-profile http
```

Open [Swagger UI](http://localhost:5182/swagger) or [the OpenAPI JSON](http://localhost:5182/openapi/v1.json). Protected Swagger calls need a configured OIDC issuer and bearer token. For HTTPS, Neon setup, provisioning, validation, and troubleshooting, see the [development guide](docs/development.md).

The API solution includes its tests. From the repository root, run `dotnet test apps/api/WhitePlate.slnx` after restore.

## Working in this repository

- [Documentation index](docs/README.md): reading order and source-of-truth rules.
- [Design system](docs/design-system/README.md): required reference for future UI changes, visual overview, light/dark tokens and adoption checklist; existing screens not yet migrated.
- [Development guide](docs/development.md): commands, configuration, ports, and common failures.
- [Coolify/Vercel runbook](docs/deployment/coolify.md): migration status, runtime settings, TLS and rollback.
- [System architecture](docs/architecture/WHITEPLATE_SYSTEM_ARCHITECTURE.md): implemented boundaries and intended direction.
- [Backend architecture](docs/architecture/WHITEPLATE_BACKEND_ARCHITECTURE.md): .NET project references, sample request flow, and test layout.
- [API contracts](docs/api/api-contracts.md) and [database design](docs/database/database-schema.md): current API plus explicitly proposed business contracts.
- [Functional test plan](docs/functional-test-plan.md): current smoke checks and future acceptance scenarios.
- [Development roadmap and decisions](docs/development-roadmap.md): dependencies and questions to settle before implementation.
- [Review findings](docs/documentation-review.md): corrections and known development blockers.
- [Agent instructions](AGENTS.md): repository guidance for coding assistants.

Run frontend scripts inside `apps/frontend`; the root `package.json` does not define npm workspaces or app orchestration. There is no Compose file, and root `npm test` is a failing template placeholder, not a test suite.
