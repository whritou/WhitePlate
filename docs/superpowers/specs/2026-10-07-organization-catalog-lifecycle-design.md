# Organization and catalog lifecycle design

**Date:** 2026-10-07  
**Status:** Proposed; awaiting user review  
**Scope:** Organization workspace overview/settings, organization archive and restore, product restore

## Context

The organization overview renders action links as adjacent items in card footers and restaurant settings rows. The organization overview skeleton is constrained to `max-w-5xl`, while the real page uses `max-w-7xl`; its fixed-width action placeholders also do not match the wrapping layout. Catalog archive operations already exist. Archived products are read-only, there is no product restore action, and the user explicitly chose not to add permanent product deletion. The user chose organization archiving with data retained.

`Organization` already has an `IsActive` property and `Deactivate()` domain method, but the current API does not wire an archive/restore operation or use that state as an access boundary. Organization ownership, restaurant memberships, catalog/order operations, invitations, and public tenant resolution are persisted in the business API. The frontend reads its organization list from that API. Catalog order lines retain product identifiers and immutable product labels/prices as snapshots.

## Goals

- Give organization overview actions consistent spacing and safe wrapping at narrow widths, in French and English.
- Make the overview skeleton reflect the real page's width, cards, and wrapping actions.
- Let an organization owner archive and restore an organization from the workspace, retaining its organization, restaurant, catalog, invitation, membership, and order records.
- Ensure an archived organization cannot be used through owner, manager, kitchen, invitation-acceptance, checkout, or public-menu paths.
- Let authorized owners and managers restore archived products in active restaurants without permanently deleting catalog data or changing historical order snapshots.
- Keep visual changes within the canonical WhitePlate design system and existing shared UI primitives.

## Non-goals

- Permanent deletion or data purging of organizations, products, or orders.
- Deleting or rewriting Better Auth identities, memberships, organization rows, or user accounts.
- Changing restaurant activation state as a side effect of organization archive/restore. Organization activity is an additional access gate; each restaurant retains its own activation setting.
- Restoring archived categories, option groups, options, or discounts in this change. Product restore changes only the selected product; separately archived descendants remain archived.
- Changing organization ownership, restaurant roles, menu design, or order snapshot semantics.

## Proposed design

### Workspace layout and loading state

Keep the organization overview as a server-rendered page. In organization cards, place the three organization actions in a dedicated flex-wrapped group with token-based gaps and controls that may shrink or wrap. In restaurant menu-settings cards, group the language and catalog actions so their labels cannot collide or overflow. Preserve accessible link names, minimum target sizes, localized copy, and existing card primitives.

Update the overview loading skeleton to use the same page width as the actual overview. Model the three organization actions and two menu actions as wrapping groups whose widths and card structure correspond to the rendered content. Keep loading feedback in the existing `WorkspaceLoadingSkeleton` route boundary.

### Organization archive and restore

Use the existing business `Organization.IsActive` state. Add owner-authorized API operations to archive and restore an organization. The operations are idempotent and retain all rows. The owner settings page adds an explicitly labeled danger-zone section. Because the operation is reversible, its copy says “Archive” rather than implying permanent erasure; a localized alert dialog names the organization and explains that organization and restaurant operations become unavailable while archived.

The overview continues to list organizations owned by the signed-in identity and includes active state. Active organizations keep their current actions. Archived organizations are visibly marked and expose a restore action. This is the recovery path and avoids relying on direct database intervention. Rename, create-restaurant, invite, and normal organization-management mutations reject an archived organization; the owner can still read its archived state and restore it.

The archive state must be enforced on the server, not inferred from a browser tenant or organization identifier. Organization-owned API reads and writes that confer operational access, restaurant membership checks, invitation acceptance, checkout, and public tenant resolution must require an active organization as well as their existing owner/role/tenant checks. Read-only owner listing needed to find and restore an archived organization remains available. Pending invitations are retained; they cannot be accepted while the organization is archived and may be accepted after restoration if they are still valid. Restaurant `IsActive` remains independent, so restoring the organization does not reactivate a restaurant that was already inactive.

Proposed contracts:

- `POST /api/v1/organizations/{organizationId}/archive` — owner only; set inactive; return `204` on success.
- `POST /api/v1/organizations/{organizationId}/restore` — owner only; set active; return `204` on success.
- Extend the organization listing DTO with `isActive` so the frontend can render archive state and the recovery action.

Archived-organization operational requests use the existing not-found policy for unavailable/foreign resources, avoiding disclosure of another organization's state. Invalid authentication remains `401`; a signed-in non-owner remains denied according to the existing organization endpoint policy. No new auth-provider organization deletion call is made.

### Product restore

Keep `DELETE /api/v1/tenants/{tenantId}/products/{productId}` as the existing soft-archive operation. Add an owner/manager-authorized restore operation for the active tenant, proposed as `POST /api/v1/tenants/{tenantId}/products/{productId}/restore`, returning `204` for success. Restoration fails while the containing category is archived, so a product cannot become active under an unavailable parent. Restoring a product clears its archived state but leaves it unavailable; the owner or manager must explicitly mark it available. It does not restore archived option groups or options, alter discount state, or edit order snapshots.

In the catalog page, archived products remain visibly marked and retain read-only details and option history. Add a restore control with pending, success, conflict/parent-archived, permission, and unavailable feedback. Active products keep the existing archive confirmation flow. No permanent-delete control is added.

## Authorization and data flow

All mutation requests continue through validated frontend server actions and server-only services using the shared API request client. The API authenticates the current identity, verifies ownership or the tenant's owner/manager role, validates the resource relationship, and applies domain state changes through application handlers and repositories. Tenant IDs supplied by the browser are selectors only.

Organization active-state enforcement must be applied consistently to the business API's current membership and tenant resolution paths. A request with an archived organization must not be allowed merely because an old Better Auth membership, tenant ID, or previously issued invitation still exists. Public tenant lookup and checkout must reject the tenant while its organization is inactive. Restoring the organization makes preserved, otherwise-active records usable again without modifying their history.

## Failure and concurrency behavior

- Archive/restore operations are repeat-safe; successful repeated requests return the same success outcome.
- Missing organizations/products and resources outside the caller's ownership boundary follow existing safe not-found/forbidden response conventions.
- Product restoration under an archived category returns a conflict or validation error that maps to localized actionable guidance.
- The UI closes confirmation dialogs only after an acknowledged success; pending submissions prevent duplicate actions.
- Errors retain the current state and provide retry guidance without claiming the mutation succeeded.

## Localization, accessibility, and responsive behavior

Add matching French and English catalog keys. Use shared `AlertDialog`, `Button`, card, alert, badge, and status-feedback primitives. Provide semantic headings for the danger zone, explicit action names, keyboard-operable dialogs, visible focus, live feedback, and mobile wrapping. Respect light/dark design tokens and the existing 44 px target guidance. Keep archived state understandable without relying on color alone.

## Documentation and verification

Update API contracts, backend/frontend architecture notes, roadmap, and the functional test plan to describe only behavior wired and verified. Add API/domain/application coverage for ownership, archived organization access boundaries, invitation/checkout/public-menu rejection, restoration, and independent tenant activation. Add frontend coverage for wrapping action structure, skeleton dimensions, archive/restore states, French/English labels, and errors. Use the guarded non-production acceptance flow for database/browser verification; never run lifecycle mutation acceptance against Production.

Run the focused API/frontend tests, then the applicable package lint, format, typecheck and build commands, plus the API solution tests. Report actual commands/results and baseline lint limitations. Visual review must cover both themes and 320/375/768/1024/1440 px layouts, keyboard/focus, and long localized labels.

## Decisions and open implementation checks

| Decision | Status | Consequence |
| --- | --- | --- |
| Organization removal is reversible archive with all records retained | Approved by user 2026-10-07 | Provide owner restoration and enforce inactive state across operational access paths |
| Product archival is reversible; no permanent purge | Approved by user 2026-10-07 | Keep order snapshots and archived records intact |
| Restaurant activation is independent of organization activation | Proposed | Archive/restore gates access without overwriting each tenant's prior active flag |
| Archived invitations remain stored and can resume after restoration if still valid | Proposed | Acceptance must check current organization state; archive does not erase invitations |
| Product restore does not revive archived option groups/options and does not make the product available | Proposed | Avoid silently reactivating separately archived options or enabling ordering |
| `isActive` is returned in organization-list DTO; dedicated archive/restore routes return `204` | Proposed | Keeps the browser display informative and lifecycle operations explicit |

The latter four choices are implementation details that fit the user's approved retention and restoration intent. If repository constraints contradict them during implementation, stop and update this design before changing the contract.
