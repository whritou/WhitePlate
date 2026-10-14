import { expect, it } from "vitest"
import { parseDashboardMetrics } from "./dashboard-metrics"

const validMetrics = {
  currency: "EUR",
  timeZone: "Europe/Paris",
  businessDate: "2026-10-14",
  comparisonDate: "2026-10-13",
  orderCount: 3,
  comparisonOrderCount: 2,
  orderValue: 45.5,
  comparisonOrderValue: 22,
  activeOrders: { total: 2, pending: 1, preparing: 1, ready: 0 },
  hourlyOrders: Array.from({ length: 24 }, (_, hour) => ({
    hour,
    current: hour === 12 ? 2 : 0,
    previous: hour === 13 ? 1 : 0,
  })),
  topSellingItems: [
    {
      productId: "11111111-1111-4111-8111-111111111111",
      productName: "Soup",
      quantity: 3,
    },
  ],
  averagePreparationMinutes: 13.5,
  preparationSampleCount: 2,
}

it("parses complete operational metrics and all hourly buckets", () => {
  const result = parseDashboardMetrics(validMetrics)

  expect(result?.businessDate).toBe("2026-10-14")
  expect(result?.hourlyOrders).toHaveLength(24)
  expect(result?.topSellingItems[0]?.productName).toBe("Soup")
})

it("accepts hidden monetary values and an unavailable preparation average", () => {
  const result = parseDashboardMetrics({
    ...validMetrics,
    orderValue: null,
    comparisonOrderValue: null,
    averagePreparationMinutes: null,
    preparationSampleCount: 0,
    topSellingItems: [],
  })

  expect(result).toMatchObject({
    orderValue: null,
    comparisonOrderValue: null,
    averagePreparationMinutes: null,
    preparationSampleCount: 0,
    topSellingItems: [],
  })
})

it.each([
  { ...validMetrics, businessDate: "2026-02-30" },
  { ...validMetrics, activeOrders: { ...validMetrics.activeOrders, total: 9 } },
  { ...validMetrics, hourlyOrders: validMetrics.hourlyOrders.slice(1) },
  { ...validMetrics, preparationSampleCount: 0 },
  { ...validMetrics, orderValue: -1 },
])("rejects inconsistent dashboard metrics: %j", (value) => {
  expect(parseDashboardMetrics(value)).toBeNull()
})
