import type {
  AnalyticsMetrics,
  AnalyticsMoneyValue,
  AnalyticsNumberValue,
} from "@/types/analytics"

function aggregateNumber(
  values: AnalyticsNumberValue[],
  mode: "weighted" | "minimum" | "maximum"
): AnalyticsNumberValue {
  const aggregate = (
    key: "value" | "previousValue",
    countKey: "sampleCount" | "previousSampleCount"
  ) => {
    const included = values.filter(
      (item) => item[key] !== null && item[countKey] > 0
    )

    if (included.length === 0) return null
    if (mode === "minimum")
      return Math.min(...included.map((item) => item[key]!))
    if (mode === "maximum")
      return Math.max(...included.map((item) => item[key]!))

    const count = included.reduce((sum, item) => sum + item[countKey], 0)

    return count === 0
      ? null
      : included.reduce((sum, item) => sum + item[key]! * item[countKey], 0) /
          count
  }

  const value = aggregate("value", "sampleCount")
  const previousValue = aggregate("previousValue", "previousSampleCount")
  const sampleCount = values
    .filter((item) => item.value !== null)
    .reduce((sum, item) => sum + item.sampleCount, 0)
  const previousSampleCount = values
    .filter((item) => item.previousValue !== null)
    .reduce((sum, item) => sum + item.previousSampleCount, 0)

  return {
    ...values[0]!,
    value,
    state: value === null ? "unavailable" : "available",
    sampleCount,
    previousSampleCount,
    previousValue,
    comparisonAvailable:
      value !== null && previousValue !== null && previousValue > 0,
  }
}

function aggregateMoney(
  metrics: AnalyticsMetrics[],
  key: "revenue" | "averageOrderValue" | "commissionPaid"
): AnalyticsMoneyValue[] {
  const currencies = [
    ...new Set(
      metrics.flatMap((item) => item[key].map((value) => value.currency))
    ),
  ].sort()

  return currencies.map((currency) => {
    const matches = metrics
      .map((item) => ({
        metrics: item,
        value: item[key].find((value) => value.currency === currency),
      }))
      .filter(
        (
          item
        ): item is { metrics: AnalyticsMetrics; value: AnalyticsMoneyValue } =>
          item.value !== undefined
      )
    const sumFor = (previous: boolean) =>
      matches.reduce((sum, item) => {
        const amount = previous ? item.value.previousValue : item.value.value
        const count = previous
          ? item.value.previousSampleCount
          : item.value.sampleCount

        return sum + (amount ?? 0) * (key === "averageOrderValue" ? count : 1)
      }, 0)
    const currentMatches = matches.filter((item) => item.value.value !== null)
    const previousMatches = matches.filter(
      (item) => item.value.previousValue !== null
    )
    const countFor = (items: typeof matches, previous: boolean) =>
      items.reduce(
        (sum, item) =>
          sum +
          (previous ? item.value.previousSampleCount : item.value.sampleCount),
        0
      )
    const currentCount = countFor(currentMatches, false)
    const previousCount = countFor(previousMatches, true)
    const value =
      currentMatches.length === 0
        ? null
        : key === "averageOrderValue" && currentCount > 0
          ? sumFor(false) / currentCount
          : sumFor(false)
    const previousValue =
      previousMatches.length === 0
        ? null
        : key === "averageOrderValue" && previousCount > 0
          ? sumFor(true) / previousCount
          : sumFor(true)

    return {
      currency,
      value,
      state: value === null ? "unavailable" : "available",
      previousValue,
      comparisonAvailable:
        value !== null && previousValue !== null && previousValue > 0,
      sampleCount: currentCount,
      previousSampleCount: previousCount,
    }
  })
}

function sumBuckets(buckets: Record<string, number>[]): Record<string, number> {
  return buckets.reduce<Record<string, number>>((result, values) => {
    for (const [currency, amount] of Object.entries(values))
      result[currency] = (result[currency] ?? 0) + amount

    return result
  }, {})
}

function aggregateOrders(metrics: AnalyticsMetrics[]) {
  const orders = metrics.reduce((sum, item) => sum + item.orders, 0)
  const previousOrders = metrics.every((item) => item.previousOrders !== null)
    ? metrics.reduce((sum, item) => sum + (item.previousOrders ?? 0), 0)
    : null

  return {
    orders,
    previousOrders,
    ordersComparisonAvailable: previousOrders !== null && previousOrders > 0,
  }
}

function aggregateSeries(metrics: AnalyticsMetrics[]) {
  const dates = [
    ...new Set(
      metrics.flatMap((item) => item.series.map((point) => point.day))
    ),
  ].sort()

  return dates.map((day) => {
    const points = metrics.flatMap((item) =>
      item.series.filter((point) => point.day === day)
    )

    return {
      day,
      orders: points.reduce((sum, item) => sum + item.orders, 0),
      revenue: sumBuckets(points.map((item) => item.revenue)),
      previousRevenue: sumBuckets(points.map((item) => item.previousRevenue)),
    }
  })
}

function aggregatePeakHours(metrics: AnalyticsMetrics[]) {
  return Array.from({ length: 13 }, (_, index) => 11 + index).map((hour) => ({
    hour,
    orders: metrics.reduce(
      (sum, item) =>
        sum +
        (item.peakHours.find((value) => value.hour === hour)?.orders ?? 0),
      0
    ),
  }))
}

function aggregateBestSellers(metrics: AnalyticsMetrics[]) {
  const sellersByCurrency = new Map<string, AnalyticsMetrics["bestSellers"]>()

  for (const seller of metrics.flatMap((item) => item.bestSellers)) {
    const sellers = sellersByCurrency.get(seller.currency) ?? []

    sellers.push(seller)
    sellersByCurrency.set(seller.currency, sellers)
  }

  return [...sellersByCurrency.entries()]
    .sort(([left], [right]) => left.localeCompare(right))
    .flatMap(([, sellers]) =>
      sellers
        .sort(
          (left, right) =>
            right.revenue - left.revenue || right.quantity - left.quantity
        )
        .slice(0, 8)
    )
}

function aggregateChannels(metrics: AnalyticsMetrics[]) {
  return ["web", "qr", "unattributed"].map((channel) => ({
    channel,
    orders: metrics.reduce(
      (sum, item) =>
        sum +
        (item.channels.find((value) => value.channel === channel)?.orders ?? 0),
      0
    ),
    state: channel === "unattributed" ? "untracked" : "available",
  }))
}

export function aggregateAnalytics(
  metrics: AnalyticsMetrics[]
): AnalyticsMetrics | null {
  if (metrics.length === 0) return null
  if (metrics.length === 1) return metrics[0]!

  const first = metrics[0]!

  return {
    ...first,
    tenantId: "all",
    restaurant: "All restaurants",
    currency: "MULTI",
    ...aggregateOrders(metrics),
    revenue: aggregateMoney(metrics, "revenue"),
    averageOrderValue: aggregateMoney(metrics, "averageOrderValue"),
    commissionPaid: aggregateMoney(metrics, "commissionPaid"),
    series: aggregateSeries(metrics),
    peakHours: aggregatePeakHours(metrics),
    channels: aggregateChannels(metrics),
    bestSellers: aggregateBestSellers(metrics),
    returningCustomerRate: aggregateNumber(
      metrics.map((item) => item.returningCustomerRate),
      "weighted"
    ),
    averagePreparationMinutes: aggregateNumber(
      metrics.map((item) => item.averagePreparationMinutes),
      "weighted"
    ),
    onTimePickupRate: aggregateNumber(
      metrics.map((item) => item.onTimePickupRate),
      "weighted"
    ),
    acceptedUnderOneMinuteRate: aggregateNumber(
      metrics.map((item) => item.acceptedUnderOneMinuteRate),
      "weighted"
    ),
    cancellationRate: aggregateNumber(
      metrics.map((item) => item.cancellationRate),
      "weighted"
    ),
    fastestPreparationMinutes: aggregateNumber(
      metrics.map((item) => item.fastestPreparationMinutes),
      "minimum"
    ),
    slowestPreparationMinutes: aggregateNumber(
      metrics.map((item) => item.slowestPreparationMinutes),
      "maximum"
    ),
    discountUses: metrics.reduce((sum, item) => sum + item.discountUses, 0),
    refunds: {
      ...first.refunds,
      value: null,
      state: "unavailable",
      sampleCount: 0,
      previousSampleCount: 0,
      previousValue: null,
      comparisonAvailable: false,
    },
    timeZones: metrics.flatMap((item) => item.timeZones),
  }
}
