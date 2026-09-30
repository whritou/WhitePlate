# Decision 0003: Catalog localization and tenant domain policy

- Date: 2026-09-30
- Status: Accepted; implementation is in source, database rollout remains pending

## Context

The storefront interface supports English (`en`) and French (`fr`), while each restaurant needs to choose its own menu languages. The first release identifies a tenant through exactly one subdomain label under a configured base domain. Production DNS, TLS, proxy configuration, and custom-domain support are separate deployment work.

## Decisions

1. Each restaurant controls its enabled menu languages. It must have at least one, may add any number, and chooses one enabled language as its default. Language tags are normalized BCP 47-style tags such as `en`, `fr-CA`, or `zh-Hant-TW`; the supported list has no product-level count cap.
2. Catalog names for categories, products, option groups, and options, plus product descriptions, can have per-language translations. The restaurant settings page exposes language management and translation editing to organization owners and restaurant managers.
3. If an item has no translation for the selected language, the storefront uses its default-language text. A requested language that is not enabled resolves to the restaurant's default language. Before changing the default, every active category, product, option group, and option must have a translation in the new language; this prevents existing base-language text from being relabeled as a translation.
4. The app interface remains on `/en` or `/fr`. The menu language is separate and selected through the `menuLocale` query parameter. The API accepts `GET /menu?locale=<tag>` and returns the effective locale and available locales.
5. A tenant is resolved from exactly one subdomain label. Custom domains are deferred. Tenant selection is not authorization; protected operations continue to require server-verified identity and persisted membership. Forwarded-host and tenant headers are not trusted.
6. The frontend validates the incoming Host against a configured base domain, extracts one safe tenant label, and constructs the API host from a fixed server-side URL template. It does not forward the raw Host or use browser-supplied tenant identity for authorization. Public menu reads remain unauthenticated.

## Implementation status

Tenant languages/defaults and catalog translations are persisted by EF Core; the `CatalogLocalization` migration adds the required columns and backfills existing tenants to English with empty translation documents. The migration is checked in but has not been applied to Neon `test` or production. API routes enforce owner/manager access to language settings and translation writes. The public storefront resolves configured subdomains, renders the menu, exposes available languages, and marks unavailable products.

## Consequences and remaining work

- Migration rollout and browser acceptance for subdomain routing and multi-language editing remain deployment/runtime checks.
- Restaurant/order snapshots still use the existing checkout text and do not record the menu locale. Localized order snapshots remain a separate checkout change.
- Custom domains, tenant-specific branding, cart, and payment remain out of this slice.
- Product language values are not authorization. Every management query and write remains scoped by tenant ID and membership.

## Alternatives considered

- Hard-code English and French as the only menu languages: rejected because restaurants need an open-ended language list.
- Require every item to be translated before enabling a language: rejected in favor of default-language fallback so language rollout can happen incrementally. Requiring active catalog items to be translated before changing the default is retained, because default text itself cannot be a fallback to a former default.
- Put menu locale in the app's `[locale]` route segment: rejected because app UI locale supports only English and French while restaurant menus may use any valid language.
- Support custom domains in the first release: deferred to avoid domain ownership, DNS, proxy trust, and TLS requirements.
- Trust arbitrary forwarded-host or tenant headers: rejected; those values do not become trusted merely because the storefront supports subdomains.

## Affected documents

- [Development roadmap](../../development-roadmap.md)
- [Database schema](../../database/database-schema.md)
- [API contracts](../../api/api-contracts.md)
- [Frontend architecture](../WHITEPLATE_FRONTEND_ARCHITECTURE.md)
- [System architecture](../WHITEPLATE_SYSTEM_ARCHITECTURE.md)
- [Functional test plan](../../functional-test-plan.md)
