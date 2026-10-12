# S1 establishment settings design

12 October 2026. Status: conversational design approved; written specification awaiting review. This document describes proposed behavior, not an available feature or an applied migration.

## Intent and approved scope

Owners and restaurant managers need to maintain the real establishment identity, location, timezone and collection instructions, and guests need to find the correct collection point. The user requested S1 including timezone and approved the following design in chat: editable trade name, phone and postal address; optional coordinates; a validated IANA timezone with UTC for existing restaurants; pickup instructions per enabled menu language using the existing fallback; safe Google Maps/Waze directions; owner/manager authorization; explicit Save/Cancel and drafts preserved on failures.

Legal identifiers and default-tax changes remain separate decisions. S1 will not introduce SIRET/VAT fields or change existing per-product taxes. Opening hours, slot/capacity enforcement, scheduled pickup promises, email delivery, payments, currency/subdomain edits, kiosk/NFC and theme publication remain separate cards. Persisting a timezone does not change the UTC order-archive worker or order timestamps.

## Source evidence and selected approach

- The existing `restaurant-settings` route checks the session and owner/manager restaurant membership through `getManagedWorkspaceRestaurant`. `RestaurantSettings` only displays the saved name/subdomain and links to catalog, language, Studio and shop operations.
- `Tenant` owns the trade name, currency, subdomain, enabled/default menu languages and description translations. It has no address, contact, timezone or pickup fields.
- `MenuLanguageSettingsHandler` independently checks persisted owner/manager access on reads and writes; description translation persistence and public fallback already exist.
- `liveWorkspaceLinks` redirects an owner's restaurant Settings entry to the organization Settings shell. Managers use the separate restaurant-settings entry. S1 must make the restaurant form discoverable for both roles while preserving organization settings.
- The public menu contains localized catalog/description information. Checkout's collection panel currently discloses missing contact/service capabilities; the receipt has immutable financial/item data and the capability tracking endpoint returns status/version/time only.

Keep establishment settings on the existing tenant aggregate, behind a dedicated management use case and repository port. This avoids a second identity source while keeping the registry-only `ITenantRepository` focused on host lookup/provisioning. Two alternatives were considered: adding these operations to the catalog repository would mix location/contact concerns into catalog editing; a new standalone establishment aggregate/table would add lifecycle and synchronization work without a separate business owner.

The design reuses the existing architecture and installed libraries. It introduces no provider, geocoding service, new authentication scheme or dependency upgrade.

## Stored fields and invariants

All text is trimmed server-side. Empty optional text becomes null; pickup text is plain text and rendered as text, never HTML. Validation occurs before any aggregate mutation so a rejected request cannot partially change the restaurant.

| Field | Proposed contract and rule |
| --- | --- |
| `name` | The existing `Tenant.Name`, required, 1–200 characters. This is the public trade name, not a separate legal identity. |
| `phone` | Optional, up to 40 characters, containing only digits, spaces, `+`, `-`, `.`, `(` and `)`, with 3–20 digits when present. No verification or national-format guarantee. A telephone link is built from the normalized allowed characters, never from a supplied URL. |
| `addressLine1` | Optional, up to 200 characters. |
| `addressLine2` | Optional, up to 200 characters. |
| `postalCode` | Optional, up to 20 characters; no France-only postal-code pattern. |
| `city` | Optional, up to 100 characters. |
| `region` | Optional, up to 100 characters. |
| `countryCode` | Optional uppercase ISO 3166-1 alpha-2 code selected from a server-validated country list. |
| Address completeness | All address fields may be empty. If any is supplied, line 1, city and country are required; postcode/region remain optional for international addresses. |
| `latitude`, `longitude` | Optional decimal pair: both supplied or both null; latitude −90 to 90 and longitude −180 to 180 inclusive. Zero is a valid coordinate. Round stored values to six decimal places after validating the original bounds. |
| `timeZone` | Required IANA zone identifier, at most 100 characters. Accept `UTC` and identifiers supported by the API runtime's IANA timezone data; reject Windows identifiers, arbitrary strings and fixed-offset labels. Defaults to `UTC` for new and existing tenants. Never infer a timezone from the browser or address. |
| `pickupInstructions` | Map keyed by normalized enabled menu locale, each value up to 1,000 characters. Missing/empty translations resolve to the saved default-menu-language text, otherwise null. An empty supplied value clears that locale. |
| `establishmentVersion` | Positive integer, starting at 1. Updated atomically on establishment saves; used to reject concurrent stale edits. |

Persist address/contact/timezone/coordinates as explicit columns on `Tenants`; persist pickup translations as a required JSON text map defaulting to `{}`, consistent with restaurant descriptions. Keep `Name` as the only trade-name column. Numeric coordinates use six-decimal precision. Domain owns bounds, normalization, completeness and translation rules; Application validates actual supported timezone/country values through focused Infrastructure capabilities, keeping runtime/platform lookup out of Domain.

Changing enabled menu languages does not erase stored pickup translations. Disabled translations are not exposed publicly or offered for editing. Re-enabling a locale restores its saved text. Establishment saves merge explicitly supplied locale entries into the stored map, preserving omitted/disabled entries. A request containing a locale that is no longer enabled fails validation rather than silently discarding the edit. Description and menu-language operations remain independent.

## Management API and authorization

Proposed endpoints:

- `GET /api/v1/tenants/{tenantId}/establishment-settings`: saved fields, enabled/default menu locales, pickup translation map for enabled locales and current establishment version. Return an ETag containing the version.
- `PUT /api/v1/tenants/{tenantId}/establishment-settings`: full replacement of the scalar form fields plus explicit pickup-locale changes, with `If-Match` containing the loaded establishment version. Return normalized saved settings and the new ETag/version.
- `GET /api/v1/tenants/{tenantId}/establishment-settings/options`: supported IANA timezone identifiers and country codes for selectors. Independently authorize this read; localized country display labels belong to the frontend.

Each endpoint requires the existing bearer authentication and rechecks persisted owner or restaurant-manager membership, active restaurant and active owning organization. Tenant IDs are resource selectors. Kitchen, unrelated identities, revoked memberships and inactive/foreign tenants cannot read or write settings. Use the existing non-disclosing management 404 policy after authentication; anonymous requests remain 401. Do not rely on the frontend route guard or a cached membership response.

PUT requires a valid version precondition. Missing/malformed `If-Match` is a validation error; a stale version is 412 and performs no write. The repository updates the selected tenant only and increments the settings version in the same database transaction. Concurrent name/contact/instruction updates cannot overwrite one another. Unrelated menu-language/description updates do not bump the establishment version, but currently enabled locales are checked again during the settings update.

Use typed Application results and the existing safe Problem Details contract, including field issues for invalid input. Request/response DTOs belong to the API host; use cases and repository/runtime-validation ports belong to Application; invariants belong to Domain; EF mapping, queries and validation implementations belong to Infrastructure. Register services explicitly in the host composition. Registry host lookup remains distinct from authenticated management.

## Public information and directions

Define one public establishment DTO with trade name, phone, structured postal address, optional coordinates, timezone and one resolved pickup instruction plus its actual text locale. It excludes membership information, all translation maps, management versions and organization/legal settings.

Add `establishment` to the public menu response and add a host-resolved `GET /api/v1/tenant/establishment?locale=…` for collection details without fetching the catalog. Both use the same server projection and existing enabled/default menu locale rules. Their tenant comes exclusively from existing host resolution. Unknown/inactive tenants and spoofed selectors retain the existing failure behavior. Return no-store public responses; the browser BFF derives the upstream restaurant host from validated request Host and configured domain/template, never query/body tenant IDs.

Generate directions with a pure frontend helper from saved validated data, using fixed HTTPS Google Maps/Waze origins and URL-encoded parameters. Do not accept user-entered link URLs. Google Maps uses the coordinate pair when supplied, otherwise the complete postal address and trade name. Waze is offered only for a valid saved coordinate pair. Without either coordinates or a complete address, omit directions. Management test links use saved values and are visibly distinguished from the editable draft. External links use safe rel/referrer behavior and do not include auth tokens, customer names or tracking capabilities.

Show saved public collection details on the storefront and in checkout's existing Collect at panel. Replace the missing-location disclosure there with actual details when saved; retain accurate disclosure for unsupported scheduling/payment/customer-contact capabilities. Do not show example pickup times or treat timezone as a service-time promise.

Receipt and successful capability tracking display **current restaurant collection information**, labeled as such. These fields are not an order snapshot: an owner correction becomes visible after collection information refresh. Receipt amounts, discounts, taxes, product/option labels and idempotency remain immutable.

The receipt's collection read requests its saved menu locale. Add nullable `menuLocale` to the existing successful tracking response so tracking can request collection information in the order's saved language; old orders with no saved locale use the restaurant default. The public status/token/expiry checks remain unchanged. Collection details are public and loaded separately through the host-resolved endpoint; a collection read failure must not hide the receipt/status or prompt checkout resubmission. Tracking renders collection details only alongside a successful order result. Collection links never carry the fragment capability. Polling/explicit refresh may update current details using the same tenant-host/locale query scope.

Email has no new delivery or template behavior in S1. Its future integration is S4 and must use an approved notification contract.

## Frontend composition and state

Keep `/[locale]/organization/restaurant-settings?tenantId=…` as the canonical establishment editor. Restaurant Settings navigation targets it for owners and managers; organization Settings remains available in organization context. Add an Establishment settings link to each real restaurant card in the organization shell, alongside the existing menu shortcut. Preserve Staff navigation, existing query context and legacy organization-settings URLs; do not redirect an organization-settings URL solely because it also contains `tenantId`.

Use the existing Lovable light-only workspace composition, semantic runtime tokens and shared Base UI cards, controls and alerts. Group the form into Identity, Address/location and Pickup information; keep the restaurant context and save state apparent. On desktop use a readable two-column field grid; on phone stack fields with no document overflow. Timezone is a searchable or keyboard-operable selector showing IANA identifiers; it never silently selects the browser zone. Pickup instructions have a selector for enabled menu languages, preserving drafts when switching languages. Retain links to the existing description/menu-language editor, catalog, Studio and shop.

Server page guards use the verified session and managed restaurant lookup, then read authorized settings. Interactive reads use a same-origin BFF and server-only services through the shared request factories; mutations use validated Server Actions/services. Keep exported types in `types/`, runtime parsers in the feature validation boundary and query keys scoped to account, tenant, interface locale and view. Never expose the API bearer token. Read the relevant installed Next.js documentation before changing Next.js code.

The loaded normalized result is the comparison baseline. Save is disabled until dirty and valid; Cancel restores all fields and locale drafts to the last acknowledged save. A synchronous guard prevents duplicate writes. Pending saves lock relevant inputs/actions. Success adopts the server's normalized result/version, announces success and refreshes membership/name-dependent workspace data.

Validation, unavailable/offline and concurrency errors retain input. On conflict, offer an explicit reload of saved values with confirmation before discarding edits; never silently replace a dirty draft or automatically resend with a newer version. Background refetch may update an untouched form; a dirty form keeps its baseline and reports that newer settings are available. Authorization failure disables the editor and clears protected data from the applicable query scope; ordinary transient failures show retained input and Retry. Account/tenant changes remount the editor and cannot carry drafts across contexts. Navigating away discards component-local drafts; show a browser unload warning while dirty, plus explicit Save/Cancel within the editor.

Provide matching route/query skeletons and distinct loading, missing/unavailable, pending, validation, conflict, offline/retry and success states. Every field has a localized label, accessible description/errors and visible focus; feedback uses alert/status semantics. All new UI copy is present in EN/FR. Targets are at least 44px, and at least 48px for tablet back-office actions. Verify 200% text zoom, reduced motion and widths 320, 375, 390, 768, 1024, 1440 and wide desktop. No shared design-token change is intended.

## Migration, documentation and rollout

Generate an additive EF migration using the configured .NET tooling; do not hand-edit generated migrations/snapshots or OpenAPI output. Backfill existing tenants to `UTC`, version 1, empty pickup map and null optional contact/location columns. No location, phone or jurisdiction data is fabricated. Applying the migration remains an explicit environment operation; startup does not apply it. Review generated PostgreSQL SQL and deploy schema before code that requires the new columns.

Update the API contract, schema, backend/frontend architecture, tenant security notes, functional test plan, development guide and S1 backlog/evidence with implemented behavior and actual commands/results. Keep order archival documented as UTC. Record source/local verification separately from shared-database migration and hosted acceptance. The current Lovable notes claiming all restaurant contact fields are unavailable will need a scoped update when S1 is actually implemented; customer contact, scheduling and payments remain unconnected.

Use `feat/establishment-settings` from the current checkout state. Preserve the pre-existing untracked `.cloudflare/` directory. Commit verified implementation with Conventional Commits and push the task branch to origin. Reuse the existing S1 kanban card; mark Done only when its scope and verification are complete, otherwise record remaining acceptance and the appropriate status.

## Verification and completion criteria

Write behavior tests before implementation and confirm their expected initial failures. Required coverage:

1. Domain: required/trimmed name; clearing optional fields; international address completeness and length limits; phone format; coordinate pairing/bounds/zero/precision; pickup limit, disabled locales, clearing and default fallback; rejected updates leave state unchanged.
2. Application/API: supported IANA zones including DST-aware zones and UTC, unsupported/Windows zones, valid/invalid country codes, owner/manager success, anonymous/kitchen/foreign/revoked/archived denial, required/malformed/stale preconditions and unchanged persistence on rejection.
3. Infrastructure: save/read-back, persisted normalization, atomic version conflicts, tenant-scoped updates, preservation of omitted/disabled translations and existing description/language/tax fields; generated migration SQL defaults and constraints.
4. Public: two host-resolved tenants remain isolated; locale fallback and actual text-language metadata; missing address/coordinates; safe encoded directions with no arbitrary scheme/origin; saved trade name reaches menu/workspace; collection failures leave receipt/status usable; old tracking orders without locale use default.
5. Frontend: real form dirty/save/cancel behavior, drafts across language changes, duplicate-submit prevention, normalized success, validation/offline/conflict recovery, read retry, authorization invalidation, tenant/account query separation, organization-versus-restaurant navigation and EN/FR parity.
6. Browser: responsive layout at all specified widths, keyboard/focus, target sizes, zoom/reduced motion, saved-link preview, missing/partial collection data and guest storefront/checkout/receipt/tracking rendering. Fixtures prove presentation/behavior, not hosted persistence.

Run `dotnet test apps/api/WhitePlate.slnx` from the root; run `npm test`, `npm run lint`, `npm run typecheck`, `npm run format:check` and `npm run build` from `apps/frontend`, plus scoped browser acceptance and `git diff --check`. Record named failures and existing baseline issues rather than silently waiving them. Real persistence and migration/hosted acceptance require the documented guarded test environment; do not mutate production restaurant data merely to validate this change.

S1 is complete in source only when the authorized editor persists validated fields, guests see saved collection information and automated/local rendered checks pass. Shared schema application and hosted verification must be recorded separately; their absence cannot be described as production completion.

## Specification self-review

Reviewed for placeholders, ambiguous field requirements, locale/state consistency, tenant boundaries and scope. Public current collection information is explicitly separate from immutable order snapshots; timezone storage does not alter archival/scheduling; legal/default-tax/email decisions remain excluded. No application code, migration or runtime test has been changed or executed for this specification.
