# W1 — Tenant isolation and authorization

## Scope and method

This file re-audits W1 on the rebased audit branch, whose product code is `origin/main` at `55f31a5` (2026-10-19). It replaces the version approved on the stale base `7e5b2e3`. Every carried-over row and finding was re-verified against current source, and every citation was re-read at its current line. Rows were added for all new surface keys.

W1a covers every .NET API surface: 115 controller actions in 21 controller files, the two `KitchenHub` methods and the three minimal endpoints in `Program.cs` (`/`, `/health/live`, `/health/ready`). New controllers since `7e5b2e3` are Analytics, DashboardMetrics, OrderEmailSettings, OrderingOperations, PickupSlots, PublicTheme, StripeConnect (including `StripeConnectWebhookController`, keyed `StripeConnectController.Receive` by the verifier), ThemePublication and ThemeSettings. CurrentUser, EstablishmentSettings, Menu, Orders, Organizations, PublicBrandAssets, PublicProductPhotos, TenantCatalog and Tenants changed. W1b covers the Next.js BFF: 28 route-handler methods in 20 `route.ts` files, 43 server actions in 10 `actions/*.ts` files, the server API client and session helpers, `proxy.ts`, and the server, query and client-state caches. The matrix has 191 rows: the 190 verifier keys plus the manual `Program.cs#GET /` row (`MapMethods` at `Program.cs:64`, which the verifier does not enumerate).

The main change since `7e5b2e3` is the authorization model. The fixed `Manager`/`Kitchen` role checks were replaced by configurable organization roles: each restaurant membership references an organization role grant set with eight permission keys (`orders.manage`, `kitchen.display`, `catalog.manage`, `discounts.manage`, `analytics.view`, `storefront.manage`, `staff.manage`, `billing.manage`; `WhitePlate.Domain/Organizations/OrganizationRoleGrantSet.cs:8-22`). `StaffMembershipRepository.HasPermissionAsync` (`WhitePlate.Infrastructure/Persistence/Repositories/StaffMembershipRepository.cs:32-55`) grants every permission to an owner of the tenant's organization. Otherwise it loads the caller's membership for that tenant and requires an unarchived grant containing the permission. Organization owners keep fixed, unconfigurable rights; only owners create, edit or archive roles.

Source review followed every call chain from controller to Application handler to repository query: `Program.cs`, `Configuration/ServiceRegistration.cs`, `Configuration/AnalyticsPrivacyService.cs`, `Tenancy/*`, `Identity/HttpCurrentIdentity.cs`, all 21 controller files, `Realtime/KitchenHub.cs`, `KitchenSubscriptions.cs`, `SignalRKitchenEventPublisher.cs`, the Application handlers each action calls, the Infrastructure repositories and EF configurations behind them, and `Infrastructure/Payments/StripeConnectProvider.cs`. Documentation compared: `docs/architecture/tenancy-and-security.md`, `docs/api/api-contracts.md`, `docs/superpowers/specs/2026-10-18-custom-organization-roles-design.md` and `docs/architecture/frontend-conventions.md`. API paths in the matrix are relative to `apps/api/`; frontend paths, and API paths after "API", are relative to `apps/frontend/` and `apps/api/` respectively.

W1b source review read every handler and action in the matrix and followed each into `lib/api/index.ts` (`getApiToken`), `lib/api/request-factory.ts`, `request-options.ts`, `request-url.ts`, `tenant-routing.ts`, `lib/storefront-preview-routing.ts`, `lib/auth.ts`, the `services/*.ts` callers, `lib/validation/*`, `proxy.ts`, `next.config.ts`, the workspace layout and pages, the TanStack Query keys and the Zustand stores. `lib/auth.ts`, `lib/api/index.ts`, `request-factory.ts`, `request-url.ts`, `request-options.ts`, `tenant-routing.ts`, `next.config.ts`, `app/api/auth/[...all]/route.ts`, `app/.well-known/openid-configuration/route.ts`, `app/api/kitchen/signalr-token/route.ts`, `app/api/brand-assets/route.ts`, `app/api/product-photos/route.ts` and `app/api/establishment-settings/route.ts` are unchanged since `7e5b2e3` (`git diff 7e5b2e3 HEAD` is empty for them). `package.json` still pins `next` 16.3.4 and `better-auth` 1.7.6, so library behavior was read in those versions as installed in the main checkout: `next/dist/server/app-render/action-handler.js:351-366` and `:438-460`, and `better-auth/dist/plugins/jwt/index.mjs:193-206`.

### Probes and their limits on this base

Runtime probes against the current code were not possible without a schema change, which the audit constraints forbid. A read-only SQL transaction on the documented Neon `test` database (the frontend `.env` `DATABASE_URL` host is `*.neon.tech`; values loaded in-process and never printed) showed this:

- The latest applied migration is `20261014150246_OrderingOperations`.
- The source requires migrations through `20261019082708_OrderCustomerDetails`.
- `OrganizationRoleGrants`, `StripeConnectConnections`, `OrderAnalyticsFingerprints` and `CatalogRevisions` do not exist there.

`docs/architecture/tenancy-and-security.md:3` likewise says the custom-role migration "is source-only and remains unapplied". Every protected tenant route now calls `HasPermissionAsync`, which reads `OrganizationRoleGrants`, and the public menu reads `CatalogPublicationHeads`. A local API on that database would therefore fail on almost every route of interest. No local servers were started. No second account was created.

| Probe (this base) | Requests | Result |
| --- | --- | --- |
| Read-only SQL on Neon `test`: migration history, presence of new tables, tenant counts | 1 transaction | Latest migration `20261014150246_OrderingOperations`; none of the four new tables exist; 16 tenants, 0 inactive, 12 organizations. Rolled back. |
| `dotnet test apps/api/WhitePlate.slnx` (in-memory SQLite host, includes `StripeConnectHandlerTests`, `StripeConnectRepositoryTests`, `OrganizationEndpointTests`, `DashboardMetricsEndpointTests`, `OrderingOperationsTests`, `ThemeSettingsEndpointTests`, `CatalogTranslationReviewEndpointTests`, `ProductAvailabilityTests`, the media, order and tenant endpoint tests) | 372 tests | 372 passed, 0 failed. |
| SEC-07 URL resolution with Node `URL` using `resolveApiUrl`'s rules (`lib/api/request-url.ts:7`, `:26-28`, unchanged) | 2 | Crafted `tenantId` values resolve to `/api/v1/tenants/<T>/categories/<C>` (suffix moved to the query) and `/api/v1/organizations/<G>/invitations/<I>` (suffix moved to the fragment); both pass the resolver's origin and prefix checks. |

Stale-base runtime evidence (2026-10-25, on `7e5b2e3`) is cited only where the code it exercised is unchanged:

- The `get-session` `set-auth-jwt` header and the blocked `/api/auth/token` route (SEC-06).
- The Origin checks of `signalr-token`, `brand-assets` and `product-photos`.
- Anonymous BFF reads returning 401.
- Spoofed `X-Tenant-Subdomain` and `X-Forwarded-Host` being ignored by Host resolution (`TenantHostResolver.cs` is unchanged).

The 49 foreign-tenant and 17 cross-resource API probes from that run exercised the old role checks. They are not carried over as evidence for the new permission model. The matrix cells for this base rest on source review plus the 372 passing tests.

## Endpoint × role × tenant matrix

Roles:

- **Kitchen:** the built-in "Kitchen staff" role of the target restaurant, with default grant `kitchen.display`.
- **Manager:** the built-in Manager role, with every permission except `billing.manage`.
- **Owner:** an organization owner of the restaurant's organization, with all permissions and unconfigurable.
- **Foreign-org account:** an authenticated, verified account with no membership in the target organization or restaurant.

Built-in role defaults are in `OrganizationRoleGrantSet.cs:218-225`. Owners can change those grants and add custom roles, so a cell reflects default grants, and the Enforcement column names the permission actually checked. `Allow (own tenant)` means allowed only for the tenant or organization where the role is held; other IDs return 404 (403 on the staff order, dashboard and analytics routes). Most catalog checks go through `CatalogAccess` (`WhitePlate.Application/Catalog/CreateCategoryCommandHandler.cs:35-49`), and order checks through `OrderStaffAccess` (`WhitePlate.Application/Orders/OrderStaffAccess.cs:7-21`).

| Surface | Anonymous | Kitchen | Manager | Owner | Foreign-org account | Tenant source | Enforcement (file:line) | Finding |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| `AnalyticsController.Get` | Deny | Deny | Allow (own tenant) | Allow (own tenant) | Deny | Route `tenantId` | `WhitePlate.Application/Orders/GetAnalyticsMetricsQueryHandler.cs:19-22` (checks `orders.manage`, not `analytics.view`); `AnalyticsRepository.cs:88-105` (active tenant, tenant filter) | SEC-08 |
| `AnalyticsController.Withdraw` | Allow | Allow | Allow | Allow | Allow | Route `tenantId`; email in body | `WhitePlate.Api/Controllers/AnalyticsController.cs:36-56` (`[AllowAnonymous]`, rate limit `:47-50`, uniform reply); `WithdrawAnalyticsConsentCommandHandler.cs:9-22`; `AnalyticsRepository.cs:34-64` (tenant-scoped HMAC match) | None |
| `BrandAssetsController.List` | Deny | Deny | Allow (own tenant) | Allow (own tenant) | Deny | Route `tenantId` | `WhitePlate.Application/Media/BrandMediaService.cs:15-20` (`storefront.manage`); `MediaRepository.cs:12-13` | SEC-01 |
| `BrandAssetsController.Preview` | Deny | Deny | Allow (own tenant) | Allow (own tenant) | Deny | Route `tenantId` + `assetId` | `WhitePlate.Application/Media/BrandMediaService.cs:63-65`; `MediaRepository.cs:24-25` (tenant + ID) | SEC-01 |
| `BrandAssetsController.Remove` | Deny | Deny | Allow (own tenant) | Allow (own tenant) | Deny | Route `tenantId` + `slot` | `WhitePlate.Api/Controllers/BrandAssetsController.cs:81`; `BrandMediaService.cs:47`; `MediaRepository.cs:54-55` | SEC-01 |
| `BrandAssetsController.Save` | Deny | Deny | Allow (own tenant) | Allow (own tenant) | Deny | Route `tenantId` + `slot`; asset ID in body | `WhitePlate.Api/Controllers/BrandAssetsController.cs:81`; `BrandMediaService.cs:47-53`; `MediaRepository.cs:54-58` (candidate in same tenant) | SEC-01 |
| `BrandAssetsController.Upload` | Deny | Deny | Allow (own tenant) | Allow (own tenant) | Deny | Route `tenantId` + `slot` | `WhitePlate.Api/Controllers/BrandAssetsController.cs:39` (before body read); `BrandMediaService.cs:28` | SEC-01 |
| `CurrentUserController.Get` | Deny | Allow | Allow | Allow | Allow | JWT `iss`/`sub` only | `WhitePlate.Infrastructure/Persistence/Repositories/StaffDirectoryRepository.cs:10-56` (own memberships and grants only) | SEC-01 |
| `DashboardMetricsController.Get` | Deny | Allow (own tenant) | Allow (own tenant) | Allow (own tenant) | Deny | Route `tenantId` | `WhitePlate.Application/Orders/GetDashboardMetricsQueryHandler.cs:19-25` (`orders.manage`, `kitchen.display` or `analytics.view`; order value only with `analytics.view`); `OrderRepository.cs:317-332` (active tenant, tenant filter) | None |
| `EstablishmentSettingsController.DeleteOpeningHours` | Deny | Deny | Allow (own tenant) | Allow (own tenant) | Deny | Route `tenantId` | `WhitePlate.Application/Tenants/EstablishmentSettingsHandler.cs:100` (`storefront.manage`); atomic recheck `EstablishmentSettingsRepository.cs:23-30` | None |
| `EstablishmentSettingsController.Get` | Deny | Deny | Allow (own tenant) | Allow (own tenant) | Deny | Route `tenantId` | `WhitePlate.Application/Tenants/EstablishmentSettingsHandler.cs:16`; `EstablishmentSettingsRepository.cs:11-15` (active tenant and organization) | None |
| `EstablishmentSettingsController.GetLegalProfile` | Deny | Deny | Allow (own tenant) | Allow (own tenant) | Deny | Route `tenantId` | `WhitePlate.Application/Tenants/EstablishmentSettingsHandler.cs:31-35`; `EstablishmentSettingsRepository.cs:11-19` | None |
| `EstablishmentSettingsController.Options` | Deny | Deny | Allow (own tenant) | Allow (own tenant) | Deny | Route `tenantId` | `WhitePlate.Application/Tenants/EstablishmentSettingsHandler.cs:23` | None |
| `EstablishmentSettingsController.Put` | Deny | Deny | Allow (own tenant) | Allow (own tenant) | Deny | Route `tenantId` | `WhitePlate.Application/Tenants/EstablishmentSettingsHandler.cs:72`; atomic recheck `EstablishmentSettingsRepository.cs:23-30` | None |
| `EstablishmentSettingsController.PutLegalProfile` | Deny | Deny | Allow (own tenant) | Allow (own tenant) | Deny | Route `tenantId` | `WhitePlate.Application/Tenants/EstablishmentSettingsHandler.cs:42-58`; atomic recheck `EstablishmentSettingsRepository.cs:45-52` | None |
| `EstablishmentSettingsController.PutOpeningHours` | Deny | Deny | Allow (own tenant) | Allow (own tenant) | Deny | Route `tenantId` | `WhitePlate.Application/Tenants/EstablishmentSettingsHandler.cs:100`; atomic recheck `EstablishmentSettingsRepository.cs:23-30` | None |
| `EstablishmentSettingsController.PutPickupScheduling` | Deny | Deny | Allow (own tenant) | Allow (own tenant) | Deny | Route `tenantId` | `WhitePlate.Application/Tenants/EstablishmentSettingsHandler.cs:123`; atomic recheck `EstablishmentSettingsRepository.cs:23-30` | None |
| `KitchenHub.JoinRestaurant` | Deny | Allow (own tenant) | Allow (own tenant) | Allow (own tenant) | Deny | Hub argument `tenantId` | `WhitePlate.Api/Realtime/KitchenHub.cs:12-22`; `KitchenSubscriptionAccess.cs:9-11` (`kitchen.display`); per-event recheck `SignalRKitchenEventPublisher.cs:11-24`; hub `RequireAuthorization` `Program.cs:76-77` | SEC-01, SEC-05 |
| `KitchenHub.LeaveRestaurant` | Deny | Allow | Allow | Allow | Allow | Hub argument; caller's own connection only | `WhitePlate.Api/Realtime/KitchenHub.cs:26-30` | None |
| `MenuController.Get` | Allow | Allow | Allow | Allow | Allow | Host (one label under `Tenancy:BaseDomain`) | `WhitePlate.Api/Tenancy/TenantResolutionMiddleware.cs:12-37`; `TenantRepository.cs:14-17` (active tenant and organization); `CatalogRepository.cs:496-503` (published snapshot) | None |
| `MenuController.GetByRestaurantSlug` | Allow | Allow | Allow | Allow | Allow | Route `restaurantSlug` | `WhitePlate.Api/Controllers/MenuController.cs:24-31` (`[RequireTenantBySlug]`); `TenantResolutionMiddleware.cs:20-21`; `TenantRepository.cs:14-17` | None |
| `OrderEmailSettingsController.Get` | Deny | Deny | Allow (own tenant) | Allow (own tenant) | Deny | Route `tenantId` | `WhitePlate.Application/Tenants/OrderEmailSettings.cs:81` (`orders.manage`); `OrderEmailSettingsRepository.cs:11-12` (active tenant) | None |
| `OrderEmailSettingsController.Put` | Deny | Deny | Allow (own tenant) | Allow (own tenant) | Deny | Route `tenantId` | `WhitePlate.Application/Tenants/OrderEmailSettings.cs:89-99`; atomic recheck `OrderEmailSettingsRepository.cs:18-25` | None |
| `OrderingOperationsController.Get` | Deny | Allow (own tenant) | Allow (own tenant) | Allow (own tenant) | Deny | Route `tenantId` | `WhitePlate.Application/Tenants/OrderingOperations.cs:31` (`orders.manage` or `kitchen.display`); `OrderingOperationsRepository.cs:12-13` | None |
| `OrderingOperationsController.Put` | Deny | Deny | Allow (own tenant) | Allow (own tenant) | Deny | Route `tenantId` | `WhitePlate.Application/Tenants/OrderingOperations.cs:43`, `:71` (`orders.manage`); atomic recheck `OrderingOperationsRepository.cs:27` | None |
| `OrdersController.Create` | Allow | Allow | Allow | Allow | Allow | Host; product and option IDs in body | `WhitePlate.Api/Controllers/OrdersController.cs:48-79` (rate limit `:62-65`); `OrderRepository.cs:77-110` (active tenant, tenant-scoped catalog) | None |
| `OrdersController.CreateByRestaurantSlug` | Allow | Allow | Allow | Allow | Allow | Route `restaurantSlug`; IDs in body | `WhitePlate.Api/Controllers/OrdersController.cs:81-93`; `TenantResolutionMiddleware.cs:20-21`; `OrderRepository.cs:77-110` | None |
| `OrdersController.History` | Deny | Deny | Allow (own tenant) | Allow (own tenant) | Deny | Route `tenantId` | `WhitePlate.Application/Orders/ListOrdersQueryHandler.cs:44-45` (`orders.manage`); `OrderRepository.cs:426` | SEC-01 |
| `OrdersController.List` | Deny | Allow (own tenant) | Allow (own tenant) | Allow (own tenant) | Deny | Route `tenantId` | `WhitePlate.Application/Orders/ListOrdersQueryHandler.cs:18-19` (`orders.manage` or `kitchen.display`); `OrderRepository.cs:266` | SEC-01 |
| `OrdersController.Quote` | Allow | Allow | Allow | Allow | Allow | Host; product IDs in body | `WhitePlate.Api/Controllers/OrdersController.cs:23-39` (rate limit `:31-33`); `QuoteOrderQueryHandler.cs:15-18` | None |
| `OrdersController.QuoteBySlug` | Allow | Allow | Allow | Allow | Allow | Route `restaurantSlug` | `WhitePlate.Api/Controllers/OrdersController.cs:41-46`; `TenantResolutionMiddleware.cs:20-21` | None |
| `OrdersController.Track` | Allow | Allow | Allow | Allow | Allow | Host + route `orderId` plus per-order capability token | `WhitePlate.Infrastructure/Persistence/Repositories/OrderRepository.cs:504-532` (tenant + order, token expiry, fixed-time hash compare) | None |
| `OrdersController.TrackByRestaurantSlug` | Allow | Allow | Allow | Allow | Allow | Route `restaurantSlug` + `orderId` plus capability token | `WhitePlate.Api/Controllers/OrdersController.cs:110-119`; `OrderRepository.cs:504-532` | None |
| `OrdersController.UpdateStatus` | Deny | Allow (own tenant) | Allow (own tenant) | Allow (own tenant) | Deny | Route `tenantId` + `orderId` | `WhitePlate.Application/Orders/UpdateOrderStatusCommandHandler.cs:27-30` (cancel needs `orders.manage`; `kitchen.display` may advance status); `OrderRepository.cs:544-551` | SEC-01 |
| `OrganizationsController.Archive` | Deny | Deny | Deny | Allow (own tenant) | Deny | Route `organizationId` | `WhitePlate.Application/Organizations/SetOrganizationActiveCommandHandler.cs:13-15`; `OrganizationProvisioningRepository.cs:20-26` | SEC-02 |
| `OrganizationsController.ArchiveRole` | Deny | Deny | Deny | Allow (own tenant) | Deny | Route `organizationId` + `roleId` | `WhitePlate.Application/Organizations/OrganizationRolePermissionsHandler.cs:127-136` (owner; built-in and assigned roles refused) | None |
| `OrganizationsController.ChangeMemberRole` | Deny | Deny | Deny | Allow (own tenant) | Deny | Route `organizationId` + `memberId`; body `roleId` | `WhitePlate.Application/Organizations/ChangeRestaurantMemberRoleHandler.cs:15-24`; `RestaurantMembershipRoleRepository.cs:13-19` (member and role in the same organization) | SEC-02 |
| `OrganizationsController.Create` | Deny | Allow | Allow | Allow | Allow | None; caller becomes first owner | `WhitePlate.Application/Organizations/CreateOrganizationCommandHandler.cs:17` (verified email) | SEC-04 |
| `OrganizationsController.CreateInvitation` | Deny | Deny | Allow (own tenant) | Allow (own tenant) | Deny | Route `organizationId`; body `tenantId` + role ID | `WhitePlate.Application/Staff/CreateStaffInvitationCommandHandler.cs:20-37` (owner, or `staff.manage` on the target restaurant for restaurant roles only) | SEC-02, SEC-09 |
| `OrganizationsController.CreateRestaurant` | Deny | Deny | Deny | Allow (own tenant) | Deny | Route `organizationId` | `WhitePlate.Application/Tenants/CreateRestaurantCommandHandler.cs:20` | SEC-04 |
| `OrganizationsController.CreateRole` | Deny | Deny | Deny | Allow (own tenant) | Deny | Route `organizationId` | `WhitePlate.Application/Organizations/OrganizationRolePermissionsHandler.cs:101-102` | None |
| `OrganizationsController.GetAssignableRoles` | Deny | Deny | Allow (own tenant) | Allow (own tenant) | Deny | Route `organizationId` | `WhitePlate.Application/Organizations/OrganizationRolePermissionsHandler.cs:44-54` (owner or `staff.manage`); `StaffMembershipRepository.cs:57-72` | SEC-09 |
| `OrganizationsController.GetLegalProfile` | Deny | Deny | Deny | Allow (own tenant) | Deny | Route `organizationId` | `WhitePlate.Api/Controllers/OrganizationsController.cs:211-212`; `OrganizationProvisioningRepository.cs:20-26` | None |
| `OrganizationsController.GetRolePermissions` | Deny | Deny | Deny | Allow (own tenant) | Deny | Route `organizationId` | `WhitePlate.Application/Organizations/OrganizationRolePermissionsHandler.cs:27-28` | None |
| `OrganizationsController.List` | Deny | Allow | Allow | Allow | Allow | JWT `iss`/`sub` only | `WhitePlate.Infrastructure/Persistence/Repositories/OrganizationProvisioningRepository.cs:13-19` (owned only) | None |
| `OrganizationsController.ListInvitations` | Deny | Deny | Allow (own tenant) | Allow (own tenant) | Deny | Route `organizationId` | `WhitePlate.Infrastructure/Persistence/Repositories/OrganizationProvisioningRepository.cs:101-112`, `:148-166` (non-owners see only `staff.manage` restaurants, never owner invitations) | None |
| `OrganizationsController.ListMembers` | Deny | Deny | Allow (own tenant) | Allow (own tenant) | Deny | Route `organizationId` | `WhitePlate.Infrastructure/Persistence/Repositories/OrganizationProvisioningRepository.cs:40-55`, `:148-166` | None |
| `OrganizationsController.ListRestaurants` | Deny | Deny | Deny | Allow (own tenant) | Deny | Route `organizationId` | `WhitePlate.Infrastructure/Persistence/Repositories/OrganizationProvisioningRepository.cs:29-37` | None |
| `OrganizationsController.Rename` | Deny | Deny | Deny | Allow (own tenant) | Deny | Route `organizationId` | `WhitePlate.Application/Organizations/RenameOrganizationCommandHandler.cs:15-17` | None |
| `OrganizationsController.ReplaceRolePermissions` | Deny | Deny | Deny | Allow (own tenant) | Deny | Route `organizationId`; body role ID | `WhitePlate.Application/Organizations/OrganizationRolePermissionsHandler.cs:67-76` (owner; Owner role not editable) | None |
| `OrganizationsController.Restore` | Deny | Deny | Deny | Allow (own tenant) | Deny | Route `organizationId` | `WhitePlate.Application/Organizations/SetOrganizationActiveCommandHandler.cs:13-15` | SEC-02 |
| `OrganizationsController.RevokeInvitation` | Deny | Deny | Allow (own tenant) | Allow (own tenant) | Deny | Route `organizationId` + `invitationId` | `WhitePlate.Infrastructure/Persistence/Repositories/StaffInvitationRepository.cs:72-97` (owner, or `staff.manage` on the invitation's restaurant; pending only) | None |
| `OrganizationsController.UpdateLegalProfile` | Deny | Deny | Deny | Allow (own tenant) | Deny | Route `organizationId` | `WhitePlate.Api/Controllers/OrganizationsController.cs:225-230`; `OrganizationProvisioningRepository.cs:20-26` | None |
| `PickupSlotsController.Get` | Allow | Allow | Allow | Allow | Allow | Host | `WhitePlate.Api/Controllers/PickupSlotsController.cs:15-24`; `OrderRepository.cs:51-66` (active tenant; slot counts only) | None |
| `PickupSlotsController.GetByRestaurantSlug` | Allow | Allow | Allow | Allow | Allow | Route `restaurantSlug` | `WhitePlate.Api/Controllers/PickupSlotsController.cs:26-32`; `TenantResolutionMiddleware.cs:20-21` | None |
| `ProductPhotosController.List` | Deny | Deny | Allow (own tenant) | Allow (own tenant) | Deny | Route `tenantId` + `productId` | `WhitePlate.Application/Media/ProductPhotoService.cs:10-15` (`storefront.manage` via `BrandMediaService.cs:15-16`, product in tenant); `ProductPhotoRepository.cs:16-23` | SEC-01 |
| `ProductPhotosController.Preview` | Deny | Deny | Allow (own tenant) | Allow (own tenant) | Deny | Route `tenantId` + `productId` + `assetId` | `WhitePlate.Application/Media/ProductPhotoService.cs:58-66` | SEC-01 |
| `ProductPhotosController.Save` | Deny | Deny | Allow (own tenant) | Allow (own tenant) | Deny | Route `tenantId` + `productId`; asset IDs in body | `WhitePlate.Application/Media/ProductPhotoService.cs:39-53`; `ProductPhotoRepository.cs:25-38` (assets of that product only) | SEC-01 |
| `ProductPhotosController.Upload` | Deny | Deny | Allow (own tenant) | Allow (own tenant) | Deny | Route `tenantId` + `productId` | `WhitePlate.Api/Controllers/ProductPhotosController.cs:37` (before body read); `ProductPhotoService.cs:22` | SEC-01 |
| `Program.cs#GET /` | Allow | Allow | Allow | Allow | Allow | n/a | `WhitePlate.Api/Program.cs:64` (GET and HEAD, empty 200; manual row, the verifier does not enumerate `MapMethods`) | None |
| `Program.cs#GET /health/live` | Allow | Allow | Allow | Allow | Allow | n/a | `WhitePlate.Api/Program.cs:65-67` | None |
| `Program.cs#GET /health/ready` | Allow | Allow | Allow | Allow | Allow | n/a | `WhitePlate.Api/Program.cs:68-75` (generic status only) | None |
| `PublicBrandAssetsController.Get` | Allow | Allow | Allow | Allow | Allow | Host + route `slot` | `WhitePlate.Application/Media/BrandMediaService.cs:68-73`; `MediaRepository.cs:14-23` (asset of the published theme only) | None |
| `PublicBrandAssetsController.GetByRestaurantSlug` | Allow | Allow | Allow | Allow | Allow | Route `restaurantSlug` + `slot` | `WhitePlate.Api/Controllers/PublicBrandAssetsController.cs:27-33`; `MediaRepository.cs:14-23` | None |
| `PublicProductPhotosController.Get` | Allow | Allow | Allow | Allow | Allow | Host + route `productId` + `assetId` + `size` | `WhitePlate.Application/Media/ProductPhotoService.cs:58-66`; `ProductPhotoRepository.cs:11-14` (active asset of a visible, non-archived product) | None |
| `PublicProductPhotosController.GetByRestaurantSlug` | Allow | Allow | Allow | Allow | Allow | Route `restaurantSlug` + IDs + `size` | `WhitePlate.Api/Controllers/PublicProductPhotosController.cs:24-31`; `ProductPhotoService.cs:58-66` | None |
| `PublicThemeController.Get` | Allow | Allow | Allow | Allow | Allow | Host | `WhitePlate.Application/Tenants/ThemePublication.cs:65-71` (published snapshot only); `ThemePublicationRepository.cs:20-21` | None |
| `PublicThemeController.GetByRestaurantSlug` | Allow | Allow | Allow | Allow | Allow | Route `restaurantSlug` | `WhitePlate.Api/Controllers/PublicThemeController.cs:27-31`; `ThemePublication.cs:65-71` | None |
| `StaffInvitationsController.Accept` | Deny | Allow | Allow | Allow | Allow | Invitation token plus verified JWT email | `WhitePlate.Infrastructure/Persistence/Repositories/StaffInvitationRepository.cs:26-58`; `WhitePlate.Domain/Identity/StaffInvitation.cs:78-86` | SEC-02, SEC-09 |
| `StripeConnectController.GetStatus` | Deny | Deny | Deny | Allow (own tenant) | Deny | Route `tenantId` | `WhitePlate.Application/Payments/StripeConnectHandler.cs:22-26` (`billing.manage`; dashboard link for owners only `:77`) | None |
| `StripeConnectController.OAuthCallback` | Allow | Allow | Allow | Allow | Allow | Query `state` (bound server-side to tenant and initiating owner) | `WhitePlate.Api/Controllers/StripeConnectController.cs:36-53`; `StripeConnectHandler.cs:102-138` (single-use state, owner recheck `:115-116`); `StripeConnectRepository.cs:34-49`, `:51-59` (no overwrite of a connected tenant or reuse of an account) | SEC-10 |
| `StripeConnectController.Receive` | Allow | Allow | Allow | Allow | Allow | Stripe signature; account ID from verified event | `WhitePlate.Api/Controllers/StripeConnectController.cs:58-83`; `StripeConnectProvider.cs:100-122`; `StripeConnectRepository.cs:102-143` | None |
| `StripeConnectController.StartOAuth` | Deny | Deny | Deny | Allow (own tenant) | Deny | Route `tenantId` | `WhitePlate.Application/Payments/StripeConnectHandler.cs:83-89` (organization owner only; refuses when already connected) | SEC-10 |
| `TenantCatalogController.ApproveTranslation` | Deny | Deny | Allow (own tenant) | Allow (own tenant) | Deny | Route `tenantId` + `reviewId` | `WhitePlate.Application/Catalog/CatalogTranslationWorkflow.cs:98-100` (`catalog.manage`); `CatalogTranslationWorkflowRepository.cs:103-104` | SEC-01 |
| `TenantCatalogController.ArchiveCategory` | Deny | Deny | Allow (own tenant) | Allow (own tenant) | Deny | Route `tenantId` + `categoryId` | `WhitePlate.Application/Catalog/CatalogManagementCommandHandler.cs:119-121`, `:177-180`; `CatalogRepository.cs:248` | SEC-01 |
| `TenantCatalogController.ArchiveOption` | Deny | Deny | Allow (own tenant) | Allow (own tenant) | Deny | Route `tenantId` + `optionId` | `WhitePlate.Application/Catalog/CatalogManagementCommandHandler.cs:180`; `CatalogRepository.cs:323` | SEC-01 |
| `TenantCatalogController.ArchiveOptionGroup` | Deny | Deny | Allow (own tenant) | Allow (own tenant) | Deny | Route `tenantId` + `groupId` | `WhitePlate.Application/Catalog/CatalogManagementCommandHandler.cs:180`; `CatalogRepository.cs:299` | SEC-01 |
| `TenantCatalogController.ArchiveProduct` | Deny | Deny | Allow (own tenant) | Allow (own tenant) | Deny | Route `tenantId` + `productId` | `WhitePlate.Application/Catalog/CatalogManagementCommandHandler.cs:180`; `CatalogRepository.cs:267` | SEC-01 |
| `TenantCatalogController.CreateCategory` | Deny | Deny | Allow (own tenant) | Allow (own tenant) | Deny | Route `tenantId` | `WhitePlate.Application/Catalog/CreateCategoryCommandHandler.cs:20-21` | SEC-01 |
| `TenantCatalogController.CreateDiscount` | Deny | Deny | Allow (own tenant) | Allow (own tenant) | Deny | Route `tenantId` | `WhitePlate.Application/Catalog/CreateCatalogConfigurationHandlers.cs:55` (`discounts.manage`) | SEC-01 |
| `TenantCatalogController.CreateOption` | Deny | Deny | Allow (own tenant) | Allow (own tenant) | Deny | Route `tenantId` + `groupId` | `WhitePlate.Application/Catalog/CreateCatalogConfigurationHandlers.cs:38-40` | SEC-01 |
| `TenantCatalogController.CreateOptionGroup` | Deny | Deny | Allow (own tenant) | Allow (own tenant) | Deny | Route `tenantId` + `productId` | `WhitePlate.Application/Catalog/CreateCatalogConfigurationHandlers.cs:21-23` | SEC-01 |
| `TenantCatalogController.CreateProduct` | Deny | Deny | Allow (own tenant) | Allow (own tenant) | Deny | Route `tenantId`; body `categoryId` | `WhitePlate.Application/Catalog/CreateProductCommandHandler.cs:22-24` | SEC-01 |
| `TenantCatalogController.DeactivateDiscount` | Deny | Deny | Allow (own tenant) | Allow (own tenant) | Deny | Route `tenantId` + `discountId` | `WhitePlate.Application/Catalog/CatalogManagementCommandHandler.cs:173-180` (`catalog.manage`, not `discounts.manage`); `CatalogRepository.cs:435-439` | SEC-08, SEC-01 |
| `TenantCatalogController.DeleteTranslationGlossaryTerm` | Deny | Deny | Allow (own tenant) | Allow (own tenant) | Deny | Route `tenantId` + `termId` | `WhitePlate.Application/Catalog/CatalogTranslationWorkflow.cs:163`; `CatalogTranslationWorkflowRepository.cs:211` | SEC-01 |
| `TenantCatalogController.DiscardCatalog` | Deny | Deny | Allow (own tenant) | Allow (own tenant) | Deny | Route `tenantId` | `WhitePlate.Application/Catalog/CatalogPublicationCommandHandler.cs:43`; `CatalogPublicationRepository.cs:80` | SEC-01 |
| `TenantCatalogController.GetCatalog` | Deny | Deny | Allow (own tenant) | Allow (own tenant) | Deny | Route `tenantId` | `WhitePlate.Application/Catalog/GetManagementCatalogQueryHandler.cs:16-26` (catalog or discount sections per permission); `CatalogRepository.cs:86` | SEC-01 |
| `TenantCatalogController.GetCatalogHistory` | Deny | Deny | Allow (own tenant) | Allow (own tenant) | Deny | Route `tenantId` | `WhitePlate.Application/Catalog/CatalogPublicationCommandHandler.cs:14`; `CatalogPublicationRepository.cs:37-47` | SEC-01 |
| `TenantCatalogController.GetMenuLanguages` | Deny | Deny | Allow (own tenant) | Allow (own tenant) | Deny | Route `tenantId` | `WhitePlate.Application/Catalog/MenuLanguageSettings.cs:49` | SEC-01 |
| `TenantCatalogController.GetProductAvailability` | Deny | Allow (own tenant) | Allow (own tenant) | Allow (own tenant) | Deny | Route `tenantId` | `WhitePlate.Application/Catalog/GetProductAvailabilityQueryHandler.cs:17-19`; `CreateCategoryCommandHandler.cs:45-48` (`catalog.manage` or `kitchen.display`); `CatalogRepository.cs:13` | SEC-01 |
| `TenantCatalogController.GetRestaurantDescriptionTranslations` | Deny | Deny | Allow (own tenant) | Allow (own tenant) | Deny | Route `tenantId` | `WhitePlate.Application/Catalog/MenuLanguageSettings.cs:18` | SEC-01 |
| `TenantCatalogController.GetTranslationGlossary` | Deny | Deny | Allow (own tenant) | Allow (own tenant) | Deny | Route `tenantId` | `WhitePlate.Application/Catalog/CatalogTranslationWorkflow.cs:126`; `CatalogTranslationWorkflowRepository.cs:155` | SEC-01 |
| `TenantCatalogController.GetTranslationReviews` | Deny | Deny | Allow (own tenant) | Allow (own tenant) | Deny | Route `tenantId` | `WhitePlate.Application/Catalog/CatalogTranslationWorkflow.cs:83-85`; `CatalogTranslationWorkflowRepository.cs:69` | SEC-01 |
| `TenantCatalogController.PublishCatalog` | Deny | Deny | Allow (own tenant) | Allow (own tenant) | Deny | Route `tenantId` | `WhitePlate.Application/Catalog/CatalogPublicationCommandHandler.cs:32`; `CatalogPublicationRepository.cs:50-56` (locked head, version check) | SEC-01 |
| `TenantCatalogController.RejectTranslation` | Deny | Deny | Allow (own tenant) | Allow (own tenant) | Deny | Route `tenantId` + `reviewId` | `WhitePlate.Application/Catalog/CatalogTranslationWorkflow.cs:98-100`; `CatalogTranslationWorkflowRepository.cs:103-104` | SEC-01 |
| `TenantCatalogController.ReorderCatalog` | Deny | Deny | Allow (own tenant) | Allow (own tenant) | Deny | Route `tenantId`; body parent, category and ordered IDs | `WhitePlate.Application/Catalog/CatalogManagementCommandHandler.cs:151-155` (`discounts.manage`, not `catalog.manage`); `CatalogRepository.cs:347-400` (every ID tenant-scoped) | SEC-08, SEC-01 |
| `TenantCatalogController.RestoreCatalogVersion` | Deny | Deny | Allow (own tenant) | Allow (own tenant) | Deny | Route `tenantId` + `version` | `WhitePlate.Application/Catalog/CatalogPublicationCommandHandler.cs:54`; `CatalogPublicationRepository.cs:107` | SEC-01 |
| `TenantCatalogController.RestoreCategory` | Deny | Deny | Allow (own tenant) | Allow (own tenant) | Deny | Route `tenantId` + `categoryId` | `WhitePlate.Application/Catalog/CatalogManagementCommandHandler.cs:123-125`, `:180`; `CatalogRepository.cs:289` | SEC-01 |
| `TenantCatalogController.RestoreOption` | Deny | Deny | Allow (own tenant) | Allow (own tenant) | Deny | Route `tenantId` + `optionId` | `WhitePlate.Application/Catalog/CatalogManagementCommandHandler.cs:180`; `CatalogRepository.cs:333` | SEC-01 |
| `TenantCatalogController.RestoreOptionGroup` | Deny | Deny | Allow (own tenant) | Allow (own tenant) | Deny | Route `tenantId` + `groupId` | `WhitePlate.Application/Catalog/CatalogManagementCommandHandler.cs:180`; `CatalogRepository.cs:310` | SEC-01 |
| `TenantCatalogController.RestoreProduct` | Deny | Deny | Allow (own tenant) | Allow (own tenant) | Deny | Route `tenantId` + `productId` | `WhitePlate.Application/Catalog/CatalogManagementCommandHandler.cs:180`; `CatalogRepository.cs:278` | SEC-01 |
| `TenantCatalogController.SaveTranslationGlossaryTerm` | Deny | Deny | Allow (own tenant) | Allow (own tenant) | Deny | Route `tenantId`; body term ID | `WhitePlate.Application/Catalog/CatalogTranslationWorkflow.cs:144`; `CatalogTranslationWorkflowRepository.cs:173` | SEC-01 |
| `TenantCatalogController.SetCategoryVisibility` | Deny | Deny | Allow (own tenant) | Allow (own tenant) | Deny | Route `tenantId` + `categoryId` | `WhitePlate.Application/Catalog/CatalogManagementCommandHandler.cs:115-117`, `:180`; `CatalogRepository.cs:151` | SEC-01 |
| `TenantCatalogController.UpdateCategory` | Deny | Deny | Allow (own tenant) | Allow (own tenant) | Deny | Route `tenantId` + `categoryId` | `WhitePlate.Application/Catalog/CatalogManagementCommandHandler.cs:31`; `CatalogRepository.cs:162` | SEC-01 |
| `TenantCatalogController.UpdateDiscount` | Deny | Deny | Allow (own tenant) | Allow (own tenant) | Deny | Route `tenantId` + `discountId` | `WhitePlate.Application/Catalog/CatalogManagementCommandHandler.cs:104` (`discounts.manage`); `CatalogRepository.cs:236` | SEC-01 |
| `TenantCatalogController.UpdateMenuLanguages` | Deny | Deny | Allow (own tenant) | Allow (own tenant) | Deny | Route `tenantId` | `WhitePlate.Application/Catalog/MenuLanguageSettings.cs:60` | SEC-01 |
| `TenantCatalogController.UpdateOption` | Deny | Deny | Allow (own tenant) | Allow (own tenant) | Deny | Route `tenantId` + `optionId` | `WhitePlate.Application/Catalog/CatalogManagementCommandHandler.cs:90`; `CatalogRepository.cs:224` | SEC-01 |
| `TenantCatalogController.UpdateOptionGroup` | Deny | Deny | Allow (own tenant) | Allow (own tenant) | Deny | Route `tenantId` + `groupId` | `WhitePlate.Application/Catalog/CatalogManagementCommandHandler.cs:76`; `CatalogRepository.cs:211` | SEC-01 |
| `TenantCatalogController.UpdateProduct` | Deny | Deny | Allow (own tenant) | Allow (own tenant) | Deny | Route `tenantId` + `productId`; body `categoryId` | `WhitePlate.Application/Catalog/CatalogManagementCommandHandler.cs:45`; `CatalogRepository.cs:181-187` (product and target category in tenant) | SEC-01 |
| `TenantCatalogController.UpdateProductAvailability` | Deny | Allow (own tenant) | Allow (own tenant) | Allow (own tenant) | Deny | Route `tenantId` + `productId` | `WhitePlate.Application/Catalog/CatalogManagementCommandHandler.cs:64` (`catalog.manage` or `kitchen.display`); `CatalogRepository.cs:34-39` | SEC-01 |
| `TenantCatalogController.UpdateRestaurantDescriptionTranslation` | Deny | Deny | Allow (own tenant) | Allow (own tenant) | Deny | Route `tenantId` + `locale` | `WhitePlate.Application/Catalog/MenuLanguageSettings.cs:29` | SEC-01 |
| `TenantCatalogController.UpdateTranslation` | Deny | Deny | Allow (own tenant) | Allow (own tenant) | Deny | Route `tenantId` + `entityType` + `entityId` | `WhitePlate.Application/Catalog/CatalogTranslationWorkflow.cs:62`; `CatalogTranslationWorkflowRepository.cs:15` | SEC-01 |
| `TenantsController.Get` | Allow | Allow | Allow | Allow | Allow | Host | `WhitePlate.Api/Tenancy/TenantResolutionMiddleware.cs:12-37`; `TenantRepository.cs:14-17`; published locales only `TenantsController.cs:42-51` | None |
| `TenantsController.GetEstablishment` | Allow | Allow | Allow | Allow | Allow | Host | `WhitePlate.Api/Controllers/TenantsController.cs:15-26`; `EstablishmentSettingsRepository.cs:11-15` | None |
| `TenantsController.GetEstablishmentByRestaurantSlug` | Allow | Allow | Allow | Allow | Allow | Route `restaurantSlug` | `WhitePlate.Api/Controllers/TenantsController.cs:28-35`; `TenantResolutionMiddleware.cs:20-21` | None |
| `ThemePublicationController.Get` | Deny | Deny | Allow (own tenant) | Allow (own tenant) | Deny | Route `tenantId` | `WhitePlate.Application/Tenants/ThemePublication.cs:33` (`storefront.manage`); `ThemePublicationRepository.cs:14-18` | None |
| `ThemePublicationController.Post` | Deny | Deny | Allow (own tenant) | Allow (own tenant) | Deny | Route `tenantId` | `WhitePlate.Application/Tenants/ThemePublication.cs:43`; recheck in a serializable, row-locked transaction `ThemePublicationRepository.cs:26-44` | None |
| `ThemeSettingsController.Get` | Deny | Deny | Allow (own tenant) | Allow (own tenant) | Deny | Route `tenantId` | `WhitePlate.Application/Tenants/ThemeSettingsHandler.cs:17`; `ThemeSettingsRepository.cs:11-12` | None |
| `ThemeSettingsController.Palette` | Deny | Deny | Allow (own tenant) | Allow (own tenant) | Deny | Route `tenantId` | `WhitePlate.Application/Tenants/ThemeSettingsHandler.cs:45-53` (`BrandMediaService` list and preview, `storefront.manage`) | None |
| `ThemeSettingsController.Put` | Deny | Deny | Allow (own tenant) | Allow (own tenant) | Deny | Route `tenantId` | `WhitePlate.Application/Tenants/ThemeSettingsHandler.cs:25-35`; atomic recheck `ThemeSettingsRepository.cs:11-25` | None |
| `app/.well-known/openid-configuration/route.ts#GET` | Allow | Allow | Allow | Allow | Allow | None (static issuer metadata) | `app/.well-known/openid-configuration/route.ts:5-17` (issuer and JWKS URI only) | None |
| `app/api/auth/[...all]/route.ts#GET` | Allow | Allow | Allow | Allow | Allow | None; own Better Auth session cookie | `app/api/auth/[...all]/route.ts:10-11` (`/token` blocked); `lib/auth.ts:56-69` (trusted origin, rate limits) | SEC-06 |
| `app/api/auth/[...all]/route.ts#POST` | Allow | Allow | Allow | Allow | Allow | None; own Better Auth session cookie | `lib/auth.ts:56-69` (trusted origin, rate limits); `lib/auth.ts:81-99` (verified email required) | None |
| `app/api/brand-assets/route.ts#DELETE` | Deny | Deny | Allow (own tenant) | Allow (own tenant) | Deny | Query `tenantId` + `slot`; `If-Match` asset ID | `app/api/brand-assets/route.ts:107-118` (exact Origin, selectors); `lib/api/index.ts:6-20` (verified session, user token); API `WhitePlate.Application/Media/BrandMediaService.cs:47` | SEC-01 |
| `app/api/brand-assets/route.ts#GET` | Deny | Deny | Allow (own tenant) | Allow (own tenant) | Deny | Query `tenantId` (+ `assetId` for a preview) | `app/api/brand-assets/route.ts:46-68`; `lib/api/index.ts:6-20`; API `BrandMediaService.cs:20`, `:63` | SEC-01 |
| `app/api/brand-assets/route.ts#POST` | Deny | Deny | Allow (own tenant) | Allow (own tenant) | Deny | Query `tenantId` + `slot` | `app/api/brand-assets/route.ts:70-96` (exact Origin `:73-74`, list precheck `:78-80`, size cap); `lib/api/index.ts:6-20`; API `WhitePlate.Api/Controllers/BrandAssetsController.cs:39` | SEC-01 |
| `app/api/brand-assets/route.ts#PUT` | Deny | Deny | Allow (own tenant) | Allow (own tenant) | Deny | Query `tenantId` + `slot`; asset ID in body | `app/api/brand-assets/route.ts:99-141`; `lib/api/index.ts:6-20`; API `BrandMediaService.cs:47-53`, `MediaRepository.cs:54-58` | SEC-01 |
| `app/api/catalog-history/route.ts#GET` | Deny | Deny | Allow (own tenant) | Allow (own tenant) | Deny | Query `tenantId` | `app/api/catalog-history/route.ts:18-41` (UUID, single selector, `catalog.manage` precheck via `/me`, 403); `lib/api/index.ts:6-20`; API `CatalogPublicationCommandHandler.cs:14` | SEC-01 |
| `app/api/establishment-settings/route.ts#GET` | Deny | Deny | Allow (own tenant) | Allow (own tenant) | Deny | Query `tenantId` | `app/api/establishment-settings/route.ts:4-15`; `lib/api/index.ts:6-20`; API `EstablishmentSettingsHandler.cs:16` | None |
| `app/api/kitchen/dashboard/metrics/route.ts#GET` | Deny | Allow (own tenant) | Allow (own tenant) | Allow (own tenant) | Deny | Query `tenantId` | `app/api/kitchen/dashboard/metrics/route.ts:15-32` (membership and permission precheck via `/me`, 403); `lib/api/index.ts:6-20`; API `GetDashboardMetricsQueryHandler.cs:19-25` | None |
| `app/api/kitchen/dashboard/ordering-operations/route.ts#GET` | Deny | Deny | Allow (own tenant) | Allow (own tenant) | Deny | Query `tenantId` | `app/api/kitchen/dashboard/ordering-operations/route.ts:13-45` (`orders.manage` precheck, stricter than the API, which also admits `kitchen.display`); `lib/api/index.ts:6-20`; API `OrderingOperations.cs:31` | None |
| `app/api/kitchen/orders/route.ts#GET` | Deny | Allow (own tenant) | Allow (own tenant) | Allow (own tenant) | Deny | Query `tenantId` (+ `status`, `cursor`) | `app/api/kitchen/orders/route.ts:19-43` (membership precheck via `/me`, 403); `lib/api/index.ts:6-20`; API `ListOrdersQueryHandler.cs:18-19` | SEC-01 |
| `app/api/kitchen/signalr-token/route.ts#POST` | Deny | Allow | Allow | Allow | Allow | None; account session only (no tenant in the request) | `app/api/kitchen/signalr-token/route.ts:24-47` (exact Origin, verified session, caller's own JWT); tenant checked at `WhitePlate.Api/Realtime/KitchenHub.cs:18-20` | SEC-05, SEC-06 |
| `app/api/organization-analytics/route.ts#GET` | Deny | Deny | Allow (own tenant) | Allow (own tenant) | Deny | Query `restaurant` (`all` or tenant ID) | `app/api/organization-analytics/route.ts:12-31`; `services/analytics.ts:41-61` (`analytics.view` filter via `/me`); `lib/api/index.ts:6-20`; API `GetAnalyticsMetricsQueryHandler.cs:19-22` (`orders.manage`) | SEC-08 |
| `app/api/product-photos/route.ts#GET` | Deny | Deny | Allow (own tenant) | Allow (own tenant) | Deny | Query `tenantId` + `productId` (+ `assetId`, `size`) | `app/api/product-photos/route.ts:49-75`; `lib/api/index.ts:6-20`; API `ProductPhotoService.cs:10-15`, `:58-66` | SEC-01 |
| `app/api/product-photos/route.ts#POST` | Deny | Deny | Allow (own tenant) | Allow (own tenant) | Deny | Query `tenantId` + `productId` | `app/api/product-photos/route.ts:77-104` (exact Origin, list precheck, size cap); `lib/api/index.ts:6-20`; API `WhitePlate.Api/Controllers/ProductPhotosController.cs:37` | SEC-01 |
| `app/api/product-photos/route.ts#PUT` | Deny | Deny | Allow (own tenant) | Allow (own tenant) | Deny | Query `tenantId` + `productId`; asset IDs in body | `app/api/product-photos/route.ts:107-138`; `lib/api/index.ts:6-20`; API `ProductPhotoService.cs:39-53`, `ProductPhotoRepository.cs:25-38` | SEC-01 |
| `app/api/public/analytics-withdrawal/route.ts#POST` | Allow | Allow | Allow | Allow | Allow | Body `tenantId` + email | `app/api/public/analytics-withdrawal/route.ts:5-41` (UUID and length checks, tokenless public client, no Origin check); API `AnalyticsController.cs:36-56` | None |
| `app/api/public/brand-assets/[slot]/route.ts#GET` | Allow | Allow | Allow | Allow | Allow | Host, or `restaurantSlug` query only on the configured path host | `app/api/public/brand-assets/[slot]/route.ts:8-58` (tokenless); `lib/storefront-preview-routing.ts:74-132`; API `MediaRepository.cs:14-23` | None |
| `app/api/public/establishment/route.ts#GET` | Allow | Allow | Allow | Allow | Allow | Host, or `restaurantSlug` on the path host | `app/api/public/establishment/route.ts:4-24`; `services/public-establishment.ts:12-39` (tokenless) | None |
| `app/api/public/order-quote/route.ts#POST` | Allow | Allow | Allow | Allow | Allow | Host, or `restaurantSlug` on the path host; product IDs in body | `app/api/public/order-quote/route.ts:7-29` (same origin when `Origin` is present, 16 KiB cap); `services/order-quote.ts:14-51` (tokenless); API `OrdersController.cs:23-39` | None |
| `app/api/public/orders/[orderId]/tracking/route.ts#POST` | Allow | Allow | Allow | Allow | Allow | Host or path slug + route `orderId` + capability token in body | `app/api/public/orders/[orderId]/tracking/route.ts:19-23` (same origin), `:44-54` (token shape), `:64-96` (tokenless); API `OrderRepository.cs:504-532` | None |
| `app/api/public/pickup-slots/route.ts#GET` | Allow | Allow | Allow | Allow | Allow | Host, or `restaurantSlug` on the path host | `app/api/public/pickup-slots/route.ts:4-18`; `services/public-pickup-slots.ts:11-39` (tokenless) | None |
| `app/api/public/product-photos/[productId]/[assetId]/[size]/route.ts#GET` | Allow | Allow | Allow | Allow | Allow | Host or path slug + route `productId` + `assetId` + `size` | `app/api/public/product-photos/[productId]/[assetId]/[size]/route.ts:15-60` (UUIDs, size enum, tokenless); API `ProductPhotoService.cs:58-66` | None |
| `app/api/theme-publication/route.ts#GET` | Deny | Deny | Allow (own tenant) | Allow (own tenant) | Deny | Query `tenantId` (only parameter) | `app/api/theme-publication/route.ts:8-14`, `:31-39`; `lib/api/index.ts:6-20`; API `ThemePublication.cs:33` | None |
| `app/api/theme-publication/route.ts#POST` | Deny | Deny | Allow (own tenant) | Allow (own tenant) | Deny | Query `tenantId` | `app/api/theme-publication/route.ts:41-69` (exact Origin, `If-Match`, 4 KiB body); `lib/api/index.ts:6-20`; API `ThemePublicationRepository.cs:26-44` | None |
| `app/api/theme-settings/route.ts#GET` | Deny | Deny | Allow (own tenant) | Allow (own tenant) | Deny | Query `tenantId` (+ `palette`) | `app/api/theme-settings/route.ts:13-35`; `lib/api/index.ts:6-20`; API `ThemeSettingsHandler.cs:17`, `:45-53` | None |
| `app/api/theme-settings/route.ts#PUT` | Deny | Deny | Allow (own tenant) | Allow (own tenant) | Deny | Query `tenantId`; theme in body | `app/api/theme-settings/route.ts:37-68` (exact Origin `:41-42`, 8 KiB body, theme parser); `lib/api/index.ts:6-20`; API `ThemeSettingsHandler.cs:25-35` | None |
| `actions/catalog-publication.ts#discardCatalogDraftAction` | Deny | Deny | Allow (own tenant) | Allow (own tenant) | Deny | Body `tenantId` | `actions/catalog-publication.ts:14-27`, `:39-47` (UUID, positive version); server-action origin check plus `lib/api/index.ts:6-20`; API `CatalogPublicationCommandHandler.cs:43` | SEC-01 |
| `actions/catalog-publication.ts#publishCatalogAction` | Deny | Deny | Allow (own tenant) | Allow (own tenant) | Deny | Body `tenantId` | `actions/catalog-publication.ts:14-37`; server-action origin check plus `lib/api/index.ts:6-20`; API `CatalogPublicationCommandHandler.cs:32` | SEC-01 |
| `actions/catalog-publication.ts#restoreCatalogVersionAction` | Deny | Deny | Allow (own tenant) | Allow (own tenant) | Deny | Body `tenantId` + `sourceVersion` | `actions/catalog-publication.ts:49-66`; server-action origin check plus `lib/api/index.ts:6-20`; API `CatalogPublicationCommandHandler.cs:54` | SEC-01 |
| `actions/catalog.ts#archiveCatalogItemAction` | Deny | Deny | Allow (own tenant) | Allow (own tenant) | Deny | Form `tenantId` + `id` + `entityType` | `actions/catalog.ts:101-107`; `lib/validation/catalog-input.ts:333-346`; server-action origin check plus `lib/api/index.ts:6-20`; API `CatalogManagementCommandHandler.cs:180` | SEC-01 |
| `actions/catalog.ts#deactivateDiscountAction` | Deny | Deny | Allow (own tenant) | Allow (own tenant) | Deny | Form `tenantId` + `id` | `actions/catalog.ts:93-99`; `lib/validation/catalog-input.ts:308-316`; server-action origin check plus `lib/api/index.ts:6-20`; API `CatalogManagementCommandHandler.cs:173-180` | SEC-08, SEC-01 |
| `actions/catalog.ts#reorderCatalogAction` | Deny | Deny | Allow (own tenant) | Allow (own tenant) | Deny | Form `tenantId` + parent, category and ordered IDs | `actions/catalog.ts:138-144`; `lib/validation/catalog-input.ts:274-300` (all IDs UUID); server-action origin check plus `lib/api/index.ts:6-20`; API `CatalogManagementCommandHandler.cs:151-155` | SEC-08, SEC-01 |
| `actions/catalog.ts#restoreCatalogItemAction` | Deny | Deny | Allow (own tenant) | Allow (own tenant) | Deny | Form `tenantId` + `id` + `entityType` | `actions/catalog.ts:120-136` (UUIDs, entity enum); server-action origin check plus `lib/api/index.ts:6-20`; API `CatalogManagementCommandHandler.cs:180` | SEC-01 |
| `actions/catalog.ts#restoreProductAction` | Deny | Deny | Allow (own tenant) | Allow (own tenant) | Deny | Form `tenantId` + `id` | `actions/catalog.ts:109-118`; server-action origin check plus `lib/api/index.ts:6-20`; API `CatalogManagementCommandHandler.cs:180`, `CatalogRepository.cs:278` | SEC-01 |
| `actions/catalog.ts#saveCategoryAction` | Deny | Deny | Allow (own tenant) | Allow (own tenant) | Deny | Form `tenantId` (+ `id`) | `actions/catalog.ts:55-61`; `lib/validation/catalog-input.ts:25-52`; server-action origin check plus `lib/api/index.ts:6-20`; API `CreateCategoryCommandHandler.cs:20`, `CatalogManagementCommandHandler.cs:31` | SEC-01 |
| `actions/catalog.ts#saveDiscountAction` | Deny | Deny | Allow (own tenant) | Allow (own tenant) | Deny | Form `tenantId` (+ `id`) | `actions/catalog.ts:85-91`; `lib/validation/discount-input.ts:53-55`; server-action origin check plus `lib/api/index.ts:6-20`; API `CreateCatalogConfigurationHandlers.cs:55`, `CatalogManagementCommandHandler.cs:104` | SEC-01 |
| `actions/catalog.ts#saveOptionAction` | Deny | Deny | Allow (own tenant) | Allow (own tenant) | Deny | Form `tenantId` + `groupId` (+ `id`) | `actions/catalog.ts:79-83`; `lib/validation/catalog-input.ts:249-271`; server-action origin check plus `lib/api/index.ts:6-20`; API `CreateCatalogConfigurationHandlers.cs:38-40`, `CatalogManagementCommandHandler.cs:90` | SEC-01 |
| `actions/catalog.ts#saveOptionGroupAction` | Deny | Deny | Allow (own tenant) | Allow (own tenant) | Deny | Form `tenantId` + `productId` (+ `id`) | `actions/catalog.ts:71-77`; `lib/validation/catalog-input.ts:213-240`; server-action origin check plus `lib/api/index.ts:6-20`; API `CreateCatalogConfigurationHandlers.cs:21-23`, `CatalogManagementCommandHandler.cs:76` | SEC-01 |
| `actions/catalog.ts#saveProductAction` | Deny | Deny | Allow (own tenant) | Allow (own tenant) | Deny | Form `tenantId` (+ `id`) + `categoryId` | `actions/catalog.ts:63-69`; `lib/validation/catalog-input.ts:149-170`; server-action origin check plus `lib/api/index.ts:6-20`; API `CreateProductCommandHandler.cs:22-24`, `CatalogRepository.cs:181-187` | SEC-01 |
| `actions/catalog.ts#setCategoryVisibilityAction` | Deny | Deny | Allow (own tenant) | Allow (own tenant) | Deny | Form `tenantId` + `id` | `actions/catalog.ts:31-43`; server-action origin check plus `lib/api/index.ts:6-20`; API `CatalogManagementCommandHandler.cs:115-117`, `CatalogRepository.cs:151` | SEC-01 |
| `actions/catalog.ts#setProductAvailabilityAction` | Deny | Allow (own tenant) | Allow (own tenant) | Allow (own tenant) | Deny | Form `tenantId` + `id` | `actions/catalog.ts:45-53`; `lib/validation/catalog-input.ts:185-210`; server-action origin check plus `lib/api/index.ts:6-20`; API `CatalogManagementCommandHandler.cs:64` | SEC-01 |
| `actions/checkout.ts#checkoutGuestOrder` | Allow | Allow | Allow | Allow | Allow | Host or path slug; product and option IDs in body | `actions/checkout.ts:13-27` (exact same origin); `lib/checkout/order-client.ts:17-48` (Host- or slug-derived, `public: true`, no user token); API `WhitePlate.Api/Controllers/OrdersController.cs:48-93` | None |
| `actions/establishment-settings.ts#saveEstablishmentSettingsAction` | Deny | Deny | Allow (own tenant) | Allow (own tenant) | Deny | Body `tenantId` | `actions/establishment-settings.ts:64-72`; `lib/validation/establishment-settings.ts:242-247`; server-action origin check plus `lib/api/index.ts:6-20`; API `EstablishmentSettingsHandler.cs:72`, `EstablishmentSettingsRepository.cs:23-30` | None |
| `actions/establishment-settings.ts#saveOpeningHoursAction` | Deny | Deny | Allow (own tenant) | Allow (own tenant) | Deny | Body `tenantId` (string only, not UUID-checked) | `actions/establishment-settings.ts:17-38`; server-action origin check plus `lib/api/index.ts:6-20`; API `EstablishmentSettingsHandler.cs:100`, `EstablishmentSettingsRepository.cs:23-30` | SEC-07 |
| `actions/establishment-settings.ts#savePickupSchedulingAction` | Deny | Deny | Allow (own tenant) | Allow (own tenant) | Deny | Body `tenantId` (hex and dash only) | `actions/establishment-settings.ts:40-62` (`/^[0-9a-f-]{36}$/i` at `:51` keeps one path segment); server-action origin check plus `lib/api/index.ts:6-20`; API `EstablishmentSettingsHandler.cs:123` | None |
| `actions/establishment-settings.ts#saveTenantLegalProfileAction` | Deny | Deny | Allow (own tenant) | Allow (own tenant) | Deny | Body `tenantId` (hex and dash only) | `actions/establishment-settings.ts:74-115` (`:86`); server-action origin check plus `lib/api/index.ts:6-20`; API `EstablishmentSettingsHandler.cs:42-58`, `EstablishmentSettingsRepository.cs:45-52` | None |
| `actions/order-email-settings.ts#saveOrderEmailSettingsAction` | Deny | Deny | Allow (own tenant) | Allow (own tenant) | Deny | Body `tenantId` | `actions/order-email-settings.ts:6-35` (UUID `:19`); server-action origin check plus `lib/api/index.ts:6-20`; API `OrderEmailSettings.cs:89-99` | None |
| `actions/ordering-operations.ts#updateOrderingOperationsAction` | Deny | Deny | Allow (own tenant) | Allow (own tenant) | Deny | Body `tenantId` | `actions/ordering-operations.ts:6-12`; `lib/validation/ordering-operations.ts:29-37`; server-action origin check plus `lib/api/index.ts:6-20`; API `OrderingOperations.cs:43`, `:71` | None |
| `actions/orders.ts#updateOrderStatusAction` | Deny | Allow (own tenant) | Allow (own tenant) | Allow (own tenant) | Deny | Body `tenantId` + `orderId` | `actions/orders.ts:7-15`; `lib/validation/orders.ts:7-13`; server-action origin check plus `lib/api/index.ts:6-20`; API `UpdateOrderStatusCommandHandler.cs:27-30` (Kitchen cannot cancel) | SEC-01 |
| `actions/organization.ts#acceptStaffInvitationAction` | Deny | Allow | Allow | Allow | Allow | Invitation token plus verified JWT email | `actions/organization.ts:230-236`; server-action origin check plus `lib/api/index.ts:6-20`; API `StaffInvitationRepository.cs:26-58` | SEC-02, SEC-09 |
| `actions/organization.ts#archiveOrganizationRoleAction` | Deny | Deny | Deny | Allow (own tenant) | Deny | Body `organizationId` + `roleId` | `actions/organization.ts:194-202`; `lib/validation/organization.ts:138-155` (role ID one segment); server-action origin check plus `lib/api/index.ts:6-20`; API `OrganizationRolePermissionsHandler.cs:127-136` | None |
| `actions/organization.ts#changeRestaurantMemberRoleAction` | Deny | Deny | Deny | Allow (own tenant) | Deny | Body `organizationId` + `memberId` + `roleId` | `actions/organization.ts:204-212`; `lib/validation/organization.ts:160-176`; server-action origin check plus `lib/api/index.ts:6-20`; API `ChangeRestaurantMemberRoleHandler.cs:15-24` | SEC-02 |
| `actions/organization.ts#createOrganizationAction` | Deny | Allow | Allow | Allow | Allow | None; caller becomes first owner | `actions/organization.ts:102-110`; server-action origin check plus `lib/api/index.ts:6-20`; API `CreateOrganizationCommandHandler.cs:17` | SEC-04 |
| `actions/organization.ts#createOrganizationRoleAction` | Deny | Deny | Deny | Allow (own tenant) | Deny | Body `organizationId` | `actions/organization.ts:184-192`; `lib/validation/organization.ts:113-118`; server-action origin check plus `lib/api/index.ts:6-20`; API `OrganizationRolePermissionsHandler.cs:101-102` | None |
| `actions/organization.ts#decideCatalogTranslationAction` | Deny | Deny | Allow (own tenant) | Allow (own tenant) | Deny | Body `tenantId` + `reviewId` | `actions/organization.ts:72-80`; `lib/validation/organization.ts:213-219`; server-action origin check plus `lib/api/index.ts:6-20`; API `CatalogTranslationWorkflow.cs:98-100` | SEC-01 |
| `actions/organization.ts#deleteCatalogTranslationGlossaryAction` | Deny | Deny | Allow (own tenant) | Allow (own tenant) | Deny | Body `tenantId` + `id` | `actions/organization.ts:92-100`; `lib/validation/organization.ts:251-254`; server-action origin check plus `lib/api/index.ts:6-20`; API `CatalogTranslationWorkflow.cs:163` | SEC-01 |
| `actions/organization.ts#renameOrganizationAction` | Deny | Deny | Deny | Allow (own tenant) | Deny | Form `organizationId` | `actions/organization.ts:145-151`; `lib/validation/organization.ts:315-323`; server-action origin check plus `lib/api/index.ts:6-20`; API `RenameOrganizationCommandHandler.cs:15-17` | None |
| `actions/organization.ts#revokeStaffInvitationAction` | Deny | Deny | Allow (own tenant) | Allow (own tenant) | Deny | Body `organizationId` + `invitationId` | `actions/organization.ts:214-228`; server-action origin check plus `lib/api/index.ts:6-20`; API `StaffInvitationRepository.cs:72-97` | None |
| `actions/organization.ts#saveCatalogTranslationAction` | Deny | Deny | Allow (own tenant) | Allow (own tenant) | Deny | Body `tenantId` + `entityType` + `entityId` | `actions/organization.ts:62-70`; `lib/validation/organization.ts:64-91`; server-action origin check plus `lib/api/index.ts:6-20`; API `CatalogTranslationWorkflow.cs:62` | SEC-01 |
| `actions/organization.ts#saveCatalogTranslationGlossaryAction` | Deny | Deny | Allow (own tenant) | Allow (own tenant) | Deny | Body `tenantId` (+ `id`) | `actions/organization.ts:82-90`; `lib/validation/organization.ts:229-235`; server-action origin check plus `lib/api/index.ts:6-20`; API `CatalogTranslationWorkflow.cs:144` | SEC-01 |
| `actions/organization.ts#saveOrganizationLegalProfileAction` | Deny | Deny | Deny | Allow (own tenant) | Deny | Body `organizationId` | `actions/organization.ts:112-143` (UUID, version, bounded fields); server-action origin check plus `lib/api/index.ts:6-20`; API `OrganizationsController.cs:225-230` | None |
| `actions/organization.ts#saveOrganizationRoleGrantAction` | Deny | Deny | Deny | Allow (own tenant) | Deny | Body `organizationId` + role ID | `actions/organization.ts:174-182`; `lib/validation/organization.ts:180-206`; server-action origin check plus `lib/api/index.ts:6-20`; API `OrganizationRolePermissionsHandler.cs:67-76` | None |
| `actions/organization.ts#saveRestaurantDescriptionTranslationAction` | Deny | Deny | Allow (own tenant) | Allow (own tenant) | Deny | Body `tenantId` + `locale` | `actions/organization.ts:52-60`; `lib/validation/organization.ts:43-59` (locale encoded by `services/organization.ts:61-62`); server-action origin check plus `lib/api/index.ts:6-20`; API `MenuLanguageSettings.cs:29` | SEC-01 |
| `actions/organization.ts#sendStaffInvitationAction` | Deny | Deny | Allow (own tenant) | Allow (own tenant) | Deny | Form `organizationId` (+ `tenantId`) + role ID | `actions/organization.ts:166-172`; `lib/validation/organization.ts:332-359`; `services/organization.ts:291-327` (invitation token emailed server-side, never returned; revoked on delivery failure); server-action origin check plus `lib/api/index.ts:6-20`; API `CreateStaffInvitationCommandHandler.cs:20-37` | SEC-02, SEC-09 |
| `actions/organization.ts#setOrganizationActiveAction` | Deny | Deny | Deny | Allow (own tenant) | Deny | Body `organizationId` | `actions/organization.ts:153-164`; server-action origin check plus `lib/api/index.ts:6-20`; API `SetOrganizationActiveCommandHandler.cs:13-15` | SEC-02 |
| `actions/organization.ts#updateMenuLanguagesAction` | Deny | Deny | Allow (own tenant) | Allow (own tenant) | Deny | Body `tenantId` | `actions/organization.ts:44-50`; `lib/validation/organization.ts:21-38`; server-action origin check plus `lib/api/index.ts:6-20`; API `MenuLanguageSettings.cs:60` | SEC-01 |
| `actions/restaurant.ts#createRestaurantAction` | Deny | Deny | Deny | Allow (own tenant) | Deny | Form `organizationId` | `actions/restaurant.ts:7-12`; `lib/validation/restaurant.ts:4-20`; server-action origin check plus `lib/api/index.ts:6-20`; API `CreateRestaurantCommandHandler.cs:20` | SEC-04 |
| `actions/stripe-connect.ts#getStripeConnectStatusAction` | Deny | Deny | Deny | Allow (own tenant) | Deny | Body `tenantId` | `actions/stripe-connect.ts:9-27` (UUID `:19`); server-action origin check plus `lib/api/index.ts:6-20`; API `StripeConnectHandler.cs:22-26` (`billing.manage`) | None |
| `actions/stripe-connect.ts#startStripeConnectOAuthAction` | Deny | Deny | Deny | Allow (own tenant) | Deny | Body `tenantId` + `locale` | `actions/stripe-connect.ts:29-53` (UUID, locale enum); server-action origin check plus `lib/api/index.ts:6-20`; API `StripeConnectHandler.cs:83-89` (owner only) | SEC-10 |

## Findings

No Blocker was found in W1a or W1b. No cross-tenant read or write reproduced or was found in source. Every protected query is scoped by the route tenant and by a persisted membership or ownership for the validated JWT `iss`/`sub`.

Stripe Connect account linking is owner-only at start (`StripeConnectHandler.cs:83-84`). The initiating owner is rechecked when the callback completes (`:115-116`), and a connected tenant or an account already used by another tenant cannot be overwritten (`StripeConnectRepository.cs:54-59`). A Kitchen, Manager or foreign account cannot link or unlink a payout account.

The BFF never sends a privileged or shared credential. Authenticated calls carry only the signed-in user's own token; public calls carry none.

The new permission model adds two Should findings inside a tenant (SEC-08, SEC-09).

### SEC-01 — Deactivated restaurants stay readable and writable by their staff

- **Workstream:** W1
- **Location:** `apps/api/WhitePlate.Infrastructure/Persistence/Repositories/StaffMembershipRepository.cs:17-55`
- **Evidence:**
  - Membership predicates never test `Tenant.IsActive`:
    - `IsOrganizationOwnerOfTenantAsync` (lines 17-23) checks only that the owner's organization is active (lines 11-15).
    - `HasPermissionAsync` (lines 32-55) checks the organization, but not the tenant.
    - Only `HasOrganizationPermissionAsync` filters `tenant.IsActive` (line 65).
  - Every catalog, catalog-publication, translation, order, media and hub check goes through `HasPermissionAsync`, and the repositories behind those routes do not filter on tenant activity (for example `CatalogRepository.cs:86`, `OrderRepository.cs:266`, `:426`, `MediaRepository.cs:12-13`, `CatalogPublicationRepository.cs:37-47`).
  - Repositories added since `7e5b2e3` do exclude inactive restaurants: establishment and legal settings (`EstablishmentSettingsRepository.cs:11-12`), order email (`OrderEmailSettingsRepository.cs:11-12`), ordering operations (`OrderingOperationsRepository.cs:12-13`), theme draft and publication (`ThemeSettingsRepository.cs:11-12`, `ThemePublicationRepository.cs:14-15`), analytics (`AnalyticsRepository.cs:88`) and dashboard metrics (`OrderRepository.cs:317`). The gap is therefore inconsistent rather than universal.
  - `/me` omits inactive restaurants for owners (`StaffDirectoryRepository.cs:21-22`) but not for direct memberships (`:32-34`). `docs/api/api-contracts.md:260` says "`GET /me` lists active restaurants only".
  - `Tenant.Deactivate` is still called only from tests (`OrganizationEndpointTests.cs:608`, `:1279`, `TenantEndpointTests.cs:172`), and Neon `test` has 0 inactive tenants, so this is a source finding.
- **Impact:** Suppose an operator deactivates one restaurant, for example to suspend or offboard it. Its storefront, checkout, settings, theme, analytics and dashboard stop. Its owners and staff can still:
  - read customer orders and history;
  - change order status;
  - edit and publish the catalog;
  - manage media;
  - subscribe to live events.

  The access stays inside the restaurant's own staff, so it is not cross-tenant. Severity stays Could because no product path deactivates a tenant today.
- **Severity:** Could
- **Fix direction:** Add `tenant.IsActive` to `IsOrganizationOwnerOfTenantAsync` and `HasPermissionAsync`, or use one shared active-tenant scope. Filter direct-membership restaurants in `StaffDirectoryRepository` the same way. Decide explicitly whether owners may still read history of a suspended restaurant, and keep `api-contracts.md` aligned.
- **Regression test:** Sketch below
- **Status:** Confirmed

```text
Arrange: tenant T with owner O, built-in Manager M, Kitchen K; set T.IsActive = false.
Request: GET /api/v1/tenants/T/catalog (M), GET /api/v1/tenants/T/orders (K),
PUT /api/v1/tenants/T/categories/{id} (O), POST /api/v1/tenants/T/catalog/publish (M),
hub JoinRestaurant(T) (K), GET /api/v1/me (M)
Expected: 404 / 403 / 404 / 404 / HubException, and /me without T; no persisted change.
Actual (source): all allowed; /me lists T for M and K.
```

### SEC-02 — Staff memberships and co-owners cannot be removed through the product

- **Workstream:** W1
- **Location:** `apps/api/WhitePlate.Api/Controllers/OrganizationsController.cs:15-326`
- **Evidence:**
  - Since `7e5b2e3` an owner can change a restaurant member's role (`PUT …/members/{memberId}/role`, `OrganizationsController.cs:179-192`, `ChangeRestaurantMemberRoleHandler.cs:15-24`).
  - No route deletes a `RestaurantMembership` or an `OrganizationOwnerMembership`. The only removals in the repository are in tests (`BrandAssetsEndpointTests.cs:127`, `ProductPhotosEndpointTests.cs:88`, `CategoryVisibilityTests.cs:94`, `ProductAvailabilityTests.cs:63`, `OrganizationEndpointTests.cs:1193`, `:1263`).
  - Staff access can only be neutralized indirectly, by moving the member to a custom role with no permissions. A custom role accepts an empty permission list (`OrganizationRoleGrantSet.cs:123-142`, `:62-75`).
  - Co-owners cannot be removed or downgraded at all. Every owner keeps equal, fixed rights: archive and restore (`SetOrganizationActiveCommandHandler.cs:13`), role editing (`OrganizationRolePermissionsHandler.cs:67`, `:101`, `:127`), inviting more owners (`CreateStaffInvitationCommandHandler.cs:20-25`) and Stripe account linking (`StripeConnectHandler.cs:83`).
  - Re-inviting an existing member still does not change the role: acceptance skips the insert when any membership exists (`StaffInvitationRepository.cs:52-57`) but consumes the invitation.
  - Invitations can only be revoked while pending (`StaffInvitationRepository.cs:95`).
- **Impact:**
  - A departing or compromised co-owner keeps full control until someone edits the production database by hand. That control includes customer order data, prices, roles, organization archive and Stripe payout linking.
  - Staff can be neutralized only through a workaround the product does not describe.
- **Severity:** Should
- **Fix direction:**
  - Add owner-only endpoints to remove a restaurant membership and to remove a co-owner, with a last-owner guard.
  - Each must enforce organization ownership server-side, with tests that the next REST call and the next hub event are denied.
  - Record the decision on co-owner equality.
- **Regression test:** Sketch below
- **Status:** Confirmed

```text
Arrange: organization G with owners O1, O2; restaurant T with Kitchen K.
Request: DELETE /api/v1/organizations/G/members/{K membership} (O1), then GET /api/v1/tenants/T/orders (K)
Expected: 204, then 403; K removed from the hub registry on the next event.
Request: DELETE /api/v1/organizations/G/owners/{O2} (O1), then POST /api/v1/tenants/T/stripe-connect/oauth/start (O2)
Expected: 204, then 404.
Actual: no such routes exist (404 from routing); K and O2 keep access.
```

### SEC-03 — No fallback authorization policy; endpoints are anonymous unless annotated

- **Workstream:** W1
- **Location:** `apps/api/WhitePlate.Api/Configuration/ServiceRegistration.cs:67`
- **Evidence:**
  - `services.AddAuthorization()` sets no `FallbackPolicy`, and `app.MapControllers()` (`Program.cs:63`) adds no `RequireAuthorization()`.
  - Protection depends on each controller carrying `[Authorize]`. All 14 protected controller classes do. `OrdersController` has none at class level and protects `List`, `History` and `UpdateStatus` per action (`OrdersController.cs:122`, `:148`, `:189`).
  - The new anonymous actions on otherwise protected controllers are explicit: `AnalyticsController.Withdraw` (`AnalyticsController.cs:37`), `StripeConnectController.OAuthCallback` (`StripeConnectController.cs:36`) and `StripeConnectWebhookController` (`:59`).
  - The public tenant controllers (`MenuController`, `TenantsController`, `PublicThemeController`, `PublicBrandAssetsController`, `PublicProductPhotosController`) rely on the absence of `[Authorize]`.
  - Every protected handler also returns 401 when `ICurrentIdentity.Identity` is null, so nothing is exposed today.
- **Impact:** A future controller or action that omits `[Authorize]` and does not read the identity would be public by default. The surface grew from 60 to 115 actions since `7e5b2e3`, which makes per-action annotation more error-prone. This is a defense-in-depth gap, not an exposure.
- **Severity:** Could
- **Fix direction:** Set `options.FallbackPolicy = new AuthorizationPolicyBuilder().RequireAuthenticatedUser().Build()`. Mark the public tenant, slug, menu, media, theme, pickup, quote, checkout, tracking, analytics-withdrawal, Stripe callback/webhook and health endpoints `[AllowAnonymous]` explicitly. Add a test that lists endpoints and fails on any anonymous endpoint outside an allowlist.
- **Regression test:** Sketch below
- **Status:** Confirmed

```text
Arrange: resolve EndpointDataSource from the test host.
Assert: every RouteEndpoint without IAllowAnonymous metadata has IAuthorizeData metadata,
and the IAllowAnonymous set equals the reviewed public allowlist (tenant, establishment, menu, theme,
brand-assets/{slot}, products/{id}/photos/..., pickup-slots, orders, orders/quote, orders/{id}/tracking,
their /api/v1/public/restaurants/{slug}/… variants, analytics/withdrawal, stripe-connect/oauth/callback,
stripe-connect/webhooks/{mode}, /, /health/live, /health/ready).
Actual: passes today only because each action is annotated; no fallback enforces it.
```

### SEC-04 — Any verified account can create unlimited organizations and claim almost any storefront name

- **Workstream:** W1
- **Location:** `apps/api/WhitePlate.Application/Tenants/CreateRestaurantCommandHandler.cs:11-14`
- **Evidence:**
  - `POST /api/v1/organizations` requires only a verified email (`CreateOrganizationCommandHandler.cs:17`), and the caller becomes owner.
  - The owner can then create restaurants without a count limit (`CreateRestaurantCommandHandler.cs:20`).
  - The reserved subdomain list still has four entries, `www`, `api`, `admin` and `app` (lines 11-14, checked at line 41). Names such as `login`, `auth`, `account`, `billing`, `support`, `security` or `whiteplate` are accepted.
  - Since `7e5b2e3` the subdomain is also a storefront path. When the frontend Host equals `STOREFRONT_PATH_BASE_DOMAIN`, `proxy.ts:8-24` rewrites `/{locale}/{slug}` to the storefront (`lib/storefront-preview-routing.ts:36-72`). The API serves it through `/api/v1/public/restaurants/{restaurantSlug}/…` (`TenantResolutionMiddleware.cs:20-21`).
  - The frontend reserves 23 path segments (`storefront-preview-routing.ts:10-34`) only to avoid shadowing its own routes; the API does not apply that list.
  - The owner reports the hosted storefront route as `https://white-plate.vercel.app/{locale}/{storefront-name}`, while `docs/architecture/tenancy-and-security.md:11` still lists the Vercel setting as pending.
  - Neither endpoint has a rate limit; the shared limiter is used only by checkout, quote and analytics withdrawal (`ServiceRegistration.cs:68-75`).
  - Not exercised at runtime, to avoid creating test organizations and restaurants.
- **Impact:**
  - A self-registered account can publish a storefront named `login`, `support` or another brand's name under the platform's own origin today (`white-plate.vercel.app/fr/login`), which helps phishing.
  - On wildcard tenant DNS (`tenancy-and-security.md:27`, still open) the same names become subdomains of the platform domain.
  - It can also create resources in bulk.
  - This is no longer latent on DNS, as it was on the stale base; severity stays Should.
- **Severity:** Should
- **Fix direction:**
  - Extend the API's reserved list with platform, auth, support and infrastructure names, the frontend's reserved path segments and a review list, and share it with `storefront-preview-routing.ts`.
  - Add per-account quotas and a rate limit on organization and restaurant creation.
  - Decide whether new storefronts need approval before they resolve publicly.
- **Regression test:** Sketch below
- **Status:** Confirmed

```text
Request: POST /api/v1/organizations/{own org}/restaurants {"name":"x","subdomain":"login","currency":"EUR","legalProfileMode":"inherit"}
Expected: 400 reserved_subdomain
Actual (source): 201; https://<path host>/fr/login and Host login.<base> then resolve the new tenant.
Request: 50 x POST /api/v1/organizations in a minute from one account
Expected: 429 after the configured quota
Actual (source): all 201.
```

### SEC-05 — Hub bearer token travels in the query string

- **Workstream:** W1
- **Location:** `apps/api/WhitePlate.Api/Configuration/ServiceRegistration.cs:58-64`
- **Evidence:** `OnMessageReceived` reads `access_token` from the query string for `/hubs/orders`, which is the standard SignalR pattern for WebSockets and Server-Sent Events. The browser client sets it through `accessTokenFactory` (`lib/orders/order-realtime.ts:31`). The API's own logging keeps `Microsoft.AspNetCore` at `Warning` (`appsettings.json`), so ASP.NET request-start lines with the URL are not written by default. Whether the Coolify proxy (Traefik) or another hop records full request URLs was not checked. W8 could not reach the API (HOST-01) and recorded no access-log evidence.
- **Impact:** If any hop logs full URLs, 15-minute API JWTs would be stored in logs. They could be replayed within their lifetime against all of that user's protected API routes, not only the hub (SEC-06).
- **Severity:** Could
- **Fix direction:** Confirm proxy access logs drop or redact query strings for `/hubs/orders`. Use a hub-only token audience with a very short lifetime for the SignalR token route (see SEC-06).
- **Regression test:** None
- **Status:** Suspected

### SEC-06 — Browser JavaScript can read a general-purpose API token through `get-session` and the SignalR token route

- **Workstream:** W1
- **Location:** `apps/frontend/lib/auth.ts:126-142`
- **Evidence:**
  - The Better Auth `jwt` plugin (1.7.6) adds an after-hook to `/get-session`. Unless `disableSettingJwtHeader` is set, the hook sets a `set-auth-jwt` response header and lists it in `Access-Control-Expose-Headers` (`better-auth/dist/plugins/jwt/index.mjs:193-206`, version as pinned in `package.json`). `lib/auth.ts:126-142` does not set it, and the file is unchanged since `7e5b2e3`.
  - Stale-base local probe (2026-10-25), with the same configuration and library version, using account A's session:
    - `GET /api/auth/get-session` returned 200 with `set-auth-jwt` holding an RS256 API token (`aud=whiteplate-api`, 900 s) and `access-control-expose-headers: set-auth-jwt`.
    - The explicit block on `/api/auth/token` (`app/api/auth/[...all]/route.ts:10-11`, unchanged) held for all seven path forms tried, so `get-session` is the bypass.
  - Separately, `POST /api/kitchen/signalr-token` returns the same general-purpose token to the browser by design for the hub (`app/api/kitchen/signalr-token/route.ts:24-47`, unchanged; consumed by `lib/api/order-browser.ts:72-90`).
  - The token is account-scoped, not tenant-scoped, so it grants nothing the account does not already hold.
  - It is, however, the token that bypasses the BFF's narrower prechecks used in SEC-08 and SEC-09.
  - `docs/architecture/tenancy-and-security.md:55` says the Next.js server exchanges the session for API tokens "and keeps them server-side". Neither path does.
- **Impact:**
  - Any script that runs on the frontend origin (an XSS or a compromised dependency) can take a bearer token valid for 15 minutes against every protected API route of the signed-in user. It can replay that token off-origin, outside the BFF's Origin and membership prechecks, after the page is closed.
  - The hosted frontend sends no Content-Security-Policy (HOST-03, W8).
  - Since `7e5b2e3`, path-based storefronts render tenant-authored storefront content on the same origin as the staff workspace (`proxy.ts:8-24`), which widens the code that shares that origin.
  - No XSS was found in W1. W5 checked XSS sinks, link schemes and e-mail encoding in source and found none (`w5-supply-chain-config.md:177`).
  - Severity stays Should under the earlier ruling: a documented control is absent, and the token reaches JavaScript through two paths.
- **Severity:** Should
- **Fix direction:**
  1. Set `disableSettingJwtHeader: true` on the `jwt` plugin.
  2. Stop handing the general-purpose token to the browser for SignalR. Issue a hub-only token (dedicated audience or scope) with the shortest workable lifetime, accept that audience only on `/hubs/orders`, and reject it on REST routes, together with SEC-05.

  Both parts are needed. Correct `tenancy-and-security.md:55` and `frontend-conventions.md:51` to describe the hub token.
- **Regression test:** Sketch below
- **Status:** Confirmed

```text
Arrange: signed-in verified account.
Request: GET /api/auth/get-session with the session cookie
Expected: 200 without a set-auth-jwt header
Actual (local, stale base 2026-10-25, configuration unchanged): 200 with set-auth-jwt (aud whiteplate-api, 900 s) and access-control-expose-headers: set-auth-jwt
Request: POST /api/kitchen/signalr-token (own Origin), then GET /api/v1/me with that token
Expected: hub-only token rejected outside /hubs/orders (401)
Actual (source): aud whiteplate-api, accepted by every protected route
```

### SEC-07 — `saveOpeningHoursAction` puts an unvalidated tenant ID into the API path

- **Workstream:** W1
- **Location:** `apps/frontend/actions/establishment-settings.ts:27`
- **Evidence:**
  - Every other server action restricts tenant, organization and resource IDs before a service builds an API path. Most use `isUuid` (for example `lib/validation/establishment-settings.ts:247`, `lib/validation/catalog-input.ts:340-341`, `lib/validation/orders.ts:12-13`, `actions/stripe-connect.ts:19`). The two newer establishment actions use the single-segment pattern `/^[0-9a-f-]{36}$/i` (`actions/establishment-settings.ts:51`, `:86`). This follows `docs/architecture/frontend-conventions.md:43`.
  - `saveOpeningHoursAction` only checks `typeof value.tenantId !== "string"` (line 27). `services/establishment-settings.ts:117` interpolates it into `/api/v1/tenants/${tenantId}/establishment-settings/opening-hours`.
  - `resolveApiUrl` only requires that the normalized path start with `/api/v1/` and stay on the API origin (`lib/api/request-url.ts:7`, `:26-28`, unchanged).
  - Reproduced with Node `URL` on this base:
    - `tenantId = "<T>/categories/<C>?x="` resolves to path `/api/v1/tenants/<T>/categories/<C>`, with the suffix moved into the query.
    - `"../organizations/<G>/invitations/<I>#"` resolves to `/api/v1/organizations/<G>/invitations/<I>`, the `DELETE` invitation-revoke route (`OrganizationsController.cs:316-324`).
  - With `openingHours: null` the service sends `DELETE` with `If-Match` set to the supplied version (`services/establishment-settings.ts:124`). A crafted call therefore reaches other `PUT` or `DELETE` API routes.
- **Impact:** The request still carries only the caller's own token. It passes Next's server-action origin check, `getApiToken`'s origin check and the API's own tenant and permission checks, so it grants nothing the caller could not do through the matching action. It breaks the documented action contract and turns one action into a generic `PUT`/`DELETE` forwarder, which a future change to token or permission handling could make dangerous.
- **Severity:** Could
- **Fix direction:**
  - Parse the opening-hours input in `lib/validation/establishment-settings.ts` with `isUuid(tenantId)` and a bounded integer version, like `parseEstablishmentInput`, and use `isUuid` in the two regex-checked actions too.
  - Harden the shared layer: build API paths from encoded segments (`encodeURIComponent`), or reject `?`, `#` and dot segments in `resolveApiUrl`.
  - Add unit tests for both.
- **Regression test:** Sketch below
- **Status:** Confirmed

```text
Call: saveOpeningHoursAction({ tenantId: "<T>/categories/<C>?x=", establishmentVersion: 1, openingHours: null })
Expected: { ok: false, status: 400, error: "invalid" } and no outgoing request
Actual (source + URL resolution): DELETE <API>/api/v1/tenants/<T>/categories/<C>?x=/establishment-settings/opening-hours with If-Match "1"
```

### SEC-08 — Analytics, catalog reordering and discount deactivation check the wrong restaurant permission

- **Workstream:** W1
- **Location:** `apps/api/WhitePlate.Application/Orders/GetAnalyticsMetricsQueryHandler.cs:19-22`
- **Evidence:** Three operations check a different permission from the one their contract and UI use:
  - **Analytics.** `GET /api/v1/tenants/{tenantId}/analytics` authorizes with `OrderStaffAccess.CanViewHistoryAsync`, which is `orders.manage` (`OrderStaffAccess.cs:9-11`). `analytics.view` is never checked.
    - The permission catalog, `api-contracts.md:11` and `:270` ("Restaurant permissions … govern staff access to … analytics") and the dashboard's order-value gate (`GetDashboardMetricsQueryHandler.cs:24-25`) all use `analytics.view`.
    - The frontend BFF filters restaurants with `analytics.view` (`lib/analytics-access.ts:3-8`, `services/analytics.ts:47`) and then calls the API.
    - `api-contracts.md:392` still describes the old "owner or manager membership check".
    - No existing test exercises the analytics route.
  - **Catalog reordering.** `PUT /api/v1/tenants/{tenantId}/catalog/reorder` reorders categories, products (including moving products between categories), option groups and options. It authorizes with `CatalogAccess.CanManageDiscountsAsync`, which is `discounts.manage` (`CatalogManagementCommandHandler.cs:151-155`, `CreateCategoryCommandHandler.cs:41-43`). `api-contracts.md:260` says catalog edits require `catalog.manage`.
  - **Discount deactivation.** `DELETE …/discounts/{discountId}` goes through the shared `ArchiveAsync` with `catalog.manage` (`CatalogManagementCommandHandler.cs:173-180`). Discount create and update require `discounts.manage` (`CreateCatalogConfigurationHandlers.cs:55`, `CatalogManagementCommandHandler.cs:104`).
- **Impact:** The built-in Manager holds all three permissions, so default Manager and Owner behavior is unchanged. Other roles are affected:
  - A role with `orders.manage` and without `analytics.view` can read the restaurant's revenue, order and repeat-customer analytics directly from the API. That includes the legacy `Staff` role that existing organizations keep (`OrganizationRoleGrantSet.cs:221`, `api-contracts.md:22`) and any custom role. The token comes from SEC-06 or any API client.
  - An Accountant, who holds `analytics.view`, is refused by the API, so the BFF aggregate fails with 403 for them.
  - A role with only `discounts.manage` can reorder and recategorize the menu.
  - A role with only `catalog.manage` can switch off promotions.

  All of this stays inside the restaurant, so it is not cross-tenant. It is Should because an owner-configured access control does not hold for those routes.
- **Severity:** Should
- **Fix direction:** Check `analytics.view` in `GetAnalyticsMetricsQueryHandler`, `catalog.manage` in `ReorderAsync`, and `discounts.manage` in `DeactivateDiscountAsync`. Add one API test per permission key that grants a custom role exactly that key and asserts every route's allow/deny outcome. Correct `api-contracts.md:392`.
- **Regression test:** Sketch below
- **Status:** Confirmed

```text
Arrange: organization G, restaurant T; custom role R1 = [orders.manage], R2 = [analytics.view], R3 = [discounts.manage], R4 = [catalog.manage]; members M1..M4.
Request: GET /api/v1/tenants/T/analytics?days=30 (M1), same (M2)
Expected: 403, 200
Actual (source): 200, 403
Request: PUT /api/v1/tenants/T/catalog/reorder {"entityType":"categories",...} (M3)
Expected: 404
Actual (source): 204
Request: DELETE /api/v1/tenants/T/discounts/{D} (M4)
Expected: 404
Actual (source): 204
```

### SEC-09 — A `staff.manage` holder can invite into roles with permissions the inviter does not hold

- **Workstream:** W1
- **Location:** `apps/api/WhitePlate.Application/Staff/CreateStaffInvitationCommandHandler.cs:20-37`
- **Evidence:**
  - For a non-owner, the handler checks three things only: the invitation is not for an organization owner, the inviter holds `staff.manage` on the target restaurant (lines 22-25), and the role belongs to the organization and is not archived (lines 34-37, `StaffInvitationRepository.cs:15-18`).
  - It never compares the role's grants with the inviter's own grants.
  - `GetAssignableAsync` offers every unarchived role to the same callers (`OrganizationRolePermissionsHandler.cs:44-54`). That includes the built-in Accountant (`analytics.view`, `billing.manage`) and any custom role.
  - Acceptance then creates the membership with that role (`StaffInvitationRepository.cs:35-57`).
  - The design gives the built-in Manager `staff.manage` but deliberately withholds `billing.manage` (`docs/superpowers/specs/2026-10-18-custom-organization-roles-design.md:29`, `:33`; `api-contracts.md:22`). It also states that `staff.manage` "does not grant permission to create or edit role definitions" (spec `:53`).
  - The API returns the invitation token to the caller (`OrganizationsController.cs:312-313`), although the BFF emails it instead (`services/organization.ts:308-315`).
  - `OwnerCanInviteStaffToACustomRoleAndReassignThePersistedMember` covers owners only; no test covers a non-owner inviting into a broader role.
- **Impact:**
  - A Manager can invite a second verified account they control as Accountant and gain `billing.manage`, which includes Stripe connection status (`StripeConnectHandler.cs:23-26`).
  - They can also invite into any broader custom role the owner defined, for example one that holds `billing.manage` together with everything else.
  - The owner's decision to withhold a permission from a role is therefore not enforced against that role's holders.
  - Stripe linking stays owner-only, and the escalation stays inside the restaurant.
- **Severity:** Should
- **Fix direction:**
  - For non-owners, require the target role's permissions to be a subset of the inviter's permissions on that restaurant, both when listing assignable roles and when creating the invitation.
  - Alternatively, let owners mark roles as delegable.
  - Add a test that a built-in Manager cannot invite as Accountant.
- **Regression test:** Sketch below
- **Status:** Confirmed

```text
Arrange: organization G, restaurant T; built-in Manager M on T; second verified account M2 controlled by M.
Request: POST /api/v1/organizations/G/invitations {"tenantId":"T","email":"<M2>","role":"Accountant"} (M)
Expected: 404 or 403 (role exceeds inviter's grants)
Actual (source): 201 with an invitation token; M2 accepts and GET /api/v1/tenants/T/stripe-connect (M2) returns 200
```

### SEC-10 — Stripe OAuth completion is bound to the state value, not to the initiating owner's browser

- **Workstream:** W1
- **Location:** `apps/api/WhitePlate.Api/Controllers/StripeConnectController.cs:36-53`
- **Evidence:**
  - The OAuth callback is `[AllowAnonymous]` and receives `state` and `code` from the browser that returns from Stripe.
  - `CompleteOAuthAsync` consumes the state by its SHA-256 digest (`StripeConnectHandler.cs:105-107`, `StripeConnectRepository.cs:34-49`) and rechecks that the identity stored with the state is still an owner (`:112-116`).
  - It then exchanges whatever `code` accompanies that state and links the resulting Stripe account to the state's tenant (`:122-138`).
  - Nothing ties the callback to the session that started the flow. `StartOAuthAsync` sets no cookie, and the redirect target is the API host, which has no browser session.
  - The state is strong: 256 bits of randomness (`:181-182`), stored only as a digest, valid for 10 minutes (`:17`) and single-use. A connected tenant cannot be overwritten (`StripeConnectRepository.cs:59`).
  - Covered in part by `StripeConnectHandlerTests.cs:19`, `:105` and `StripeConnectRepositoryTests.cs:16`; none of these tests session binding.
- **Impact:** Suppose the authorization URL, which carries the state, leaks within its 10-minute life before the owner completes it, for example through a shared screen, a forwarded link or browser history on a shared device. Whoever opens it first while signed in to their own Stripe account links that account as the restaurant's payout connection. The owner then sees "connected". This is a narrow window that needs a leak, so it is Could. Linking is otherwise owner-only, and no Kitchen, Manager or foreign account can start it.
- **Severity:** Could
- **Fix direction:**
  - Bind the state to the initiating browser: set a short-lived `HttpOnly`, `SameSite=Lax` cookie holding a second secret when the flow starts, and verify it in the callback. Alternatively, route the callback through the frontend BFF and check that the signed-in user is the state's owner.
  - Show the linked Stripe account's display name or ID to the owner for confirmation.
- **Regression test:** Sketch below
- **Status:** Confirmed

```text
Arrange: owner O starts OAuth for tenant T and obtains authorizationUrl with state S.
Request: GET /api/v1/stripe-connect/oauth/callback?state=S&code=<code for another person's Stripe account> from a browser without O's session
Expected: 302 to ...stripeConnectResult=failed; no connection saved
Actual (source): connection saved for T with the other account; redirect with stripeConnectResult=connected
```

## Checked, no finding

### Fixed since `7e5b2e3`

- None of SEC-01 to SEC-07 is fully fixed. SEC-02 is narrowed: owners can now reassign restaurant roles (`ChangeRestaurantMemberRoleHandler.cs:15-24`), but removal is still missing.

### W1a — API

- **Tenant source for protected routes.** It is the route `tenantId`/`organizationId`, used only as a selector. Access always comes from persisted ownership, or from a membership plus an unarchived role grant, for the validated JWT `iss`/`sub` (`HttpCurrentIdentity.cs:14-26`, `ServiceRegistration.cs:45-55`, `StaffMembershipRepository.cs:11-72`). Invalid or multi-bit permission arguments fail closed (`:35-37`). A membership whose role grant is missing or archived gets nothing (`:51-54`).
- **Tenant source for public routes.**
  - It is the actual Host, resolved once per request with no fallback, or, on the new `[RequireTenantBySlug]` routes, the `restaurantSlug` route value (`TenantResolutionMiddleware.cs:12-37`).
  - Both paths validate the label (`TenantSubdomain.TryCreate`, `ResolveTenantQueryHandler.cs:13-16`) and require an active tenant and organization (`TenantRepository.cs:14-17`).
  - The slug variants are anonymous public reads, checkout, quote and capability tracking only, as documented in `tenancy-and-security.md:11`. No protected route reads the slug.
  - `TenantHostResolver.cs` is unchanged since the stale-base probe, where spoofed `X-Tenant-Subdomain` and `X-Forwarded-Host` headers were ignored.
- **Body- and route-supplied resource IDs are rechecked against the route tenant or organization:**
  - product category on create and update (`CreateProductCommandHandler.cs:22-24`, `CatalogRepository.cs:181-187`);
  - option group product (`CreateCatalogConfigurationHandlers.cs:21-23`) and option group (`:38-40`);
  - every reorder ID, including products moved from another category (`CatalogRepository.cs:347-400`);
  - translation review (`CatalogTranslationWorkflowRepository.cs:103-104`);
  - invitation tenant (`StaffInvitationRepository.cs:11-13`) and invitation role (`:15-18`), plus composite organization/tenant and organization/role foreign keys (`StaffInvitationConfiguration.cs:28-32`, `RestaurantMembershipConfiguration.cs:23-27`);
  - member role change (`RestaurantMembershipRoleRepository.cs:13-19`);
  - media asset IDs (`MediaRepository.cs:24-25`, `:54-58`, `ProductPhotoRepository.cs:25-38`).
- **Permission checks are in the Application handlers or repositories, not only the UI.**
  - Catalog, translations and publication require `catalog.manage`.
  - Discounts require `discounts.manage`, except SEC-08.
  - Establishment, theme, brand media and product photos require `storefront.manage`.
  - Order list, status and ordering-operations reads require `orders.manage` or `kitchen.display`. History, cancellation, ordering-operations writes and order-email settings require `orders.manage`.
  - The hub and product availability accept `kitchen.display`.
  - Stripe status requires `billing.manage`; Stripe linking and organization, role and restaurant administration are owner-only.
  - The built-in grants match `api-contracts.md:22` (`OrganizationRoleGrantSet.cs:218-225`). The 372 existing tests pass.
- **Writes recheck the caller's grant inside the same statement or transaction as the version check:** establishment, legal profile, opening hours and pickup scheduling (`EstablishmentSettingsRepository.cs:23-30`, `:45-52`); order email (`OrderEmailSettingsRepository.cs:18-25`); ordering operations (`OrderingOperationsRepository.cs:27`); theme draft (`ThemeSettingsRepository.cs:18-25`); theme publication (serializable, row-locked, `ThemePublicationRepository.cs:26-44`). A revocation between check and write cannot slip through.
- **List queries filter by tenant before paging or ordering:** kitchen list (`OrderRepository.cs:266`), history (`:426`), dashboard metrics (`:332-345`), analytics (`AnalyticsRepository.cs:99-105`), catalog history (`CatalogPublicationRepository.cs:43-46`), management catalog (`CatalogRepository.cs:86`), public menu (`:496-526`).
- **Raw SQL and query filters.** There are no EF global query filters. The four raw-SQL uses are interpolated (parameterized) and tenant-keyed: `ThemePublicationRepository.cs:29-30`, `CatalogPublicationRepository.cs:199-200`, `OrderRepository.cs:210`, `:225-229`.
- **Tenant-owned relationships use composite tenant foreign keys,** as before (`ProductConfiguration`, `ProductOptionGroupConfiguration`, `ProductOptionConfiguration`, `MediaAssetConfiguration`). Restaurant memberships and invitations are also bound to their organization's role and tenant by composite keys (`RestaurantMembershipConfiguration.cs:19-27`, `StaffInvitationConfiguration.cs:25-32`).
- **Hub join and delivery.**
  - `JoinRestaurant` checks persisted `kitchen.display` (owners included) before adding the connection (`KitchenHub.cs:12-22`, `KitchenSubscriptionAccess.cs:9-11`).
  - The hub requires authentication (`KitchenHub.cs:8`, `Program.cs:76-77`), and the group name is derived on the server (`KitchenHub.cs:38`).
  - Events are sent per connection only after a fresh permission check. Failing subscriptions are removed from the registry and group (`SignalRKitchenEventPublisher.cs:11-24`), so a role change or revocation takes effect at the next event. Connections close at token expiry (`Program.cs:76`).
  - `Clients.Group` is not used.
- **Public controllers expose only published or public data:**
  - Brand assets come only from the published theme snapshot (`MediaRepository.cs:14-23`).
  - The public theme returns the published appearance and asset flags only (`ThemePublication.cs:65-71`).
  - The menu, tenant locales and establishment locales come from the published catalog snapshot when one exists (`CatalogRepository.cs:501-503`, `TenantsController.cs:21-24`, `:45-50`). New restaurants get an empty published snapshot at creation (`TenantRepository.cs:28-30`).
  - Draft previews need `storefront.manage` (`BrandMediaService.cs:63`).
  - Pickup slots return slot availability only (`OrderRepository.cs:51-66`).
  - One nuance: public product photos check the live catalog (visible category, non-archived product) rather than the published snapshot (`ProductPhotoRepository.cs:11-14`). A photo of a product added in an unpublished draft is therefore served to anyone holding its product and asset GUIDs. Those IDs appear only in management responses, so this is not a disclosure path.
- **Public tracking.** Both slug and Host variants require a 256-bit per-order capability compared in fixed time, before expiry (`OrderRepository.cs:504-532`). They now return a line and price summary, but no customer name, email, phone or notes.
- **Analytics withdrawal** (`AnalyticsController.cs:36-56`) is anonymous by documented design (`api-contracts.md:400`).
  - It deletes only that tenant's fingerprints and repeat links matched by a keyed HMAC of the normalized email (`AnalyticsPrivacyService.cs:12-51`, `AnalyticsRepository.cs:34-64`).
  - It returns the same body whether or not a record matched and is rate-limited per tenant and client address.
  - Someone who knows a customer's email can withdraw that customer's analytics consent. That only reduces data held and does not alter order-update consent.
  - The BFF route adds no Origin check (`app/api/public/analytics-withdrawal/route.ts:5-41`), which gives no more than the anonymous API already allows.
- **Dashboard metrics.** Kitchen staff receive counts, queue and preparation time but `orderValue: null`. Value needs `analytics.view` (`GetDashboardMetricsQueryHandler.cs:24-28`), matching `api-contracts.md:153`.
- **Stripe Connect.**
  - Linking is owner-only at start and at completion, with single-use 10-minute hashed state (`StripeConnectHandler.cs:83-116`).
  - A tenant that is already connected, or an account already linked to another tenant, cannot be re-linked (`StripeConnectRepository.cs:54-59`, unique indexes in `StripeConnectConnectionConfiguration.cs`).
  - Only a standard account with `read_write` scope and a matching live mode is accepted (`StripeConnectHandler.cs:123-130`).
  - The callback redirects only to the configured HTTPS or loopback frontend (`StripeConnectController.cs:41-52`).
  - Unlinking happens only through the signature-verified `account.application.deauthorized` webhook (`StripeConnectProvider.cs:100-122`, `StripeConnectRepository.cs:122-133`). The webhook is idempotent per event ID (`:107-109`).
  - The Stripe dashboard link is returned to owners only (`StripeConnectHandler.cs:77`).
  - Existing tests cover a Manager without `billing.manage` (denied status and start) and a billing grant that does not allow OAuth start (`StripeConnectHandlerTests.cs:41`, `:54`).
  - Payment amount authority and webhook replay windows are W3.
- **Catalog publication and history.**
  - Publish, discard and restore lock the tenant's publication head in a serializable transaction with a version check (`CatalogPublicationRepository.cs:50-56`, `:195-202`).
  - History is tenant-filtered (`:37-47`). It shows each revision's actor as raw OIDC issuer and subject to `catalog.manage` holders of that tenant (`:321-324`, rendered at `components/workspace/catalog/publication/catalog-publication-dialogs.tsx:195`). These are opaque identifiers of the same restaurant's staff, so there is no tenant-isolation effect. That they are shown at all is a W7 hygiene note.
- **Translation review.** The decision path allows the submitting author to approve their own translation whenever they hold `catalog.manage` (`CatalogTranslationWorkflow.cs:95-105`, `:172-174`). This is the documented single-permission design, not a tenant issue.
- **Role administration.**
  - Creating, editing and archiving roles is owner-only (`OrganizationRolePermissionsHandler.cs:27`, `:67`, `:101`, `:127`). The Owner role cannot be edited or archived, built-in roles cannot be archived, and roles with active assignments cannot be archived (`:69-70`, `:129-136`; `OrganizationRoleGrantSet.cs:181-190`).
  - Member role changes are owner-only and scoped to the organization (`ChangeRestaurantMemberRoleHandler.cs:15-24`).
  - Staff-manager team and invitation reads cover only restaurants where the caller holds `staff.manage`, never owner invitations, and never issuer, subject or token material (`OrganizationProvisioningRepository.cs:40-55`, `:101-112`, `:148-166`). Covered by `ManagerTeamReadsAreLimitedToRestaurantsWhereTheyHaveStaffManagement`.
- **Invitation acceptance** requires a verified JWT email equal to the normalized recipient and an active organization. It is single-use (`StaffInvitation.cs:78-86`, `StaffInvitationRepository.cs:26-40`). Revocation is owner-only for owner invitations, `staff.manage` for restaurant invitations, and pending-only (`:72-97`).
- **JWT validation fails closed.** Production requires an HTTPS issuer and an audience (`ServiceRegistration.cs:29-32`). Without issuer and audience there are no signing keys and no valid issuer, so every token is rejected. Inbound claim mapping is off (`:55`).

### W1b — BFF, actions and caches

- **Account source.** Every authenticated BFF call gets its token from `getApiToken`, which reads the server session from request cookies, requires a verified email and returns the caller's own Better Auth JWT (`apps/frontend/lib/api/index.ts:6-20`, unchanged). Without it the factory returns 401 before any network call (`lib/api/request-factory.ts`). No handler or action takes an account or user ID from the browser.
- **Browser tenant IDs.**
  - Handlers and actions pass `tenantId`/`organizationId` only as path selectors after UUID validation (except SEC-07). The two regex-checked establishment actions still yield one hex segment. The API rechecks persisted permission on every call.
  - The kitchen orders, dashboard metrics, ordering-operations and catalog-history BFFs add their own permission precheck against `/me` and return 403 before reading (`app/api/kitchen/orders/route.ts:30-43`, `app/api/kitchen/dashboard/metrics/route.ts:19-32`, `app/api/kitchen/dashboard/ordering-operations/route.ts:13-45`, `app/api/catalog-history/route.ts:31-41`).
  - Media `POST` handlers call the list endpoint first, so an unauthorized upload is refused before the body is read (`app/api/brand-assets/route.ts:78-80`, `app/api/product-photos/route.ts:84-90`).
- **Privileged tokens.**
  - There is no service or shared API credential in the frontend. `BETTER_AUTH_API_KEY` only enables the Better Auth dashboard plugin (`lib/auth.ts:123-125`).
  - Public clients are built with `public: true` and `getToken: async () => null`: public brand assets `route.ts:38-42`, product photos `route.ts:50-53`, tracking `route.ts:87-91`, analytics withdrawal `route.ts:27-31`, `services/public-establishment.ts:32-35`, `services/order-quote.ts:34-38`, `services/public-pickup-slots.ts:30-34`, `lib/checkout/order-client.ts:41-44`.
  - A signed-in user's token therefore never reaches the public API routes.
- **SignalR token for a foreign tenant.** `api/kitchen/signalr-token` takes no tenant input and returns only the caller's own account token after exact-Origin and verified-session checks (`app/api/kitchen/signalr-token/route.ts:24-47`). Tenant access is decided by `KitchenHub.JoinRestaurant` (`KitchenHub.cs:18-20`). It cannot mint a token for another account or tenant. Token exposure itself is SEC-06.
- **Public proxies.**
  - The tenant comes from the request `Host`, restricted to one DNS label under `STOREFRONT_BASE_DOMAIN` (`lib/api/tenant-routing.ts`, unchanged).
  - Alternatively, a single `restaurantSlug` query value is honored only when the Host exactly equals the configured `STOREFRONT_PATH_BASE_DOMAIN`. On a tenant host the slug must equal the host's own tenant, and duplicate or malformed selectors fail closed (`lib/storefront-preview-routing.ts:74-148`, `:188-240`).
  - The slug is validated against `^[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?$` (`:8`) before it is placed in `/api/v1/public/restaurants/{slug}` on the server-only `API_BASE_URL` (`:118-131`).
  - Paths must stay under `/api/v1/` on that origin (`lib/api/request-url.ts:7-30`), and redirects are refused (`lib/api/request-options.ts:36`).
  - This leaves no SSRF target beyond configured API hosts and no way to select a tenant other than by Host or a validated public slug, which only reaches that tenant's public data.
- **`.well-known/openid-configuration`** returns only the issuer and JWKS URI derived from `BETTER_AUTH_URL` (`app/.well-known/openid-configuration/route.ts:5-17`), with no tenant or user data.
- **CSRF on actions.**
  - Next 16.3.4 aborts a server action whose `Origin` host differs from `Host`/`X-Forwarded-Host` (`next/dist/server/app-render/action-handler.js:351-366`, `:438-460`). `next.config.ts` sets no `allowedOrigins`.
  - `getApiToken` additionally refuses a token when `Origin` is present and differs from `BETTER_AUTH_URL` (`lib/api/index.ts:13`).
  - The session cookie is `SameSite=Lax` (stale-base runtime sign-in response; configuration unchanged).
  - Guest checkout requires an exact same-origin `Origin` (`actions/checkout.ts:13-27`).
- **CSRF on route handlers.**
  - Every authenticated mutating handler requires an exact `Origin` match: `app/api/brand-assets/route.ts:39-44`, `:73-74`, `:110-111`; `app/api/product-photos/route.ts:42-47`, `:78`, `:108`; `app/api/theme-settings/route.ts:41-42`; `app/api/theme-publication/route.ts:24-29`, `:42`; `app/api/kitchen/signalr-token/route.ts:24-28`.
  - The public tracking and quote handlers require same origin (`tracking/route.ts:19-23`, `:122-133`; `order-quote/route.ts:7-10` when `Origin` is present).
  - `GET` handlers change no state, return `private, no-store` with `Vary: Cookie`, and are not readable cross-origin.
- **Caches.**
  - There is no `unstable_cache`, `"use cache"`, `revalidatePath`, `revalidateTag`, React `cache()` or route-segment `revalidate` anywhere in `apps/frontend` outside `node_modules` (search of `app`, `actions`, `lib`, `services`, `components`, `hooks`).
  - Every factory request uses `cache: "no-store"` (`lib/api/request-options.ts:35`). Authenticated handlers answer `private, no-store` with `Vary: Cookie`; public proxies answer `no-store` with `Vary: Host`.
  - Client query keys include the user ID and tenant ID: `lib/query/order-query.ts:4-10`, `dashboard-metrics-query.ts:4-19`, `ordering-operations-query.ts:4-19`, `hooks/use-tenant-theme.ts:32`, `:60`, `hooks/use-product-photos.ts:29`, `components/workspace/catalog/publication/catalog-publication-dialogs.tsx:80`, `components/workspace/settings/restaurants/establishment-editor.tsx:29`.
  - The analytics key carries the tenant, role and permission scope but not the user ID (`components/workspace/analytics/analytics-workspace-client.tsx:45-58`). Sign-out clears the QueryClient (`components/auth/sign-out-button.tsx:21`), which covers it.
  - Public keys include the Host and slug (`components/storefront/current-collection-information.tsx:23`, `order-tracking.tsx:67`, `hooks/use-order-quote.ts:16`).
- **Guest cart.**
  - The Zustand store is created per `GuestCheckoutProvider` mount for the menu's tenant (`components/storefront/guest-checkout-provider.tsx:20`, `lib/state/guest-checkout-store.ts:5-8`). It lives only in memory, with no `persist` or storage.
  - Path-based storefronts now share one origin across tenants, but the in-memory, per-mount store does not carry a cart between them.
  - The order goes only to the Host- or slug-derived tenant API (`lib/checkout/order-client.ts:17-48`), which revalidates products and prices.
  - The workspace settings draft in `localStorage` is keyed `whiteplate-live-draft:{userId}:{organizationId}:settings` (`components/workspace/settings/live-settings.tsx:28-30`) and holds simulated UI state only.
  - The public `demo/*` pages keep static demo data in browser storage (`lib/lovable/customerOrder.ts`, `lib/lovable/menu.ts`, `lib/lovable/storeTheme.ts`), with no tenant data and no API call.
- **`proxy.ts`** runs the storefront path rewrite and then `next-intl` locale routing. It makes no authorization decision (`apps/frontend/proxy.ts:8-24`), so its matcher (which skips `api`, `_next`, `_vercel` and any path with a dot, `:26-28`) cannot leave a protected route open. The rewrite applies only on the configured path host to `/{en|fr}/{slug}` and `/{en|fr}/{slug}/order/{uuid}`, never to reserved workspace segments (`lib/storefront-preview-routing.ts:10-72`). Workspace protection is in the server layout (`app/[locale]/(workspace)/organization/layout.tsx:14-17`), and every workspace data read goes through `whitePlateApi`, which returns 401 without a verified session. All 11 `*-test` fixture pages under `app/[locale]` call `notFound()` outside development.
- **Invitation tokens.** `sendStaffInvitation` receives the invitation token from the API, emails it server-side and never returns it to the browser. On delivery failure it revokes the invitation (`services/organization.ts:291-327`).

## Not covered

- **Runtime API, hub and BFF probes on this base.** The Neon `test` database is at migration `20261014150246_OrderingOperations`. The code needs the 13 migrations from `20261014211126_DiscountMinimumAndExpiration` through `20261019082708_OrderCustomerDetails`, and `OrganizationRoleGrants` (read by every permission check), `CatalogPublicationHeads`, `StripeConnect*` and the analytics tables are absent. Applying migrations is a schema change outside the audit's constraints, so no local server was started.
  - All 191 matrix rows rest on source review plus the 372 passing tests.
  - No foreign-tenant, cross-resource, custom-role or hub replay was run against the new permission model.
  - The SEC-08, SEC-09 and SEC-10 sketches are unexecuted.
- **Live Kitchen, Manager, Accountant and custom-role tokens, and a second verified account.** These were not created, for the reason above.
- **Stripe OAuth and webhook end to end.** This needs Stripe test credentials and a reachable callback. Amount authority and webhook replay are W3.
- **Inactive-restaurant behavior at runtime (SEC-01).** No inactive tenant exists, and deactivation has no API.
- **Hosted environments.** The production API returns 503 (HOST-01, W8), and hosted probes are limited to unauthenticated reads. The hosted path-storefront and `set-auth-jwt` behavior were not checked on Vercel.
- **Server actions over HTTP.** Action IDs are build-specific. All 43 actions were reviewed in source. Next's origin check was read in the installed 16.3.4 source, not exercised on this base.
- **Multi-instance SignalR, token-expiry closure and reconnection.** These follow the documented single-instance design.
- **Rate-limit keying.** The checkout, quote and withdrawal limiter keys on `Connection.RemoteIpAddress` (`OrdersController.cs:30`, `:62`; `AnalyticsController.cs:47`). `Program.cs` has no forwarded-headers middleware, and the BFF calls the API server-side. Whether limits are effectively per client or global per tenant behind Traefik and Vercel belongs to W5.
- **XSS and Content-Security-Policy, which decide how far SEC-06 matters.** Covered by W5 in source, no finding (`w5-supply-chain-config.md:177`); no CSP is HOST-03 in W8.
- **Proxy access-log handling of the hub `access_token` query parameter (SEC-05).** W8; not observable while HOST-01 persists.

## ASVS / WCAG coverage

| Requirement | Result |
| --- | --- |
| V1.4.1 Access control enforced at trusted server points | Pass: all decisions are in API handlers or repositories. The BFF adds session, origin and permission prechecks but is not relied on. |
| V1.4.4 Single, well-vetted access control mechanism | Partial: one `HasPermissionAsync` path and shared `CatalogAccess`, `OrderStaffAccess` and `StorefrontAccess` helpers, but some operations map to the wrong permission (SEC-08), there is no fallback policy (SEC-03), and tenant-activity checks are inconsistent (SEC-01). |
| V1.4.5 Feature/data-level access control | Partial: tenant isolation holds. Feature permissions are wrong for analytics, reorder and discount deactivation (SEC-08), and suspended tenants are not excluded (SEC-01). |
| V4.1.1 Server-side enforcement | Pass (source and 372 passing tests). |
| V4.1.2 Attributes not manipulable by users | Pass: tenant, role and permissions come from persisted membership and grants, not from headers, body or token claims. BFF tenant IDs and public slugs are selectors only. One action does not validate its selector (SEC-07, no privilege gain). |
| V4.1.3 Least privilege | Gap: `staff.manage` delegates roles broader than the delegator's grants (SEC-09). Memberships and co-owners cannot be removed (SEC-02). Creation is unbounded (SEC-04). |
| V4.1.5 Access controls fail securely | Pass: unknown, foreign and revoked access returns 404/403. Missing or archived grants and invalid permission arguments fail closed (`StaffMembershipRepository.cs:35-37`, `:51-54`). Writes recheck atomically. |
| V4.2.1 IDOR protection | Pass in source: every route and body ID is rechecked against the route tenant or organization. Not replayed at runtime on this base (see Not covered). |
| V4.2.2 CSRF for cookie-authenticated functions | Pass: server actions use Next's Origin/Host check plus `getApiToken`'s origin check and `SameSite=Lax`. Mutating route handlers require an exact Origin. Not applicable to the API (bearer tokens only). |
| V4.3.1 MFA for administrative interfaces | Not covered here (W2). |
| V4.3.3 Additional authorization for sensitive operations | Gap: co-owner archive, role editing and Stripe payout linking need no step-up (SEC-02). The Stripe OAuth completion is not bound to the initiating session (SEC-10). |
| V13.1.3 No sensitive data in API URLs | Suspected gap: hub token in query string (SEC-05). |
| V13.1.4 Authorization at URI and resource level | Pass: route-level `[Authorize]` and resource-level tenant-scoped queries. |
| V13.2.1 Enabled HTTP methods are valid for the user and action | Pass: each method maps to one authorized handler; CORS methods are restricted (`ServiceRegistration.cs:76-83`). |
| V13.2.3 CSRF for RESTful services using cookies | Pass for the BFF route handlers: exact Origin on every authenticated mutation, `no-store` and `Vary: Cookie` on reads. The anonymous analytics-withdrawal BFF has no Origin check and changes only data the anonymous API already lets anyone remove. Not applicable to the API. |
| V13.2.6 Headers trusted only when appropriate | Pass: forwarded-host and tenant headers are ignored by the API (stale-base runtime, resolver unchanged). The BFF derives public tenants only from a validated one-label Host, or from a validated slug on the exact configured path host. |
| Token confinement to the server (outside the named chapters; closest is V8.2 client-side data protection) | Gap: a general-purpose API token is readable by browser JavaScript (SEC-06). |
| WCAG | Not applicable to W1. |
