# Decision 0004: Localized order snapshots

- Date: 2026-10-01
- Status: Accepted; implementation is a separate checkout change

## Context

Decision 0003 allows each restaurant to configure a menu locale and falls back to its default locale when a translation is missing. Checkout already snapshots product and selected-option labels and prices, but it neither receives nor stores the effective menu locale. Receipts and future staff order details need to preserve what the customer saw at purchase time, even when catalog translations later change.

## Decisions

1. Checkout uses the guest's selected menu locale. The order request may include `menuLocale`; the server resolves it against the restaurant's enabled menu locales. An omitted or unsupported value resolves to the restaurant's default, matching `GET /menu`. The API records the effective locale, never a client-provided label or price.
2. Each new order stores its effective menu locale. Each order line stores the product name resolved for that locale, and each selected option snapshot stores its resolved option name. A missing item translation uses the restaurant's default-language text, as in decision 0003. The exact resolved strings are immutable historical snapshots; no receipt or staff view re-translates an existing order from the current catalog. Category/group names and product descriptions remain outside the order-line snapshot because they are not part of the current checkout receipt.
3. Customer receipts and any staff order detail that displays an item use the saved product and option names. The app's `/en` or `/fr` interface locale continues to control interface copy; the restaurant menu locale is independent.
4. Existing orders keep their current snapshot values. Their effective menu locale is unknown, so the migration and API represent it as `null`; do not infer it from today's restaurant default or rewrite historical labels.
5. The normalized idempotency request includes the effective menu locale. Reusing a key for otherwise identical checkout content in a different effective locale is a changed request and returns `409`; an unchanged retry replays the original localized receipt.
6. This decision changes neither tenant authorization nor checkout pricing. The API continues resolving the restaurant from the trusted request host and derives product/option labels and all prices from that tenant's catalog.

## Consequences and implementation boundary

- A follow-up implementation adds an optional `menuLocale` to checkout requests, a nullable locale snapshot on orders for legacy compatibility, and the resolved names in existing line/option snapshots. It updates receipt contracts, frontend payload and copy, idempotency hashing, migrations, and regression/acceptance tests together.
- The decision is accepted but not implemented in source. The current checkout request has no locale, and the current order schema/receipt do not expose one. Do not describe the new behavior as available until the implementation and migration are verified.
- The migration must preserve existing names and assign `null` to their unknown locale. Production rollout follows the independent migration/backup/rollback process.

## Alternatives considered

- Re-translate historical receipts from the current catalog: rejected because a later edit could make an old receipt disagree with what the customer purchased.
- Infer the locale of existing orders from the current default: rejected because the order's historical menu locale cannot be recovered.
- Store only the locale and translate names on read: rejected because catalog translations may change after checkout.
- Trust client-submitted product or option labels: rejected because checkout names and prices must be derived from the server's tenant-scoped catalog.

## Affected documents

- [Decision 0003](0003-catalog-localization-and-tenant-domain-policy.md)
- [Development roadmap](../../development-roadmap.md)
- [API contracts](../../api/api-contracts.md)
- [Database schema](../../database/database-schema.md)
- [Functional test plan](../../functional-test-plan.md)
