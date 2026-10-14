# Menu Builder demo parity design

**Date:** 2026-10-14  
**Status:** Proposed; awaiting user review  
**Scope:** Live organization catalog editor, demo menu hover states, catalog discount persistence and checkout validation

## Context

The live `/organization/catalog` editor has accumulated controls and layouts that differ from `/demo/menu`. The live editor stores real catalog data and already supports product-photo drafts, archival, product restoration, options, translations, product metadata, and discount activation. The demo is the visual reference for the requested gallery, option, discount, and list treatments, but its product-availability and discount-status hover states can make text and background indistinguishable.

The live product list already has an Active / Archived / All filter. Product restoration is currently available from the selected product panel and only succeeds when its category is active. Archiving a category archives its products and option descendants; the API has no restore operations for categories, option groups, or options. Discount records currently have no minimum-order amount or expiration date, and checkout only receives code, kind, and value.

The user approved demo parity, explicit category-first restoration, reversible product archival, end-to-end discount minimum/expiry, confirmation dialogs for destructive catalog actions, and fixing the demo hover contrast defects. The minimum-order basis is the pre-tax, pre-discount subtotal of products and selected options. An expiration date is valid through the end of that date in the restaurant's saved time zone.

## Goals

- Make the live catalog editor follow the demo's layout and interaction patterns for categories, products, product photos, options/extras, and discounts.
- Persist category and item ordering through accessible drag-and-drop interactions without numeric order fields.
- Keep all real catalog data and capabilities that the user asked to retain.
- Confirm each catalog archive or removal action; keep product archival reversible and expose recovery from the archived-product filter.
- Restore an archived category explicitly before restoring products archived by that category; do not silently restore descendants.
- Store and enforce discount minimum-order and expiration values from the editor through API and checkout.
- Fix the demo's low-contrast hover states and use the same safe semantic color pairs in the live editor.

## Non-goals

- Changing the Languages tab or removing its catalog translation workflow.
- Keeping product translations inside the product editor; those controls are removed there only.
- Permanently deleting products, categories, photos, options, or discounts.
- Removing SKU, allergen multi-selects, dietary declarations, preparation information, option rules, discount names, or discount activation state.
- Changing order snapshots, tax computation, the discount stacking model, or checkout pricing beyond discount eligibility.
- Changing the demo's business behavior beyond fixing the specified hover contrast defects.

## Proposed design

### Demo parity rule

For every in-scope catalog surface, reproduce the demo's visual design and interaction presentation: layout, spacing, typography, colors, borders, control placement, responsive behavior, and ordinary hover/focus states. Keep real-only capabilities such as SKU, dietary metadata, archival, and restoration in those same demo-styled sections. Where the demo has no matching control, use the nearest existing demo component pattern. The specifically identified low-contrast hover states are the sole approved visual correction to the reference.

### Category and product lists

Keep category selection and category actions in the sidebar. Replace the “Manage categories” dialog with inline category controls for creating, editing, archiving, and restoring a category. Active categories can be reordered by drag-and-drop. Archived categories remain visible with an archived state and a restore action; they are not reorder targets.

Products can be reordered within their category and moved to another category by dropping onto that category, matching the demo. Remove numeric display-order controls from the product rows and product form. Keep search, availability, and category filtering. The existing Active / Archived / All product filter remains; archived products show a restore action from the list, while the details panel remains a way to inspect them.

Product archival uses the existing reversible API behavior. The list's X action opens an `AlertDialog` naming the product and explaining that its option descendants will also be archived. Confirm archives; Cancel leaves the catalog unchanged. Restoring a product does not make it available for ordering, matching the current API behavior.

Category archival continues to archive its product and option descendants. Add a tenant-authorized category restore operation and restore control in the category list. Category restore changes only the category's archive state; it does not restore products, groups, or options. A product whose category is archived cannot be restored until the category is restored. The manager then restores products individually. Existing availability flags remain unchanged by category restore; product restoration retains the current behavior of leaving the product unavailable.

Add tenant-authorized restore operations and explicit controls for option groups and options. A group can be restored only after its product and category are active and the product itself is restored. Restoring a group does not restore its options; each option is restored separately after its group is active. Every restore changes only the selected entity and uses the existing pending/success/error feedback. No descendant is restored implicitly.

### Product photos

Replace the live preview-and-arrow gallery layout with the demo's square tile grid and reproduce its visual treatment exactly, including spacing, tile proportions, and cover/remove placement. Support multiple selection on add, drag-to-reorder, a cover badge on the first tile, and an X removal control. Moving a photo to the first position makes it the cover. The same visual structure and interactions apply in the live product editor and demo.

Keep the live gallery's maximum of eight assets, file validation, aspect-ratio framing, upload progress, save/discard behavior, conflict/error feedback, and retry behavior. Removing a photo from the working gallery is confirmed before the draft changes; the published gallery changes only when the existing save action succeeds. Keyboard and touch users receive an equivalent way to reorder photos.

### Product options and extras

Replace the live table with the demo's grouped card/list treatment. Keep group names, single/multiple selection rules, minimum/maximum counts, option names, price adjustments, add/edit/archive actions, and archived-state visibility. Use drag-and-drop for sortable groups and options instead of numeric order fields; provide keyboard-accessible move controls as an equivalent. Group and option archive actions name the item and explain descendant impact where relevant. Archived groups and options receive individual restore actions, gated by their active parent and with no implicit descendant restoration.

Keep SKU, “Contains” and “May contain” allergen multi-selects, dietary declarations, indicative preparation minutes, and localized preparation notes. Keep the product Archive action. Remove the inline product translations section; the Languages tab remains unchanged.

### Discounts and checkout

Use the demo's compact row treatment with Code, Type, Value, Minimum order, Expires, and status. Preserve the live discount name as secondary text and keep the existing active/deactivation behavior. Do not imply a reactivation path the API does not provide, and do not add a hard-delete route. Confirm deactivation with an `AlertDialog` naming the code.

Add `MinimumOrderAmount` and nullable `ExpiresOn` to the discount domain model, EF configuration and migration, API request/response DTOs, frontend catalog types, validation, and API contract documentation. A missing minimum is represented as zero for existing rows; a missing expiration means no expiry. Require a non-negative minimum and a valid date when supplied.

The checkout discount projection includes both fields. On the server, resolve the restaurant's saved IANA time zone and reject a code when the current restaurant-local date is later than `ExpiresOn`. Compare the minimum against the order subtotal after product and option quantities are included but before tax and discount are applied. Return distinct actionable errors for expired codes and orders below the minimum; do not silently ignore an ineligible code. Existing code normalization, single-discount allocation, tax calculations, idempotency, and immutable order snapshots remain unchanged.

### Destructive confirmations and hover states

Use the shared `AlertDialog` primitive for every removal or archive action in the catalog UI: product row, category, product details, option group, option, discount deactivation, and photo removal. Dialogs identify the affected item, describe any cascading archive effect, provide Cancel and a clearly labeled destructive confirmation, and prevent duplicate submission while pending. Existing dialogs are retained and brought into consistent behavior and styling; restore actions remain explicit, entity-specific, and use the existing pending/error feedback patterns.

In the demo and live editor, use design-system semantic foreground/background pairs for availability and discount status controls. Define hover and focus styles explicitly so the foreground remains readable against the hovered background. Apply the correction to at least Available/Sold out and Active/Paused/Expired states, including keyboard focus, without introducing new global color tokens or changing other demo behavior.

## Data flow and boundaries

Ordering actions submit identifiers and destination collections only; they never resend product names, prices, allergens, or other editable fields. Add a tenant-scoped batch reorder API operation that validates every identifier, parent relationship, active state, and duplicate before applying the complete order transactionally. It supports category order, product order/category moves, option-group order, and option order. Foreign or archived resources fail without partial changes. The frontend disables further ordering while a save is pending and keeps the prior order with actionable feedback on failure.

All catalog mutations continue through validated frontend server actions and server-only services. The API authenticates the caller, validates owner/manager membership, and enforces tenant ownership on every read and write. Restore-category/product/group/option and discount-checkout behavior follow the existing API/application/repository boundaries. Group restore requires an active product in an active category; option restore additionally requires an active group. Photos continue through the current tenant-scoped gallery service.

## Localization, accessibility, and responsive behavior

Add matching French and English copy for new confirmation text, restore actions, archived-category guidance, minimum/expiration validation, and hover-state labels where needed. Preserve semantic status text so availability is not conveyed by color alone. Use keyboard-operable drag alternatives, visible focus, live save feedback, labeled icon-only X controls, minimum target sizes, and responsive demo-equivalent grids/cards. Keep styling within the canonical WhitePlate tokens and shared primitives.

## Acceptance criteria

- The live editor matches the demo's category/product list, photo grid, option/extras, and discount layouts while preserving the real capabilities listed above.
- Categories and products reorder by drag-and-drop, product moves between categories by drop, and persisted ordering survives reload; no numeric category/product order controls or “Manage categories” dialog remain.
- Archived products can be filtered, inspected, and restored from the product list when their category is active. Products archived by a category require the category to be explicitly restored first; restoring category does not restore products or options.
- Archived groups and options can each be restored explicitly after their parents are active. Restoring a group does not restore its options, and no restore action silently changes descendant states.
- Every catalog remove/archive action presents a correctly named confirmation dialog; cancel performs no mutation and confirming uses the existing archive/deactivation operation without permanent deletion.
- Product photos support multi-add, reorder, first-item cover, confirmed removal, and real save/error/retry behavior.
- Option groups/options preserve their current validation, prices, edit/archive actions, individual restore paths, and order while using demo-like grouped cards and no numeric order fields.
- Discount minimum and expiration survive create/edit/read and are enforced at checkout using the specified subtotal and restaurant-local date rules.
- Hover and focus states in both demo and live editor keep text legible on the background for product availability and discount status.
- The Languages tab is unchanged, product metadata remains available, and order/tax behavior outside discount eligibility is unchanged.

## Documentation and implementation notes

Update API contracts, the database schema reference, the menu-manager audit, and the functional test plan with the behavior actually implemented. Preserve the untracked workspace directories and do not edit generated files. Before implementation, follow the frontend instruction to read the installed Next.js documentation for the affected server/client and mutation patterns. Use the existing API conventions and add the required migration; no dependency upgrade is proposed.

The visual reference is `/demo/menu`; hover colors are a defect in that source and must be corrected there before reusing those status-control treatments in the live editor.
