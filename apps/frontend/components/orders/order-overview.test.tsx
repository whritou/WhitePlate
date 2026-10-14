import { createElement } from "react"
import { renderToStaticMarkup } from "react-dom/server"
import { beforeEach, expect, it, vi } from "vitest"
import type { OrderDashboardProps, OrderPage } from "@/types/orders"
import { OrderOverview } from "./order-overview"

const { useDashboard } = vi.hoisted(() => ({ useDashboard: vi.fn() }))

vi.mock("@/hooks/use-order-dashboard", () => ({
  useOrderDashboard: useDashboard,
}))

vi.mock("@/i18n/navigation", async () => {
  const React = await import("react")

  return {
    Link: ({ href, children, ...props }: Record<string, unknown>) =>
      React.createElement("a", { href, ...props }, children as React.ReactNode),
    useRouter: () => ({ refresh: vi.fn(), push: vi.fn() }),
  }
})

vi.mock("next-intl", () => ({
  useTranslations:
    (namespace: string) =>
    (key: string, values?: Record<string, string | number>) => {
      if (namespace === "KitchenOrders" && key.startsWith("statuses.")) {
        return key.slice("statuses.".length)
      }

      if (namespace === "KitchenOrders" && key === "statusCount") {
        return `${values?.status}: ${values?.count}`
      }

      const messages: Record<string, string> = {
        kitchen: "In the kitchen",
        dashboardLoadedScope: `Counts reflect ${values?.count} loaded orders.`,
        openOrders: "Open order board",
        emptyDashboard: "No active orders.",
        loadingOrders: "Loading orders…",
        refreshingOrders: "Checking for updated orders…",
        stale: "Showing saved orders. The latest refresh failed.",
        retry: "Try again",
      }

      if (namespace === "LiveWorkspace" && key === "dashboardLoadedScope") {
        return `Counts reflect ${values?.count} loaded orders.`
      }

      return messages[key] ?? key
    },
}))

vi.mock("./order-realtime-connection", () => ({
  OrderRealtimeConnection: () => null,
}))

const orderPage: OrderPage = {
  items: [
    {
      id: "22222222-2222-4222-8222-222222222222",
      customerName: "Ada",
      currency: "EUR",
      menuLocale: "en",
      total: 19.25,
      status: "Pending",
      version: 1,
      createdAt: "2026-10-01T18:00:00Z",
      lines: [],
    },
    {
      id: "33333333-3333-4333-8333-333333333333",
      customerName: "Lin",
      currency: "EUR",
      menuLocale: "en",
      total: 12,
      status: "Ready",
      version: 1,
      createdAt: "2026-10-01T18:01:00Z",
      lines: [],
    },
    {
      id: "44444444-4444-4444-8444-444444444444",
      customerName: "Sam",
      currency: "EUR",
      menuLocale: "en",
      total: 8,
      status: "Ready",
      version: 1,
      createdAt: "2026-10-01T18:02:00Z",
      lines: [],
    },
  ],
  nextCursor: "next-page",
  serverTime: "2026-10-01T18:03:00Z",
}

const props: OrderDashboardProps = {
  userId: "user-1",
  tenantId: "11111111-1111-4111-8111-111111111111",
  tenantName: "Bistro",
  role: "Kitchen",
  locale: "en",
  selectedStatus: null,
  cursor: null,
  page: orderPage,
  loadError: null,
  hubUrl: null,
}

beforeEach(() => {
  useDashboard.mockReturnValue({
    page: orderPage,
    loadError: null,
    isStale: false,
    isInitialLoading: false,
    isFetching: false,
    message: null,
    refresh: vi.fn(),
    retry: vi.fn(),
  })
})

it("summarizes loaded order statuses and links to the full order board", () => {
  const html = renderToStaticMarkup(createElement(OrderOverview, props))

  expect(html).toContain("Pending")
  expect(html).toContain("Preparing")
  expect(html).toContain("Ready")
  expect(html).toContain("Completed")
  expect(html).toContain("Cancelled")
  expect(html).toContain("Counts reflect 3 loaded orders.")
  expect(html).toContain('aria-label="Pending: 1"')
  expect(html).toContain('aria-label="Ready: 2"')
  expect(html).toContain(
    'href="/organization/orders?tenantId=11111111-1111-4111-8111-111111111111"'
  )
  expect(html).not.toContain('role="tablist"')
  expect(html).not.toContain("data-order-id=")
  expect(html).not.toContain("Ada")
})

it("keeps loaded-page status counts visible with a stale-data warning", () => {
  useDashboard.mockReturnValue({
    page: orderPage,
    loadError: "unavailable",
    isStale: true,
    isInitialLoading: false,
    isFetching: false,
    message: null,
    refresh: vi.fn(),
    retry: vi.fn(),
  })

  const html = renderToStaticMarkup(createElement(OrderOverview, props))

  expect(html).toContain("Showing saved orders. The latest refresh failed.")
  expect(html).toContain("Counts reflect 3 loaded orders.")
  expect(html).toContain("Ready")
})
