# Organization Workspace Shell Design

**Date:** 2026-10-06

**Status:** Implemented; authenticated browser verification pending

**Kanban card:** Add a responsive sidebar and app bar to the organization workspace

## Context and outcome

WhitePlate already has localized organization overview, team, restaurant creation, catalog, menu-language, settings, and kitchen-order pages. They currently render independently and do not share a navigation frame. The goal is to give signed-in restaurant operators a consistent way to understand their current organization or restaurant and move between pages available to their role, on desktop and mobile.

The existing authorization boundary remains authoritative: the server derives organizations and restaurant memberships from the verified session, each protected page validates its resource, and the API independently checks ownership or membership for every read and mutation. A URL parameter may select a displayed context but never grants access.

## Approaches considered

1. **Add a shared route-group layout (recommended).** Move the authenticated organization routes beneath `app/[locale]/(workspace)/organization/` and put the shared shell in `(workspace)/organization/layout.tsx`. Next route groups do not appear in URLs, so existing links and public routes retain their paths. Keep organization sign-up outside the group. This provides one place for role-aware navigation and the responsive frame.
2. **Wrap each existing page individually.** This avoids moving route files but repeats shell composition and makes future workspace routes easy to omit. Responsive state and navigation behavior would be harder to keep consistent.

The route-group layout is recommended because this change intentionally establishes a shared boundary across several existing workspace pages while keeping the public sign-up flow separate.

## Proposed design

### Route and authorization boundary

- Add the `(workspace)` route group under the locale segment. Move the organization overview, team, restaurant creation, catalog, menu-language, settings, orders, and organization loading UI into its `organization` route tree without changing their public URL paths.
- Keep `/[locale]/organization/sign-up` outside the workspace group, along with authentication and public storefront routes.
- Give the overview and each workspace page its own loading boundary. Reserve page-shaped content in each fallback; do not place an overview-shaped fallback at the organization parent where it can mask nested routes. Keep a matching form fallback for organization sign-up outside the shell.
- The server layout requires a signed-in, verified session, matching the current protected-workspace behavior. It reads the signed-in user's owned organizations and restaurant memberships through the existing server-only services and passes only display/navigation data to the shell.
- Preserve page-level and API-level ownership and membership checks. Layout data is for navigation only and is not reused as an authorization grant.
- Treat a requested `organizationId` or `tenantId` as selected context only when it matches an organization or restaurant returned for the verified user. Unknown IDs produce a neutral workspace context; they do not reveal resource data.

### Navigation and responsive frame

- Add a persistent desktop sidebar and a top app bar using the existing theme tokens and shadcn-compatible Base UI components.
- Add a local shadcn-compatible `Sheet` primitive for mobile navigation, based on the installed Base UI primitives. The mobile menu must close on Escape and navigation, contain its own scrolling, and preserve the trigger/focus behavior provided by the primitive.
- Show the selected organization or restaurant name only when it is present in server-verified navigation data. Build links from those authorized records and preserve the relevant `organizationId` and `tenantId` query parameters.
- Show links according to the user's available role and records:
  - Organization owners can reach organization team, settings, and restaurant creation for organizations they own.
  - Restaurant owners and managers can reach catalog and menu-language settings for restaurants they can manage.
  - Restaurant members with order access can reach the kitchen orders page for their restaurants.
  - The overview remains the entry point for the user's organization and restaurant memberships.
- Use locale-aware navigation helpers for links and locale switching. Include a theme control and the existing sign-out action in the app bar, with accessible names and visible keyboard focus. Mark the active route semantically and visually.
- Keep public pages and authentication flows outside this shell.

### Components and data flow

- Keep server session and membership reads in the route-group layout or server-only services. Keep the shared shell interactive only where needed for mobile disclosure, active route state, and locale/theme controls.
- Pass serializable, presentation-only organization and restaurant records into the client shell; do not pass API tokens, auth secrets, or raw request headers.
- Keep link generation and role filtering in a focused pure navigation helper so it can be tested independently from the rendered shell.
- Reuse the checked-in Button, Separator, and other shadcn Base UI primitives. Add the Sheet implementation to `components/ui` only if no existing primitive satisfies the required behavior.

## Verification

- Unit-test role-aware navigation, selected-context validation, query preservation, and active-route matching.
- Component-test localized navigation, semantic active state, visible focus, account/theme controls, and role-filtered links. Verify each route selects its page-shaped loading fallback in both language catalogs.
- Verify the mobile Sheet's Escape dismissal, focus containment/restoration, and contained scrolling using the installed Base UI Dialog behavior and browser coverage when an isolated authenticated browser environment is available.
- Run the frontend tests, lint, typecheck, format check, and production build as appropriate. Record exact results in the documentation review.
- Review the route move for unchanged URLs and confirm organization sign-up renders in the workspace shell while auth and storefront routes remain outside it.

## Documentation and scope

Update the frontend architecture and the relevant UI conventions to describe the route-group layout, its role-scoped navigation data, and the Sheet primitive after implementation. Keep English and French user-visible copy in sync.

This design covers only the workspace sidebar and app bar card. Accessible mutation toasts and organization roster/invitation reads are separate kanban cards and will be designed and implemented in sequence after this shell scope is reviewed and completed.

## Open implementation checks

- Read the installed Next.js layout and route-group documentation before moving routes.
- Inspect the installed Base UI Dialog/Sheet APIs and the existing theme/sign-out controls before composing the shell.
- Verify all currently supported restaurant roles against the existing page and API access checks before finalizing link visibility.

## Implementation notes

- The workspace layout reads the verified account's current organization and restaurant records only to render navigation. Page and API authorization remain independent.
- `WorkspaceShell` uses the existing shadcn Base UI Button and Separator controls plus a local Sheet composition over Base UI Dialog.
- Every overview, team, restaurant creation, catalog, menu-language, organization settings, kitchen orders, and organization sign-up route now has its own localized loading layout. The overview fallback is isolated under an invisible route group.
- Vitest covers role links, selected context, locale query preservation, responsive layout markers, shell controls, and route-to-skeleton mappings. Full browser keyboard and focus-return verification remains an environment-dependent follow-up; the Sheet delegates those behaviors to Base UI Dialog.

## Follow-up — 2026-10-07

The organization sign-up route and its loading layout were moved into `(workspace)/organization/sign-up` after the initial implementation. This route already requires a verified session, so it now shares the workspace navigation. Next.js route groups do not alter the public URL: `/[locale]/organization/sign-up` is unchanged.
