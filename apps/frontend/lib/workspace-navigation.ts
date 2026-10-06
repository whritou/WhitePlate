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
      links.push(
        {
          href: `/organization/catalog?tenantId=${tenantId}`,
          label: translate("catalog"),
        },
        {
          href: `/organization/restaurant-languages?tenantId=${tenantId}`,
          label: translate("menuLanguages"),
        }
      )
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

export function isWorkspaceLinkActive(href: string, pathname: string) {
  const path = href.split("?", 1)[0]

  if (path === "/organization") return pathname === path

  return pathname === path || pathname.startsWith(`${path}/`)
}
