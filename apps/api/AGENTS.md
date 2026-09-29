# API development instructions

Read [backend architecture](../../docs/architecture/WHITEPLATE_BACKEND_ARCHITECTURE.md), [coding standards](../../docs/coding-standards.md), and the affected [API contract](../../docs/api/api-contracts.md) before changing the backend.

Keep dependencies pointing inward: Domain has no project references; Application references Domain; Infrastructure references Application; `WhitePlate.Api` composes them and owns HTTP DTOs. Add business invariants to Domain, use cases and external capability interfaces to Application, external implementations to Infrastructure, and request/response mapping and DI registration to the host. Do not add a database or authentication library merely to fill a folder.

The former weather sample has been removed. For restaurant features, apply the [tenant boundaries](../../docs/architecture/tenancy-and-security.md) and record decisions in the approved API design before changing contracts.

Use `apps/api/WhitePlate.slnx` from the repository root for `dotnet restore` and `dotnet test`. Keep the existing tests in `apps/api/tests/WhitePlate.Tests` organized by layer, and add meaningful HTTP, ownership, invariant, or infrastructure tests with each feature. Root `global.json` selects the test runner. The API Dockerfile uses `apps/api` as build context; update that context and the docs together if project locations change.
