# Quick product availability

Date: 2026-10-14. Status: approved source design for D4.

## Decision

Keep full catalog reads and product edits owner/manager-only. Add a tenant-scoped availability read that returns only product ID, name and availability for products in active, visible categories. Organization owners, restaurant managers and Kitchen members may use that read.

Add a separate product availability update that accepts one explicit boolean. Recheck the persisted membership on every request. Only an unarchived product in the selected tenant and an active, visible category can be changed. Missing, foreign, archived or hidden products return the same `404` response. Kitchen members receive no price, allergen, preparation, option or catalog-edit capability through these routes.

The existing availability field remains authoritative for new storefront menus and checkout. Checkout still revalidates the catalog on the server, and saved order lines remain unchanged. No table or migration is needed.

The availability-only API read and update remain available under the authorization rules above. On 14 October 2026, the user directed that quick availability be removed from the dashboard as part of matching the reviewed dashboard composition. The dashboard no longer requests availability data or renders quick toggles. Storefront open, copy and QR actions remain in the dashboard and use the existing validated tenant subdomain and locale URL policy.

## Consequences

- Role and tenant checks stay in the API; browser tenant IDs only select the resource.
- Archived or hidden products cannot be reactivated through the availability API.
- Product availability is immediately visible to new storefront reads and checkout validation; realtime availability push is outside D4.
- The frontend and API contracts remain localized at the user interface; product names retain the catalog's saved base name.
