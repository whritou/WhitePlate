# W3 — Public surface (storefront, checkout, discounts, tracking, payments)

## Scope and method

Audit date 2026-10-25. Audited code is `origin/main` `55f31a5`; this file was written on the audit branch at `817f798`, which changes only documentation. W3 covers business-logic abuse on the anonymous public surface. W1 owns the authorization matrices and W8 owns hosted posture, so neither is repeated here.

Surface reviewed:

- API: `OrdersController` (`Quote`, `QuoteBySlug`, `Create`, `CreateByRestaurantSlug`, `Track`, `TrackByRestaurantSlug`), `PickupSlotsController`, `PublicThemeController`, `MenuController`, `AnalyticsController.Withdraw` (anonymous), `StripeConnectController` (OAuth start and callback, plus `StripeConnectWebhookController.Receive` in the same file), `OrderingOperationsController` (staff-only, checked only for its effect on checkout). Also read: `Configuration/CheckoutRequestRateLimiter.cs`, `Configuration/ServiceRegistration.cs`, `Configuration/HmacEmailTrackingCapability.cs`, `Errors/ApiErrorMapper.cs` and `Errors/ApiExceptionHandler.cs`.
- Application, domain and infrastructure: `CreateOrderCommandHandler`, `QuoteOrderQueryHandler`, `CheckoutPricingReader`, `OrderTrackingToken`, `GetPublicOrderTrackingQueryHandler`, `Order`, `OrderLine`, `PromotionDiscount`, `EstablishmentSettings.GeneratePickupSlots`, `OrderRepository` (checkout catalog, idempotency, slot reservation, tracking), `IdempotencyRecord`, `StripeConnectHandler`, `StripeConnectProvider`, `StripeConnectRepository`.
- Frontend: `actions/checkout.ts`, `actions/stripe-connect.ts`, `lib/checkout/order-client.ts`, `lib/checkout/cart.ts`, `hooks/use-order-quote.ts`, `components/storefront/live-checkout.tsx`, and `app/api/public/order-quote`, `orders/[orderId]/tracking`, `pickup-slots` and `analytics-withdrawal` route handlers.
- Docs: decision records 0006 (public order tracking) and 0013 (catalog publication), `docs/api/api-contracts.md`, `docs/architecture/WHITEPLATE_BACKEND_ARCHITECTURE.md` and `docs/development.md`.
- Stripe: every hit of `git grep -n -i stripe -- apps` was triaged. The Stripe code is Standard-account Connect onboarding plus a readiness webhook. Nothing in the code base creates a charge, PaymentIntent, Checkout Session, transfer or refund.

Runtime probes (raw output is in the session scratchpad):

1. **Neon `test`.** The approved Neon `test` probes could not exercise this code. A read-only query (`BEGIN READ ONLY`) of `__EFMigrationsHistory` shows the branch at `20261014150246_OrderingOperations`. By this audit's count, 13 source migrations after that are not applied, from `20261014211126_DiscountMinimumAndExpiration` to `20261019082708_OrderCustomerDetails`. The W1 redo counted 11; the difference is not reconciled here. Examples of missing objects: `CatalogPublicationHeads` does not exist, and the discount minimum/expiry, email-tracking, Stripe, analytics and customer-detail columns are missing. The same read-only query found that no tenant has opening hours, an active discount or an option, so no checkout could succeed even on the old schema. The API (`55f31a5`, scratch build) was started once on `:5185` against the branch, after checking that the host ends in `.neon.tech` and with `WHITEPLATE_ACCEPTANCE_DATABASE=neon-test`. Its outbox dispatcher logged `Kitchen outbox polling failed during idempotency_cleanup (PostgresException)` at startup. Following the controller's ruling, no request was sent and the process was stopped. Ports 5185 and 3015 were confirmed closed afterwards; the frontend was never started.
2. **In-process test host.** As a substitute, the brief's probes ran against the API's own test harness: `WebApplicationFactory<Program>` with SQLite in memory, the `Production` environment, the default checkout limit of 10 requests per 60 s, and the `OrdersFactory` seed (restaurant `bistro` with product Soup at 8.50 and 10% tax, a required option Large at +1.25 and fixed discount `SAVE` of 2.00; restaurant `other` with product Pie and no discount). The probe file lived only in a `git archive` copy of `apps/api` in the scratchpad and was deleted after the run; nothing was added to the repository's test suite. Results are quoted in the findings and under Checked, no finding. In that copy, the existing checkout, quote, rate-limiter, Stripe Connect, error-response and order-domain tests ran with `dotnet test --project apps/api/tests/WhitePlate.Tests/WhitePlate.Tests.csproj --filter-class "*OrdersEndpointTests" --filter-class "*CheckoutRequestRateLimiterTests" --filter-class "*StripeConnect*" --filter-class "*ErrorResponseTests" --filter-class "*OrderTests"`: 97 total, 97 passed.
3. **Hosted.** Not probed: the production API returns 503 (HOST-01).
4. **Stripe.** No Stripe test key exists in local configuration (the API's User Secrets store for `112e8cf8-…` is empty). No live key was used. No Stripe call was made.

## Findings

### PUB-01 — Known, unresolved: checkout rate limit is one bucket per restaurant behind the BFF, also spent by quotes

Top W3 priority.

- **Workstream:** W3
- **Location:** `apps/api/WhitePlate.Api/Controllers/OrdersController.cs:30-31` and `:62-63` (partition `"{tenantId}|{RemoteIpAddress}"`, one limiter for both `Quote` and `Create`); `apps/api/WhitePlate.Api/Configuration/ServiceRegistration.cs:71-74` (10 per 60 s, queue 0); `apps/frontend/actions/checkout.ts:30-46` and `apps/frontend/lib/checkout/order-client.ts:46-53` (checkout is a server-to-server call); `apps/frontend/hooks/use-order-quote.ts:15-19` and `apps/frontend/components/storefront/live-checkout.tsx:57`, `:151` (a quote runs on every cart change, and checkout requires a successful quote)
- **Evidence:** This is a documented, still-unresolved limitation, not an undisclosed one. `docs/api/api-contracts.md:288` says the limiter "still uses its observed remote address" and that different guests behind the BFF "can share the BFF's per-tenant API bucket". It calls a trusted-proxy and edge-rate policy "separate operational work". `docs/architecture/tenancy-and-security.md:46` repeats this. `api-contracts.md:5` documents that quotes "reuse checkout's … tenant/client rate limiter". `api-contracts.md:280`, however, still describes buckets as "per tenant and remote client address", which reads as per guest. No backlog item, decision record or deployed edge limit closing the gap was found. The mechanism: guests never reach the API directly. Checkout goes through a same-origin Next.js server action (`api-contracts.md:286`), the quote through the `/api/public/order-quote` BFF, and the API sits behind Traefik on Coolify with no forwarded-header handling, by design (`docs/development.md:112`, `:164`; no `UseForwardedHeaders` in `apps/api`). In the in-process probe, 25 quotes to `bistro`, each with a different `X-Forwarded-For` (`198.51.100.1` to `.25`), returned `200` ten times, then `429` fifteen times. The next `POST /api/v1/orders` with a valid body and key returned `429`, and the 429 response has `Cache-Control` but no `Retry-After`. The brief asked for 25 rapid checkouts. This probe sends 25 quotes plus 1 create instead, because both endpoints acquire a permit from the same limiter with the same partition key before any handler runs (`OrdersController.cs:31`, `:63`). Quotes also create no orders or slot reservations, so the probe tests the same bucket without filling capacity, and it shows quotes starving creation. The existing test `CheckoutIsRateLimitedPerTenantAndClient` (`apps/api/tests/WhitePlate.Tests/Api/OrdersEndpointTests.cs:518`) covers tenant separation only, not clients behind one proxy. The hosted topology itself was not observed (HOST-01).
- **Impact:** Availability of the guest path. About 10 anonymous quote requests a minute, from anyone, deny checkout to every guest of a restaurant, because checkout requires a successful quote. In normal use, a lunch rush with several guests editing carts at once gets `429` on legitimate quotes and orders. The limit also gives no per-client protection against a determined abuser.
- **Severity:** Should
- **Fix direction:** Do the "separate operational work" that `api-contracts.md:288` defers, before launch. Either configure `ForwardedHeadersOptions` with `KnownProxies`/`KnownNetworks` limited to the Traefik network and have the BFF send a server-only client address that the API trusts only from the frontend; or move per-client limiting to the BFF or edge and keep a larger per-tenant ceiling in the API. Give quotes their own, larger bucket. Add `Retry-After` to 429 responses. Reconcile `api-contracts.md:280` with `:288` so the contract states the effective partition.
- **Regression test:** Sketch below
- **Status:** Confirmed

```text
Request:  25 x POST /api/v1/orders/quote (tenant bistro), each with a different X-Forwarded-For,
then POST /api/v1/orders with a fresh Idempotency-Key, all through the same proxy hop
Expected: guests behind distinct client addresses are limited independently; quotes do not
exhaust the order-creation allowance; 429 carries Retry-After
Actual:   200 x10, then 429 x15; the following order create returns 429; no Retry-After
(in-process test host, default limit 10/60 s)
```

### PUB-02 — A deactivated discount code keeps working until the next catalog publish

- **Workstream:** W3
- **Location:** `apps/api/WhitePlate.Infrastructure/Persistence/Repositories/OrderRepository.cs:86-89` and `:174-177` (checkout reads discounts from the published snapshot once a publication head exists); `docs/architecture/decisions/0013-catalog-publication-and-history.md:9-10`
- **Evidence:** Decision 0013 classifies `PromotionDiscounts` as draft data and puts discounts in the published snapshot. `BuildPublishedCheckoutCatalog` selects the code with `discount.IsActive` from the snapshot, not from the `PromotionDiscounts` row. So `PromotionDiscount.Deactivate()` (`apps/api/WhitePlate.Domain/Catalog/PromotionDiscount.cs:61`), the frontend's "explicit one-way deactivation" (`docs/architecture/WHITEPLATE_FRONTEND_ARCHITECTURE.md:118`), only takes effect at the next publish. That publish also releases every other pending draft edit. Product availability has an immediate path (decision 0010); discounts do not. No discount has a redemption limit, so a leaked code (percentage up to 100, `PromotionDiscount.cs:35-37`) can be reused without limit until then. This conclusion comes from source and decision 0013. It was not exercised at runtime, because Neon `test` lacks `CatalogPublicationHeads`.
- **Impact:** An owner who sees a leaked or wrongly configured code cannot stop it on its own. They must publish unrelated draft changes or keep honouring the discount. Revenue impact is limited to orders placed in that window, because no online payment exists.
- **Severity:** Could
- **Fix direction:** Apply discount deactivation, like D4 availability, immediately to the published head or at checkout time (for example, check the live `PromotionDiscounts.IsActive` as well as the snapshot). Consider an optional total or per-day redemption cap. Record the decision in 0013.
- **Regression test:** Sketch below
- **Status:** Confirmed

```text
Setup:    published catalog containing active code SAVE; owner deactivates SAVE (no publish)
Request:  POST /api/v1/orders/quote {discountCode:"SAVE", items:[...]}
Expected: 400 invalid_discount
Actual:   (by source) 200 with the discount applied until the next publish
```

### PUB-03 — Server accepts any client-chosen tracking capability, including an all-zero token

- **Workstream:** W3
- **Location:** `apps/api/WhitePlate.Application/Orders/OrderTrackingToken.cs:11-19`; `apps/api/WhitePlate.Application/Orders/CreateOrderCommandHandler.cs:34-36`; `docs/architecture/decisions/0006-public-order-tracking.md:13`
- **Evidence:** The tracking capability is generated by the client. The storefront uses 32 bytes from `crypto.getRandomValues` (`apps/frontend/lib/checkout/cart.ts:39-40`). The API checks only the shape: 43 base64url characters that decode to 32 bytes. In the in-process probe, a checkout with `trackingToken` = 43 × `A` (32 zero bytes) returned `201`. A tracking request then succeeds for anyone who knows the order ID and that constant. Order IDs appear in receipts and in the staff UI.
- **Impact:** Nothing for orders placed through the WhitePlate storefront. Any other client (a future app, an integration, a modified script) that reuses or derives tokens weakly creates tracking links that others can guess. The server cannot tell. Tracking exposes the item and totals summary, not personal data (0006 amendment).
- **Severity:** Could
- **Fix direction:** Have the API generate the tracking capability with `RandomNumberGenerator` and return it once in the creation response (or reuse the HMAC capability already built for email in `HmacEmailTrackingCapability.cs:12-21`). Keep accepting the client value only for the documented compatibility window, then remove it from the contract.
- **Regression test:** Sketch below
- **Status:** Confirmed

```text
Request:  POST /api/v1/orders {customerName, items, trackingToken:"AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA"}
Expected: server ignores or rejects client-chosen tokens and issues its own
Actual:   201 Created (in-process test host)
```

### PUB-04 — Anonymous unpaid orders can fill pickup capacity and the kitchen queue

- **Workstream:** W3
- **Location:** `apps/api/WhitePlate.Infrastructure/Persistence/Repositories/OrderRepository.cs:225-238` (capacity reserved at order creation); `apps/api/WhitePlate.Application/Orders/CreateOrderCommandHandler.cs:81-88`; `docs/architecture/WHITEPLATE_BACKEND_ARCHITECTURE.md:72` (no online charge)
- **Evidence:** Guest checkout requires only a name, an item and an idempotency key. It has no payment, contact verification or challenge, and each order reserves one place in a pickup slot (default capacity 8 per 15-minute slot, `apps/api/WhitePlate.Domain/Tenants/EstablishmentSettings.cs:34`). The only throttle is PUB-01's limiter. In the in-process probe, one client placed six orders on `bistro` in sequence without any check beyond the limiter (permit raised for the probe). The slots offered are limited to a 7-day horizon (`EstablishmentSettings.cs:106-142`). Staff cancellation releases a future reservation (`OrderRepository.cs:579-592`), and owners can pause ordering (`OrderRepository.cs:59-60`, `:214-218`).
- **Impact:** A low-effort actor can fill near-term slots and the kitchen board with fake orders, so real guests see "no slots available" until staff cancel the orders one by one. This is inherent to pay-at-pickup and is bounded by PUB-01. Fixing PUB-01 by keying on the real client address makes it easier to spread fake orders across addresses.
- **Severity:** Could
- **Fix direction:** Product decision: keep pay-at-pickup and add an abuse control (per-client daily order cap, optional phone or email confirmation for scheduled slots, bot challenge on repeated orders, bulk cancel for staff), or require payment once Stripe payments exist. Record it as a backlog decision rather than a silent change.
- **Regression test:** None
- **Status:** Confirmed

### PUB-05 — Stripe webhook may reject all events if the endpoint API version differs from Stripe.net's

- **Workstream:** W3
- **Location:** `apps/api/WhitePlate.Infrastructure/Payments/StripeConnectProvider.cs:105`; `apps/api/WhitePlate.Infrastructure/WhitePlate.Infrastructure.csproj:21` (`Stripe.net` 53.0.0); `docs/development.md:74-81`
- **Evidence:** `VerifyWebhook` calls `EventUtility.ConstructEvent(rawBody, signature, secret)` with the library defaults, which in Stripe.net include `throwOnApiVersionMismatch: true`. Every `StripeException` becomes `null`, then `400` (`StripeConnectController.cs:80-82`). The only test uses an event with `api_version = "2026-09-30.endive"` (`apps/api/tests/WhitePlate.Tests/Infrastructure/StripeConnectProviderTests.cs:51`). The setup guide does not say which API version to choose for the webhook endpoint. This is unverified: the Stripe.net 53 source was not read and no live Stripe event was received.
- **Impact:** It fails closed, so there is no security exposure. If the Stripe endpoint uses another API version, `account.updated` and `account.application.deauthorized` events are rejected and retried until Stripe disables the endpoint. A deauthorized account then stays "connected" until the next status read.
- **Severity:** Could
- **Fix direction:** Pin the webhook endpoint API version in the setup guide to the one Stripe.net 53 expects, or call `ConstructEvent(..., throwOnApiVersionMismatch: false)` and parse only the fields used. Add a test that sends an event with a different `api_version`.
- **Regression test:** Sketch below
- **Status:** Suspected

```text
Request:  POST /api/v1/stripe-connect/webhooks/test, correctly signed, body api_version "2025-01-27.acacia"
Expected: 200 (event deduplicated and applied)
Actual:   not run (no Stripe test key; source suggests 400)
```

### PUB-06 — Anyone who knows a guest's email can delete that guest's analytics records

- **Workstream:** W3
- **Location:** `apps/api/WhitePlate.Api/Controllers/AnalyticsController.cs:36-56`; `apps/frontend/app/api/public/analytics-withdrawal/route.ts:19-36`; `docs/api/api-contracts.md:400`
- **Evidence:** `POST /api/v1/tenants/{tenantId}/analytics/withdrawal` is `[AllowAnonymous]` and deletes fingerprints, consent flags and repeat-customer links for any email it is given. It does not check that the requester owns the address; the contract states this design. The tenant ID is public (it is returned in the public menu DTO, `apps/api/WhitePlate.Application/Catalog/MenuDto.cs:60`). The BFF route checks no `Origin`, and its rate-limit partition collapses like PUB-01's (`AnalyticsController.cs:47-48`, behind the same proxy hop). The generic response prevents enumeration. This is a source review: the route needs migration `AnalyticsLive`, which Neon `test` lacks.
- **Impact:** Integrity of restaurant analytics. A third party can remove a customer's returning-customer history, or erase many guessed addresses. The withdrawal bucket (`analytics-withdrawal:{tenantId}:{RemoteIpAddress}`, `AnalyticsController.cs:47-48`) collapses behind the BFF the same way as PUB-01's. That caps an attacker at about 10 per minute per restaurant, but a real guest's withdrawal can also get `429` while someone else is using it. It reveals no personal data and only removes consented analytics data, so the privacy direction is safe. One-step withdrawal is acceptable because GDPR Art. 7(3) requires withdrawing consent to be as easy as giving it, and consent was given with a checkbox and no verification.
- **Severity:** Could
- **Fix direction:** Keep one-step withdrawal (Art. 7(3)) and record the owner's acceptance of the integrity trade-off. If abuse appears, send a confirmation link to the address and delete only on confirmation. Add an `Origin` check to the BFF route. Key the withdrawal bucket on the same trusted client address chosen for PUB-01.
- **Regression test:** None
- **Status:** Confirmed

### PUB-07 — Quote responses distinguish existing discount codes, so codes can be guessed

- **Workstream:** W3
- **Location:** `apps/api/WhitePlate.Application/Orders/CheckoutPricingReader.cs:64-65` (`invalid_discount`), `:86-90` (`discount_expired`, `discount_minimum_not_met`); `apps/api/WhitePlate.Api/Controllers/OrdersController.cs:23-39` (anonymous quote); `apps/api/WhitePlate.Domain/Catalog/PromotionDiscount.cs:31-32` (codes are owner-chosen, 1 to 32 letters, digits or hyphens)
- **Evidence:** An anonymous quote with a guessed code answers in one of four ways. An unknown or inactive code gives `invalid_discount`. An expired code gives `discount_expired`. A code above the subtotal minimum gives `discount_minimum_not_met`. A valid code gives `200` with `discountAmount`. In the in-process probe, `FREE100` returned `400 invalid_discount` and `SAVE` returned `discountAmount=2`. Owner-chosen codes are usually dictionary-like (`SUMMER10`, `WELCOME`), and a valid code is necessarily revealed by success in any code system. The distinct errors add only expired and minimum-gated codes. The only throttle is PUB-01's shared limiter. There is no per-client or failed-code counter.
- **Impact:** Low. Someone can find a restaurant's guessable active codes (and expired or minimum-gated ones) at roughly 10 guesses a minute today. Once PUB-01 is fixed per client, the rate per distinct address goes up. No payment is taken online, so the loss is limited to discounts applied at pickup.
- **Severity:** Could
- **Fix direction:** When fixing PUB-01, add a small per-client budget for failed discount lookups (or a short lockout per tenant and client). Advise owners in the discount editor to use non-trivial codes for large discounts. The distinct error codes are useful to legitimate guests and can stay.
- **Regression test:** None
- **Status:** Confirmed

## Checked, no finding

- **Server price authority:** line prices, option prices, tax and currency come from the catalog snapshot. `CheckoutPricingReader.cs:51-61` builds snapshots from `CheckoutProductDto`. `CreateOrderRequest` (`apps/api/WhitePlate.Api/Contracts/CreateOrderRequest.cs:3-8`) has no price, total or currency field. In the probe, extra `unitPrice: 0.01`, `priceAdjustment: -100`, `subtotal/total: 0.01`, `currency: "USD"`, `discountAmount: 999` and a foreign `tenantId` were ignored: `201`, `currency=EUR subtotal=19.50 discountAmount=0 taxAmount=1.95 total=21.45`, own `tenantId`. The quote returned the same totals.
- **Archived, hidden or unavailable items:** the draft path filters `IsAvailable && !IsArchived` and requires a visible, unarchived category (`OrderRepository.cs:91-94`). The published path applies the same filters (`OrderRepository.cs:148-151`), and archived groups and options are excluded (`:104-117`, `:153-157`). A count mismatch returns 404 (`CheckoutPricingReader.cs:25-26`). Probe: foreign product → `404 not_found`.
- **Option tampering:** options must belong to the product's own groups (`CheckoutPricingReader.cs:38-42`), groups' minimum and maximum selections are enforced (`:44-49`), and duplicates or more than 20 options are rejected (`:35-36`). Probe: random option `404`, duplicate `400 invalid_options`, missing required `400 invalid_option_selection`. Negative option prices are rejected by the domain (`Order.cs:76-81`).
- **Quantity bounds:** `1..99` (`CheckoutPricingReader.cs:33-34`, `Order.cs:76`) and 1 to 50 lines (`CheckoutPricingReader.cs:12-13`). Probe: `0`, `-1`, `100` and `2147483647` gave `400 invalid_quantity`; `2147483648`, `1.5`, `1e2` and `null` gave `400` with a fixed `invalid_value` message; `99` gave `201`; `"2"` (a string) gave `201` (web-default number handling, harmless); 51 lines gave `400 invalid_count`.
- **Discounts:** lookup is by tenant, code and `IsActive` (`OrderRepository.cs:136-140`; published path `:174-177`). Restaurant-local expiry and minimum order are enforced (`CheckoutPricingReader.cs:69-91`). A fixed amount is capped at the subtotal and a percentage is rounded `AwayFromZero` (`:92-98`). The domain caps percentages at 100 and requires positive two-decimal values (`PromotionDiscount.cs:35-37`), and the order rejects a discount above the subtotal (`Order.cs:88-89`). Only one non-stacking code is allowed (`api-contracts.md:278`). Probe: foreign-tenant code `SAVE` on `other` → `400 invalid_discount`; unknown code → `400 invalid_discount`; own code → `discountAmount=2`. No redemption-limit rule is documented, so its absence is noted only under PUB-02; code guessing is PUB-07.
- **Idempotency:** scoped to tenant and SHA-256 key hash with a unique index (`IdempotencyRecordConfiguration.cs:21`), lasting 24 h (`IdempotencyRecord.cs:18`). The canonical request fingerprint covers every customer-controlled field (`CreateOrderCommandHandler.cs:130-157`), and fixed-time comparison returns `Conflict` on any difference (`OrderRepository.cs:705-714`). The record is re-checked inside the creation transaction, with race fallback (`:198-207`, `:253-259`). Probe: same body gave the same order ID; changed quantity or discount gave `409`; the same key on another tenant created an independent order; a missing key gave `400`.
- **Tracking capability:** 256-bit token (client, see PUB-03) or 256-bit HMAC email capability (`HmacEmailTrackingCapability.cs:12-21`). Only the SHA-256 hash is stored, with a 30-day expiry (`CreateOrderCommandHandler.cs:97-103`, `Order.cs:101-108`). Lookup is tenant-scoped, compares in fixed time and enforces expiry (`OrderRepository.cs:507-521`, `:531-532`). Unknown order, wrong token, wrong tenant and expired token all return the same 404 (`GetPublicOrderTrackingQueryHandler.cs:11-18`). The response holds no personal data (`OrderRepository.cs:523-528`; test `OrdersEndpointTests.cs:323`). Probe: correct token `200`, one-character change `404`, random order ID `404`, short token `404`. The BFF checks `Origin`, the UUID and the token shape (`app/api/public/orders/[orderId]/tracking/route.ts:19-54`).
- **Pickup slots and opening hours (S3):** enforced on the server. Only slots generated from saved opening hours, the minimum lead time, the rush buffer and the 7-day horizon are accepted (`EstablishmentSettings.cs:106-142`, `CreateOrderCommandHandler.cs:81-88`). A missing schedule is rejected (`:82-83`). Capacity is reserved with a conditional update inside the transaction (`OrderRepository.cs:225-238`), and `AcceptingOrders` is re-checked under `FOR SHARE` (`:209-218`). Probe: off-grid time, a past time and a time beyond the horizon all gave `409`. The quote endpoint does not check hours, by design: it creates nothing (`api-contracts.md:5`).
- **Problem responses:** unhandled exceptions return a generic `unexpected` problem with only a `traceId`, and log only the type (`ApiExceptionHandler.cs:11-19`). Model-binding errors return a fixed message without echoing input (`ServiceRegistration.cs:175-183`). Probe: malformed JSON and a GUID body containing `'--` returned `400` with `"The supplied request is invalid."`, no SQL, stack trace or input echo. Existing test `ErrorResponseTests.UnexpectedExceptionsNeverExposeDetailsInResponsesOrLogs`.
- **Body limits:** 16 KiB on checkout and quote, and 1 KiB on tracking (`OrdersController.cs:25`, `:50`, `:97`); test `OrdersEndpointTests.CheckoutRejectsOversizedRequestBodies`.
- **Payments, amount authority:** no charge exists. No code creates a Stripe charge, PaymentIntent or Checkout Session. The contract states "No payment" (`api-contracts.md:278`) and the setup guide "This scope does not accept or create payments" (`docs/development.md:84`). Totals are computed only on the server (above).
- **Payments, an order marked paid without Stripe:** not possible. `Order` has no payment state; the statuses are `Pending`, `Preparing`, `Ready`, `Completed` and `Cancelled` (`apps/api/WhitePlate.Domain/Orders/OrderStatus.cs:3`). Webhooks never touch orders (`StripeConnectRepository.cs:102-143`).
- **Payments, webhook:** `POST /api/v1/stripe-connect/webhooks/{mode}` reads the raw body unchanged (`StripeConnectController.cs:75-79`) and verifies `Stripe-Signature` with the per-mode `whsec_` secret (`StripeConnectProvider.cs:100-105`, configuration check `:23-24`). Events whose `livemode` disagrees with the route are rejected (`StripeConnectHandler.cs:153-155`). `account.updated` is re-read from Stripe rather than trusted from the body (`:162-166`). Events are deduplicated by ID (`StripeConnectRepository.cs:107-109`), and out-of-order events are ignored by `created` time (`:124-125`). Existing test `StripeConnectProviderTests.WebhookMustHaveStripeSignatureForExactRawBody` (`:43`) rejects a body changed by one byte.
- **Payments, connected-account ID source:** the account ID comes only from the server-side OAuth code exchange with Stripe (`StripeConnectHandler.cs:122-130`). The flow uses a hashed, single-use OAuth state that expires after 10 minutes and is bound to the tenant and owner (`:17`, `:93-97`, `:106`, `:115`). The account must be a Standard account and match the configured mode. One account cannot be linked to two restaurants (`StripeConnectRepository.cs:56-59`). The frontend actions (`actions/stripe-connect.ts:9`, `:29`) send no account ID.
- **Payments, restaurant without a connected account:** checkout does not consult Stripe, so ordering is unaffected; it is pay at pickup (`WHITEPLATE_BACKEND_ARCHITECTURE.md:72`). Idempotency of payment confirmation does not apply, since no payment confirmation exists.
- **Public menu exposure:** hidden or archived categories and archived products, groups and options are excluded (`CatalogRepository.cs:510-536`). `MenuDto` carries no discount codes (`MenuDto.cs:60-62`). Unavailable products are listed but cannot be ordered, by design (`api-contracts.md:278`).
- **Public theme:** `PublicThemeController.Get` and `GetByRestaurantSlug` (`apps/api/WhitePlate.Api/Controllers/PublicThemeController.cs:16-31`) are anonymous. The tenant comes only from the host (`[RequireTenant]`) or the slug (`[RequireTenantBySlug]`), never from the request body. They return only the published theme: appearance, asset presence flags, publish time and version (`apps/api/WhitePlate.Application/Tenants/ThemePublication.cs:65-73`), for an active tenant (`ThemePublicationRepository.cs:20-21`). Responses are `no-store`.
- **Anonymous pickup slots:** `PickupSlotsController.Get` (`:15-24`) returns each future slot's `RemainingCapacity` (`OrderRepository.cs:70-72`). That is a small order-volume signal: a competitor polling it can estimate bookings per slot, to the granularity of slot capacity (default 8), over a 7-day horizon. Accepted, not a finding. The storefront needs remaining capacity to offer selectable slots. The data is aggregate counts with no customer information. The same volume is observable by visiting the restaurant. Showing only "available"/"full" would remove the signal if the owner prefers.
- **Ordering operations:** `OrderingOperationsController` is `[Authorize]` (`:11`). A paused restaurant is enforced on the server at checkout (`OrderRepository.cs:59-60`, `:214-218`).

## Not covered

- **Every Neon `test` runtime probe** (tampered payloads, foreign discount, idempotency replay, tracking, 25 rapid checkouts): Neon `test` is at migration `20261014150246_OrderingOperations`, 13 migrations behind `55f31a5` by this audit's count (W1 counted 11), and no tenant there has opening hours, discounts or options. Applying migrations is out of scope by controller ruling. The same probes ran in the in-process test host instead (SQLite, not PostgreSQL), so PostgreSQL-specific behaviour is not covered: `FOR SHARE`, the `ON CONFLICT` slot insert, and races between independent connections.
- **Frontend runtime** (storefront, quote BFF, server action, guest checkout fixture): the frontend needs the API, which cannot serve checkout against Neon `test`. Frontend behaviour is reviewed from source only. `npm ci` was not run.
- **Hosted environments:** the production API returns 503 (HOST-01). The real proxy hop behind PUB-01 (Traefik container address, Vercel egress) was not observed.
- **Live Stripe:** no Stripe test key is configured locally, and live keys are never used. OAuth, webhook delivery and PUB-05 are source-only.
- **Public media routes** (`PublicBrandAssetsController`, `PublicProductPhotosController`, `app/api/public/brand-assets`, `product-photos`, `establishment`): their tenant scoping belongs to W1 and their headers to W8. W3 found no pricing or ordering logic in them.
- **Email delivery content and rendering:** decision 0015. Only capability generation is reviewed here.

## ASVS / WCAG coverage

| Requirement | Coverage | Result |
| --- | --- | --- |
| ASVS V5.1 Input validation | Covered (source + in-process probes) | Quantity, line count, option, discount, pickup time, token shape and body size validated on the server; no finding |
| ASVS V7.4 Error handling | Covered (source + probe + existing tests) | Generic problem+json with trace ID; no stack trace, SQL or input echo; no finding |
| ASVS V11.1 Business logic security | Covered (source + in-process probes) | PUB-01 (anti-automation limit ineffective; top priority), PUB-02, PUB-03, PUB-04, PUB-06, PUB-07 |
| ASVS V13.2 RESTful web service | Covered (source + probes) | JSON-only bodies with fixed validation; idempotent create; same-origin checks on checkout and tracking BFF; PUB-06 notes the withdrawal BFF lacks an `Origin` check; Stripe webhook signature verified (PUB-05 reliability only) |
| WCAG 2.2 | Not applicable | Owned by W6 |
