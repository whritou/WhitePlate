# 0001: Tenant foundation and backend conventions

- Date: 2026-09-28
- Status: implemented architecture decision; identity/deployment choices remain open
- Context: the user requested reusable backend boundaries and selected multi-tenancy as the first model. Previously only the weather sample and proposed restaurant schema existed.

## Choices

- Keep four .NET 10 projects and plain handlers. Use `Result<T>` for expected failures, authored domain rule errors, and typed RFC 9457 responses at the HTTP edge. Preserve direct resource/array success bodies.
- Implement the tenant registry: UUID, trimmed name (1–200 characters), normalized ASCII DNS subdomain (1–63 characters, internal hyphens allowed), active status. IDs are server-generated and new tenants start active. `www`, `api`, `admin`, and `app` are reserved during provisioning. These initial technical onboarding limits should be reviewed before broader onboarding.
- Use EF Core 10.0.12 and Npgsql 10.0.3, following the proposed PostgreSQL direction. Keep connection strings external and migrations in Infrastructure. Never apply migrations automatically. Database server version and deployment remain operational choices; the schema uses basic UUID/varchar/boolean types.
- Resolve public tenants through one subdomain under `Tenancy:BaseDomain` (local default `localhost`). Reject bare, nested, foreign, unknown and inactive hosts. Ignore tenant and forwarded-host headers. Custom domains and proxy trust remain open.
- Expose only `GET /api/v1/tenant`. Provision through an explicit local operator command. No anonymous management API or global tenant list exists.
- Use scoped tenant context and disable caching for tenant metadata/errors. Add tenant-owned data filters only alongside actual business records and ownership tests.

## Alternatives and consequences

A generic repository/mediator adds indirection without a demonstrated need. A universal success envelope breaks weather compatibility and contradicts the existing proposal. Persisting weather invents a data requirement. Orders/catalog would require unresolved pricing/identity decisions. Anonymous tenant administration would expose writes without an access policy.

This foundation supports public tenant lookup, not staff membership or private business-data isolation. Custom domains, tenant updates/reactivation, deletion/retention, currency, and branding remain open. Raw SQL/import paths must enforce the same normalization; only the application provisioning path is supplied.

## Affected documents

[Backend](../WHITEPLATE_BACKEND_ARCHITECTURE.md), [API](../../api/api-contracts.md), [schema](../../database/database-schema.md), [security](../tenancy-and-security.md), [setup](../../development.md), [decisions](../../development-roadmap.md).
