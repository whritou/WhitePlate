# Custom organization roles

**Date:** 2026-10-18
**Status:** Draft for review
**Related work:** [Staff & roles permissions task](https://github.com/users/whritou/projects/1/views/1?pane=issue&itemId=274836766)

## Intent

Extend the existing persisted Organization → Staff & roles permission system so owners can create custom roles and use them for restaurant staff. The current owner-editable permission matrix and server checks are already implemented; this work builds on them rather than recreating them. Keep the existing visual style. Role changes continue to affect which pages, tabs, sections, and actions are available.

## Current behavior

- `OrganizationRoleGrantSet` persists one permission set per organization and fixed `RestaurantRole` enum value.
- Organization owners can read the role matrix and replace permission grants through versioned owner-only API operations.
- Organization creation seeds `Manager`, `Staff`, `Kitchen`, and `Accountant`; Owner is a protected synthetic role.
- Restaurant memberships and invitations store fixed enum roles. The server resolves permissions from the member's enum role and organization grant row.
- Custom role definitions and assignment are not supported.

The existing grant editor, supported permission catalog, permission checks, owner protection, and current page visibility behavior remain in place.

## Role catalog

### New organizations

Provision a protected synthetic **Owner** role and three editable built-in roles:

| Role | Default permissions |
| --- | --- |
| Manager | `orders.manage`, `kitchen.display`, `catalog.manage`, `discounts.manage`, `analytics.view`, `storefront.manage`, `staff.manage` |
| Kitchen staff | `kitchen.display` |
| Accountant | `analytics.view`, `billing.manage` |

Manager does not receive `billing.manage`. Stripe account connection and OAuth remain owner-only even when a role has billing visibility. These defaults are an initial baseline; owners can change the grants using the existing editor.

The fixed `Staff` role is not seeded for newly created organizations. Existing organizations retain their current Staff role and grant set so existing assignments keep their behavior. Existing `Kitchen` assignments display as **Kitchen staff** after migration.

### Custom roles

- An organization owner can create a role with a trimmed display name and any subset of the existing permission catalog.
- Role names are unique within an organization using case-insensitive, normalized comparison. Built-in names and reserved owner names cannot be reused.
- Owners can change a custom role's name and grants. Built-in role names stay fixed, while their grants remain editable through the existing flow.
- Role definitions and grants are organization-scoped. A role from one organization can never be assigned in another.
- Owner remains synthetic, cannot be created, edited, archived, invited as a restaurant role, or assigned to a restaurant membership.
- An owner can archive an unused custom role. Archiving is rejected while active memberships or pending invitations use it. The archived record remains for historical invitation references and is not offered for new assignments.
- Assigning or changing a staff member's role uses an active role from that member's organization. An invitation's organization and restaurant must match the selected role.

## Data and authorization design

Promote the existing organization role grant row into the persisted role definition instead of adding a duplicate role catalog. Keep its permission bitset and optimistic version, and add a stable role ID, display name, normalized name, optional built-in key, and archive state. The role remains the source of truth for both presentation metadata and grants.

Restaurant memberships and restaurant invitations reference the stable organization role ID rather than a fixed enum. Persist the organization ID on memberships so the database can enforce the role and restaurant composite ownership boundary. Organization-owner memberships and owner invitations retain their existing special path and never depend on an editable role row. Permission resolution loads the active membership's role record, then applies its stored grants; missing, archived, foreign, or malformed role data denies access.

Existing explicit manager-only checks that represent a permission already in the catalog should continue to authorize through that permission. Owner-only operations such as owner management, organization lifecycle, and Stripe account linking remain protected by the built-in owner check. `staff.manage` continues to control permitted invitation/member administration; it does not grant permission to create or edit role definitions.

## API and UI behavior

- Keep the owner-only role list operation and its no-store response. Each role includes stable ID, display name, optional built-in key, permissions, version, protected/built-in state, and archive state.
- Add owner-only create and archive operations. Extend the existing owner-only update operation to support custom-role names while keeping grant updates version-checked. Built-in role names and Owner grants remain protected as described above.
- Update invitation and membership-role assignment contracts to accept stable role IDs and validate organization ownership on the server.
- Keep the existing role matrix and controls. Add an owner-facing create-role form and custom-role name/archive controls, using the existing permission checkboxes and current component style.
- Make active custom roles available in staff invitations and owner role reassignment. Show their saved names in the staff directory and invitation list; continue localizing built-in names from system role keys.
- Keep localized copy in English and French. Non-owners do not receive role-management controls. Frontend hiding complements, but never replaces, server authorization.

The supported permission catalog stays fixed. This feature does not add permission-key creation, new permission concepts, or different authorization behavior for existing grants.

## Migration and compatibility

Add a reviewed EF migration that converts existing enum-backed grant and membership/invitation roles to stable role references without changing existing permission bitsets or tenant memberships. It also preserves the current `Staff` role for existing organizations and creates only the requested three editable defaults for newly provisioned organizations. Keep migrations explicit; application startup does not migrate the database.

Role references use organization-scoped foreign keys. Restrictive deletes prevent orphaned memberships or invitations. The migration and provisioning path must be safe for organizations created both before and after the change.

## Failure and security behavior

- Only the organization owner may create, rename, edit, or archive role definitions.
- Stale role updates return the existing precondition failure behavior.
- Duplicate or invalid names, unsupported permissions, foreign role IDs, owner assignment attempts, and archived-role assignment fail validation or return the established not-found response without exposing a foreign organization.
- A role with active membership or a pending invitation cannot be archived; the owner must reassign members and revoke or update pending invitations first.
- Permission resolution fails closed when role lookup or organization/tenant ownership validation fails.
- Existing owner full access and owner-only operations cannot be reduced through a role edit or custom role.

## Acceptance criteria

1. Creating an organization provisions Manager, Kitchen staff, and Accountant with the defaults in this spec. The UI also shows the synthetic, protected Owner role; the owner can edit each persisted built-in grant and the saved changes persist.
2. An owner can create a uniquely named custom role, grant supported permissions, reload the page, and see the saved role and grants.
3. A custom role can be selected for an invitation and assigned to an existing restaurant member; the resulting user receives exactly the role's effective permissions.
4. Permission revocation for a custom role blocks subsequent protected API requests and removes the matching navigation/actions after permission refresh.
5. Non-owners cannot create, edit, or archive roles, even when they have `staff.manage`.
6. A role cannot be used across organizations, and a custom role cannot be archived while an active member or pending invitation references it.
7. Existing Manager, Staff, Kitchen, and Accountant memberships keep their prior permission behavior through migration; the owner role remains protected.
8. The matrix, team directory, and invitation flow keep their existing visual style and work in English and French.

## Verification scope

Domain and application tests cover role-name rules, defaults, owner-only mutations, version conflicts, assignment validation, archive restrictions, and fail-closed permission resolution. Infrastructure/API tests cover migration mapping, restrictive relationships, invitation/member assignment, and two-organization isolation. Frontend tests cover dynamic matrix rendering, create/edit/archive controls, invitation selection, existing-member reassignment, localization, and unavailable/error states. Broader database and hosted acceptance remains separate from source-level tests.
