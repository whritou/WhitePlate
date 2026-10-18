import type { AnalyticsMetrics } from "@/types/analytics"
import {
  isNonEmptyString,
  isRecord,
  isTenantId,
  parseBestSellers,
  parseChannels,
  parseMoney,
  parseNumber,
  parsePeakHours,
  parsePeriod,
  parseSeries,
  parseTimeZones,
} from "./analytics-metrics-parse-helpers"

export function parseAnalyticsMetrics(value: unknown): AnalyticsMetrics | null {
  if (
    !isRecord(value) ||
    value.version !== 1 ||
    !isTenantId(value.tenantId) ||
    !isNonEmptyString(value.restaurant) ||
    !(
      value.currency === "MULTI" ||
      (typeof value.currency === "string" && /^[A-Z]{3}$/.test(value.currency))
    ) ||
    !isNonEmptyString(value.timeZone) ||
    ("timeZones" in value && !Array.isArray(value.timeZones))
  )
    return null

  const core = parseAnalyticsCore(value)
  const dimensions = parseAnalyticsDimensions(value)

  if (!core || !dimensions) return null

  return {
    version: 1,
    tenantId: value.tenantId,
    restaurant: value.restaurant,
    currency: value.currency,
    timeZone: value.timeZone,
    ...core,
    ...dimensions,
  }
}

function parseAnalyticsCore(value: Record<string, unknown>) {
  const currentPeriod = parsePeriod(value.currentPeriod)
  const comparisonPeriod = parsePeriod(value.comparisonPeriod)
  const revenue = parseMoney(value.revenue)
  const averageOrderValue = parseMoney(value.averageOrderValue)
  const commissionPaid = parseMoney(value.commissionPaid)
  const returningCustomerRate = parseNumber(value.returningCustomerRate)
  const averagePreparationMinutes = parseNumber(value.averagePreparationMinutes)
  const onTimePickupRate = parseNumber(value.onTimePickupRate)
  const acceptedUnderOneMinuteRate = parseNumber(
    value.acceptedUnderOneMinuteRate
  )
  const cancellationRate = parseNumber(value.cancellationRate)
  const fastestPreparationMinutes = parseNumber(value.fastestPreparationMinutes)
  const slowestPreparationMinutes = parseNumber(value.slowestPreparationMinutes)
  const refunds = parseNumber(value.refunds)
  const series = parseSeries(value.series)
  const validOrders =
    Number.isInteger(value.orders) && Number(value.orders) >= 0
  const validPreviousOrders =
    value.previousOrders === null ||
    (Number.isInteger(value.previousOrders) &&
      Number(value.previousOrders) >= 0)
  const validDiscountUses =
    Number.isInteger(value.discountUses) && Number(value.discountUses) >= 0

  if (
    !currentPeriod ||
    !comparisonPeriod ||
    !revenue ||
    !averageOrderValue ||
    !commissionPaid ||
    !returningCustomerRate ||
    !averagePreparationMinutes ||
    !onTimePickupRate ||
    !acceptedUnderOneMinuteRate ||
    !cancellationRate ||
    !fastestPreparationMinutes ||
    !slowestPreparationMinutes ||
    !refunds ||
    !series ||
    !validOrders ||
    !validPreviousOrders ||
    typeof value.ordersComparisonAvailable !== "boolean" ||
    !validDiscountUses
  )
    return null

  return {
    currentPeriod,
    comparisonPeriod,
    revenue,
    orders: Number(value.orders),
    previousOrders: value.previousOrders as number | null,
    ordersComparisonAvailable: value.ordersComparisonAvailable,
    averageOrderValue,
    returningCustomerRate,
    averagePreparationMinutes,
    commissionPaid,
    series,
    onTimePickupRate,
    acceptedUnderOneMinuteRate,
    cancellationRate,
    fastestPreparationMinutes,
    slowestPreparationMinutes,
    discountUses: Number(value.discountUses),
    refunds,
  }
}

function parseAnalyticsDimensions(value: Record<string, unknown>) {
  const peakHours = parsePeakHours(value.peakHours)
  const channels = parseChannels(value.channels)
  const bestSellers = parseBestSellers(value.bestSellers)
  const timeZones = Array.isArray(value.timeZones)
    ? parseTimeZones(value.timeZones)
    : value.tenantId === "all"
      ? null
      : parseTimeZones([
          {
            tenantId: value.tenantId,
            restaurant: value.restaurant,
            timeZone: value.timeZone,
          },
        ])

  if (!peakHours || !channels || !bestSellers || !timeZones) return null

  return { peakHours, channels, bestSellers, timeZones }
}
