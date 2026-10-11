# Decision 0009: Menu product metadata

Date: 2026-10-11
Status: Implemented in source; migration and hosted acceptance pending.

## Context

M2 adds saved SKU/reference, allergen and dietary declarations, and preparation guidance to the real menu builder. The product editor already writes through the tenant-protected catalog API. The public menu and kitchen tickets need safe, explicit metadata without implying integrations or pickup promises.

## Decisions

- SKU is optional, trimmed, uppercased and limited to ASCII letters, digits, `.`, `_` and `-` (64 characters). It is unique per restaurant across active and archived products. It is an internal catalog reference only; it does not enable POS integration or inventory tracking.
- The controlled allergen vocabulary is the EU Regulation 1169/2011 Annex II list of 14 allergens. Owners declare each under either **contains** or **may contain**; a code cannot appear in both lists. An empty list means no declaration was entered, not that the product is allergen-free. Labels are localized in the frontend; no allergen text is inferred from product content.
- Dietary labels (`dairyFree`, `glutenFree`, `pescatarian`, `vegan`, `vegetarian`) are explicit owner-entered declarations, not inferred or guaranteed claims.
- Preparation time is optional guidance from 1 to 1,440 minutes. Localized notes support EN/FR. The storefront calls the time an estimate, and kitchen tickets show it as prep guidance; it is not a pickup or ready-time promise.
- Guest menu and order snapshots include declarations and preparation guidance but omit SKU. Order-line snapshots preserve the submitted disclosures and notes for receipts/history if the catalog changes later.
- Metadata columns use JSON for bounded declaration lists and localized notes; SKU has a filtered unique `(TenantId, Sku)` index. The owner/manager catalog authorization and tenant-scoped repository remain the access boundary.

## Alternatives and consequences

Restaurant-defined allergen categories and inferred dietary classifications were rejected because they make disclosures inconsistent or unsupported. Separate lookup tables were not needed for this fixed vocabulary. JSON columns keep the migration additive and preserve the existing aggregate boundary; queries do not filter by declaration values. The migration must be applied explicitly before deploying code that reads these fields.

## Scope and verification

Manual/phone order entry, POS, inventory, product photos, AI classification, allergen-free guarantees, and authoritative pickup scheduling remain outside this decision. Source tests and hosted role/guest acceptance are tracked in [M2 verification](../../audits/menu-builder-metadata.md). The vocabulary is based on [EU Regulation 1169/2011, Annex II](https://eur-lex.europa.eu/eli/reg/2011/1169/oj/eng) and the [European Commission allergen summary](https://food.ec.europa.eu/food-safety/campaign-2026/allergies_en).
