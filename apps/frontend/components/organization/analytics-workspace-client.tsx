"use client"

import { useEffect, useMemo, useState } from "react"
import { useQuery, useQueryClient } from "@tanstack/react-query"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { browserRequest } from "@/lib/api/browser-request"
import { parseAnalyticsMetrics } from "@/lib/analytics-metrics"
import { AnalyticsPageProvider } from "@/components/lovable/pages/analytics-AnalyticsPage-context"
import { AnalyticsPageView } from "@/components/lovable/pages/analytics-AnalyticsPage-view"
import { useTranslations } from "next-intl"
import { useRouter } from "next/navigation"
import type {
  AnalyticsMetrics,
  AnalyticsRange,
  AnalyticsRestaurant,
} from "@/types/analytics"

class AnalyticsRequestError extends Error {
  constructor(readonly status: number) {
    super("Analytics request failed")
  }
}

export function AnalyticsWorkspaceClient({
  restaurants,
  locale,
  requestedTenantId,
  initialErrorStatus,
}: {
  restaurants: AnalyticsRestaurant[]
  locale: string
  requestedTenantId?: string
  initialErrorStatus?: number
}) {
  const t = useTranslations("AnalyticsLive")
  const router = useRouter()
  const queryClient = useQueryClient()
  const initialRestaurant = restaurants.findIndex(
    (item) => item.id.toLowerCase() === requestedTenantId?.toLowerCase()
  )
  const [rest, setRest] = useState(
    initialRestaurant >= 0 ? initialRestaurant + 1 : 0
  )
  const [range, setRange] = useState<AnalyticsRange>("30")
  const [metric, setMetric] = useState<"revenue" | "orders">("revenue")
  const selector = rest === 0 ? "all" : (restaurants[rest - 1]?.id ?? "all")
  const scope = restaurants
    .map((item) => `${item.id}:${item.role}`)
    .sort()
    .join("|")
  const queryKey = [
    "organization-analytics",
    scope,
    selector,
    range,
    locale,
  ] as const
  const query = useQuery({
    queryKey,
    enabled: restaurants.length > 0,
    staleTime: 30_000,
    retry: false,
    queryFn: async ({ signal }) => {
      const url = new URLSearchParams({ restaurant: selector, days: range })
      const response = await browserRequest<{ ok: boolean; data?: unknown }>(
        `/api/organization-analytics?${url}`,
        { signal }
      )

      if (!response.ok) {
        if (response.status === 401 || response.status === 403)
          await queryClient.removeQueries({
            queryKey: ["organization-analytics"],
          })
        throw new AnalyticsRequestError(response.status)
      }

      if (!response.data?.ok) throw new AnalyticsRequestError(response.status)

      const data = parseAnalyticsMetrics(response.data.data)

      if (!data) throw new AnalyticsRequestError(502)

      return data
    },
  })

  useEffect(() => {
    if (
      query.error instanceof AnalyticsRequestError &&
      [401, 403].includes(query.error.status)
    )
      void queryClient.removeQueries({ queryKey: ["organization-analytics"] })
  }, [query.error, queryClient])

  const data = query.data
  const viewModel = useMemo(
    () =>
      data
        ? buildViewModel(data, {
            range,
            setRange,
            rest,
            setRest,
            metric,
            setMetric,
            locale,
            t,
            restaurants,
          })
        : null,
    [data, locale, metric, range, rest, restaurants, t]
  )

  if (initialErrorStatus !== undefined)
    return (
      <AnalyticsError
        status={initialErrorStatus}
        onRetry={() => router.refresh()}
        title={t("title")}
      />
    )

  if (restaurants.length === 0) {
    return (
      <main className="mx-auto max-w-[1600px] px-6 py-8">
        <h1 className="font-display text-4xl font-bold">{t("title")}</h1>

        <Alert variant="info" className="mt-6">
          <AlertDescription>{t("noRestaurants")}</AlertDescription>
        </Alert>
      </main>
    )
  }

  if (query.isLoading || !data || !viewModel) {
    if (query.isError)
      return (
        <AnalyticsError
          status={
            query.error instanceof AnalyticsRequestError
              ? query.error.status
              : 503
          }
          onRetry={() => void query.refetch()}
          title={t("title")}
        />
      )

    return (
      <main className="mx-auto max-w-[1600px] px-6 py-8" aria-busy="true">
        <p role="status" className="label-mono text-muted-foreground">
          {t("loading")}
        </p>

        <div className="mt-6 h-10 w-64 animate-pulse bg-muted" />

        <div className="mt-6 grid grid-cols-2 gap-px border bg-foreground md:grid-cols-3 xl:grid-cols-6">
          {Array.from({ length: 6 }, (_, index) => (
            <div key={index} className="h-28 animate-pulse bg-background" />
          ))}
        </div>
      </main>
    )
  }

  return (
    <>
      {query.isError && (
        <div className="px-6 pt-4">
          <Alert variant="destructive" role="alert">
            <AlertDescription className="flex flex-wrap items-center justify-between gap-3">
              <span>{t("refreshError")}</span>

              <Button
                variant="outline"
                size="sm"
                onClick={() => void query.refetch()}
              >
                {t("retry")}
              </Button>
            </AlertDescription>
          </Alert>
        </div>
      )}

      {data.orders === 0 && (
        <div className="px-6 pt-4">
          <Alert variant="info" role="status">
            <AlertDescription>{t("emptyPeriod")}</AlertDescription>
          </Alert>
        </div>
      )}

      <div
        className={query.isRefetching ? "opacity-70" : ""}
        aria-busy={query.isRefetching}
      >
        <AnalyticsPageProvider model={viewModel}>
          <AnalyticsPageView />
        </AnalyticsPageProvider>
      </div>

      <p className="mx-6 mb-8 text-xs text-muted-foreground">{t("dataNote")}</p>
    </>
  )
}

function AnalyticsError({
  status,
  onRetry,
  title,
}: {
  status: number
  onRetry: () => void
  title: string
}) {
  const t = useTranslations("AnalyticsLive")
  const message =
    status === 401
      ? t("sessionExpired")
      : status === 403
        ? t("forbidden")
        : status === 404
          ? t("notFound")
          : t("loadError")

  return (
    <main className="mx-auto max-w-[1600px] px-6 py-8">
      <h1 className="font-display text-4xl font-bold">{title}</h1>

      <Alert variant="destructive" role="alert" className="mt-6">
        <AlertDescription className="flex flex-wrap items-center justify-between gap-3">
          <span>{message}</span>

          <Button variant="outline" onClick={onRetry}>
            {t("retry")}
          </Button>
        </AlertDescription>
      </Alert>
    </main>
  )
}

function buildViewModel(
  data: AnalyticsMetrics,
  state: {
    range: AnalyticsRange
    setRange: (value: AnalyticsRange) => void
    rest: number
    setRest: (value: number) => void
    metric: "revenue" | "orders"
    setMetric: (value: "revenue" | "orders") => void
    locale: string
    t: (
      key:
        | "unavailable"
        | "comparisonUnavailable"
        | "allRestaurants"
        | "previousPeriod"
        | "channelWeb"
        | "channelQr"
        | "channelUnattributed"
        | "channelPhone"
        | "revenue"
        | "orders"
        | "averageBasket"
        | "returningCustomers"
        | "averagePreparation"
        | "commissionPaid"
        | "commissionNote"
        | "overTime"
        | "peakHours"
        | "orderChannels"
        | "bestSellingDishes"
        | "dish"
        | "sold"
        | "kitchenPerformance"
        | "onTimePickups"
        | "acceptedUnderOneMinute"
        | "cancelledOrders"
        | "fastest"
        | "slowest"
        | "discountUses"
        | "refunds"
        | "vsPrevious"
        | "range7"
        | "range30"
        | "range90"
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
    restaurants: AnalyticsRestaurant[]
  }
) {
  const moneyText = (items: AnalyticsMetrics["revenue"]) =>
    items.length === 0
      ? state.t("unavailable")
      : items
          .map((item) =>
            item.value === null
              ? `${item.currency} ${state.t("unavailable")}`
              : formatMoney(item.value, item.currency, state.locale)
          )
          .join(" · ")
  const moneyDelta = (items: AnalyticsMetrics["revenue"]) => {
    if (
      items.length !== 1 ||
      !items[0]?.comparisonAvailable ||
      items[0].previousValue === null ||
      items[0].previousValue <= 0 ||
      items[0].value === null
    )
      return null

    return (
      ((items[0].value - items[0].previousValue) / items[0].previousValue) * 100
    )
  }

  const numberText = (
    item: AnalyticsMetrics["returningCustomerRate"],
    unit: string
  ) =>
    item.value === null
      ? state.t("unavailable")
      : `${item.value.toFixed(1)}${unit}`
  const channelTotal = data.channels.reduce((sum, item) => sum + item.orders, 0)
  const channels = [
    { channel: "web", name: state.t("channelWeb") },
    { channel: "qr", name: state.t("channelQr") },
    { channel: "unattributed", name: state.t("channelUnattributed") },
    { channel: "phone", name: state.t("channelPhone") },
  ].map((channel) => {
    const source = data.channels.find(
      (item) => item.channel === channel.channel
    )
    const count = source?.orders ?? 0

    return {
      name: channel.name,
      value: channelTotal ? Math.round((count * 100) / channelTotal) : 0,
      state:
        channel.channel === "phone"
          ? "untracked"
          : channelTotal === 0
            ? "unavailable"
            : "available",
    }
  })
  const fastest =
    data.fastestPreparationMinutes.value === null
      ? state.t("unavailable")
      : `${data.fastestPreparationMinutes.value.toFixed(0)} min`
  const slowest =
    data.slowestPreparationMinutes.value === null
      ? state.t("unavailable")
      : `${data.slowestPreparationMinutes.value.toFixed(0)} min`
  const revenueKpiDelta = moneyDelta(data.revenue)
  const basketDelta = moneyDelta(data.averageOrderValue)
  const kpis = [
    {
      k: state.t("revenue"),
      v: moneyText(data.revenue),
      delta: revenueKpiDelta,
      note:
        data.revenue.length > 1
          ? metricDeltaText(data.revenue, state.t)
          : undefined,
    },
    {
      k: state.t("orders"),
      v: data.orders.toLocaleString(state.locale),
      delta:
        data.ordersComparisonAvailable && data.previousOrders
          ? percent(data.orders, data.previousOrders)
          : null,
    },
    {
      k: state.t("averageBasket"),
      v: moneyText(data.averageOrderValue),
      delta: basketDelta,
      note:
        data.averageOrderValue.length > 1
          ? metricDeltaText(data.averageOrderValue, state.t)
          : undefined,
    },
    {
      k: state.t("returningCustomers"),
      v: numberText(data.returningCustomerRate, "%"),
      delta:
        data.returningCustomerRate.comparisonAvailable &&
        data.returningCustomerRate.previousValue !== null
          ? percent(
              data.returningCustomerRate.value!,
              data.returningCustomerRate.previousValue
            )
          : null,
    },
    {
      k: state.t("averagePreparation"),
      v: numberText(data.averagePreparationMinutes, " min"),
      delta:
        data.averagePreparationMinutes.comparisonAvailable &&
        data.averagePreparationMinutes.previousValue !== null
          ? percent(
              data.averagePreparationMinutes.value!,
              data.averagePreparationMinutes.previousValue
            )
          : null,
      invert: true,
    },
    {
      k: state.t("commissionPaid"),
      v: moneyText(data.commissionPaid),
      delta: null,
      note: state.t("commissionNote"),
    },
  ]
  const series = data.series.map((point) => ({
    day: new Date(`${point.day}T12:00:00Z`).toLocaleDateString(state.locale, {
      day: "2-digit",
      month: "short",
      timeZone: "UTC",
    }),
    orders: point.orders,
    revenue: 0,
    prev: 0,
    revenueByCurrency: point.revenue,
    previousRevenueByCurrency: point.previousRevenue,
  }))
  const maxRevenueByCurrency = new Map<string, number>()

  for (const item of data.bestSellers) {
    maxRevenueByCurrency.set(
      item.currency,
      Math.max(maxRevenueByCurrency.get(item.currency) ?? 0, item.revenue)
    )
  }

  let currentDishCurrency = ""
  let currentDishRank = 0
  const dishes = data.bestSellers.map((item) => {
    if (item.currency !== currentDishCurrency) {
      currentDishCurrency = item.currency
      currentDishRank = 0
    }

    currentDishRank += 1

    return {
      n: item.name,
      q: item.quantity,
      rev: item.revenue,
      currency: item.currency,
      tenantId: item.tenantId,
      restaurant: item.restaurant,
      rank: currentDishRank,
      barValue: maxRevenueByCurrency.get(item.currency)
        ? item.revenue / maxRevenueByCurrency.get(item.currency)!
        : 0,
    }
  })
  const csv = () => exportCsv(data, state.range, (key) => state.t(key))

  return {
    range: state.range,
    setRange: state.setRange,
    rest: state.rest,
    setRest: state.setRest,
    restOptions: [
      state.t("allRestaurants"),
      ...state.restaurants.map((item) => item.name),
    ],
    metric: state.metric,
    setMetric: state.setMetric,
    pageMode: "live" as const,
    dishBarMetric: "normalized" as const,
    d: {
      series,
      hours: data.peakHours.map((item) => ({
        hour: `${item.hour}h`,
        orders: item.orders,
      })),
      channels,
      dishes,
    },
    kpis,
    maxDish: 1,
    kitchen: {
      onTime: data.onTimePickupRate.value,
      accepted: data.acceptedUnderOneMinuteRate.value,
      cancelled: data.cancellationRate.value,
      fastest,
      slowest,
      discountUses: data.discountUses.toLocaleString(state.locale),
      refunds: state.t("unavailable"),
    },
    exportCsv: csv,
  }
}

function percent(value: number, previous: number): number | null {
  return previous > 0 ? ((value - previous) / previous) * 100 : null
}

function formatMoney(value: number, currency: string, locale: string): string {
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency,
    maximumFractionDigits: 2,
  }).format(value)
}

function metricDeltaText(
  items: AnalyticsMetrics["revenue"],
  translate: (key: "unavailable" | "comparisonUnavailable") => string
): string {
  return items
    .map((item) =>
      item.comparisonAvailable && item.previousValue && item.value !== null
        ? `${item.currency} ${item.value >= item.previousValue ? "▲" : "▼"} ${Math.abs(percent(item.value, item.previousValue) ?? 0).toFixed(1)}%`
        : `${item.currency} ${translate("comparisonUnavailable")}`
    )
    .join(" · ")
}

function exportCsv(
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
