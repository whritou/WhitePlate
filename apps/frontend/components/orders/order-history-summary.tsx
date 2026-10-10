"use client"

import { useTranslations } from "next-intl"
import { Download } from "lucide-react"
import { Button } from "@/components/ui/button"
import { historyAmounts, historyCsv } from "@/lib/order-history-export"
import type { OrderSummary } from "@/types/orders"

export function OrderHistorySummary({
  orders,
  locale,
}: {
  orders: OrderSummary[]
  locale: string
}) {
  const t = useTranslations("OrderHistory")
  const amounts = historyAmounts(orders)
  const format = (key: "total" | "average") =>
    amounts
      .map((group) =>
        new Intl.NumberFormat(locale, {
          style: "currency",
          currency: group.currency,
        }).format(group[key])
      )
      .join(" · ") || "—"

  function exportCsv() {
    const url = URL.createObjectURL(
      new Blob(["\uFEFF", historyCsv(orders)], {
        type: "text/csv;charset=utf-8",
      })
    )
    const link = document.createElement("a")

    link.href = url
    link.download = "whiteplate-order-history.csv"
    link.click()
    URL.revokeObjectURL(url)
  }

  return (
    <section aria-label={t("summary")} className="grid gap-3">
      <div className="grid border sm:grid-cols-3">
        {[
          [t("loadedOrders"), String(orders.length)],
          [t("loadedTotal"), format("total")],
          [t("averageBasket"), format("average")],
        ].map(([label, value]) => (
          <div
            key={label}
            className="min-w-0 border-b p-4 last:border-b-0 sm:border-r sm:border-b-0 sm:last:border-r-0"
          >
            <h2 className="label-mono text-muted-foreground">{label}</h2>

            <p className="mt-2 font-display text-2xl font-bold tabular-nums">
              {value}
            </p>
          </div>
        ))}
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-muted-foreground">{t("summaryScope")}</p>

        <Button type="button" variant="outline" onClick={exportCsv}>
          <Download aria-hidden="true" />

          {t("exportCsv")}
        </Button>
      </div>
    </section>
  )
}
