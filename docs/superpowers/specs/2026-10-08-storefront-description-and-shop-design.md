# Localized restaurant description and shop design

**Date:** 2026-10-08  
**Status:** Approved by the user on 2026-10-08
**Scope:** Public click-and-collect shop UX and restaurant description translations

## Context

The public tenant storefront already reads a localized menu, supports product options, keeps a tenant-scoped in-memory cart, and routes to checkout and order tracking. Product selection currently appears inline in the product list. The storefront has no restaurant description field. Restaurant menu languages and catalog-item translations are already configured and managed through the restaurant language page.

The user approved adding real description data end to end and chose this display rule: show the description for the menu language currently selected by the customer; if that translation is missing, fall back to the restaurant's default menu language. When neither language has a description, show none.

The existing project Kanban card for public checkout and tracking (#48) is closed and its feature is merged. This follow-up needs a new card before implementation.

## Goals

- Let authorized restaurant owners and managers edit a short description for each enabled menu language.
- Persist the text with the restaurant and expose a locale-resolved description in the public menu response.
- Apply the selected-language then default-language fallback without changing the site's interface locale.
- Improve product discovery and option selection with category navigation, product cards, a product-options modal, and responsive cart access.
- Preserve server-derived prices, tenant-scoped guest cart behavior, current checkout/idempotency rules, and the no-payment flow.
- Follow WhitePlate design tokens, components, localization, responsive, and accessibility requirements.

## Non-goals

- Restaurant photos, product images, or generated placeholder content.
- Automatic or machine-generated translations.
- Changing product, price, availability, tax, discount, checkout, pickup scheduling, or order-tracking behavior.
- Payment capture, customer accounts, or persistent guest-cart storage.
- Restaurant-specific custom domains or visual branding.

## Proposed design

### Description storage and locale resolution

Add a tenant-owned `DescriptionTranslationsJson` value, initialized to an empty translation map for existing and newly created restaurants. Reuse the established locale-keyed translation conventions without adding a separate translation entity/table. The default menu language remains the fallback source; changing it changes the fallback at read time and does not rewrite or delete stored translations.

For a supported requested menu locale, resolve the description in this order:

1. Description for the requested menu locale.
2. Description for the tenant's default menu locale.
3. `null` when neither translation is present.

For an unsupported requested menu locale, retain the current menu behavior of resolving the menu to its default language. No description translation is copied between languages. An absent description is omitted from the storefront presentation rather than replaced with generic copy.

Each non-empty description is trimmed and limited to 500 characters. A blank edit removes that locale's translation. Only currently enabled menu locales may be written. Disabling a language does not delete its saved description; re-enabling it makes the existing translation available again.

### Management API and authorization

Add a management read contract under `/api/v1/tenants/{tenantId}/restaurant-description-translations` that returns the tenant ID, enabled locales, default locale, and saved description translations. Add an idempotent locale-specific `PUT` operation under the same resource to set or clear one enabled locale's description. The request contains only the description; locale comes from the route. The API validates the 500-character limit and locale configuration.

Both operations require the current owner/manager membership for the selected tenant. Browser-supplied tenant IDs remain selectors only; every read and write checks membership server-side. Missing and unauthorized tenant resources follow the existing safe not-found policy. The public menu remains resolved by the request host and exposes no management capability.

The public `GET /menu?locale={tag}` response gains a nullable, resolved restaurant description. It does not expose the entire translation map. Menu caching remains `no-store` as currently configured.

### Management UI

Add a restaurant-description section to the existing restaurant language page. The section displays the default language and enabled languages, lets the owner/manager select a language and edit its description, shows the 500-character limit, and gives pending, saved, validation, and API-error feedback. Blank submission clears the selected locale's saved value. Changing the default language updates the stated fallback without changing the saved text.

Use the existing server-action, server-only service, shared API request client, accessible inputs, cards, buttons, alerts, and feedback patterns. Keep EN/FR interface copy in both catalogs. Do not widen access beyond the existing restaurant owner/manager checks.

### Public shop UX

Keep the existing localized public tenant route and checkout route. Refresh the shop presentation with:

- Restaurant name and the resolved restaurant description when available.
- Accessible category navigation and clear product cards with localized names/descriptions and prices.
- Product selection that opens an accessible modal. The modal shows option groups, required/maximum selection rules, option price adjustments, and quantity. Adding or updating a cart item takes effect only after a valid confirmation.
- A persistent cart summary on larger screens and a compact sticky cart entry point on small screens. The mobile cart view exposes item quantities, selected options, estimated total, and the existing checkout action.
- Empty-cart, unavailable-product, invalid-selection, pending, and API-error states using shared UI primitives and design tokens.

Do not invent image content because the menu contract has no image fields. Preserve the tenant-scoped guest checkout store and route parameters, including selected menu locale.

### Data flow and ownership

Management pages obtain tenant selection from the existing verified restaurant membership context. The frontend invokes validated server actions; server-only services call the API through the shared request client. The API verifies owner/manager membership, validates enabled locale and description length, updates the tenant translation map, and persists it through EF Core.

Public menu requests remain unauthenticated and derive tenant identity from the validated restaurant host. The API reads only that tenant's description map, resolves the requested/default language, and returns one nullable description with the localized menu. No browser tenant ID grants access or selects another restaurant's description.

## Failure and concurrency behavior

- Invalid or disabled locale and descriptions over 500 characters return the existing validation problem contract; the management UI preserves the draft and shows field-safe feedback.
- Missing or unauthorized tenants follow the existing not-found response policy.
- A failed save keeps the editor open and retains its draft for retry. A successful acknowledged save updates the displayed saved value.
- A failed menu request continues using the current storefront unavailable state; the page does not claim that a description was loaded when the API request failed.
- Cart and checkout errors retain the existing retry and idempotency behavior.
- No special cross-locale concurrency resolution is added; saving one locale updates only that locale in the stored map.

## Localization, accessibility, and responsive behavior

Maintain separate UI locale and menu locale. Translate management and interaction copy in `messages/en.json` and `messages/fr.json`; product and restaurant text comes from the selected menu locale. The dialog must contain focus, support Escape, restore focus to its trigger, provide an accessible title/description, and prevent invalid cart writes. Category navigation, quantity controls, and cart actions must work by keyboard with visible focus and live feedback. Verify light and dark themes, 320/375/768/1024/1440 px widths, zoom, long French labels, and target sizes against the canonical design system.

## Documentation and verification

Update API contracts, database schema, backend/frontend architecture notes, functional test plan, and affected roadmap status to match the implemented behavior. Generate and review the EF migration; do not hand-edit generated API specifications. Record deployment migration requirements separately from local source verification.

Add focused API/domain/application/infrastructure coverage for validation, locale fallback, persistence, disabled-locale behavior, and cross-tenant/role denial. Add frontend coverage for the editor, localized storefront response, modal selection, cart behavior, and copy. Verify keyboard/focus, responsive layouts, both themes, and EN/FR manually or through existing browser tests.

Run the focused API and frontend tests, the applicable frontend lint/format/typecheck/build commands, and `dotnet test apps/api/WhitePlate.slnx`. Record exact commands and outcomes, including existing baseline issues and any unavailable hosted or database checks. Never perform acceptance mutations against Production.

## Decisions and open implementation checks

| Decision | Status | Consequence |
| --- | --- | --- |
| Store localized restaurant descriptions on the tenant, following the existing locale-map pattern | Approved conversational design 2026-10-08 | Add one tenant column and domain read/write behavior; avoid a new translation entity |
| Edit description translations from the existing restaurant language workflow | Approved conversational design 2026-10-08 | Add an editor there and expose tenant-authorized read/write API operations |
| Use the selected menu locale, then the restaurant default locale, then no description | Approved by user 2026-10-08 | Keep menu locale independent from UI locale; do not synthesize translation text |
| Limit description text to 500 characters; blank input clears that locale | Approved conversational design 2026-10-08 | Validate on both API and frontend; retain other locale values on each save |
| Product selection uses a modal, with a persistent desktop cart and sticky mobile cart entry | Approved conversational design 2026-10-08 | Replace inline editing with explicit confirmation while preserving current checkout semantics |
| New feature is associated with a new Kanban card; closed #48 is not reopened | Required by repository workflow | Create a scoped card with acceptance criteria before implementation |

No unresolved product decisions remain in the approved design. Implementation details may be refined only if source or generated contracts reveal a conflict; if that changes scope or behavior, update this design and return it for review before proceeding.
