import type { OrderStatus } from "@/types/orders"

export function buildOrdersHref(
  tenantId: string,
  status: OrderStatus | null,
  cursor: string | null
): string {
  const query = new URLSearchParams({ tenantId })
  if (status) query.set("status", status)
  if (cursor) query.set("cursor", cursor)
  return `/organization/orders?${query}`
}
