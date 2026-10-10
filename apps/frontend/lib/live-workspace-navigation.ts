import { resolveWorkspaceContext } from "./workspace-navigation"
import type { Organization } from "@/types/organization"
import type { RestaurantMembership } from "@/types/orders"
import type { LiveWorkspaceLink } from "@/types/live-workspace"

export function liveWorkspaceLinks(
  search: URLSearchParams,
  organizations: Organization[],
  restaurants: RestaurantMembership[]
): LiveWorkspaceLink[] {
  const context = resolveWorkspaceContext(search, organizations, restaurants)

  if (!context) return []
  if (context.type === "organization") {
    return (
      [
        ["team", "team"],
        ["settings", "settings"],
        ["restaurants/new", "createRestaurant"],
      ] as const
    ).map(([path, key]) => ({
      href: `/organization/${path}?organizationId=${context.id}`,
      key,
    }))
  }

  const restaurant = restaurants.find((item) => item.id === context.id)!
  const pages =
    restaurant.role === "Kitchen"
      ? ([["orders", "orders"]] as const)
      : ([
          ["dashboard", "dashboard"],
          ["orders", "orders"],
          ["order-history", "orderHistory"],
          ["analytics", "analytics"],
          ["catalog", "catalog"],
          ["theming", "theming"],
          ["restaurant-settings", "settings"],
        ] as const)

  return pages.map(([path, key]) => ({
    href: `/organization/${path}?tenantId=${context.id}`,
    key,
  }))
}
