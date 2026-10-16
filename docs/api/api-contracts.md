# API contracts

## Menu catalog demo parity — 2026-10-14

Owner/manager catalog mutations continue to require persisted membership for the addressed tenant. `PUT /api/v1/tenants/{tenantId}/catalog/reorder` accepts `{entityType, parentId, categoryId, orderedIds}`. `entityType` is `categories`, `products`, `option-groups`, or `options`; `categoryId` selects the destination product category, while `parentId` selects the product for option groups or the group for options. `orderedIds` must contain the complete active sibling list (up to 500 distinct IDs). Product ordering may move active products from another active category into the destination list; source ordering is compacted in the same transaction. Archived entities are not reordered.

`POST /api/v1/tenants/{tenantId}/categories/{categoryId}/restore`, `POST …/option-groups/{groupId}/restore`, and `POST …/options/{optionId}/restore` restore only the addressed entity. A group requires an active product in an active category; an option requires an active group, product, and category. The existing product restore also requires its category to be active, leaves the product unavailable, and does not restore its option descendants. Category, product, group, and option archive operations remain retained/soft archive operations.

Discount create/update requests and management reads now include `minimumOrderAmount` (decimal, 0–9,999,999,999.99; defaults to 0) and nullable `expiresOn` (`YYYY-MM-DD`). Checkout applies the minimum to the products-plus-options subtotal before tax and discount. Expiration is inclusive through that calendar date in the restaurant's saved IANA time zone. The additive migration `20261014211126_DiscountMinimumAndExpiration` adds a defaulted `numeric(12,2)` minimum and nullable `date`; it is source-only and has not been applied to a shared database. No startup migration is configured.

## M4 catalog publication and history — 2026-10-16

| Method and route | Access and behavior |
| --- | --- |
| `GET /api/v1/tenants/{tenantId}/catalog` | Owner/manager; current draft catalog plus `publication` summary; returns the quoted published version as `ETag` |
| `GET /api/v1/tenants/{tenantId}/catalog/history?pageSize=25&beforeVersion=…` | Owner/manager; newest-first revision pages, 1–100 entries; cursor is an exclusive version bound |
| `POST /api/v1/tenants/{tenantId}/catalog/publish` | Owner/manager; `{}` plus quoted positive integer `If-Match`; validates and atomically publishes the complete draft, returns `{publishedVersion, publishedAt}` and a new `ETag` |
| `POST /api/v1/tenants/{tenantId}/catalog/discard` | Owner/manager; `{}` plus quoted `If-Match`; replaces the working draft with the current published snapshot and returns 204 with the current `ETag` |
| `POST /api/v1/tenants/{tenantId}/catalog/history/{version}/restore` | Owner/manager; `{}` plus quoted `If-Match`; restores the selected catalog as a new publication, returns the new version and `ETag` |

The draft remains in the existing normalized catalog rows. The `CatalogPublicationHistory` migration creates `CatalogPublicationHeads` and `CatalogRevisions`, backfills each existing tenant's current catalog as baseline version 1, and stores new tenants' empty baseline at creation. The migration is generated, has not been applied to a shared or production database, and must be applied before deploying the API. No startup migration runs automatically.

The catalog response's `publication` contains `publishedVersion`, `publishedAt`, `hasUnpublishedChanges`, `changeCount`, and reviewable entity/field changes. History entries include version, time, action, optional source version, actor issuer/subject, and change set. Revisions are retained indefinitely; there is no purge endpoint. Restore creates a new version instead of modifying an old row. Discard soft-archives or deactivates draft-only entries so existing references remain intact.

Publishing validates the full draft on the server, including locale/default configuration, catalog relationships, prices, option bounds, discount rules and identifiers. The published head and revision are committed together under a row lock and serializable transaction. Missing `If-Match` returns 428, stale versions return 412, and invalid input returns 400. A failed publish preserves the previous public version. Publishing an unchanged draft is a no-op and does not add a revision.

Public `/menu`, public tenant locale output, public establishment locale fallback and checkout catalog/pricing use the published snapshot. Restaurant description text and establishment details remain separate current settings. Existing order snapshots and idempotency receipts are not rewritten. Product-photo galleries retain M5's independent immediate-save behavior and do not appear in catalog diffs. D4 availability changes remain immediate for owners/managers/Kitchen and add an availability revision; full catalog history and publication remain owner/manager-only. Normal product-form availability changes stay in the draft.

Source wiring and API build are complete; migration application, PostgreSQL concurrency, and end-to-end guest/staff acceptance remain unverified. See [decision 0013](../architecture/decisions/0013-catalog-publication-and-history.md) and [schema](../database/database-schema.md#m4-catalog-publication-and-history--2026-10-16).

## S1 organization and restaurant legal profiles — 2026-10-12

Organization creation now requires `legalCountryCode` (`FR`, `DE`, `GB`, or `US`) and accepts optional `legalName`, `legalRegistrationNumber`, and `taxIdentifier`. `GET /api/v1/organizations/{organizationId}/legal-profile` and `PUT` manage the profile for persisted organization owners. PUT requires a quoted `If-Match` legal-profile version; stale writes return 412. The organization response includes the current profile and `legalProfileVersion`.

`POST /api/v1/organizations/{organizationId}/restaurants` defaults `legalProfileMode` to `inherit`. `custom` accepts the same profile fields and stores an independent restaurant profile. Owner/manager `GET` and `PUT /api/v1/tenants/{tenantId}/establishment-settings/legal-profile` return `{mode, organizationProfile, effectiveProfile, version}`; PUT requires a quoted version ETag. `inherit` clears the override and resolves the current organization profile on read. `custom` requires a supported legal country. Organization edits are immediately visible to inheriting restaurants and do not change custom profiles.

Identifiers are optional and checked for supported syntax/checksum only (French SIREN at organization level, SIRET at restaurant level); no external registry status is asserted. The establishment address `countryCode` remains distinct from legal country. No default tax percentage is stored. Product tax rates remain authoritative and order amounts/snapshots remain unchanged. Additive migration `20261012190104_LegalProfileSettings` was applied to Coolify Production on 2026-10-12 before deploying API merge `53ad791`; Coolify confirmed the new container passed `/health/ready`. A direct browser health probe was blocked by the local browser. Hosted legal-profile save/read acceptance remains open. See [legal profile design](../superpowers/specs/2026-10-12-legal-settings-design.md) and [S1 rollout evidence](../audits/establishment-settings.md#legal-profile-rollout--2026-10-12).

## S1 establishment settings — 2026-10-12

Implemented and deployed to Coolify Production; hosted acceptance on an active owner/manager establishment remains open. `/api/v1/me` omits inactive restaurants so workspace navigation does not offer a tenant that protected operations correctly hide. [Verification and rollout](../audits/establishment-settings.md).

| Method and route | Access and behavior |
| --- | --- |
| `GET /api/v1/tenants/{tenantId}/establishment-settings` | Persisted owner/manager, active establishment; scalar settings, enabled pickup map, `locales`, `defaultLocale`, `establishmentVersion`; quoted version ETag and no-store |
| `GET …/establishment-settings/options` | Same access; `{timeZones: IANA IDs including UTC, countries: ISO alpha-2 codes}` |
| `PUT …/establishment-settings` | Full scalar replacement and explicit pickup translation merge; requires quoted positive integer If-Match; normalized settings and new ETag |
| `GET /api/v1/tenant/establishment?locale=…` | Public host-resolved current collection details; resolved pickup text/actual locale, no version or translation map |

PUT accepts required `name` (≤200), nullable `phone` (≤40; telephone characters, 3–20 ASCII digits), nullable `addressLine1`/`addressLine2` (≤200), `postalCode` (≤20), `city`/`region` (≤100), `countryCode` (ISO alpha-2), nullable paired `latitude`/`longitude` (bounds ±90/±180 before six-decimal rounding), required supported `timeZone` (≤100), and optional `pickupInstructions` locale-to-nullable-text map (≤1000 per enabled locale). Strings trim; empty optional fields clear. Empty address is valid; any address requires line 1, city and country. Only explicitly supplied pickup languages change; blank/null text clears, omitted and disabled stored translations survive. Invalid input or missing/malformed If-Match returns 400; stale saves return 412; anonymous access 401; kitchen/foreign/revoked/inactive access 404. Existing safe problem responses apply.

Public `/menu` adds `establishment`: name, optional phone/address/coordinates, timezone and `pickupInstruction`/`pickupLocale`. Missing requested text falls back to the default; no text makes both pickup fields null. Tracking adds nullable `menuLocale` from the saved order. Receipt/tracking collection details are independently loaded current information, preserving historical order snapshots. Older additive-field-free APIs remain usable.

Protected frontend GET `/api/establishment-settings?tenantId=…` uses the authenticated server factory and private no-store/Vary Cookie. The validated save Server Action forwards the saved version as If-Match. Public GET `/api/public/establishment?locale=…` uses host routing without bearer credentials, bounded timeout/cancellation and no-store/Vary Host. Browser tenant selectors cannot choose another public establishment.

## S2 weekly opening hours — 2026-10-12

`OpeningHoursJson` is nullable: null means the schedule is not configured; an explicit seven-day schedule can mark every day closed. Weekdays use ISO numbering (Monday 1 through Sunday 7), and each day has its own `isClosed` state and `windows` list, so weekday hours are independent. A day can have up to eight sorted, non-overlapping local-time windows (`HH:mm`); windows use `[start,end)`, allow adjacency and `24:00` only as an end, and cannot span midnight. The saved S1 IANA time zone defines wall-clock interpretation.

| Method and route | Access and behavior |
| --- | --- |
| `PUT /api/v1/tenants/{tenantId}/establishment-settings/opening-hours` | Owner/manager; `{openingHours: schedule}`; quoted `If-Match`; validates all seven days and saves atomically with the establishment version |
| `DELETE /api/v1/tenants/{tenantId}/establishment-settings/opening-hours` | Owner/manager; clears the schedule back to not configured; quoted `If-Match` |

The management settings GET includes nullable `openingHours`; its existing scalar PUT preserves it. The public host-resolved establishment and `/menu` projection include the weekly schedule and time zone without management versions. Existing restaurants remain not configured until an owner or manager saves hours. Public output does not calculate open-now state or enforce checkout availability. Migration `20261012171223_OpeningHours` is applied to production; hosted owner/manager acceptance remains open. See [rollout evidence](../deployment/coolify.md#production-opening-hours-rollout--2026-10-12).

## S3 pickup scheduling — implemented in source, migration rollout pending

`PUT /api/v1/tenants/{tenantId}/establishment-settings/pickup-scheduling` is owner/manager-only, requires the quoted current `EstablishmentVersion`, and accepts `{intervalMinutes: 10|15|20|30, minimumLeadMinutes: 0..1440, capacity: 1..50}`. Defaults are 15 minutes, 20 minutes and 8 orders. The existing settings GET returns `pickupScheduling`.

`GET /api/v1/pickup-slots` resolves the active tenant from the request host and is no-store; it accepts no tenant selector. It returns `{state, timeZone, slots, acceptingOrders, rushHoldEnabled, rushBufferMinutes}` where state is `available`, `schedule_not_configured`, `no_slots_available` or `orders_paused`. A paused restaurant returns no slots. With rush hold enabled, newly generated slots apply the fixed rush buffer to the configured minimum lead time and return `rushBufferMinutes: 10`; otherwise it is 0. Slots carry offset-bearing UTC instants, end instants, time zone and remaining capacity. The rolling horizon is seven restaurant-local dates. Each opening window anchors its own fixed-duration slots, and slots that miss lead-time, cross closing, fall in a nonexistent DST wall time, or are full are omitted. Both real instants for an ambiguous DST wall time are returned.

`POST /api/v1/orders` accepts optional `pickupAt` as an offset-bearing instant. Omission means ASAP and the server assigns the earliest available slot; an explicit instant means Scheduled. A saved opening schedule is required. The API revalidates availability and atomically increments the tenant/slot usage counter while inserting one reservation, the order, idempotency receipt and outbox event in one transaction. A newly full or stale explicit slot returns 409. An unchanged idempotent retry replays the original pickup snapshot without incrementing capacity. Receipts, public tracking, staff order summaries and history expose nullable `pickupAt` and `pickupTimeZone`; staff order summaries and history also expose nullable `pickupMode` (`Asap` or `Scheduled`). Older orders have no reservation and keep `pickupMode: null` because their original selection cannot be inferred from the resolved pickup instant. A cancellation before pickup begins releases its reservation and decrements usage in the status transaction; cancellation at or after slot start does not.

Coolify Production migration history confirmed the three S3 pickup migrations and `20261013191310_OrderPickupMode` applied on 2026-10-13. K1's nullable `Orders.PickupMode` column was verified before API deployment `299b29d`; the new container passed `/health/ready`. No orders existed at migration time. The API does not migrate on startup. Hosted owner/manager, PostgreSQL concurrency, and storefront browser acceptance remain pending. See [S3 design](../superpowers/specs/2026-10-12-pickup-scheduling-design.md), [implementation plan](../superpowers/specs/2026-10-12-pickup-scheduling-implementation-plan.md), [S3 verification](../audits/pickup-scheduling.md), and [K1 Live Orders evidence](../audits/live-orders.md).

## M2 menu product metadata — 2026-10-11

Owner/manager `POST /api/v1/tenants/{tenantId}/products` and `PUT /api/v1/tenants/{tenantId}/products/{productId}` accept the existing product fields plus optional `sku`, `containsAllergens`, `mayContainAllergens`, `dietaryTags`, `preparationMinutes` and `preparationNotes` (a locale-to-text object). Omitting metadata on create uses empty declarations; a full update replaces these values, including clearing them. SKU is optional, at most 64 ASCII letters/digits/dot/underscore/dash, normalized to uppercase and unique within the restaurant. Allergen codes are the controlled EU 14 identifiers; declarations cannot overlap. Dietary codes are `dairyFree`, `glutenFree`, `pescatarian`, `vegan` and `vegetarian`. Preparation minutes are null or 1–1,440, with localized notes up to 250 characters per locale. Invalid values return 400 `validation_failed`; duplicate SKU returns 409 `conflict`.

Management catalog reads return all metadata. The tenant-host-resolved public menu returns explicit allergen/dietary declarations and localized preparation notes/estimate; it omits SKU. Order receipts and staff order summaries retain snapshots of declarations and preparation guidance taken at checkout. Empty declarations do not assert allergen-free status. Preparation guidance is not a pickup or ready-time promise. The generated migration must be applied before this API code is deployed; there is no startup migration. See [decision 0009](../architecture/decisions/0009-menu-product-metadata.md).

## K2 live orders — KDS operations — 2026-10-14

`GET /api/v1/tenants/{tenantId}/orders` returns `{items, nextCursor, serverTime}`. `serverTime` is sampled before the repository read and anchors client timers and new-order event filtering. Staff order summary/history lines also return the saved `preparationNotes` locale-to-text snapshot alongside `preparationMinutes`; missing metadata is an empty object. No new persistence fields or migration are introduced.

The board measures elapsed time from saved `createdAt`, pickup countdown/urgency from saved `pickupAt`, and advances both using monotonic browser time from the API snapshot. Orders at or below five minutes to pickup are due soon; orders at or past pickup time are overdue. Terminal orders have no active countdown. `preparationMinutes` remains guidance only; it is not turned into a ready-time promise or countdown. The board displays the note matching the order's saved menu locale, with the interface locale as fallback.

Order sound is muted by default and enabled only by a user gesture. It alerts on a deduplicated `order.created` event newer than the latest REST snapshot, with an accessible announcement; replayed, duplicate, status-only, and foreign-tenant events do not alert. The preference lasts for the mounted board session. Persisted preparation stages, stations, pickup shelves, and rush-adjusted deadlines are not represented by the current order/API model and are not shown as if they were saved facts.

## D2 restaurant dashboard metrics — implemented in source, migration rollout pending

`GET /api/v1/tenants/{tenantId}/dashboard/metrics` requires a current owner, manager, or kitchen membership for that tenant and returns a no-store response. Owners and managers receive `orderValue` and `comparisonOrderValue`; Kitchen receives both as `null`. Order value is the saved `Order.Total` after product tax and applied discount, excluding currently cancelled orders. It is an order total, not captured payment revenue. `currency` comes from the restaurant.

`businessDate` is the restaurant-local date containing the server's current time; `comparisonDate` is the previous restaurant-local calendar date. Both use the saved IANA tenant time zone, converted to UTC day boundaries. `orderCount` and hourly volume count orders by `CreatedAt`, including orders later cancelled. Each `hourlyOrders` entry has a local wall-clock `hour` from 0–23 plus `current` and `previous` counts. If a local hour repeats during a fall-back clock change, both occurrences share that hour bucket. Historical aggregates include archived rows while they remain retained.

`activeOrders` is the current live queue across all creation dates, broken into Pending, Preparing, and Ready. `topSellingItems` ranks up to five product IDs/names and quantities from saved order-line snapshots created on `businessDate`, excluding currently cancelled orders; it does not join the live catalog. `averagePreparationMinutes` is the average of `ReadyAt - PreparingAt` for valid timestamp pairs whose `ReadyAt` falls on `businessDate`, with `preparationSampleCount`; the average is `null` when no valid samples exist. Older orders have no inferred lifecycle timestamps.

The same-origin frontend route `/api/kitchen/dashboard/metrics?tenantId=…` rechecks the session's restaurant membership, forwards the API result, and returns `private, no-store` with `Vary: Cookie`. Browser query keys include account, tenant, locale, and role so role changes do not reuse previously cached monetary values. No forecast, growth percentage, repeat-diner rate, or payment metric is returned. The additive migrations add nullable preparation timestamps and aggregate indexes; they are applied to Coolify Production and Neon `test`. PostgreSQL query-plan and hosted/browser acceptance remain open. See [D2 source and acceptance evidence](../audits/dashboard-metrics.md) and [schema details](../database/database-schema.md#d2-dashboard-metric-source-fields--2026-10-14).

## D3 dashboard rush hold and emergency pause — implemented in source, schema applied

| Method and route | Access and behavior |
| --- | --- |
| `GET /api/v1/tenants/{tenantId}/ordering-operations` | Active tenant owner, manager, or Kitchen; returns `{acceptingOrders, rushHoldEnabled, rushBufferMinutes, version}`, quoted version ETag and no-store |
| `PUT /api/v1/tenants/{tenantId}/ordering-operations` | Active tenant owner or manager; accepts `{acceptingOrders, rushHoldEnabled}` and requires the quoted current `If-Match`; conditional update returns the new version and ETag |
| `GET /api/v1/pickup-slots` | Adds pause/rush state fields; `orders_paused` has no slots, and rush shifts newly offered slots by ten minutes |
| `POST /api/v1/orders` | Revalidates the current pause state during transactional order creation; a new checkout after pause returns 409, including requests made from a stale guest cart |

Missing or malformed `If-Match` returns 428; a stale version returns 412. Kitchen, foreign, inactive, or revoked staff cannot read or update ordering operations (404); anonymous requests return 401. API membership checks are authoritative; a browser tenant ID only selects the route resource. The frontend protected BFF `GET /api/kitchen/dashboard/ordering-operations?tenantId=…` rechecks session membership and uses `private, no-store` with `Vary: Cookie`. Dashboard query keys include account, tenant, locale and role, and poll every 15 seconds. The owner/manager interface confirms each service-impacting change and updates only after the API succeeds; Kitchen sees read-only state.

`AcceptingOrders` defaults true, `RushHoldEnabled` defaults false, and `OrderingOperationsVersion` defaults to 1. Rush is a fixed ten-minute addition to pickup minimum lead time and remains enabled until manually cleared. Pause hides public slots and prevents new checkouts. A successful idempotent retry keeps returning its saved receipt; accepted orders, reservations and slot usage are not rewritten. The checkout transaction takes a shared tenant-row lock while a settings update takes the conflicting write lock, so concurrent pause and checkout have a serialization point. Migration `20261014150246_OrderingOperations` and its predecessors are applied to Neon `test`; D3 is also applied to Coolify Production. The Neon application happened before Coolify was clarified as the target. The API/frontend change remains on open PR #92; Coolify API and Vercel Production deployments, independent-connection PostgreSQL race checks and hosted/browser acceptance remain open. See [decision 0011](../architecture/decisions/0011-dashboard-ordering-operations.md), [D3 verification](../audits/dashboard-rush-pause.md) and [schema details](../database/database-schema.md#d3-persisted-ordering-controls--2026-10-14).

## M5 product photo galleries — 2026-10-09

Source implementation; actual S3/PostgreSQL/hosted acceptance remains open. See [ADR 0008](../architecture/decisions/0008-product-photo-gallery.md).

| Method and route | Behavior |
| --- | --- |
| `GET /api/v1/tenants/{tenantId}/products/{productId}/photos` | Persisted owner/manager authorization; returns `{storageAvailable, assets: [{id, width, height, bytes}]}` in order; authorized staff can inspect retained archived-product galleries |
| `POST …/photos/uploads?aspect=1:1` or `4:3` | Bounded `application/octet-stream`, at most 4 MiB; actual decoded-content validation and three private variants; 201 with a photo descriptor |
| `GET …/photos/uploads/{assetId}/{size}` | Protected preview of exact tenant/product media; size 320, 640 or 1200; WebP bytes |
| `PUT …/photos` | `{assetIds: UUID[], expectedIds: UUID[]}`; distinct ordered lists of at most eight; atomic save/reorder/removal, returning authoritative descriptors; stale gallery returns 412 |
| `GET /api/v1/products/{productId}/photos/{assetId}/{size}` | Public host-resolved tenant; only current active photos of nonarchived products in visible, nonarchived categories |

Empty desired IDs remove all photos. Missing/foreign products/media, revoked membership and unauthorized roles return 404. Archived products/categories reject mutations. Invalid files, ratios, duplicates or excessive length return validation errors. Storage failures return 503 and preserve the published gallery. Draft uploads alone are never public.

Public menu products add ordered `photos` descriptors without bucket keys or URLs. Frontend BFF paths: protected `/api/product-photos?tenantId=…&productId=…`, public `/api/public/product-photos/{productId}/{assetId}/{size}`. Mutations require the configured exact origin and bounded body reads before shared-factory forwarding. Protected responses use `private, no-store` and `Vary: Cookie`; public images use `no-store` and `Vary: Host` at the BFF. Shared Next image optimization is bypassed.


Status: the Better Auth frontend, email/password and social auth routes, server-side API token exchange, organization signup, email-bound invitations, public order tracking, and localized restaurant description management are wired in source. The `RestaurantDescriptionTranslations` EF migration is generated but not yet applied to a shared environment. The `PublicOrderTracking` schema migration is applied to Coolify Production, but its feature code is not deployed there and hosted tracking acceptance remains pending. Localized checkout snapshots, catalog language paths, restaurant description fallback and management authorization are covered by API tests. Catalog and order locale migrations are applied on Neon `test` and Coolify Production. Local email/password signup, organization creation, invitation acceptance, owner/manager/kitchen permissions, cross-tenant denial, REST revocation recovery, and live outbox/reconnect acceptance are recorded on Neon `test`. Local email/password signup, organization creation, and invitation acceptance were verified using locally intercepted email delivery. Vercel Production has also completed one hosted email/password signup and verification, organization listing, an authenticated protected API request, and restaurant creation against Coolify over verified TLS. The owner-protected team roster and invitation-list routes were added in merge `8a2f835` (PR #26); the currently recorded Coolify API deployment at `e13860e` predates them, so redeployment and hosted team-read verification remain open. The operator reports that both signed-out and alternate-account visits to the protected restaurant route redirected to `/fr?error=invalid_code`; consider this hosted access-denial behavior complete without a repeat check. This records the frontend redirect, not an independently observed API status code. Browser OAuth, hosted invitation acceptance, hosted SignalR delivery/token-expiry, and broader real email delivery remain open.

## 1. HTTP routes

All paths are rooted at `/api/v1`. Success responses contain the resource directly; errors use the shared `application/problem+json` contract in section 5.

| Method and path | Access | Behavior |
| --- | --- | --- |
| `GET /tenant` | Public, resolved restaurant host | Return active tenant id, name, subdomain, default menu language, and enabled menu languages; invalid/unknown/inactive host receives `404` |
| `GET /menu?locale={tag}` | Public, resolved restaurant host | Return the localized menu for an enabled language, or the restaurant default when omitted/unsupported; includes unavailable non-archived products with availability state |
| `POST /organizations` | Better Auth bearer, verified email | Create an organization and make the caller its first owner |
| `GET /organizations` | Better Auth bearer, owner | List the caller's organizations with `isActive` so the workspace can show archived organizations |
| `GET /organizations/{organizationId}/restaurants` | Better Auth bearer, owner | List restaurants owned by the organization |
| `GET /organizations/{organizationId}/members` | Better Auth bearer, owner | List organization owners and restaurant staff memberships; return role, optional verified email, and restaurant scope without issuer or subject |
| `GET /organizations/{organizationId}/invitations` | Better Auth bearer, owner | List invitation role, recipient email, restaurant scope, expiry, and `Pending`, `Accepted`, `Revoked`, or `Expired` status without token material |
| `PATCH /organizations/{organizationId}` | Better Auth bearer, owner | Rename an owned organization |
| `POST /organizations/{organizationId}/archive` | Better Auth bearer, active owner | Archive an organization without deleting organization, restaurant, catalog, invitation, or order data; suspend restaurant access, public menus, and new orders |
| `POST /organizations/{organizationId}/restore` | Better Auth bearer, owner | Restore an archived organization; existing restaurant and product availability flags remain unchanged |
| `POST /organizations/{organizationId}/restaurants` | Better Auth bearer, owner | Create a restaurant tenant with EUR, USD, or GBP currency |
| `POST /organizations/{organizationId}/invitations` | Better Auth bearer, verified owner | Create a single-use seven-day invitation bound to the request email and role; token is returned once to the server action |
| `DELETE /organizations/{organizationId}/invitations/{invitationId}` | Better Auth bearer, owner | Revoke a pending invitation; accepted, revoked, expired, missing, or foreign invitations return the same `404` |
| `POST /invitations/accept` | Better Auth bearer, verified invitee | Accept only when the JWT verified email matches the invitation email |
| `GET /me` | Better Auth bearer | Return the current identity and its organization/restaurant memberships |
| `GET /tenants/{tenantId}/catalog` | Organization owner or restaurant manager | Read current draft entries, archived entries, discount state, and the publication summary |
| `GET /tenants/{tenantId}/catalog/history` | Organization owner or restaurant manager | Read paginated actor/time/version/change history |
| `POST /tenants/{tenantId}/catalog/publish` | Organization owner or restaurant manager | Validate and atomically publish the current draft using quoted `If-Match` |
| `POST /tenants/{tenantId}/catalog/discard` | Organization owner or restaurant manager | Replace the current draft from the published snapshot using quoted `If-Match` |
| `POST /tenants/{tenantId}/catalog/history/{version}/restore` | Organization owner or restaurant manager | Publish a historical snapshot as a new version using quoted `If-Match` |
| `GET /tenants/{tenantId}/products/availability` | Organization owner, restaurant manager, or Kitchen member | Read only ID, name and availability for products in active, visible categories |
| `GET /tenants/{tenantId}/menu-languages` | Organization owner or restaurant manager | Read enabled menu language tags and default language |
| `GET /tenants/{tenantId}/restaurant-description-translations` | Organization owner or restaurant manager | Read enabled locales, default locale, and saved restaurant description translations; private response is not cached |
| `PUT /tenants/{tenantId}/restaurant-description-translations/{locale}` | Organization owner or restaurant manager | Save or clear the restaurant description for an enabled menu locale; descriptions are trimmed and limited to 500 characters |
| `PUT /tenants/{tenantId}/menu-languages` | Organization owner or restaurant manager | Replace enabled menu languages and default; requires at least one unique language and a default included in the list. Changing the default requires translations for every active category, product, option group, and option in the new default language |
| `PUT /tenants/{tenantId}/catalog/{entityType}/{entityId}/translation` | Organization owner or restaurant manager | Save a translated name and optional product description for an enabled locale; supported entity types are categories, products, option-groups, and options |
| `POST /tenants/{tenantId}/categories` | Organization owner or restaurant manager | Create a category |
| `PUT /tenants/{tenantId}/categories/{categoryId}` | Organization owner or restaurant manager | Update a category name and sort order |
| `PUT /tenants/{tenantId}/categories/{categoryId}/visibility` | Organization owner or restaurant manager | Set temporary public visibility with `{ "isVisible": true/false }`; requires an active category in the authorized tenant |
| `DELETE /tenants/{tenantId}/categories/{categoryId}` | Organization owner or restaurant manager | Archive the category and its product/option descendants |
| `POST /tenants/{tenantId}/products` | Organization owner or restaurant manager | Create a product with base price and percentage tax |
| `PUT /tenants/{tenantId}/products/{productId}` | Organization owner or restaurant manager | Update product details, price, tax, order, availability and optional `categoryId`; omitted/null preserves the current category. Current and target categories must be active and owned by the authorized tenant; foreign/missing/archived or empty UUID targets return `404` without a write |
| `PUT /tenants/{tenantId}/products/{productId}/availability` | Organization owner, restaurant manager, or Kitchen member | Set availability with `{ "isAvailable": true/false }`; requires an unarchived product in an active, visible category owned by the authorized tenant; missing, foreign, archived or hidden products return `404` |
| `DELETE /tenants/{tenantId}/products/{productId}` | Organization owner or restaurant manager | Archive the product and its option descendants |
| `POST /tenants/{tenantId}/products/{productId}/restore` | Organization owner or restaurant manager | Restore an archived product in an active category. The product remains unavailable until a manager explicitly enables it; archived option descendants remain archived. No permanent product purge route exists |
| `POST /tenants/{tenantId}/products/{productId}/option-groups` | Organization owner or restaurant manager | Create a selection group with minimum/maximum counts |
| `PUT /tenants/{tenantId}/option-groups/{groupId}` | Organization owner or restaurant manager | Update selection rules and display order |
| `DELETE /tenants/{tenantId}/option-groups/{groupId}` | Organization owner or restaurant manager | Archive the group and its options |
| `POST /tenants/{tenantId}/option-groups/{groupId}/options` | Organization owner or restaurant manager | Create a fixed-price option |
| `PUT /tenants/{tenantId}/options/{optionId}` | Organization owner or restaurant manager | Update an option |
| `DELETE /tenants/{tenantId}/options/{optionId}` | Organization owner or restaurant manager | Archive an option |
| `POST /tenants/{tenantId}/discounts` | Organization owner or restaurant manager | Create a fixed or percentage discount code |
| `PUT /tenants/{tenantId}/discounts/{discountId}` | Organization owner or restaurant manager | Update discount name, kind, and value; its code stays stable |
| `DELETE /tenants/{tenantId}/discounts/{discountId}` | Organization owner or restaurant manager | Deactivate a discount |
| `POST /orders` | Public, resolved restaurant host | Price and create an order from the server's catalog; requires `Idempotency-Key`. Accepts optional `menuLocale` and returns the effective locale with saved localized labels. |
| `POST /orders/{orderId}/tracking` | Public, resolved restaurant host plus per-order capability | Read only `id`, `status`, `version`, and `createdAt`; accepts `trackingToken` in JSON body; unknown, wrong-tenant, invalid, and expired capabilities return the same `404`; response is `no-store` |
| `GET /tenants/{tenantId}/orders` | Restaurant owner, manager, or kitchen staff | Read bounded, cursor-paginated order summaries with saved ticket lines and option labels; optional status filter |
| `PATCH /tenants/{tenantId}/orders/{orderId}/status` | Restaurant owner, manager, or kitchen staff | Change status with a required `If-Match` version |
| `/hubs/orders` | Better Auth JWT authenticated SignalR connection | Join authorized restaurant groups and receive `order.changed` events |
| `GET /health/live` | Public | Return `Healthy` while the API process can answer requests; does not check dependencies |
| `GET /health/ready` | Public | Check PostgreSQL connectivity and return `Healthy` or `Unhealthy` with HTTP `200` or `503`; response contains no provider details |
| `GET /openapi/v1.json`, `GET /swagger` | Anonymous when enabled | OpenAPI 3.1 JSON and interactive Swagger UI |

The app interface supports `/en` and `/fr`; restaurant menu locales are independent and restaurant-configurable without a fixed count limit. Menu locale is requested with `GET /menu?locale=<tag>`. Names for categories, products, option groups, options, product descriptions, and the short restaurant description can be translated. Missing text falls back to the default menu language; the public menu reports its effective locale and includes `restaurantDescription` as a string or `null`. Omitted or unsupported request locales resolve to the default. Restaurant descriptions are saved per enabled locale, trimmed, limited to 500 characters, and an empty value clears that locale. Owners and restaurant managers edit menu languages and descriptions in the localized organization area. First-release tenant addressing uses one-label subdomains; custom domains are deferred. See [decision 0003](../architecture/decisions/0003-catalog-localization-and-tenant-domain-policy.md).

The tenant ID in a protected route selects a resource. Every catalog/order query and mutation checks the authenticated issuer/subject membership for that tenant. Foreign or missing resource IDs return the same `404`. Kitchen members can read and change only product availability through the narrow availability routes; full catalog reads and edits remain owner/manager-only. Kitchen staff can read/progress orders but cannot cancel them; owner/manager cancellation is allowed for incomplete orders. `GET /me` lists active restaurants only; restaurant entries use role values `Manager` and `Kitchen`, while organization-owned restaurants use `OrganizationOwner`. Invitation role values `RestaurantManager` and `KitchenStaff` map to those persisted membership values.

`GET /tenants/{tenantId}/orders` returns each summary's `lines` array with `productId`, saved `productName`, `quantity`, and selected `options` (`optionId`, saved `name`). These labels come from persisted order snapshots and are not re-read or re-translated from the current catalog. The default page size is 50, the maximum is 100, and `nextCursor` is opaque.

`POST /orders` resolves the restaurant from the request host. For local development, `bistro.localhost:5182` resolves the `bistro` tenant when `Tenancy:BaseDomain=localhost`. Forwarded-host and tenant headers are ignored. Order creation returns the receipt. Capability-protected status-only tracking is specified by [decision 0006](../architecture/decisions/0006-public-order-tracking.md); it is not a general lookup by order ID.

## 2. Authentication and tenancy

Better Auth issues short-lived RS256 JWTs from the Next.js server. The API discovers signing keys from `{Authentication:Issuer}/.well-known/openid-configuration` and validates issuer and audience. Configure `Authentication:Issuer` to the exact Better Auth base URL and `Authentication:Audience` to the same value as `API_AUDIENCE`. The browser session cookie stays in the browser; the server-side BFF obtains API tokens and calls the API without exposing bearer tokens to client JavaScript. A person is identified by validated issuer/subject. Persisted organization-owner and restaurant memberships determine access; token-supplied tenant IDs are not authorization. OpenAPI declares Bearer security per protected route. The API has no login route; local Swagger testing uses the frontend's `auth:dev-token` command and Swagger's Bearer **Authorize** control.

Invitation role identifiers are `OrganizationOwner`, `RestaurantManager`, and `KitchenStaff`; `/me` restaurant role values are `OrganizationOwner`, `Manager`, and `Kitchen`. An organization owner can manage that organization's restaurants and invitations. Restaurant managers manage that restaurant's catalog/orders. Kitchen staff can read and progress its orders. Restaurant tenant resolution for public routes accepts exactly one subdomain label below `Tenancy:BaseDomain`; unknown, inactive, nested, and foreign-domain hosts return `404`.

The organization team reads are owner-checked on every request and return private, non-cacheable data. Member rows expose only role, nullable email, and nullable restaurant ID/name. Email is derived from a matching accepted invitation or, for the currently authenticated verified owner, the verified identity claim; legacy memberships without a known email return `null`. Invitation rows expose a role, recipient email, nullable restaurant ID/name, expiry, and server-derived status. Neither read returns OIDC issuer/subject, raw invitation tokens, or token hashes. Only pending invitations can be revoked; accepted, revoked, expired, missing, and foreign invitations share the safe `404` response.

New customers use the localized organization signup flow, which creates the organization and its verified-email owner through `POST /organizations`. The operator-only `--provision-organization` command remains available for migrations/backfill using an issuer and subject. Staff invitations carry a normalized recipient email; accepting requires a verified JWT email with the same normalized address. See the [authentication decision](../architecture/decisions/0002-authentication.md) and [development guide](../development.md#authentication-configuration).

## 3. Pricing, checkout, and order workflow

The tenant menu includes ordered active categories and non-archived products, including items marked unavailable so the storefront can show their state. Checkout still rejects unavailable products. Product records have a base price and percentage tax rate. Option groups enforce their minimum/maximum selection counts; selected options add fixed amounts. Prices use decimal arithmetic in EUR, USD, or GBP. The server allocates at most one fixed or percentage discount across lines, computes tax, and rounds line amounts to two decimal places using `AwayFromZero`. New orders store the effective menu locale and immutable server-resolved product/option label snapshots per [decision 0004](../architecture/decisions/0004-localized-order-snapshots.md). Existing orders preserve their labels and report an unknown locale as `null`. No payment, cart, inventory, tax-jurisdiction engine, or stacked promotion is included.

`POST /orders` accepts a customer name, optional menu locale, unique product lines, positive quantities, selected option IDs, and an optional discount code. The API resolves the locale against enabled menu locales and defaults omitted or unsupported values to the tenant default. New orders snapshot the resolved product and selected-option labels using decision 0003's per-item default-language fallback. Legacy orders return `menuLocale: null` and keep their existing labels. The server derives tenant, names, prices, tax, currency, and totals from its catalog, then stores the order and purchase-time snapshots atomically. Requests are limited to 16 KiB. The fixed-window checkout limit is configured with `CheckoutRateLimit:PermitLimit`, `CheckoutRateLimit:WindowSeconds`, and `CheckoutRateLimit:QueueLimit`; buckets are per tenant and remote client address. `429` uses `rate_limited`.

The storefront may include `trackingToken`, a 32-byte random base64url capability, in the order create request. The API stores only its SHA-256 hash and a 30-day expiry. `POST /orders/{orderId}/tracking` accepts `{ "token": "…" }`; see [decision 0006](../architecture/decisions/0006-public-order-tracking.md) for capability, host, response and privacy boundaries.

Every checkout requires an `Idempotency-Key`. Keys are tenant-scoped and retained for 24 hours. The effective locale is included in normalized request hashing, so an unchanged retry replays the original receipt while a changed effective locale or other request content with the same key returns `409`. The successful create response contains the receipt. Staff kitchen lists default to 50 summaries per page, cap at 100, and return an opaque `nextCursor`; archived orders are excluded from every kitchen-list status filter. Each order summary includes its effective `menuLocale`, nullable for legacy rows, and its lifecycle `status` as a string name such as `Pending`.

The storefront submits checkout through a same-origin Next.js server action. Its in-memory cart supplies `customerName`, nullable `discountCode`, selected `menuLocale`, and `items: [{ productId, quantity, optionIds }]`. The action derives the restaurant API host from validated actual Host and the configured template; browser tenant IDs, labels, and prices are not submitted. The frontend generates a UUID key, preserves payload/key on uncertain retries, and displays the API receipt's totals, tax, discount, currency, status, saved product/option labels, effective menu locale, and ID. Safe `400`, `404`, `409`, and `429` distinctions are retained; unreadable success responses are uncertain.

The API limiter still uses its observed remote address. Different guests behind the BFF can share the BFF's per-tenant API bucket. Browser address/forwarded headers are not forwarded or trusted to bypass it. A deployment-specific trusted-proxy and edge-rate policy remains separate operational work.

Statuses progress `Pending -> Preparing -> Ready -> Completed`. Repeating the current status is a no-op. Skipped/backward transitions and cancellation of a completed order return `409`; managers may cancel other incomplete orders. Mutations require `If-Match: "<version>"`; missing values return `428`, and stale concurrent writes return `412`. Successful mutations return the updated receipt and a new ETag.

`GET /api/v1/tenants/{tenantId}/orders/history` returns every order, including completed, cancelled, and daily-archived orders. Only organization owners and restaurant managers may use it; kitchen staff and identities without current tenant membership receive `403`. Optional filters are `status`, `search`, `from`, and `through` (`yyyy-MM-dd`, inclusive UTC dates). Search matches a customer name or the visible order-reference prefix; a complete UUID also matches exactly. `sort` is `createdAt` or `total`; `direction` is `asc` or `desc`. Pages are numbered from 1, default to 25 items and cap at 100; responses include `page`, `pageSize`, and `totalCount`. Ordering uses the order ID as a stable tie-breaker.

On `Completed` or `Cancelled`, the API records `ClosedAt` and UTC ticks. The hosted `OrderArchiveDispatcher` archives eligible terminal orders at each UTC midnight, retaining their original status and snapshots. It also runs once on startup to catch a missed daily run and retries failed runs every minute. The operation is idempotent across API instances. Kitchen lists hide archived rows; the owner/manager history endpoint continues to include them. There is no restaurant timezone setting, so the daily boundary is UTC.

## 4. SignalR notifications

### Frontend kitchen read BFF

`GET /api/kitchen/orders?tenantId=<uuid>&status=<optional-status>&cursor=<optional-cursor>` is a frontend same-origin read adapter for TanStack Query. It validates selectors (including duplicate query parameters), requires the current verified session through the server API client, reads the user's memberships, and rejects a foreign restaurant before requesting its order page. The API independently authorizes the read. The browser supplies no API bearer token.

Success returns `{ ok: true, status: 200, data: { items: [...], nextCursor: null | string } }` using the existing validated order summaries. Failure returns a safe `error` code with an appropriate HTTP status, including 400 for invalid selectors, 401 for no verified session, 403 for no membership and 5xx for unavailable data. All responses use `Cache-Control: private, no-store` and `Vary: Cookie`. Client keys include account, tenant, locale, status and cursor; status mutations still use a validated Server Action and the API `If-Match` contract. SignalR hints invalidate the account/tenant query prefix. This adapter introduces no database or API schema change.

### API hub

The hub is `/hubs/orders`; bearer tokens supplied by SignalR's `access_token` query parameter are read only on this path. Call `JoinRestaurant(tenantId)` to request a membership-checked subscription. The server derives the group name and checks the current owner/manager/kitchen membership before joining; clients cannot submit a group name. `LeaveRestaurant(tenantId)` removes the current connection's subscription and group membership; disconnect removes all of that connection's subscriptions.

The publisher rechecks persisted membership for each subscribed connection immediately before sending an event to that connection. Revoked memberships are removed from the subscription registry and group without receiving the event; authorization/database failures propagate to outbox retry. Leaving or disconnecting during the authorization check prevents that captured subscription from receiving. An already queued event cannot be recalled. SignalR closes authenticated connections at token expiration (`CloseOnAuthenticationExpiration`); reconnect must obtain a fresh token, rejoin and recover REST state. The registry and SignalR transport are in memory and support the current single API instance. Multiple replicas require a shared delivery/subscription design before deployment; a transport backplane alone would not share this registry.

The dispatcher publishes `order.changed` with `eventId`, `tenantId`, `orderId`, `eventType`, current `status`, `version`, and UTC `occurredAt`. Order creation/status changes and outbox rows commit in one transaction. The dispatcher retries failed deliveries with bounded exponential delay; delivery is at least once, so clients should deduplicate by event ID and use the authorized paginated REST list after reconnect. REST/database state remains authoritative.

The localized staff page at `/[locale]/organization/orders?tenantId=<id>` reads `/me` first and only requests the selected tenant's order page when that membership is present. It uses saved ticket labels, passes status and cursor filters through the page URL, and calls the status API through a same-origin Next.js server action with `If-Match`. The frontend's `POST /api/kitchen/signalr-token` route requires a verified session and exact same-origin `Origin`, returns a short-lived API JWT with `Cache-Control: no-store`, and grants no tenant-specific permission. The browser keeps the token in memory for SignalR only. The API still authorizes `JoinRestaurant`; events trigger a coalesced REST refresh, and reconnect rejoins the selected tenant before reloading REST state. Set `PUBLIC_API_BASE_URL` to the browser-reachable API origin when it differs from server-side `API_BASE_URL`. Production URL, CORS, proxy, and TLS verification remain in the hosting/operations task.

## T2 theme drafts — 15 October 2026

Implemented and merged; production schema applied, API deployment/hosted acceptance unverified. Every route requires an active organization owner or restaurant manager. Foreign, missing, inactive or unauthorized restaurants return 404; anonymous requests return 401. All responses are no-store.

| Method/path | Request | Result |
| --- | --- | --- |
| GET `/api/v1/tenants/{tenantId}/theme` | None | `{ theme, version, contrast }` with quoted integer ETag. Defaults/version 1 when no draft exists. |
| PUT `/api/v1/tenants/{tenantId}/theme` | Appearance object (8 KiB maximum), `If-Match: "<version>"` | Updated draft and incremented version/ETag. Invalid/unknown fields: 400; missing/invalid precondition: 428; stale: 412. No publication. |
| GET `/api/v1/tenants/{tenantId}/theme/palette` | None | `{ palette: { primary, accent, bg, text }, reason: null }`, or `{ palette: null, reason: "no_logo" | "unavailable" | "unusable" }`. Uses only the authorized saved T1 logo. |

Appearance: six-digit HEX `primary`, `accent`, `bg`, `text`; allowlisted `font`, `headingFont`; `headingWeight` 400/500/600/700; `bodyWeight` 400/500; `textScale` 0.9–1.2; `lineHeight` 1.3–1.8; integer `buttonRadius` 0–28 and `radius` 0–24; `buttonStyle` solid/outline; `spacing` compact/comfortable/airy; `imageRatio` square/landscape/wide; integer `bannerHeight` 180–440 and `bannerOverlay` 20–85; `bannerAlign` left/center; booleans `showRestaurantInfo`, `showBanner`; `layout` grid/list; `ambiance` custom/crisp-light/warm-cream/bistro-noir. Omitted fields use reference defaults; callers send the full object. Identity, URLs, media, domain and arbitrary CSS are excluded.

Contrast returns unrounded sRGB `textOnBackground`, `primaryOnBackground`, `textOnAccent`, `backgroundOnPrimary` and `readyForPublication` for these normal-text pairs (all at least 4.5:1). This diagnostic does not certify all rendered states. Low-contrast drafts can be saved; T3 must enforce safe publication.

Browser BFF: GET `/api/theme-settings?tenantId=…` (`palette=1` for suggestions); PUT the same path with `{ theme, version }`. PUT requires exact configured Origin, validates selector/body and forwards If-Match. Credentials remain server-only; responses use `private, no-store`, `Vary: Cookie`. See [decision 0012](../architecture/decisions/0012-tenant-theme-drafts.md).

## T3 theme publication

Implementation status: source implemented; migration rollout and hosted acceptance pending.

Owner/manager publication reads and writes require persisted membership and return no-store responses. The published snapshot is separate from the editable T2 draft and from T1's saved active slots. A publish captures the current saved appearance and current ready logo/favicon/banner slot IDs in one transaction; changing a T1 slot only stages the replacement until the next publish.

| Method/path | Request | Result |
| --- | --- | --- |
| GET `/api/v1/tenants/{tenantId}/theme/publication` | None | Current snapshot, source draft version, asset IDs, publication time, and quoted publication-version ETag. Null snapshot reads as default appearance, no assets, and version 1. |
| POST `/api/v1/tenants/{tenantId}/theme/publication` | `{ "draftVersion": n }`, `If-Match: "<publicationVersion>"` | Publishes the current saved draft and saved active T1 slots atomically; returns the new snapshot and ETag. The request cannot supply theme values or asset IDs. |
| GET `/api/v1/theme` | Validated tenant host; no tenant selector | Public appearance, published asset-presence flags, publication time, and version; no-store. |
| GET `/api/v1/brand-assets/{logo|favicon|banner}` | Validated tenant host | Exact ready asset ID in the published snapshot; draft slot changes are not served. Existing default favicon fallback remains. |

Missing or malformed `If-Match` returns 428; a stale publication or draft version returns 412; a saved appearance that fails publication contrast checks or a selected asset that is not ready returns 422. Publication requires at least 4.5:1 for text/background, primary/background, and text/accent. When a banner is selected, its overlay must be at least 65%. Unauthorized or inactive tenant access remains indistinguishable as 404 (anonymous management access is 401).

The same-origin frontend `/api/theme-publication?tenantId=…` BFF requires one UUID tenant selector; POST also checks the configured exact `Origin`, forwards the publication ETag, and returns `private, no-store`/`Vary: Cookie`. The real menu, checkout shell, order tracking shell, title, and favicon consume only host-resolved published values and versioned asset URLs. The additive `20261016132000_ThemePublication` migration backfills existing restaurants with the default appearance and their current active T1 assets to preserve current storefront behavior. It is generated source only and has not been applied; API deployment, guest-browser refresh, and hosted tenant-isolation acceptance remain pending.

## 5. Error contract

Errors use `ApiProblemResponse` with `application/problem+json`, `type: about:blank`, status, safe English detail, a stable code, trace ID, and optional field issues. `instance` is omitted and responses are `Cache-Control: no-store`. Exception/provider details, request values, and arbitrary JSON paths are not returned or logged.

| Status | Stable code and use |
| --- | --- |
| `400` | `validation_failed`: malformed request or invalid use-case input |
| `401` | `unauthorized`: authentication required |
| `403` | `forbidden`: authenticated identity lacks permission |
| `404` | `not_found`: missing/foreign resource or invalid/unknown/inactive tenant |
| `409` | `conflict`: invalid state transition, conflicting idempotency key, duplicate resource |
| `412` | `precondition_failed`: stale `If-Match` version |
| `413` | `request_too_large`: body exceeds the checkout limit |
| `422` | `unprocessable_entity`: saved tenant theme or selected brand asset is unsafe to publish |
| `428` | `precondition_required`: versioned mutation omitted or malformed `If-Match` |
| `429` | `rate_limited`: checkout fixed-window limit reached |
| `500` | `unexpected_error`: safe fallback without exception details |

405 and 415 responses also preserve their status with stable `method_not_allowed` and `unsupported_media_type` codes. Binding/JSON failures use field `request`, code `invalid_value`, and fixed copy. See the [security boundaries](../architecture/tenancy-and-security.md) and [functional test plan](../functional-test-plan.md).

## M1 category visibility — 2026-10-08

Management category responses include required `isVisible` (boolean). New and migrated categories default to `true`. `PUT /api/v1/tenants/{tenantId}/categories/{categoryId}/visibility` accepts an explicit JSON boolean and returns `204`; absent/null/invalid values return `400`, missing identity returns `401`, and unauthorized, foreign or archived categories return `404`. It changes only visibility, preserving archive, ordering and product availability. Public menus omit hidden categories and their products. New checkout attempts with products under hidden categories fail with the existing `404` unavailable-item result; existing order snapshots are unchanged. Ordering continues through existing category/product updates. API and migration must precede frontend rollout; see [M1 verification](../audits/menu-builder.md).

## T1 brand assets — implemented source, hosted acceptance pending

Protected owner/manager routes resolve persisted membership on every operation. Unknown or unauthorized tenants/assets return the same 404; missing authentication returns 401. Responses and image delivery are no-store. A browser tenant ID never grants access.

| Method/path under `/api/v1` | Request | Success |
| --- | --- | --- |
| GET `/tenants/{tenantId}/brand-assets` | None | 200 `{ storageAvailable, assets: [{ id, slot, contentType, width, height, bytes }] }` |
| POST `/tenants/{tenantId}/brand-assets/{slot}/uploads?aspect=16:9` | Raw binary, `Content-Type: application/octet-stream`; aspect also accepts `21:9` | 201 normalized private asset metadata |
| GET `/tenants/{tenantId}/brand-assets/uploads/{assetId}` | Authenticated read | 200 PNG/WebP bytes for ready, unexpired tenant-owned media |
| PUT `/tenants/{tenantId}/brand-assets/{slot}` | `{ "assetId": "<draft-guid>" }`, `If-Match: "<current-guid>"` or `"none"` | 204; draft becomes current immediately |
| DELETE `/tenants/{tenantId}/brand-assets/{slot}` | Same precondition | 204; current slot removed, fallback restored |
| GET `/brand-assets/{slot}` | Active tenant resolved from actual host; no private asset selector | 200 current PNG/WebP or 404 when absent |

Slots are `logo`, `favicon`, `banner`. Upload alone never publishes. Save checks tenant, slot, readiness, expiry and prior publication; retired media cannot be republished as a draft. A serializable transaction compares the expected current ID before swapping pointers. Missing precondition is 428; stale precondition is 412. The old asset remains current after failed validation/storage/save. Normalization rules and limits are in [decision 0007](../architecture/decisions/0007-brand-media-storage.md). Invalid files return 400, oversized transport may return 413, unsupported transport type returns 415, and storage failures return 503 `unavailable`. A maximum of 20 retained unpublished uploads per tenant returns 429 `rate_limited`; serialization contention on pending creation also asks the client to retry.

The same-origin BFF at `/api/brand-assets` validates selectors and body limits, requires the exact configured auth origin on mutations, and keeps tokens server-side. It forwards original binary bytes using the shared request factory. `/api/public/brand-assets/{slot}` derives its upstream solely from the validated incoming tenant host and fixed server configuration, ignores browser tenant selectors, and serves only public slot reads. A missing saved favicon falls back to `/favicon.ico`. `storageAvailable` means configured, not a verified provider health result.
