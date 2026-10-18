export type AnalyticsPeriod = {
  startDate: string
  endDate: string
  days: number
}
export type AnalyticsMoneyValue = {
  currency: string
  value: number | null
  state: "available" | "unavailable"
  previousValue: number | null
  comparisonAvailable: boolean
  sampleCount: number
  previousSampleCount: number
}
export type AnalyticsNumberValue = {
  value: number | null
  state: "available" | "unavailable" | "untracked"
  unit: string
  sampleCount: number
  previousSampleCount: number
  previousValue: number | null
  comparisonAvailable: boolean
  provenance: string
}
export type AnalyticsSeriesPoint = {
  day: string
  orders: number
  revenue: Record<string, number>
  previousRevenue: Record<string, number>
}
export type AnalyticsMetrics = {
  version: number
  tenantId: string
  restaurant: string
  currency: string
  timeZone: string
  currentPeriod: AnalyticsPeriod
  comparisonPeriod: AnalyticsPeriod
  revenue: AnalyticsMoneyValue[]
  orders: number
  previousOrders: number | null
  ordersComparisonAvailable: boolean
  averageOrderValue: AnalyticsMoneyValue[]
  returningCustomerRate: AnalyticsNumberValue
  averagePreparationMinutes: AnalyticsNumberValue
  commissionPaid: AnalyticsMoneyValue[]
  series: AnalyticsSeriesPoint[]
  peakHours: { hour: number; orders: number }[]
  channels: { channel: string; orders: number; state: string }[]
  bestSellers: {
    tenantId: string
    restaurant: string
    name: string
    quantity: number
    revenue: number
    currency: string
  }[]
  onTimePickupRate: AnalyticsNumberValue
  acceptedUnderOneMinuteRate: AnalyticsNumberValue
  cancellationRate: AnalyticsNumberValue
  fastestPreparationMinutes: AnalyticsNumberValue
  slowestPreparationMinutes: AnalyticsNumberValue
  discountUses: number
  refunds: AnalyticsNumberValue
  timeZones: { tenantId: string; restaurant: string; timeZone: string }[]
}
export type AnalyticsRestaurant = {
  id: string
  name: string
  role: string
  permissions: string[]
}

export type AnalyticsRange = "7" | "30" | "90"

export type AnalyticsPageViewModel = {
  range: AnalyticsRange
  setRange: (range: AnalyticsRange) => void
  rest: number
  setRest: (index: number) => void
  restOptions: string[]
  metric: "revenue" | "orders"
  setMetric: (metric: "revenue" | "orders") => void
  d: {
    series: {
      day: string
      orders: number
      revenue: number
      prev: number
      revenueByCurrency?: Record<string, number>
      previousRevenueByCurrency?: Record<string, number>
    }[]
    hours: { hour: string; orders: number }[]
    channels: { name: string; value: number; state?: string }[]
    dishes: {
      n: string
      q: number
      rev: number
      currency?: string
      tenantId?: string
      restaurant?: string
      rank?: number
      barValue?: number
    }[]
  }
  kpis: {
    k: string
    v: string
    delta: number | null
    invert?: boolean
    note?: string
  }[]
  kitchen: {
    onTime: number | null
    accepted: number | null
    cancelled: number | null
    fastest: string
    slowest: string
    discountUses: string
    refunds: string
  }
  maxDish: number
  pageMode: "demo" | "live"
  dishBarMetric?: "revenue" | "quantity" | "normalized"
  exportCsv: () => void
}
