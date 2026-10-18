import type { AnalyticsMetrics, AnalyticsRange } from "@/types/analytics"

export function exportAnalyticsCsv(
  data: AnalyticsMetrics,
  range: AnalyticsRange,
  t: (
    key:
      | "csvHeaderType"
      | "csvHeaderDay"
      | "csvHeaderTenant"
      | "csvHeaderRestaurant"
      | "csvHeaderItem"
      | "csvHeaderQuantity"
      | "csvHeaderOrders"
      | "csvHeaderCurrency"
      | "csvHeaderRevenue"
      | "csvHeaderPreviousRevenue"
      | "csvHeaderAvailability"
  ) => string
) {
  const rows: unknown[][] = [
    [
      t("csvHeaderType"),
      t("csvHeaderDay"),
      t("csvHeaderTenant"),
      t("csvHeaderRestaurant"),
      t("csvHeaderItem"),
      t("csvHeaderQuantity"),
      t("csvHeaderOrders"),
      t("csvHeaderCurrency"),
      t("csvHeaderRevenue"),
      t("csvHeaderPreviousRevenue"),
      t("csvHeaderAvailability"),
    ],
  ]

  rows.push([
    "period",
    data.currentPeriod.startDate,
    "",
    data.restaurant,
    "selected period",
    "",
    data.currentPeriod.days,
    "",
    "",
    "",
    data.timeZones.map((item) => `${item.tenantId}:${item.timeZone}`).join("|"),
  ])
  rows.push([
    "comparison_period",
    data.comparisonPeriod.startDate,
    "",
    data.restaurant,
    "previous period",
    "",
    data.comparisonPeriod.days,
    "",
    "",
    "",
    "available",
  ])
  for (const point of data.series) {
    const codes = [
      ...new Set([
        ...Object.keys(point.revenue),
        ...Object.keys(point.previousRevenue),
      ]),
    ].sort()

    if (codes.length === 0)
      rows.push([
        "trend",
        point.day,
        "",
        "",
        "",
        "",
        point.orders,
        "",
        "",
        "",
        "available",
      ])
    for (const currency of codes)
      rows.push([
        "trend",
        point.day,
        "",
        "",
        "",
        "",
        point.orders,
        currency,
        point.revenue[currency] ?? 0,
        point.previousRevenue[currency] ?? 0,
        "available",
      ])
  }

  for (const dish of data.bestSellers)
    rows.push([
      "dish",
      "",
      dish.tenantId,
      dish.restaurant,
      dish.name,
      dish.quantity,
      "",
      dish.currency,
      dish.revenue,
      "",
      "available",
    ])
  for (const item of data.revenue)
    rows.push([
      "revenue_total",
      "",
      "",
      data.restaurant,
      "",
      "",
      "",
      item.currency,
      item.value ?? "",
      item.previousValue ?? "",
      item.state,
    ])
  for (const item of data.averageOrderValue)
    rows.push([
      "average_basket",
      "",
      "",
      data.restaurant,
      "",
      "",
      item.sampleCount,
      item.currency,
      item.value ?? "",
      item.previousValue ?? "",
      item.state,
    ])
  for (const item of data.commissionPaid)
    rows.push([
      "commission_policy",
      "",
      "",
      data.restaurant,
      "",
      "",
      "",
      item.currency,
      item.value ?? "",
      "",
      item.state,
    ])
  for (const item of [
    data.returningCustomerRate,
    data.averagePreparationMinutes,
    data.onTimePickupRate,
    data.acceptedUnderOneMinuteRate,
    data.cancellationRate,
    data.fastestPreparationMinutes,
    data.slowestPreparationMinutes,
    data.refunds,
  ])
    rows.push([
      "operational_metric",
      "",
      "",
      data.restaurant,
      item.provenance,
      "",
      item.sampleCount,
      item.unit,
      item.value ?? "",
      item.previousValue ?? "",
      item.state,
    ])
  rows.push([
    "discount_uses",
    "",
    "",
    data.restaurant,
    "discount uses",
    "",
    data.discountUses,
    "",
    "",
    "",
    "available",
  ])
  for (const hour of data.peakHours)
    rows.push([
      "peak_hour",
      "",
      "",
      data.restaurant,
      hour.hour,
      "",
      hour.orders,
      "",
      "",
      "",
      "available",
    ])
  for (const item of data.channels)
    rows.push([
      "channel",
      "",
      "",
      data.restaurant,
      item.channel,
      "",
      item.orders,
      "",
      "",
      "",
      item.state,
    ])

  const content = rows
    .map((row) => row.map((value) => csvCell(String(value ?? ""))).join(","))
    .join("\r\n")
  const blobUrl = URL.createObjectURL(
    new Blob([content], { type: "text/csv;charset=utf-8" })
  )
  const anchor = document.createElement("a")

  anchor.href = blobUrl
  anchor.download = `analytics-${range}d.csv`
  anchor.click()
  URL.revokeObjectURL(blobUrl)
}

function csvCell(value: string): string {
  const safe = /^[=+\-@\t\r]/.test(value) ? `'${value}` : value

  return `"${safe.replace(/"/g, '""')}"`
}
