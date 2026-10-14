import { isRecord, isUuid } from "@/lib/validation/common"
import type {
  DashboardMetrics,
  DashboardMetricsInput,
} from "@/types/dashboard-metrics"

export function parseDashboardMetrics(value: unknown): DashboardMetrics | null {
  if (!isDashboardMetricsInput(value)) return null

  const hourlyOrders = parseHourlyOrders(value.hourlyOrders)
  const topSellingItems = parseTopSellingItems(value.topSellingItems)

  if (!hourlyOrders || !topSellingItems) return null

  return {
    currency: value.currency,
    timeZone: value.timeZone,
    businessDate: value.businessDate,
    comparisonDate: value.comparisonDate,
    orderCount: value.orderCount,
    comparisonOrderCount: value.comparisonOrderCount,
    orderValue: value.orderValue,
    comparisonOrderValue: value.comparisonOrderValue,
    activeOrders: {
      total: value.activeOrders.total,
      pending: value.activeOrders.pending,
      preparing: value.activeOrders.preparing,
      ready: value.activeOrders.ready,
    },
    hourlyOrders,
    topSellingItems,
    averagePreparationMinutes: value.averagePreparationMinutes,
    preparationSampleCount: value.preparationSampleCount,
  }
}

function isDashboardMetricsInput(
  value: unknown
): value is DashboardMetricsInput {
  if (!isRecord(value) || !isRecord(value.activeOrders)) return false

  return (
    isCurrency(value.currency) &&
    typeof value.timeZone === "string" &&
    Boolean(value.timeZone.trim()) &&
    value.timeZone.length <= 100 &&
    isDate(value.businessDate) &&
    isDate(value.comparisonDate) &&
    isCount(value.orderCount) &&
    isCount(value.comparisonOrderCount) &&
    isAmount(value.orderValue) &&
    isAmount(value.comparisonOrderValue) &&
    isCount(value.activeOrders.total) &&
    isCount(value.activeOrders.pending) &&
    isCount(value.activeOrders.preparing) &&
    isCount(value.activeOrders.ready) &&
    value.activeOrders.total ===
      value.activeOrders.pending +
        value.activeOrders.preparing +
        value.activeOrders.ready &&
    Array.isArray(value.hourlyOrders) &&
    value.hourlyOrders.length === 24 &&
    Array.isArray(value.topSellingItems) &&
    value.topSellingItems.length <= 5 &&
    isAmount(value.averagePreparationMinutes) &&
    isCount(value.preparationSampleCount) &&
    ((value.preparationSampleCount === 0 &&
      value.averagePreparationMinutes === null) ||
      (value.preparationSampleCount > 0 &&
        typeof value.averagePreparationMinutes === "number"))
  )
}

function parseHourlyOrders(
  rows: unknown[]
): DashboardMetrics["hourlyOrders"] | null {
  const hourlyOrders: DashboardMetrics["hourlyOrders"] = []

  for (let hour = 0; hour < rows.length; hour++) {
    const candidate: unknown = rows[hour]

    if (
      !isRecord(candidate) ||
      candidate.hour !== hour ||
      !isCount(candidate.current) ||
      !isCount(candidate.previous)
    )
      return null

    hourlyOrders.push({
      hour,
      current: candidate.current,
      previous: candidate.previous,
    })
  }

  return hourlyOrders
}

function parseTopSellingItems(
  rows: unknown[]
): DashboardMetrics["topSellingItems"] | null {
  const topSellingItems: DashboardMetrics["topSellingItems"] = []

  for (const candidate of rows) {
    if (
      !isRecord(candidate) ||
      !isUuid(candidate.productId) ||
      typeof candidate.productName !== "string" ||
      !candidate.productName.trim() ||
      !isCount(candidate.quantity) ||
      candidate.quantity < 1
    )
      return null

    topSellingItems.push({
      productId: candidate.productId,
      productName: candidate.productName,
      quantity: candidate.quantity,
    })
  }

  return topSellingItems
}

function isCurrency(value: unknown): value is DashboardMetrics["currency"] {
  return value === "EUR" || value === "USD" || value === "GBP"
}

function isDate(value: unknown): value is string {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value))
    return false

  const parsed = new Date(`${value}T00:00:00Z`)

  return (
    !Number.isNaN(parsed.valueOf()) &&
    parsed.toISOString().slice(0, 10) === value
  )
}

function isCount(value: unknown): value is number {
  return typeof value === "number" && Number.isSafeInteger(value) && value >= 0
}

function isAmount(value: unknown): value is number | null {
  return (
    value === null ||
    (typeof value === "number" && Number.isFinite(value) && value >= 0)
  )
}
