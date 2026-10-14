import { createElement } from "react"
import { renderToStaticMarkup } from "react-dom/server"
import { beforeEach, expect, it, vi } from "vitest"
import type { DashboardMetrics } from "@/types/dashboard-metrics"
import { DashboardMetricsPanel } from "./dashboard-metrics-panel"

const { dashboard } = vi.hoisted(() => ({
  dashboard: { value: {} as Record<string, unknown> },
}))

vi.mock("@/hooks/use-dashboard-metrics", () => ({
  useDashboardMetrics: () => dashboard.value,
}))

vi.mock("next-intl", () => ({
  useTranslations: () => (key: string, values?: Record<string, unknown>) =>
    values ? `${key} ${Object.values(values).join(" ")}` : key,
}))

const metrics: DashboardMetrics = {
  currency: "EUR",
  timeZone: "Europe/Paris",
  businessDate: "2026-10-14",
  comparisonDate: "2026-10-13",
  orderCount: 3,
  comparisonOrderCount: 2,
  orderValue: 10.73,
  comparisonOrderValue: 8.5,
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
  averagePreparationMinutes: 12,
  preparationSampleCount: 1,
}

beforeEach(() => {
  dashboard.value = {
    metrics,
    loadError: null,
    isInitialLoading: false,
    isFetching: false,
    retry: vi.fn(),
    canViewOrderValue: true,
  }
})

it("renders formatted totals and a screen-reader hourly data table", () => {
  const html = renderToStaticMarkup(
    createElement(DashboardMetricsPanel, {
      userId: "user-a",
      tenantId: "22222222-2222-4222-8222-222222222222",
      locale: "en",
      role: "Manager",
      initialMetrics: metrics,
    })
  )

  expect(html).toContain("€10.73")
  expect(html).toContain("Soup")
  expect(html).toContain(
    "hourlyAccessibleSummary 2026-10-14 2026-10-13 Europe/Paris"
  )
  expect(html).toContain('<table class="sr-only">')
  expect(html).toContain('<th scope="col">hourColumn</th>')
})

it("does not render monetary values to Kitchen staff", () => {
  dashboard.value = { ...dashboard.value, canViewOrderValue: false }

  const html = renderToStaticMarkup(
    createElement(DashboardMetricsPanel, {
      userId: "user-kitchen",
      tenantId: "22222222-2222-4222-8222-222222222222",
      locale: "fr",
      role: "Kitchen",
      initialMetrics: {
        ...metrics,
        orderValue: null,
        comparisonOrderValue: null,
      },
    })
  )

  expect(html).not.toContain("orderValue")
  expect(html).not.toContain("10,73")
})
