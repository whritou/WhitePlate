import type { OrderSummary, UpdateOrderStatusInput } from "@/types/orders"
import { getAvailableOrderTransitions } from "@/lib/order-dashboard"

export function resolveOrderDrop(
  snapshot: OrderSummary,
  orders: OrderSummary[],
  destination: string | null,
  blocked: boolean,
  permissions: string[] = []
): Omit<UpdateOrderStatusInput, "tenantId"> | null {
  const current = orders.find((order) => order.id === snapshot.id)

  if (
    blocked ||
    !current ||
    current.version !== snapshot.version ||
    current.status !== snapshot.status ||
    !destination
  )
    return null

  const status = getAvailableOrderTransitions(current.status, permissions).find(
    (status) => status === destination
  )

  return status
    ? { orderId: current.id, version: current.version, status }
    : null
}
