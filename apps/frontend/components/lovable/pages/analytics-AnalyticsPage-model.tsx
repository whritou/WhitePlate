"use client"
import { useMemo, useState } from "react"
import { useThemeColors, build, eur, pct } from "./analytics-shared"
export function useAnalyticsPageModel() {
  const [range, setRange] = useState<"7" | "30" | "90">("30")
  const [rest, setRest] = useState(0)
  const [metric, setMetric] = useState<"revenue" | "orders">("revenue")
  const d = useMemo(() => build(+range, rest), [range, rest])

  useThemeColors()

  const revenue = d.series.reduce((s, x) => s + x.revenue, 0)
  const prevRev = d.series.reduce((s, x) => s + x.prev, 0)
  const orders = d.series.reduce((s, x) => s + x.orders, 0)
  const basket = revenue / Math.max(1, orders)
  const kpis = [
    { k: "Revenue", v: eur(revenue), delta: pct(revenue, prevRev) },
    { k: "Orders", v: orders.toLocaleString("en-GB"), delta: 8.4 + rest },
    { k: "Avg basket", v: `€${basket.toFixed(2)}`, delta: 3.1 - rest * 0.6 },
    { k: "Returning customers", v: `${41 + rest * 2}%`, delta: 2.2 },
    { k: "Avg prep time", v: `${11 + rest} min`, delta: -6.5, invert: true },
    { k: "Commission paid", v: "€0", delta: 0, note: "0% fee forever" },
  ]
  const maxDish = d.dishes[0]?.rev ?? 1
  const exportCsv = () => {
    const rows = [
      ["Day", "Orders", "Revenue"],
      ...d.series.map((x) => [x.day, x.orders, x.revenue]),
    ]
    const a = document.createElement("a")

    a.href = URL.createObjectURL(
      new Blob([rows.map((r) => r.join(",")).join("\n")], { type: "text/csv" })
    )
    a.download = `analytics-${range}d.csv`
    a.click()
    URL.revokeObjectURL(a.href)
  }

  return {
    range,
    setRange,
    rest,
    setRest,
    metric,
    setMetric,
    d,
    revenue,
    prevRev,
    orders,
    basket,
    kpis,
    maxDish,
    exportCsv,
  }
}
