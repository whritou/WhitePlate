import { exportAnalyticsCsv } from "./analytics-workspace-export"
import type {
  AnalyticsMetrics,
  AnalyticsRange,
  AnalyticsRestaurant,
} from "@/types/analytics"

export function buildAnalyticsViewModel(
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
  const csv = () => exportAnalyticsCsv(data, state.range, (key) => state.t(key))

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
