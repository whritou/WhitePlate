export type DashboardMetrics = {
  currency: "EUR" | "USD" | "GBP"
  timeZone: string
  businessDate: string
  comparisonDate: string
  orderCount: number
  comparisonOrderCount: number
  orderValue: number | null
  comparisonOrderValue: number | null
  activeOrders: {
    total: number
    pending: number
    preparing: number
    ready: number
  }
  hourlyOrders: {
    hour: number
    current: number
    previous: number
  }[]
  topSellingItems: {
    productId: string
    productName: string
    quantity: number
  }[]
  averagePreparationMinutes: number | null
  preparationSampleCount: number
}

export type DashboardMetricsInput = Omit<
  DashboardMetrics,
  "hourlyOrders" | "topSellingItems"
> & {
  hourlyOrders: unknown[]
  topSellingItems: unknown[]
}

export type DashboardMetricsScope = {
  userId: string
  tenantId: string
  locale: string
  role: RestaurantRole
}
import type { RestaurantRole } from "@/types/orders"
