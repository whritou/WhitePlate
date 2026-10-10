"use client"
import { useMemo, useState } from "react"
import { useLocale } from "next-intl"
import { useSearchParams } from "next/navigation"
import { OrderHistoryTable } from "@/components/orders/order-history-table"
import { parseOrderStatusFilter } from "@/lib/order-dashboard"
import { parseOptionalOrderHistoryDate } from "@/lib/order-history-filters"
import type { OrderHistoryFilters, OrderSummary } from "@/types/orders"
import type { Order } from "@/types/lovable/page-history"
import { makeOrders, total, Bill } from "./history-shared"
export function HistoryPage() {
  const locale = useLocale()
  const query = useSearchParams()
  const source = useMemo(() => makeOrders(), [])
  const [bill, setBill] = useState<Order | null>(null)
  const status = parseOrderStatusFilter(query.get("status") ?? undefined)
  const from = parseOptionalOrderHistoryDate(query.get("from") ?? undefined)
  const through = parseOptionalOrderHistoryDate(
    query.get("through") ?? undefined
  )
  const filters: OrderHistoryFilters = {
    tenantId: "demo",
    status: status.ok ? status.status : null,
    search: query.get("search")?.trim() || null,
    from: from.ok ? from.value : null,
    through: through.ok ? through.value : null,
    sort: query.get("sort") === "total" ? "total" : "createdAt",
    direction: query.get("direction") === "asc" ? "asc" : "desc",
    page: Math.max(1, Math.floor(Number(query.get("page")) || 1)),
    pageSize: 25,
  }
  const orders: OrderSummary[] = source
    .map((order): OrderSummary => ({
      id: order.id,
      customerName: order.customer,
      currency: "EUR",
      menuLocale: locale,
      total: total(order),
      status: order.status === "Collected" ? "Completed" : "Cancelled",
      version: 1,
      createdAt: order.date.toISOString(),
      lines: order.items.map((item, index) => ({
        productId: `${order.id}-${index}`,
        productName: item.n,
        quantity: item.q,
        options: [],
      })),
    }))
    .filter(
      (order) =>
        (!filters.status || order.status === filters.status) &&
        (!filters.search ||
          `${order.id} ${order.customerName}`
            .toLowerCase()
            .includes(filters.search.toLowerCase())) &&
        (!filters.from || order.createdAt.slice(0, 10) >= filters.from) &&
        (!filters.through || order.createdAt.slice(0, 10) <= filters.through)
    )
    .sort(
      (a, b) =>
        (filters.sort === "total"
          ? a.total - b.total
          : a.createdAt.localeCompare(b.createdAt)) *
        (filters.direction === "asc" ? 1 : -1)
    )
  const page = Math.min(
    filters.page,
    Math.max(1, Math.ceil(orders.length / filters.pageSize))
  )

  return (
    <>
      <OrderHistoryTable
        tenantName="Maison Verte"
        locale={locale}
        filters={{ ...filters, page }}
        route="/demo/history"
        page={{
          items: orders.slice(
            (page - 1) * filters.pageSize,
            page * filters.pageSize
          ),
          page,
          pageSize: filters.pageSize,
          totalCount: orders.length,
        }}
        onSelectOrder={(id) =>
          setBill(source.find((order) => order.id === id) ?? null)
        }
      />

      {bill && <Bill o={bill} onClose={() => setBill(null)} />}
    </>
  )
}

export {
  DISHES,
  NAMES,
  seeded,
  makeOrders,
  subtotal,
  total,
  vat,
  fmtDate,
  fmtTime,
  eur,
  PAGE,
  Bill,
} from "./history-shared"
