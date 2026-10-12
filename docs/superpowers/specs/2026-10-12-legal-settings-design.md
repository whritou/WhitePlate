# S1 legal and tax profile settings design

12 October 2026. Status: design approved in conversation; implementation not started.

## Goal and approved scope

Complete the legal and tax identity portion excluded from S1 establishment settings. An organization records its legal profile during creation and can edit it later in organization settings. New restaurants inherit the organization profile by default and can opt into an independent profile at creation. Owners and managers can later change the restaurant's inheritance mode or edit its custom profile in restaurant settings. Restaurant settings use three categories: Establishment, Legal and tax, and Opening hours. Desktop uses a category sidebar; mobile uses a category selector, with category state represented in the URL.

The supported legal jurisdictions at launch are France, Germany, the United Kingdom and the United States. Legal country is required. Country-specific identifiers are optional unless future approved business rules establish otherwise. No default tax rate is introduced. Existing product tax rates remain the source for new order calculations; saved order line rates, amounts, totals and historical snapshots are unchanged.

## Legal profile and validation

The profile contains a legal country, legal business name, registration identifier and tax identifier, with country-aware labels and fields:

| Country | Organization identifier | Restaurant identifier | Tax identifier |
| --- | --- | --- | --- |
| France | SIREN | SIRET | VAT ID |
| Germany | Trade-register number (where applicable) | Establishment registration number when supplied | VAT ID |
| United Kingdom | Company registration number | Establishment registration number when supplied | VAT ID |
| United States | EIN | Establishment registration number when supplied | EIN/tax ID as applicable |

Only relevant country fields are shown. The restaurant's existing physical `countryCode` remains separate from its legal country. France distinguishes the organization-level SIREN from the establishment-level SIRET. Identifiers are normalized and validated for syntax and known checksums (including SIREN/SIRET checks where applicable); no registry lookup or assertion that an identifier was issued, is active, or establishes tax compliance is made. Country-specific validation rules are documented and tested.

Germany and UK registration identifiers and VAT IDs remain optional because applicability depends on legal form and registration/tax status. US EIN remains optional because not every entity needs one. Legal name is optional to support organizations still completing setup. The legal country is required at organization creation and when a custom restaurant profile is saved. Existing organizations migrate with a null profile, not a fabricated country or identifier. Their settings prompt an owner to choose a country before saving a legal profile. Restaurants inheriting from such an organization continue to show an unconfigured inherited profile until the organization is completed; a custom restaurant profile still requires its own country.

No generic tax percentage is added at either level. Tax settings here store identifiers only. Product `TaxRatePercent` remains authoritative for product pricing and checkout.

## Inheritance and editing

An organization owns one legal profile. A restaurant stores an explicit mode: `inherit` or `custom`. In inherit mode, reads expose the effective organization profile and clearly identify it as inherited; restaurant-specific organization identifiers (such as the French SIRET) are represented as establishment-specific details without changing the parent SIREN. Switching to custom copies the effective values into the restaurant editor, after which fields can be changed or cleared independently. Switching back to inherit discards the active override from effective reads, while preserving no stale custom values; the user sees a confirmation if unsaved edits would be lost. Changing an organization profile never overwrites a restaurant in custom mode.

At restaurant creation, inheritance is selected by default and requires no duplicate data entry. Choosing custom reveals the country-aware profile fields and validates them before creation. Organization creation collects the legal country and optional relevant identifiers. Organization settings provide a later edit path.

## Navigation and user experience

Restaurant settings retain the existing workspace context and move to URL-addressable categories: `establishment`, `legal`, and `hours`. A desktop sidebar presents the three categories; mobile presents a keyboard-accessible category selector. Direct links, browser back/forward and refresh preserve the selected category. Existing establishment fields and opening-hours behavior remain in their respective categories. The legal category explains inherited versus custom values and offers an explicit mode switch.

All visible copy is localized in English and French. The UI follows the canonical WhitePlate design tokens and existing organization settings navigation patterns. Forms retain explicit save/cancel, dirty-state preservation, field-level errors, conflict handling and safe authorization-loss behavior already established by S1.

## API, persistence and authorization

Add organization legal-profile read/update behavior and extend organization creation to accept the profile. Add restaurant profile mode and optional custom profile to restaurant creation and protected restaurant legal settings read/update. Responses include both mode and effective profile so clients do not infer inheritance from null fields. Writes use optimistic concurrency using a version/ETag scoped to the legal profile; stale writes fail without partial updates. Organization and restaurant writes are atomic.

Organization operations require persisted organization-owner authorization. Restaurant operations require persisted owner/manager membership and active organization and tenant, matching S1 non-disclosing access behavior. Client-supplied tenant or organization IDs are selectors only and never confer authorization. The API contract/schema, request validation, and safe Problem Details field errors are updated with the implementation.

Persist organization profile fields on `Organizations` and restaurant override fields/mode on `Tenants` using bounded columns and additive migration(s). Migration defaults for existing records preserve current behavior and do not fabricate identifiers. Do not enable startup migration. Review generated EF migration SQL before deployment. History and product rates are outside the write set.

## Verification and rollout

Add domain validation tests for all supported identifiers, HTTP tests for owner/manager authorization, organization creation/update, inherited/custom restaurant behavior, concurrent stale writes, cross-tenant denial and migration compatibility. Frontend tests cover country-conditioned fields, inheritance toggle, localized validation, category URL navigation, responsive sidebar/selector and unsaved changes. Run API solution tests and frontend lint, typecheck and build.

Deploy only after the additive migration has been reviewed and applied in the target environment. Verify organization creation/edit, default inheritance, custom restaurant creation/edit, organization changes propagating only to inherited restaurants, and unchanged order/tax snapshots. Update the S1 planning card and audit/API documentation with actual results; hosted behavior remains In review until acceptance is verified.

## Decisions

- Jurisdictions: France, Germany, UK and US at launch.
- Legal identifiers: country-aware and optional; validate syntax/checksum only, without external registry verification.
- France: SIREN at organization level and SIRET at restaurant level.
- Restaurant profile: inherit by default; explicit custom mode is independent from then-current and future organization edits.
- Tax: no default tax rate; preserve product-specific rates and historical amounts.
- Restaurant settings navigation: Establishment, Legal and tax, Opening hours; desktop sidebar and mobile category selector.
