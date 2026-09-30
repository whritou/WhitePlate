# Decision 0003: Catalog localization and tenant domain policy

- Date: 2026-09-30
- Status: Accepted product direction; implementation design remains open

## Context

The storefront interface supports English (`en`) and French (`fr`), but persisted catalog names are currently language-neutral single strings and `GET /menu` has no locale contract. The API resolves public tenant requests from exactly one subdomain label under its configured base domain. Production frontend-to-API host mapping and custom-domain support have not been implemented.

## Decisions

1. Storefront catalog copy must support English and French translations.
2. The first release identifies a tenant through exactly one subdomain label under the configured base domain.
3. Custom domains are deferred from the first release.
4. Tenant selection is not authorization. Protected operations continue to require server-verified identity and persisted membership. Forwarded-host and tenant headers do not become trusted merely because the storefront supports subdomains.

## Alternatives considered

- Keep catalog copy in one language: rejected for the storefront requirement.
- Support custom domains in the first release: deferred to avoid introducing domain ownership, proxy trust, DNS, and TLS requirements into the initial storefront.
- Trust arbitrary forwarded-host or tenant headers: rejected; the current API boundary ignores these values.

## Consequences and open design

- This decision does not add translations to the database or API. `GET /menu` remains the current locale-free contract until an implementation design is approved.
- The implementation design must specify which catalog fields are translated, how translations are stored and edited, how a missing translation behaves, how the requested locale reaches the menu API, and which language is recorded in future order snapshots.
- The implementation design must also specify how the frontend maps an incoming one-label subdomain to the public menu API without relying on untrusted forwarded-host data. No tenant selector or subdomain value grants access to protected tenant data.
- Production DNS, TLS, proxy configuration, and CORS remain deployment work. Custom-domain handling must not be described as implemented.

## Affected documents

- [Development roadmap](../../development-roadmap.md)
- [Database schema](../../database/database-schema.md)
- [API contracts](../../api/api-contracts.md)
- [System architecture](../WHITEPLATE_SYSTEM_ARCHITECTURE.md)
- [Functional test plan](../../functional-test-plan.md)
