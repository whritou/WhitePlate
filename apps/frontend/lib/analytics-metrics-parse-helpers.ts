import type {
  AnalyticsMetrics,
  AnalyticsMoneyValue,
  AnalyticsNumberValue,
  AnalyticsPeriod,
  AnalyticsSeriesPoint,
} from "@/types/analytics"

export function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === "object" && !Array.isArray(value)
}

export function isNumber(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value)
}

export function isNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0
}

export function isTenantId(value: unknown): value is string {
  return (
    value === "all" ||
    (typeof value === "string" &&
      /^[0-9a-f]{8}(?:-[0-9a-f]{4}){3}-[0-9a-f]{12}$/i.test(value))
  )
}

export function parsePeriod(value: unknown): AnalyticsPeriod | null {
  if (
    !isRecord(value) ||
    typeof value.startDate !== "string" ||
    typeof value.endDate !== "string" ||
    ![7, 30, 90].includes(Number(value.days))
  )
    return null

  return {
    startDate: value.startDate,
    endDate: value.endDate,
    days: Number(value.days),
  }
}

export function parseMoney(value: unknown): AnalyticsMoneyValue[] | null {
  if (!Array.isArray(value)) return null

  const output: AnalyticsMoneyValue[] = []

  for (const item of value) {
    if (
      !isRecord(item) ||
      !/^[A-Z]{3}$/.test(String(item.currency)) ||
      (item.value !== null && !isNumber(item.value)) ||
      !["available", "unavailable"].includes(String(item.state)) ||
      (item.previousValue !== null && !isNumber(item.previousValue)) ||
      typeof item.comparisonAvailable !== "boolean" ||
      !Number.isInteger(item.sampleCount) ||
      Number(item.sampleCount) < 0 ||
      !Number.isInteger(item.previousSampleCount) ||
      Number(item.previousSampleCount) < 0
    )
      return null
    output.push({
      currency: item.currency as string,
      value: item.value as number | null,
      state: item.state as AnalyticsMoneyValue["state"],
      previousValue: item.previousValue as number | null,
      comparisonAvailable: item.comparisonAvailable,
      sampleCount: Number(item.sampleCount),
      previousSampleCount: Number(item.previousSampleCount),
    })
  }

  return output
}

export function parseNumber(value: unknown): AnalyticsNumberValue | null {
  if (
    !isRecord(value) ||
    (value.value !== null && !isNumber(value.value)) ||
    !["available", "unavailable", "untracked"].includes(String(value.state)) ||
    !isNonEmptyString(value.unit) ||
    !Number.isInteger(value.sampleCount) ||
    Number(value.sampleCount) < 0 ||
    !Number.isInteger(value.previousSampleCount) ||
    Number(value.previousSampleCount) < 0 ||
    (value.previousValue !== null && !isNumber(value.previousValue)) ||
    typeof value.comparisonAvailable !== "boolean" ||
    typeof value.provenance !== "string"
  )
    return null

  return {
    value: value.value as number | null,
    state: value.state as AnalyticsNumberValue["state"],
    unit: value.unit,
    sampleCount: Number(value.sampleCount),
    previousSampleCount: Number(value.previousSampleCount),
    previousValue: value.previousValue as number | null,
    comparisonAvailable: value.comparisonAvailable,
    provenance: value.provenance,
  }
}

export function parseBuckets(value: unknown): Record<string, number> | null {
  if (!isRecord(value)) return null

  const result: Record<string, number> = {}

  for (const [key, amount] of Object.entries(value)) {
    if (!isNumber(amount) || amount < 0) return null
    result[key] = amount
  }

  return result
}

export function parseSeries(value: unknown): AnalyticsSeriesPoint[] | null {
  if (!Array.isArray(value)) return null

  const result: AnalyticsSeriesPoint[] = []

  for (const item of value) {
    if (
      !isRecord(item) ||
      typeof item.day !== "string" ||
      !/^\d{4}-\d{2}-\d{2}$/.test(item.day) ||
      !Number.isInteger(item.orders) ||
      Number(item.orders) < 0
    )
      return null

    const revenue = parseBuckets(item.revenue)
    const previousRevenue = parseBuckets(item.previousRevenue)

    if (!revenue || !previousRevenue) return null
    result.push({
      day: item.day,
      orders: Number(item.orders),
      revenue,
      previousRevenue,
    })
  }

  return result
}

export function parsePeakHours(
  value: unknown
): AnalyticsMetrics["peakHours"] | null {
  if (!Array.isArray(value)) return null

  const result = value.filter(isRecord).map((item) => ({
    hour: Number(item.hour),
    orders: Number(item.orders),
  }))

  if (
    result.length !== value.length ||
    result.some(
      (item) =>
        !Number.isInteger(item.hour) ||
        !Number.isInteger(item.orders) ||
        item.orders < 0
    )
  )
    return null

  return result
}

export function parseChannels(
  value: unknown
): AnalyticsMetrics["channels"] | null {
  if (!Array.isArray(value)) return null

  const result = value.filter(isRecord).map((item) => ({
    channel: String(item.channel),
    orders: Number(item.orders),
    state: String(item.state),
  }))

  if (
    result.length !== value.length ||
    result.some(
      (item) =>
        !["web", "qr", "unattributed"].includes(item.channel) ||
        !Number.isInteger(item.orders) ||
        item.orders < 0 ||
        !["available", "untracked"].includes(item.state)
    )
  )
    return null

  return result
}

export function parseBestSellers(
  value: unknown
): AnalyticsMetrics["bestSellers"] | null {
  if (!Array.isArray(value)) return null

  const result = value.filter(isRecord).map((item) => ({
    tenantId: item.tenantId as string,
    restaurant: item.restaurant as string,
    name: item.name as string,
    quantity: Number(item.quantity),
    revenue: Number(item.revenue),
    currency: item.currency as string,
  }))

  if (
    result.length !== value.length ||
    result.some(
      (item) =>
        !isTenantId(item.tenantId) ||
        item.tenantId === "all" ||
        !isNonEmptyString(item.restaurant) ||
        !isNonEmptyString(item.name) ||
        !Number.isInteger(item.quantity) ||
        item.quantity < 0 ||
        !isNumber(item.revenue) ||
        item.revenue < 0 ||
        !/^[A-Z]{3}$/.test(item.currency)
    )
  )
    return null

  return result
}

export function parseTimeZones(
  value: unknown
): AnalyticsMetrics["timeZones"] | null {
  if (!Array.isArray(value)) return null

  const result = value.filter(isRecord).map((item) => ({
    tenantId: item.tenantId as string,
    restaurant: item.restaurant as string,
    timeZone: item.timeZone as string,
  }))

  if (
    result.length === 0 ||
    result.length !== value.length ||
    result.some(
      (item) =>
        !isTenantId(item.tenantId) ||
        item.tenantId === "all" ||
        !isNonEmptyString(item.restaurant) ||
        !isNonEmptyString(item.timeZone)
    )
  )
    return null

  return result
}
