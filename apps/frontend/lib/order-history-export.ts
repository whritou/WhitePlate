import type { OrderSummary } from "@/types/orders"

export function historyCsv(orders: OrderSummary[]): string {
  const rows = [
    ["Order", "Date", "Customer", "Status", "Currency", "Total", "Items"],
    ...orders.map((order) => [
      order.id,
      order.createdAt,
      order.customerName,
      order.status,
      order.currency,
      order.total.toFixed(2),
      order.lines
        .map((line) => `${line.quantity} × ${line.productName}`)
        .join(" | "),
    ]),
  ]

  return rows
    .map((row) =>
      row
        .map((value) => {
          const safe = /^\s*[=+\-@]/.test(value) ? `'${value}` : value

          return `"${safe.replace(/"/g, '""')}"`
        })
        .join(",")
    )
    .join("\r\n")
}

export function historyAmounts(orders: OrderSummary[]) {
  const groups = new Map<string, { total: number; count: number }>()

  for (const order of orders) {
    const group = groups.get(order.currency) ?? { total: 0, count: 0 }

    group.total += order.total
    group.count++
    groups.set(order.currency, group)
  }

  return [...groups].map(([currency, group]) => ({
    currency,
    total: group.total,
    average: group.total / group.count,
  }))
}
