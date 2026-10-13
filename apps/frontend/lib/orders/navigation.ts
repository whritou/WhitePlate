import type { OrderDashboardViewFilters, OrderStatus } from "@/types/orders"

export function buildOrdersHref(
  tenantId: string,
  status: OrderStatus | null,
  cursor: string | null,
  filters?: OrderDashboardViewFilters
): string {
  const query = new URLSearchParams({ tenantId })

  if (status) query.set("status", status)
  if (cursor) query.set("cursor", cursor)
  if (filters?.search) query.set("q", filters.search)
  if (filters && filters.pickupMode !== "all")
    query.set("pickup", filters.pickupMode)

  return `/organization/orders?${query}`
}
