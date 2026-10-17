import { resolveWorkspaceContext } from "./workspace-navigation"
import type { Organization } from "@/types/organization"
import type { RestaurantMembership } from "@/types/orders"
import type { LiveWorkspaceLink } from "@/types/live-workspace"

const permission = {
  orders: "orders.manage",
  kitchen: "kitchen.display",
  catalog: "catalog.manage",
  discounts: "discounts.manage",
  analytics: "analytics.view",
  storefront: "storefront.manage",
  staff: "staff.manage",
  billing: "billing.manage",
} as const

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
  const granted = new Set(restaurant.permissions ?? [])
  const has = (...keys: string[]) => keys.some((key) => granted.has(key))
  const pages: (readonly [string, LiveWorkspaceLink["key"]])[] = []

  if (has(permission.orders, permission.kitchen)) {
    pages.push(["dashboard", "dashboard"], ["orders", "orders"])
  }
  if (has(permission.orders)) pages.push(["order-history", "orderHistory"])
  if (has(permission.analytics)) pages.push(["analytics", "analytics"])
  if (has(permission.catalog, permission.discounts))
    pages.push(["catalog", "catalog"])
  if (has(permission.storefront)) pages.push(["theming", "theming"])
  if (has(permission.staff) && restaurant.organizationId)
    pages.push([
      `/team?organizationId=${restaurant.organizationId}&tenantId=${restaurant.id}`,
      "team",
    ])
  if (has(permission.storefront, permission.orders, permission.billing)) {
    const section = has(permission.storefront)
      ? "establishment"
      : has(permission.orders)
        ? "notifications"
        : "payments"
    pages.push([`restaurant-settings?section=${section}`, "settings"])
  }

  return pages.map(([path, key]) => {
    if (path.startsWith("/")) return { href: `/organization${path}`, key }
    const [route, query] = path.split("?", 2)

    return {
      href: `/organization/${route}?${query ? `${query}&` : ""}tenantId=${context.id}`,
      key,
    }
  })
}

export function restaurantWorkspaceHref(restaurant: RestaurantMembership) {
  const granted = new Set(restaurant.permissions)
  const query = `?tenantId=${restaurant.id}`

  if (granted.has(permission.orders)) return `/organization/dashboard${query}`
  if (granted.has(permission.kitchen)) return `/organization/orders${query}`
  if (granted.has(permission.analytics)) return `/organization/analytics${query}`
  if (granted.has(permission.catalog) || granted.has(permission.discounts))
    return `/organization/catalog${query}`
  if (granted.has(permission.storefront)) return `/organization/theming${query}`
  if (granted.has(permission.staff) && restaurant.organizationId)
    return `/organization/team?organizationId=${restaurant.organizationId}&tenantId=${restaurant.id}`
  if (granted.has(permission.billing))
    return `/organization/restaurant-settings${query}&section=payments`

  return "/organization"
}
