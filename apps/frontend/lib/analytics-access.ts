import type { RestaurantMembership } from "@/types/orders"

export function selectAnalyticsMemberships(
  memberships: RestaurantMembership[]
): RestaurantMembership[] {
  return memberships.filter((item) =>
    item.permissions.includes("analytics.view")
  )
}
