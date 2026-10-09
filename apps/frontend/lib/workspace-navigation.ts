import type { Organization } from "@/types/organization"
import type { RestaurantMembership } from "@/types/orders"
import type {
  WorkspaceContext,
  WorkspaceNavigationSection,
  WorkspaceNavigationTranslationKey,
} from "@/types/workspace-navigation"

export function buildWorkspaceNavigation(
  organizations: Organization[],
  restaurants: RestaurantMembership[],
  translate: (key: WorkspaceNavigationTranslationKey) => string
): WorkspaceNavigationSection[] {
  const sections: WorkspaceNavigationSection[] = [
    {
      id: "workspace",
      label: translate("workspace"),
      links: [{ href: "/organization", label: translate("overview") }],
    },
  ]

  for (const organization of organizations) {
    const organizationId = encodeURIComponent(organization.id)

    sections.push({
      id: `organization-${organization.id}`,
      label: organization.name,
      links: [
        {
          href: `/organization/team?organizationId=${organizationId}`,
          label: translate("team"),
        },
        {
          href: `/organization/settings?organizationId=${organizationId}`,
          label: translate("settings"),
        },
        {
          href: `/organization/restaurants/new?organizationId=${organizationId}`,
          label: translate("createRestaurant"),
        },
      ],
    })
  }

  for (const restaurant of restaurants) {
    const tenantId = encodeURIComponent(restaurant.id)
    const links = [
      {
        href: `/organization/orders?tenantId=${tenantId}`,
        label: translate("orders"),
      },
    ]

    if (restaurant.role !== "Kitchen") {
      links.push({
        href: `/organization/order-history?tenantId=${tenantId}`,
        label: translate("orderHistory"),
      })
    }

    if (restaurant.role !== "Kitchen") {
      links.push({
        href: `/organization/catalog?tenantId=${tenantId}`,
        label: translate("catalog"),
      })
      links.push({
        href: `/organization/theming?tenantId=${tenantId}`,
        label: translate("theming"),
      })
    }

    sections.push({
      id: `restaurant-${restaurant.id}`,
      label: restaurant.name,
      links,
    })
  }

  return sections
}

export function resolveWorkspaceContext(
  searchParams: URLSearchParams,
  organizations: Organization[],
  restaurants: RestaurantMembership[]
): WorkspaceContext | null {
  const tenantIds = searchParams.getAll("tenantId")

  if (tenantIds.length > 0) {
    if (tenantIds.length !== 1) return null

    const restaurant = restaurants.find(
      (item) => item.id.toLowerCase() === tenantIds[0].toLowerCase()
    )

    return restaurant
      ? { type: "restaurant", id: restaurant.id, name: restaurant.name }
      : null
  }

  const organizationIds = searchParams.getAll("organizationId")

  if (organizationIds.length > 0) {
    if (organizationIds.length !== 1) return null

    const organization = organizations.find(
      (item) => item.id.toLowerCase() === organizationIds[0].toLowerCase()
    )

    return organization
      ? { type: "organization", id: organization.id, name: organization.name }
      : null
  }

  return null
}

export function isWorkspaceLinkActive(
  href: string,
  pathname: string,
  searchParams: URLSearchParams
) {
  const [path, query = ""] = href.split("?", 2)

  if (path === "/organization") return pathname === path

  const pathMatches = pathname === path || pathname.startsWith(`${path}/`)

  if (!pathMatches) return false

  const linkParams = new URLSearchParams(query)
  const linkTenantIds = linkParams.getAll("tenantId")
  const linkOrganizationIds = linkParams.getAll("organizationId")

  if (linkTenantIds.length === 1 && linkOrganizationIds.length === 0) {
    const currentTenantIds = searchParams.getAll("tenantId")

    return (
      currentTenantIds.length === 1 &&
      searchParams.getAll("organizationId").length === 0 &&
      currentTenantIds[0].toLowerCase() === linkTenantIds[0].toLowerCase()
    )
  }

  if (linkOrganizationIds.length === 1 && linkTenantIds.length === 0) {
    const currentOrganizationIds = searchParams.getAll("organizationId")

    return (
      currentOrganizationIds.length === 1 &&
      searchParams.getAll("tenantId").length === 0 &&
      currentOrganizationIds[0].toLowerCase() ===
        linkOrganizationIds[0].toLowerCase()
    )
  }

  return linkTenantIds.length === 0 && linkOrganizationIds.length === 0
}
