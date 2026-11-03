# W9 — Performance (lightweight)

## Scope and method

Audit date 2026-10-25. Audited code is `origin/main` `55f31a5`; this file was written on a branch whose base (`849e3cd`) changes only documentation. W9 is a light pass over the guest path (storefront menu, add to cart, product photos) with a lab measurement, plus a source review of the public menu and the order-history queries. It does not replace a load test.

Questions answered: N+1 or lazy loading; unbounded `ToList` on tenant data; indexes for `(TenantId, …)` filters and the order-history cursor; whether the public menu is cached; image sizing, `srcset` and lazy loading; the largest client bundles and their causes. Thresholds: LCP at most 2.5 s, CLS at most 0.1, INP at most 200 ms. A miss on the guest path is Should.

### Probe 1: browser measurement of the guest storefront (production build)

Lighthouse was not approved, so the brief's fallback was used: a Playwright script outside the repository (scratchpad `perf.cjs`, `perf-diag.cjs`, `scripts.cjs`) driving the installed Chrome 155 through Playwright 1.63.0 (the project's own dependency, `channel: "chrome"`, headless).

- Build: `git -c core.autocrlf=false archive 849e3cd apps/frontend docs/design-system` into a scratch directory, `npm ci` there with Node 24.19.0 by full path (exit 0), then `npm run build` (`next build --webpack`, compiled in 82 s, exit 0) with the inert CI-shaped placeholder variables from the README baseline (`*.invalid` hosts, `ci-only-*` secrets, loopback database URL). Served with `next start --port 3017` (a production server, not `next dev`). No real credential was used.
- Target: the "Guest checkout browser fixture" of `docs/development.md` (`apps/frontend/tests/fixtures/checkout-api.mjs`, tenant `bistro`, menu with one category and two products, Soup has a required bread option) at `http://bistro.localhost:3017/en`, with `STOREFRONT_BASE_DOMAIN=localhost`, `PUBLIC_TENANT_API_URL_TEMPLATE=http://{tenant}.localhost:5199` and the repository's `localhost-dns.cjs` preload.
- Two edits were made in the scratch copy only, so the repository is untouched: (1) the fixture's hard-coded port 5189 became 5199, to avoid colliding with another audit worker; (2) the `process.env.NODE_ENV === "production" && target.protocol !== "https:"` clause in `apps/frontend/lib/api/tenant-routing.ts` was removed before the build, because a production build refuses a plain-HTTP tenant API and the fixture cannot serve HTTPS. That clause is a protocol check with no rendering cost, so the result still reflects the production bundle, but it is a deviation and is labelled here. A per-path hit counter was also added to the scratch fixture.
- Emulation: viewport 390x844 at device scale 2, mobile and touch; CDP `Emulation.setCPUThrottlingRate` 4; CDP `Network.emulateNetworkConditions` latency 150 ms, 1.6 Mbit/s down, 750 kbit/s up (the Lighthouse mobile profile); a fresh browser context (cold cache) for every run.
- Metrics: LCP, FCP and layout shifts through `PerformanceObserver` (CLS uses session windows of at most 5 s with gaps under 1 s); long tasks for a total-blocking-time figure; INP proxy from `PerformanceObserver` with `type: "event"` and `durationThreshold: 16`, taking the worst interaction among three taps (Add Soup, choose Sourdough, "Add 1"), so it is a three-interaction proxy of INP, not a field INP.
- Machine: Windows 11 workstation shared with other audit workers, so timings carry noise. Treat them as order of magnitude and as relative to the thresholds.

| Run set | LCP (ms) | FCP (ms) | CLS | INP proxy (ms) | Long-task time over 50 ms (ms) | Transferred |
| --- | --- | --- | --- | --- | --- | --- |
| Unthrottled, n=2 | 908, 892 | 908, 892 | 0 | 88, 72 | 83, 25 | 1006 KB |
| 4x CPU and Slow 4G, n=5, first tap 6 s after load | 1676, 1656, 1824, 1620, 1512 | 1096, 980, 1096, 980, 920 | 0 | 352, 488, 552, 592, 536 | 727 to 1566 | 1006 KB |
| 4x CPU and Slow 4G, n=3, first tap 14 s after load (hydration finished) | 1676, 1820, 1808 | 1024, 1092, 1144 | 0 | 368, 328, 304 | 880 to 1197 | 1006 KB |

Reading: LCP passes (1.5 to 1.8 s) and CLS passes (0, one zero-value shift entry). The LCP element in every run is the `h1` restaurant name, because the fixture menu has no photos. INP proxy fails by a wide margin when CPU is throttled (PERF-01). The first tap, which opens the product dialog, spends 268 to 320 ms inside its `click` handler (the other two taps spend 19 to 132 ms), after 25 to 35 ms of input delay; the later taps stay under 200 ms in the post-hydration set. The throttled load event fires at about 5.0 s, because the page transfers 1006 KB cold: scripts 286 KB (30 chunks), fonts 617 KB (Inter 470 KB, four Space Grotesk files 147 KB), the document 77 KB, stylesheet 24 KB.

Per page view the Next.js server made exactly one menu request and one theme request to the API (counted at the fixture: `/api/v1/menu` 1, `/api/v1/theme` 1), so `generateMetadata` and the page body do not double the API calls (Next.js request memoization).

### Probe 2: EF statement counts (SQLite test host, not PostgreSQL)

A probe test lived only in a `git archive` copy of `apps/api` in the scratchpad (with the repository's `global.json`), using the existing `OrdersFactory` (in-process `WebApplicationFactory<Program>`, SQLite in memory, `Production` environment). The factory's `AddDbContext` call was edited to add a `DbCommandInterceptor` that records `CommandText`. It seeded 60 orders through `POST /api/v1/orders` (checkout limit raised to 1000 for the seed), then issued one request per case and counted statements. The probe file and the edited test file were deleted after the run; nothing was added to the repository. The counts are for SQLite and the EF provider's SQL, so statement text differs on Npgsql; row counts are small, so this says nothing about timings or plans.

| Request (host `bistro.example.test`, 60 orders in the tenant) | HTTP | SQL statements | Breakdown |
| --- | --- | --- | --- |
| `GET /api/v1/menu` (public, cold) | 200 | 4 | tenant resolution (full `Tenants` row), tenant again (full `Tenants` row), `CatalogPublicationHeads`, `MediaAssets` |
| `GET /api/v1/menu` (repeat) | 200 | 4 | identical, nothing cached |
| `GET /api/v1/tenants/{id}/orders/history?page=1&pageSize=25` (manager) | 200 | 7 | 4 authorization reads, `COUNT(*)`, one page query (orders, lines, options), one `OrderEmailDeliveries` query |
| same with `search=guest` | 200 | 7 | the `COUNT(*)` carries `instr(upper(CustomerName), …) > 0 OR upper(CAST(Id AS TEXT)) LIKE …` |
| `GET /api/v1/tenants/{id}/orders?pageSize=25` (kitchen list, cursor) | 200 | 6 | 4 authorization reads, one page query, one `OrderEmailDeliveries` query |
| `…/orders/history?page=2&pageSize=25&sort=total&direction=desc` | 500 | 6 | the page query orders by `"o"."Total" COLLATE EF_DECIMAL`; the failure is a SQLite test-host limitation that was not diagnosed. This case is Not covered. |

Statement counts do not grow with the number of orders returned, so there is no N+1 in these paths.

## Findings

### PERF-01 — Opening a product on a throttled phone takes 300 to 600 ms to respond

- **Workstream:** W9
- **Location:** `apps/frontend/components/storefront/product-ordering.tsx:26-209` (hypothesised cause, not profiled: every product card owns a `Dialog` with its own photo gallery and option tree), rendered from `apps/frontend/components/storefront/menu-product-card.tsx:144`
- **Evidence:** Production build, guest fixture, CDP 4x CPU and Slow 4G, cold cache. Worst-interaction (INP proxy) across 8 throttled runs: 352, 488, 552, 592, 536 ms with the first tap 6 s after load, and 368, 328, 304 ms with the first tap 14 s after load, once hydration had finished. In the 14 s runs the first tap is `click` with 27 to 35 ms input delay and 268 to 320 ms processing (`click` entry at `processingEnd - processingStart`); the second tap (Sourdough) is 72 ms and the third ("Add 1") is 104 to 200 ms. Unthrottled the same flow is 72 to 88 ms. The symptom is measured; the cause is a hypothesis. What the handler spends its time on (dialog tree mount versus the cart state update, or one dialog per card) was not profiled.
- **Impact:** On a mid-range phone, a guest who taps the add button waits about a third of a second to half a second before the dialog appears, above the 200 ms INP threshold, on the first action of every order. Menus with more products than the two-product fixture may be worse because every card carries a dialog, which is not measured.
- **Severity:** Should
- **Fix direction:** Profile the first tap with the React Profiler under 4x throttling. Candidates: mount `DialogContent` and the photo gallery only while open, render one shared dialog instead of one per card, and defer non-essential work with `startTransition`. Re-measure with the script below and keep the result under 200 ms.
- **Regression test:** Sketch below
- **Status:** Confirmed

```text
Test: Playwright against `next start` and the checkout fixture, Chrome, CDP CPU throttling 4, Slow 4G;
wait for hydration (no long task for 2 s); register a PerformanceObserver {type: "event", durationThreshold: 16};
tap "Add Soup", then the option, then "Add 1".
Expected: the maximum entry duration for each interaction (interactionId > 0) is at most 200 ms
Actual:   304 to 368 ms for the first tap after hydration (352 to 592 ms before it settles).
```

### PERF-02 — Public product photos are not cacheable (documented no-store decision, a cost to revisit)

- **Workstream:** W9
- **Location:** `apps/api/WhitePlate.Api/Controllers/PublicProductPhotosController.cs:12` (`[ResponseCache(NoStore = true, Location = ResponseCacheLocation.None)]`); `apps/frontend/app/api/public/product-photos/[productId]/[assetId]/[size]/route.ts:31` and `:54-63` (`"Cache-Control": "no-store"`, body relayed from `api.image`); `apps/frontend/lib/api/request-options.ts:35` (`cache: "no-store"`); `apps/frontend/lib/product-photos.ts:70-75` (the browser URL is this route); `apps/api/WhitePlate.Application/Media/ProductPhotoService.cs:61-67` (sizes 320, 640, 1200; the object key includes the asset id) and `:63` (`PublicProductExistsAsync`, the per-request visibility check); decision `docs/architecture/decisions/0008-product-photo-gallery.md:30`; contract `docs/api/api-contracts.md:188`
- **Evidence:** Source and documents only. The guest photo URL `/api/public/product-photos/{productId}/{assetId}/{size}` is served by a Next.js route handler that fetches the whole image from the API with `no-store`, buffers it, and returns it with `Cache-Control: no-store`; the API sends `no-store` too and reads the bytes from object storage on every request. This is intended: ADR 0008:30 says "public image responses use `no-store`, with host variation at the BFF", and `api-contracts.md:188` says "public images use `no-store` and `Vary: Host` at the BFF". The per-request check at `ProductPhotoService.cs:63` (`PublicProductExistsAsync`) and the asset lookup at `:64-66` (`IsActive`, `IsReady`, `ExpiresAt`) are why hidden or archived products, and replaced or removed photos, stop serving immediately. The implementation matches the decision, so there is no policy violation; the price is cacheability. An asset id identifies one immutable upload, but the response can be reused by no browser, CDN or shared cache. The fixture menu has no photos, so no photo timing was measured (Not covered).
- **Impact:** Every photo on every guest page view costs a serverless function invocation, an API request with two database reads and an object-storage read, and the browser refetches photos it already has on each navigation, such as returning from checkout to the menu. A menu with 20 photos is 20 such round trips per view. This raises hosting cost and delays photo paint, which is usually the LCP element on a photo menu. It is a trade made for immediate takedown, not an oversight, and its size is unmeasured here.
- **Severity:** Could
- **Fix direction:** Owner decision: revisit ADR 0008:30 and `api-contracts.md:188`, weighing hosting cost and photo paint against takedown latency. Options that keep takedown short and are safe: a short `max-age` (for example 60 s) with `stale-while-revalidate`, or `ETag` revalidation (`no-cache` plus a validator, so the browser sends a conditional request that still runs the visibility check and returns 304 without the body). One-year `immutable` caching is conditional on the owner accepting delayed takedown of a hidden or archived product's photos in browser and CDN caches. Whatever is chosen, record it in the ADR and keep `no-store` for the protected staff route.
- **Regression test:** Sketch below
- **Status:** Confirmed

```text
Request: GET /api/v1/products/{productId}/photos/{assetId}/640 (tenant host), then the BFF route
GET /api/public/product-photos/{productId}/{assetId}/640, then the same after the product is hidden
Expected: after the owner's decision (for example ETag revalidation): 200 with a validator, 304 on a conditional repeat, 404 once the product is hidden
Actual: Cache-Control no-store on both, as ADR 0008:30 states (source); a hidden product returns 404 on the next request
```

### PERF-03 — Every guest page embeds the whole translation catalog (about 178 KB of strings)

- **Workstream:** W9
- **Location:** `apps/frontend/app/[locale]/layout.tsx:28` and `:33` (`getMessages()` passed whole to `NextIntlClientProvider`); `apps/frontend/messages/en.json`, `fr.json` (204 KB and 222 KB on disk)
- **Evidence:** In the production build the storefront document is 227,848 characters and 76,630 bytes gzipped (`curl -H "Accept-Encoding: gzip" --resolve bistro.localhost:3017:127.0.0.1 http://bistro.localhost:3017/en`), for a page with two products. `messages/en.json` minified is 178,392 bytes, 65,647 bytes gzipped, so the catalog is about 86 percent of the gzipped document. The marker string `LovableOriginal` occurs once in the HTML, at offset 96,742 of 227,848 (the catalog is serialized once). The largest namespaces are `Lovable` (37.8 KB), `LovableOriginal` (37.6 KB), `Marketing` (12.7 KB), `Redesign` (11.6 KB), `Auth` (9.0 KB) and `LiveWorkspace` (8.8 KB), most of which the storefront does not render (`Redesign` is the exception: `live-tracking-progress.tsx` and `order-tracking.tsx` use it). Namespaces the storefront and tracking pages do use are `Storefront`, `Checkout`, `ProductPhotos`, `OrderTracking`, `Redesign`, `CollectionInformation`, `OpeningHours`, `BrandAssets`, `AnalyticsPrivacy` and `HomePage`, which total about 26.8 KB minified, so about 151 KB of the catalog is unneeded on a guest page.
- **Impact:** Every cold guest view downloads and parses roughly 65 KB of compressed strings it does not use, on a document that cannot be cached (`Cache-Control: private, no-cache, no-store`, tenant by host). At the Slow 4G profile that is about 0.3 s of transfer before the document completes. The cost grows with every new screen, because new namespaces are added to the same catalog.
- **Severity:** Should
- **Fix direction:** Provide only the namespaces a route needs: pick them in a route-level layout or provider (`NextIntlClientProvider messages={pick(messages, [...])}`) for the storefront and tracking routes, and keep the full catalog for the workspace. Re-measure the document size.
- **Regression test:** Sketch below
- **Status:** Confirmed

```text
Request:  GET http://bistro.localhost:3017/en (production build, fixture tenant), Accept-Encoding gzip
Expected: the HTML does not contain keys from unrelated namespaces (for example Auth, LiveWorkspace, Marketing);
gzipped document well below 30 KB
Actual:   76,630 bytes gzipped; contains the whole catalog (178,392 bytes minified)
```

### PERF-04 — Guest page downloads 617 KB of fonts, mostly uncompressed-format TTF

- **Workstream:** W9
- **Location:** `apps/frontend/app/globals.css:262-263` (`@font-face` for Inter, `/design/inter.ttf`, 856 KiB on disk, and Plus Jakarta Sans); `apps/frontend/public/lovable/*.ttf` (theme fonts, 45 to 130 KiB each, loaded through the restaurant theme); no preload or `next/font` use found for the guest path
- **Evidence:** Cold throttled run transfer by type: Font 616,874 bytes of 1,006 KB total. By file: `/design/inter.ttf` 469,591 bytes transferred, and four `/lovable/space-grotesk-*.ttf` weights (400, 500, 600, 700) at about 37 KB each (147,283 bytes together). All faces are `font-display: swap`, which kept CLS at 0 and the `h1` LCP independent of fonts in the lab. The throttled load event fires at about 5.0 s, as the fonts and scripts compete for 1.6 Mbit/s.
- **Impact:** Fonts are 61 percent of the first-load bytes and compete with the JavaScript that hydrates the page, which prolongs the busy period measured in PERF-01 on slow networks. A theme with a heavier serif family costs more (Lora and Playfair TTF are 120 to 130 KiB per weight). Not a threshold miss in the lab.
- **Severity:** Could
- **Fix direction:** Convert to subset `woff2` (Latin and Latin Extended, variable weight where available), serve through `next/font/local` so Next adds preloads and size-adjusted fallbacks, and drop weights the storefront does not use. Verify that an unneeded face (Inter, if the storefront theme does not use it) is not requested.
- **Regression test:** None
- **Status:** Confirmed

### PERF-05 — Guest photos are all lazy, including the first card, and thumbnails use the 640 variant

- **Workstream:** W9
- **Location:** `apps/frontend/components/product/photo-image.tsx:47-56` (`loading={tenantId && size === 640 ? "eager" : "lazy"}`, `unoptimized`, no `sizes`, no `priority`); `apps/frontend/components/storefront/menu-product-card.tsx:44-53` (guest card: `restaurantSlug` only, no `tenantId`, `size={640}`, list layout in a 7 rem column)
- **Evidence:** Source only. The eager condition keys on `tenantId`, which only staff previews pass (`photoUrl` uses `tenantId` to choose the authenticated route), so every guest card image is `loading="lazy"`, including the first card, which sits inside the first mobile viewport in the fixture screenshot. `next/image` with `unoptimized` emits no `srcset`, so the browser cannot choose a variant; the card always requests the 640 variant, including in the list layout where the image column is 7 rem (112 px) wide. The API stores 320, 640 and 1200 widths, so a 320 variant exists. The effect on LCP was not measured because the fixture has no photos.
- **Impact:** On a photo menu the LCP candidate is likely the first card image: lazy loading can delay its request until layout is known, and the bytes are larger than the list layout needs. Probably tens of milliseconds to a few hundred on Slow 4G; unmeasured.
- **Severity:** Could
- **Fix direction:** Pass an explicit `priority` (or `loading="eager"` with `fetchPriority="high"`) for the first one or two guest cards, keep lazy for the rest, and request 320 for the list layout. Measure with a fixture menu that has photos before and after.
- **Regression test:** None
- **Status:** Suspected

### PERF-06 — Public menu is recomputed for every view and reads the tenant twice

- **Workstream:** W9
- **Location:** `apps/api/WhitePlate.Api/Controllers/MenuController.cs:15` and `:26` (`NoStore`); `apps/api/WhitePlate.Infrastructure/Persistence/Repositories/CatalogRepository.cs:496-503` (second tenant read) and `:610-665` (snapshot mapping, with in-memory `Where` per product and per group); `apps/api/WhitePlate.Api/Tenancy/TenantResolutionMiddleware.cs:29-30` with `TenantRepository.cs:14-16` (first tenant read); `apps/frontend/lib/api/request-options.ts:35`; `apps/frontend/app/[locale]/page.tsx` (dynamic, `Cache-Control: private, no-cache, no-store` measured)
- **Evidence:** In-process probe: a cold and a repeat `GET /api/v1/menu` each ran 4 statements; the first two are the same full-row `SELECT … FROM "Tenants"`, then `CatalogPublicationHeads` (whose `SnapshotJson` is deserialized per request) and `MediaAssets`. Nothing is cached in the API, the frontend fetches with `no-store`, and the page response is not cacheable. The catalog changes only at publish, and `CatalogPublicationHeads.PublishedVersion` is a ready cache key.
- **Impact:** Each guest view costs one API request with 4 statements and a JSON snapshot parse, so a lunch rush hits Neon and the API for data that is identical until the next publish. On the lab fixture this is invisible; it is a scaling and cost risk, and it is a latency term in LCP (the page waits for menu and theme before streaming its content). Not measured against PostgreSQL.
- **Severity:** Could
- **Fix direction:** Reuse the tenant already resolved by the middleware instead of reading it again in `GetMenuAsync`; add a short per-tenant, per-locale cache of the mapped menu keyed by `PublishedVersion` and photo changes (or an `ETag` plus `Cache-Control: public, max-age=…, stale-while-revalidate`) with explicit invalidation on publish and on availability changes (decision 0010 makes availability immediate, so that path needs an invalidation or a short TTL).
- **Regression test:** None
- **Status:** Confirmed

### PERF-07 — Order history uses offset pagination, a count per page, and search that cannot use an index

- **Workstream:** W9
- **Location:** `apps/api/WhitePlate.Infrastructure/Persistence/Repositories/OrderRepository.cs:422-448` (`CountAsync` at `:440`, `ToUpper().Contains` and `Id.ToString().ToUpper().StartsWith` at `:433-437`, `Skip((page - 1) * pageSize)` at `:448`, sort by `Total` at `:443-444`); `apps/api/WhitePlate.Application/Orders/ListOrdersQueryHandler.cs:49` (`Page` up to 100,000, `PageSize` up to 100); `apps/api/WhitePlate.Infrastructure/Persistence/Configurations/OrderConfiguration.cs:53-57`
- **Evidence:** Source and the probe's SQL. History page 1 ran a separate `SELECT COUNT(*) … WHERE TenantId = @tenantId` and a page query; with `search=guest` the count carries `instr(upper("o"."CustomerName"), @normalizedTerm) > 0 OR upper(CAST("o"."Id" AS TEXT)) LIKE …`, which an ordinary B-tree index cannot serve (the Npgsql translation is equivalent in shape). The index list has `(TenantId, CreatedAtTicks, Id)` for the default sort and the cursor list, `(TenantId, Status)`, `(TenantId, CreatedAt, Id)`, `(TenantId, ReadyAtTicks)` and `(Status, ClosedAtTicks, ArchivedAt)`, but none for `Total`, so `sort=total` orders every tenant order. The sort-by-total request returned 500 on the SQLite test host, so the Npgsql plan was not seen. The kitchen list is a true cursor (`OrderPageCursor`, `(CreatedAtTicks, Id)`, `Take(pageSize + 1)`) and is covered by the `(TenantId, CreatedAtTicks, Id)` index.
- **Impact:** For a restaurant with tens of thousands of orders, staff history pages cost a full tenant scan for the count, a scan with per-row string functions for every search, and deep offsets scan and discard rows. Staff-facing, not on the guest path, and not measurable on 60 rows.
- **Severity:** Could
- **Fix direction:** Drop the exact total count (or cache it), or switch history to the same keyset cursor as the kitchen list and use "next page" navigation; for search, store a normalized lowercase customer name column with a trigram or prefix index and match the order-id prefix against a stored text column or a range on the GUID; add `(TenantId, Total, Id)` only if sorting by total stays. Re-check the plans with `EXPLAIN (ANALYZE, BUFFERS)` on PostgreSQL with seeded volume.
- **Regression test:** None
- **Status:** Suspected

### PERF-08 — Analytics loads up to 180 days of orders with three collection includes in one query

- **Workstream:** W9
- **Location:** `apps/api/WhitePlate.Infrastructure/Persistence/Repositories/AnalyticsRepository.cs:99-105` (`Include(order => order.Lines)`, `AnalyticsFingerprints`, `AnalyticsRepeatLinks`, `ToListAsync`); `apps/api/WhitePlate.Application/Orders/GetAnalyticsMetricsQueryHandler.cs:16` (`Days` is 7, 30 or 90, and the query reads twice that window); `apps/api/WhitePlate.Api/Configuration/ServiceRegistration.cs:93` (`UseNpgsql` with no `UseQuerySplittingBehavior`); no `AsSplitQuery` anywhere in `apps/api`
- **Evidence:** Source only. With `Days = 90` the window is 180 days; the whole result set is materialized and aggregated in C# (`RevenueByCurrency`, `RepeatCustomers`, …). EF Core's default single-query mode joins the three collections, so each order produces `lines × fingerprints × repeat links` rows. The cost was not measured.
- **Impact:** Memory and database time grow with order volume and with repeat-customer links, and the query is the heaviest in the staff path. It matters only for busy restaurants and on the analytics screen, not for the guest path.
- **Severity:** Could
- **Fix direction:** Use `AsSplitQuery()` as a minimum, or better compute revenue, counts and repeat figures in SQL (grouped queries) and load only the order columns the aggregates need. Add a regression test that bounds the statement count and the row count for a seeded window.
- **Regression test:** None
- **Status:** Suspected

## Checked, no finding

- N+1 and lazy loading: no lazy-loading proxies are configured (`grep -rn "UseLazyLoadingProxies\|Proxies" apps/api` finds none; `ServiceRegistration.cs:93` is a plain `UseNpgsql`). Probe: statement counts stayed at 4 (menu), 7 (history) and 6 (kitchen list) with 60 orders and a page of 25; a page is one statement for orders, lines and options plus one for email deliveries (`OrderRepository.cs:448-476`, `GetEmailNotificationsAsync` at `:479`).
- Unbounded `ToList` on the hot paths: kitchen list is `Take(pageSize + 1)` with `pageSize` at most 100 (`OrderRepository.cs:272-273`, `ListOrdersQueryHandler.cs:22`); history is `Take(pageSize)` at most 100 (`:448`); dashboard metrics read a two-day window (`OrderRepository.cs:355`); the management catalog read loads one tenant's catalog (`CatalogRepository.cs:91-103`), which is staff-only and bounded by the catalog size. The published menu reads one snapshot row.
- Indexes for tenant filters: snapshot `WhitePlateDbContextModelSnapshot.cs` has `(TenantId, CreatedAtTicks, Id)` and `(TenantId, CreatedAt, Id)` on `Orders` (lines 724 and 726, used by the cursor and by analytics at `AnalyticsRepository.cs:30` and `:103`), `(TenantId, Status)` (720), `(TenantId, ReadyAtTicks)` (718), `OrderLines(OrderId)` (853), `OrderLineOptions(OrderLineId)` (880), `OrderEmailDeliveries(TenantId, OrderId, CreatedAt)` (1348), `ProductOptions(TenantId, GroupId)` (361), `ProductOptionGroups(TenantId, ProductId)` (400), `MediaAssets(TenantId, ProductId, IsActive, SortOrder)` (577), `PromotionDiscounts(TenantId, Code)` unique (446) and the unique tenant `Subdomain` index (1243, used by `TenantRepository.FindActiveBySubdomainAsync`). The order-history cursor ordering is covered (the default history order and the kitchen list both use `CreatedAtTicks` then `Id`, descending).
- Duplicate API calls per page view: `generateMetadata` and the page body both call `getPublicMenu` and `getPublicTheme` (`apps/frontend/app/[locale]/page.tsx:19-23`, `:63-67`), but the counter at the fixture showed one request each per render.
- Core Web Vitals other than INP, in the lab: LCP 1.5 to 1.8 s under throttling and CLS 0 (no `font-display: swap` shift, no late image or banner shift in the fixture). Limits are in Not covered.
- Guest-path bundle: 30 script chunks, 841 KiB raw and 267 KiB gzipped for a cold load including opening the product dialog (`scripts.cjs`). The biggest are shared runtime: chunk `3794` (236 KiB raw, 64 KiB gzipped), `react-dom` in `4bd1b696` (196 KiB raw, 62 KiB gzipped), Base UI in `4992` (41 KiB raw, 14 KiB gzipped); the route's own page chunk is 36 KiB raw (9 KiB gzipped). No SignalR, QR code or charts code is on the guest path. The largest client chunks in the build are `774` (403 KiB raw, 108 KiB gzipped, contains `recharts`) and `e7e73406` (802 KiB raw, 228 KiB gzipped, content not identified), and neither is loaded by the guest storefront: `e7e73406` is referenced only by workspace and `*-test` routes' client manifests. `next build` in this version prints no per-route size column, so sizes come from `.next/static/chunks`, `build-manifest.json` and the route client-reference manifests.
- `<img>` instead of `next/image` (the 19 `@next/next/no-img-element` warnings in the baseline): all are in `components/demo`, `components/marketing`, `components/storefront/demo` and `components/workspace/studio/page/shared.tsx` (`grep -rn "<img" app components`), none under the live guest path. The live path uses `next/image` with `unoptimized` on purpose (`photo-image.tsx:47-56`, `components/brand/asset-image.tsx:27-37`) because the API pre-renders 320, 640 and 1200 pixel WebP variants (`ProductPhotoService.cs:61`); see PERF-05 for the missing `srcset` effect. The marketing landing page is a separate branch of the same route (`app/[locale]/page.tsx`), rendered only for hosts that are not a tenant.
- Menu API response size: 1,616 bytes for the seeded two-product menu; the response is built from a snapshot, with no per-row database access.

## Not covered

- Lighthouse: not approved by the owner. The Playwright script above stands in for LCP, CLS and an INP proxy; it does not produce a Lighthouse score or field data.
- Photo-bearing menus: the fixture menu has no photos, so LCP with a hero or a first-card image, the cost of PERF-02 and the effect in PERF-05 were not measured.
- Hosted Vercel and Coolify performance (TTFB, CDN behaviour, cold starts): the production API is down (HOST-01) and the storefront cannot render without it; only unauthenticated read-only hosted requests are allowed.
- PostgreSQL plans and timings: Neon `test` is about 13 migrations behind the source, and the production API is down. Statement counts come from the SQLite test host, and `EXPLAIN` on PostgreSQL was not run; the `sort=total` history case returned 500 on SQLite and was not diagnosed.
- Load and concurrency behaviour (connection pool, outbox dispatcher, rate-limit bucket under load), real-device timings, and repeat-visit caching.
- Production TLS-only tenant routing: the build used the scratch edit described above, because the fixture serves plain HTTP; every other production-mode behaviour was exercised.
- ASVS and WCAG: not part of W9.

## ASVS / WCAG coverage

n/a
