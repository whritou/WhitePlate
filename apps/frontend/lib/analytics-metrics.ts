import type {
  AnalyticsMetrics,
  AnalyticsMoneyValue,
  AnalyticsNumberValue,
  AnalyticsPeriod,
  AnalyticsSeriesPoint,
} from "@/types/analytics"

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === "object" && !Array.isArray(value)
}

function isNumber(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value)
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0
}

function isTenantId(value: unknown): value is string {
  return value === "all" || typeof value === "string" &&
    /^[0-9a-f]{8}(?:-[0-9a-f]{4}){3}-[0-9a-f]{12}$/i.test(value)
}

function parsePeriod(value: unknown): AnalyticsPeriod | null {
  if (!isRecord(value) || typeof value.startDate !== "string" ||
      typeof value.endDate !== "string" || ![7, 30, 90].includes(Number(value.days))) return null

  return { startDate: value.startDate, endDate: value.endDate, days: Number(value.days) }
}

function parseMoney(value: unknown): AnalyticsMoneyValue[] | null {
  if (!Array.isArray(value)) return null

  const output: AnalyticsMoneyValue[] = []

  for (const item of value) {
    if (!isRecord(item) || !/^[A-Z]{3}$/.test(String(item.currency)) ||
        (item.value !== null && !isNumber(item.value)) ||
        !["available", "unavailable"].includes(String(item.state)) ||
        (item.previousValue !== null && !isNumber(item.previousValue)) ||
        typeof item.comparisonAvailable !== "boolean" ||
        !Number.isInteger(item.sampleCount) || Number(item.sampleCount) < 0 ||
        !Number.isInteger(item.previousSampleCount) || Number(item.previousSampleCount) < 0) return null
    output.push({ currency: item.currency as string, value: item.value as number | null,
      state: item.state as AnalyticsMoneyValue["state"],
      previousValue: item.previousValue as number | null,
      comparisonAvailable: item.comparisonAvailable,
      sampleCount: Number(item.sampleCount), previousSampleCount: Number(item.previousSampleCount) })
  }

  return output
}

function parseNumber(value: unknown): AnalyticsNumberValue | null {
  if (!isRecord(value) || (value.value !== null && !isNumber(value.value)) ||
      !["available", "unavailable", "untracked"].includes(String(value.state)) ||
      !isNonEmptyString(value.unit) || !Number.isInteger(value.sampleCount) ||
      Number(value.sampleCount) < 0 || !Number.isInteger(value.previousSampleCount) ||
      Number(value.previousSampleCount) < 0 ||
      (value.previousValue !== null && !isNumber(value.previousValue)) ||
      typeof value.comparisonAvailable !== "boolean" || typeof value.provenance !== "string") return null

  return { value: value.value as number | null,
    state: value.state as AnalyticsNumberValue["state"], unit: value.unit,
    sampleCount: Number(value.sampleCount), previousSampleCount: Number(value.previousSampleCount),
    previousValue: value.previousValue as number | null,
    comparisonAvailable: value.comparisonAvailable, provenance: value.provenance }
}

function parseBuckets(value: unknown): Record<string, number> | null {
  if (!isRecord(value)) return null

  const result: Record<string, number> = {}

  for (const [key, amount] of Object.entries(value)) {
    if (!isNumber(amount) || amount < 0) return null
    result[key] = amount
  }

  return result
}

function parseSeries(value: unknown): AnalyticsSeriesPoint[] | null {
  if (!Array.isArray(value)) return null

  const result: AnalyticsSeriesPoint[] = []

  for (const item of value) {
    if (!isRecord(item) || typeof item.day !== "string" ||
        !/^\d{4}-\d{2}-\d{2}$/.test(item.day) || !Number.isInteger(item.orders) || Number(item.orders) < 0)
      return null

    const revenue = parseBuckets(item.revenue)
    const previousRevenue = parseBuckets(item.previousRevenue)

    if (!revenue || !previousRevenue) return null
    result.push({ day: item.day, orders: Number(item.orders), revenue, previousRevenue })
  }

  return result
}

export function parseAnalyticsMetrics(value: unknown): AnalyticsMetrics | null {
  if (!isRecord(value) || value.version !== 1 || !isTenantId(value.tenantId) ||
      !isNonEmptyString(value.restaurant) ||
      !(value.currency === "MULTI" || typeof value.currency === "string" && /^[A-Z]{3}$/.test(value.currency)) ||
      !isNonEmptyString(value.timeZone) || "timeZones" in value && !Array.isArray(value.timeZones)) return null

  const currentPeriod = parsePeriod(value.currentPeriod)
  const comparisonPeriod = parsePeriod(value.comparisonPeriod)
  const revenue = parseMoney(value.revenue)
  const averageOrderValue = parseMoney(value.averageOrderValue)
  const commissionPaid = parseMoney(value.commissionPaid)
  const returningCustomerRate = parseNumber(value.returningCustomerRate)
  const averagePreparationMinutes = parseNumber(value.averagePreparationMinutes)
  const onTimePickupRate = parseNumber(value.onTimePickupRate)
  const acceptedUnderOneMinuteRate = parseNumber(value.acceptedUnderOneMinuteRate)
  const cancellationRate = parseNumber(value.cancellationRate)
  const fastestPreparationMinutes = parseNumber(value.fastestPreparationMinutes)
  const slowestPreparationMinutes = parseNumber(value.slowestPreparationMinutes)
  const refunds = parseNumber(value.refunds)
  const series = parseSeries(value.series)

  if (!currentPeriod || !comparisonPeriod || !revenue || !averageOrderValue || !commissionPaid ||
      !returningCustomerRate || !averagePreparationMinutes || !onTimePickupRate ||
      !acceptedUnderOneMinuteRate || !cancellationRate || !fastestPreparationMinutes ||
      !slowestPreparationMinutes || !refunds || !series || !Array.isArray(value.peakHours) ||
      !Array.isArray(value.channels) || !Array.isArray(value.bestSellers) ||
      !Number.isInteger(value.orders) || Number(value.orders) < 0 ||
      (value.previousOrders !== null && (!Number.isInteger(value.previousOrders) || Number(value.previousOrders) < 0)) ||
      typeof value.ordersComparisonAvailable !== "boolean" ||
      !Number.isInteger(value.discountUses) || Number(value.discountUses) < 0) return null

  const peakHours = value.peakHours.filter(isRecord).map(item => ({ hour: Number(item.hour), orders: Number(item.orders) }))
  const channels = value.channels.filter(isRecord).map(item => ({
    channel: String(item.channel), orders: Number(item.orders), state: String(item.state),
  }))
  const bestSellers = value.bestSellers.filter(isRecord).map(item => ({
    tenantId: item.tenantId as string, restaurant: item.restaurant as string, name: item.name as string,
    quantity: Number(item.quantity), revenue: Number(item.revenue), currency: item.currency as string,
  }))
  const timeZones = Array.isArray(value.timeZones) ? value.timeZones.filter(isRecord).map(item => ({
    tenantId: item.tenantId as string, restaurant: item.restaurant as string, timeZone: item.timeZone as string,
  })) : [{ tenantId: value.tenantId, restaurant: value.restaurant, timeZone: value.timeZone }]

  if (peakHours.length !== value.peakHours.length || channels.length !== value.channels.length ||
      bestSellers.length !== value.bestSellers.length ||
      peakHours.some(item => !Number.isInteger(item.hour) || !Number.isInteger(item.orders) || item.orders < 0) ||
      channels.some(item => !["web", "qr", "unattributed"].includes(item.channel) ||
        !Number.isInteger(item.orders) || item.orders < 0 ||
        !["available", "untracked"].includes(item.state)) ||
      bestSellers.some(item => !isTenantId(item.tenantId) || item.tenantId === "all" ||
        !isNonEmptyString(item.restaurant) || !isNonEmptyString(item.name) ||
        !Number.isInteger(item.quantity) || item.quantity < 0 || !isNumber(item.revenue) || item.revenue < 0 ||
        !/^[A-Z]{3}$/.test(item.currency)) ||
      !Array.isArray(timeZones) || timeZones.length === 0 ||
      Array.isArray(value.timeZones) && timeZones.length !== value.timeZones.length ||
      timeZones.some(item => !isTenantId(item.tenantId) || item.tenantId === "all" ||
        !isNonEmptyString(item.restaurant) || !isNonEmptyString(item.timeZone)) ||
      value.tenantId === "all" && !Array.isArray(value.timeZones))
    return null

  return {
    version: 1, tenantId: value.tenantId, restaurant: value.restaurant, currency: value.currency,
    timeZone: value.timeZone, currentPeriod, comparisonPeriod, revenue, orders: Number(value.orders),
    previousOrders: value.previousOrders as number | null, ordersComparisonAvailable: value.ordersComparisonAvailable,
    averageOrderValue, returningCustomerRate, averagePreparationMinutes, commissionPaid, series, peakHours,
    channels, bestSellers, onTimePickupRate, acceptedUnderOneMinuteRate, cancellationRate,
    fastestPreparationMinutes, slowestPreparationMinutes, discountUses: Number(value.discountUses), refunds,
    timeZones,
  }
}

function aggregateNumber(values: AnalyticsNumberValue[], mode: "weighted" | "minimum" | "maximum"):
  AnalyticsNumberValue {
  const aggregate = (key: "value" | "previousValue", countKey: "sampleCount" | "previousSampleCount") => {
    const included = values.filter(item => item[key] !== null && item[countKey] > 0)

    if (included.length === 0) return null
    if (mode === "minimum") return Math.min(...included.map(item => item[key]!))
    if (mode === "maximum") return Math.max(...included.map(item => item[key]!))

    const count = included.reduce((sum, item) => sum + item[countKey], 0)

    return count === 0 ? null : included.reduce((sum, item) => sum + item[key]! * item[countKey], 0) / count
  }

  const value = aggregate("value", "sampleCount")
  const previousValue = aggregate("previousValue", "previousSampleCount")
  const sampleCount = values.filter(item => item.value !== null)
    .reduce((sum, item) => sum + item.sampleCount, 0)
  const previousSampleCount = values.filter(item => item.previousValue !== null)
    .reduce((sum, item) => sum + item.previousSampleCount, 0)

  return { ...values[0]!, value, state: value === null ? "unavailable" : "available", sampleCount,
    previousSampleCount, previousValue,
    comparisonAvailable: value !== null && previousValue !== null && previousValue > 0 }
}

function aggregateMoney(metrics: AnalyticsMetrics[], key: "revenue" | "averageOrderValue" | "commissionPaid"):
  AnalyticsMoneyValue[] {
  const currencies = [...new Set(metrics.flatMap(item => item[key].map(value => value.currency)))].sort()

  return currencies.map(currency => {
    const matches = metrics.map(item => ({ metrics: item, value: item[key].find(value => value.currency === currency) }))
      .filter((item): item is { metrics: AnalyticsMetrics; value: AnalyticsMoneyValue } => item.value !== undefined)
    const sumFor = (previous: boolean) => matches.reduce((sum, item) => {
      const amount = previous ? item.value.previousValue : item.value.value
      const count = previous ? item.value.previousSampleCount : item.value.sampleCount

      return sum + (amount ?? 0) * (key === "averageOrderValue" ? count : 1)
    }, 0)
    const currentMatches = matches.filter(item => item.value.value !== null)
    const previousMatches = matches.filter(item => item.value.previousValue !== null)
    const countFor = (items: typeof matches, previous: boolean) => items.reduce((sum, item) =>
      sum + (previous ? item.value.previousSampleCount : item.value.sampleCount), 0)
    const currentCount = countFor(currentMatches, false)
    const previousCount = countFor(previousMatches, true)
    const value = currentMatches.length === 0 ? null : key === "averageOrderValue" && currentCount > 0
      ? sumFor(false) / currentCount : sumFor(false)
    const previousValue = previousMatches.length === 0 ? null :
      key === "averageOrderValue" && previousCount > 0 ? sumFor(true) / previousCount : sumFor(true)

    return { currency, value, state: value === null ? "unavailable" : "available", previousValue,
      comparisonAvailable: value !== null && previousValue !== null && previousValue > 0, sampleCount: currentCount,
      previousSampleCount: previousCount }
  })
}

function sumBuckets(buckets: Record<string, number>[]): Record<string, number> {
  return buckets.reduce<Record<string, number>>((result, values) => {
    for (const [currency, amount] of Object.entries(values)) result[currency] = (result[currency] ?? 0) + amount

    return result
  }, {})
}

export function aggregateAnalytics(metrics: AnalyticsMetrics[]): AnalyticsMetrics | null {
  if (metrics.length === 0) return null
  if (metrics.length === 1) return metrics[0]!

  const first = metrics[0]!
  const orders = metrics.reduce((sum, item) => sum + item.orders, 0)
  const previousOrders = metrics.every(item => item.previousOrders !== null)
    ? metrics.reduce((sum, item) => sum + (item.previousOrders ?? 0), 0) : null
  const dates = [...new Set(metrics.flatMap(item => item.series.map(point => point.day)))].sort()
  const series = dates.map(day => {
    const points = metrics.flatMap(item => item.series.filter(point => point.day === day))

    return { day, orders: points.reduce((sum, item) => sum + item.orders, 0),
      revenue: sumBuckets(points.map(item => item.revenue)),
      previousRevenue: sumBuckets(points.map(item => item.previousRevenue)) }
  })
  const peakHours = Array.from({ length: 13 }, (_, index) => 11 + index).map(hour => ({ hour,
    orders: metrics.reduce((sum, item) => sum + (item.peakHours.find(value => value.hour === hour)?.orders ?? 0), 0) }))
  const sellersByCurrency = new Map<string, AnalyticsMetrics["bestSellers"]>()

  for (const seller of metrics.flatMap(item => item.bestSellers)) {
    const sellers = sellersByCurrency.get(seller.currency) ?? []

    sellers.push(seller)
    sellersByCurrency.set(seller.currency, sellers)
  }

  const bestSellers = [...sellersByCurrency.entries()].sort(([left], [right]) => left.localeCompare(right))
    .flatMap(([, sellers]) => sellers.sort((left, right) => right.revenue - left.revenue ||
      right.quantity - left.quantity).slice(0, 8))

  return {
    ...first, tenantId: "all", restaurant: "All restaurants", currency: "MULTI",
    revenue: aggregateMoney(metrics, "revenue"), orders, previousOrders,
    ordersComparisonAvailable: previousOrders !== null && previousOrders > 0,
    averageOrderValue: aggregateMoney(metrics, "averageOrderValue"),
    commissionPaid: aggregateMoney(metrics, "commissionPaid"), series, peakHours,
    channels: ["web", "qr", "unattributed"].map(channel => ({ channel,
      orders: metrics.reduce((sum, item) => sum + (item.channels.find(value => value.channel === channel)?.orders ?? 0), 0),
      state: channel === "unattributed" ? "untracked" : "available" })),
    bestSellers,
    returningCustomerRate: aggregateNumber(metrics.map(item => item.returningCustomerRate), "weighted"),
    averagePreparationMinutes: aggregateNumber(metrics.map(item => item.averagePreparationMinutes), "weighted"),
    onTimePickupRate: aggregateNumber(metrics.map(item => item.onTimePickupRate), "weighted"),
    acceptedUnderOneMinuteRate: aggregateNumber(metrics.map(item => item.acceptedUnderOneMinuteRate), "weighted"),
    cancellationRate: aggregateNumber(metrics.map(item => item.cancellationRate), "weighted"),
    fastestPreparationMinutes: aggregateNumber(metrics.map(item => item.fastestPreparationMinutes), "minimum"),
    slowestPreparationMinutes: aggregateNumber(metrics.map(item => item.slowestPreparationMinutes), "maximum"),
    discountUses: metrics.reduce((sum, item) => sum + item.discountUses, 0),
    refunds: { ...first.refunds, value: null, state: "unavailable", sampleCount: 0,
      previousSampleCount: 0, previousValue: null, comparisonAvailable: false },
    timeZones: metrics.flatMap(item => item.timeZones),
  }
}
