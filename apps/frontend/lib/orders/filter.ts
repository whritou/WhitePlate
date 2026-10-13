import type { OrderPickupModeFilter, OrderSummary } from "@/types/orders"

export function filterOrders(
  orders: OrderSummary[],
  search: string,
  pickupMode: OrderPickupModeFilter
): OrderSummary[] {
  const query = normalize(search.trim())

  return orders.filter((order) => {
    if (pickupMode === "asap" && order.pickupMode !== "Asap") return false

    if (pickupMode === "scheduled" && order.pickupMode !== "Scheduled")
      return false

    if (
      pickupMode === "unrecorded" &&
      order.pickupMode !== null &&
      order.pickupMode !== undefined
    )
      return false

    if (!query) return true

    return [
      order.id,
      order.id.slice(0, 8),
      order.customerName,
      ...order.lines.flatMap((line) => [
        line.productName,
        ...line.options.map((option) => option.name),
      ]),
    ].some((value) => normalize(value).includes(query))
  })
}

function normalize(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLocaleLowerCase()
}
