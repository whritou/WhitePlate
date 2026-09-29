# WhitePlate API

The ASP.NET Core host targets .NET 10 and is the outer layer of a four-project Clean Architecture solution. This directory contains HTTP controllers and DTOs, composition in `Program.cs`, launch settings, and the Dockerfile. Sibling projects under `apps/api/` provide Domain, Application, and Infrastructure code. The weather sample has been removed. The host validates Better Auth OIDC/JWKS bearer tokens, manages organizations and tenants, email-bound staff invitations, catalog, public checkout, staff order workflow, and authenticated SignalR notifications delivered through a transactional outbox.

From the repository root:

```sh
dotnet restore apps/api/WhitePlate.slnx
dotnet test apps/api/WhitePlate.slnx --no-restore
dotnet run --project apps/api/WhitePlate.Api/WhitePlate.Api.csproj --launch-profile http
```

The HTTP profile uses `http://localhost:5182` in Development. Swagger UI is at `/swagger` and the OpenAPI document is at `/openapi/v1.json`. Swagger runs in Development by default; production can opt in with `Swagger__Enabled=true`. Protected calls validate RS256 JWTs issued by Better Auth. Set `Authentication__Issuer` to the Better Auth base URL and `Authentication__Audience` to its configured API audience; production startup fails if either is missing. The frontend exposes OIDC discovery at `/.well-known/openid-configuration` and JWKS at `/api/auth/jwks`. `WhitePlate.Api.http` contains a sample OpenAPI request. The test project uses xUnit v3 and ASP.NET Core's in-memory host; `global.json` selects the .NET 10 test runner.

For HTTPS, trust your local development certificate if needed with `dotnet dev-certs https --trust`, then run with `--launch-profile https`. This profile also listens on `https://localhost:7283`. `Program.cs` enables HTTPS redirection; an HTTP-only run may warn that it cannot determine the HTTPS port.

The Dockerfile uses `apps/api` as its build context because the host references sibling projects. See [backend architecture](../../../docs/architecture/WHITEPLATE_BACKEND_ARCHITECTURE.md), [development and container commands](../../../docs/development.md), and [API contracts](../../../docs/api/api-contracts.md).
