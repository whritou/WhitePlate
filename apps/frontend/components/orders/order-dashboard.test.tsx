import { createElement } from "react"
import { renderToStaticMarkup } from "react-dom/server"
import { beforeEach, expect, it, vi } from "vitest"
import type { OrderDashboardProps } from "@/types/orders"
import { OrderDashboard } from "./order-dashboard"

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
  useTranslations: () => (key: string, values?: Record<string, string>) => {
    if (key === "actionForOrder") {
      return `${values?.action ?? ""} order ${values?.reference ?? ""}`
    }

    const messages: Record<string, string> = {
      "roles.OrganizationOwner": "Owner",
      "roles.Manager": "Manager",
      "roles.Kitchen": "Kitchen staff",
      "statuses.Pending": "Pending",
      "statuses.Preparing": "Preparing",
      "statuses.Ready": "Ready",
      "statuses.Completed": "Completed",
      "statuses.Cancelled": "Cancelled",
      "actions.Preparing": "Start preparing",
      "actions.Cancelled": "Cancel order",
      "errors.forbidden": "You don’t have access to these orders.",
      "errors.unavailable":
        "We couldn’t load the latest orders. Try again in a moment.",
      retry: "Try again",
      loadingOrders: "Loading orders…",
      refreshingOrders: "Checking for updated orders…",
      stale: "Showing saved orders. The latest refresh failed.",
      filterLabel: "Filter orders by status",
      title: "Kitchen orders",
      description: "Review incoming orders.",
      backToOrganizations: "All organizations",
      orderReference: `Order ${values?.reference ?? ""}`,
      lineItem: `${values?.quantity ?? ""} × ${values?.product ?? ""}`,
      emptyTitle: "No orders for now",
      emptyDescription: "New orders will appear here.",
    }

    return messages[key] ?? key
  },
}))

vi.mock("./order-realtime-connection", () => ({
  OrderRealtimeConnection: () => createElement("p", null, "Realtime status"),
}))

const order = {
  id: "22222222-2222-4222-8222-222222222222",
  customerName: "Ada",
  currency: "EUR",
  menuLocale: "en",
  total: 19.25,
  status: "Pending" as const,
  version: 1,
  createdAt: "2026-10-01T18:00:00Z",
  lines: [
    {
      productId: "11111111-1111-4111-8111-111111111111",
      productName: "Soup",
      quantity: 2,
      options: [],
    },
  ],
}

const props: OrderDashboardProps = {
  userId: "user-1",
  tenantId: "33333333-3333-4333-8333-333333333333",
  tenantName: "Bistro",
  role: "Kitchen",
  locale: "en",
  selectedStatus: null,
  cursor: null,
  page: { items: [order], nextCursor: null },
  loadError: null,
  hubUrl: "https://api.example.test/hubs/orders",
}

beforeEach(() => {
  useDashboard.mockReturnValue({
    page: props.page,
    loadError: null,
    isStale: false,
    isInitialLoading: false,
    isFetching: false,
    pending: null,
    message: null,
    refresh: vi.fn(),
    retry: vi.fn(),
    updateStatus: vi.fn(),
  })
})

it("shows a polite loading status and decorative skeletons on an initial query", () => {
  useDashboard.mockReturnValue({
    page: null,
    loadError: null,
    isStale: false,
    isInitialLoading: true,
    isFetching: true,
    pending: null,
    message: null,
    refresh: vi.fn(),
    retry: vi.fn(),
    updateStatus: vi.fn(),
  })

  const html = renderToStaticMarkup(createElement(OrderDashboard, props))

  expect(html).toContain("Loading orders…")
  expect(html).toContain('aria-busy="true"')
  expect(html).toContain('aria-hidden="true"')
  expect(html.indexOf('role="status"')).toBeLessThan(
    html.indexOf('aria-busy="true"')
  )
  expect(html).not.toContain("We couldn’t load the latest orders.")
})

it("announces a background refresh while keeping current orders visible", () => {
  useDashboard.mockReturnValue({
    page: props.page,
    loadError: null,
    isStale: false,
    isInitialLoading: false,
    isFetching: true,
    pending: null,
    message: null,
    refresh: vi.fn(),
    retry: vi.fn(),
    updateStatus: vi.fn(),
  })

  const html = renderToStaticMarkup(createElement(OrderDashboard, props))

  expect(html).toContain("Checking for updated orders…")
  expect(html).toContain("Ada")
  expect(html).toContain("Soup")
})

it("keeps the last order snapshot visible with its stale-data warning", () => {
  useDashboard.mockReturnValue({
    page: props.page,
    loadError: "unavailable",
    isStale: true,
    isInitialLoading: false,
    isFetching: false,
    pending: null,
    message: null,
    refresh: vi.fn(),
    retry: vi.fn(),
    updateStatus: vi.fn(),
  })

  const html = renderToStaticMarkup(createElement(OrderDashboard, props))

  expect(html).toContain("Showing saved orders. The latest refresh failed.")
  expect(html).toContain("Ada")
  expect(html).toContain("Soup")
})

it("shows only the empty state when the current view has no orders", () => {
  useDashboard.mockReturnValue({
    page: { items: [], nextCursor: null },
    loadError: null,
    isStale: false,
    isInitialLoading: false,
    isFetching: false,
    pending: null,
    message: null,
    refresh: vi.fn(),
    retry: vi.fn(),
    updateStatus: vi.fn(),
  })

  const html = renderToStaticMarkup(createElement(OrderDashboard, props))

  expect(html).toContain("No orders for now")
  expect(html).not.toContain("No orders in this view")
  expect(html).not.toContain("New orders will appear here.")
  expect(html).not.toContain("data-order-lane=")
  expect(html).not.toContain("Loading orders…")
  expect(html).toContain("All organizations")
  expect(html).toContain("lucide-arrow-left")
})

it("shows an unavailable error after an unsuccessful initial query", () => {
  useDashboard.mockReturnValue({
    page: null,
    loadError: "unavailable",
    isStale: false,
    isInitialLoading: false,
    isFetching: false,
    pending: null,
    message: null,
    refresh: vi.fn(),
    retry: vi.fn(),
    updateStatus: vi.fn(),
  })

  const html = renderToStaticMarkup(createElement(OrderDashboard, props))

  expect(html).toContain("We couldn’t load the latest orders.")
  expect(html).toContain('role="alert"')
  expect(html).not.toContain("Loading orders…")
})

it("shows the signed-in restaurant role and names each order action accessibly", () => {
  const html = renderToStaticMarkup(createElement(OrderDashboard, props))

  expect(html).toContain("Kitchen staff")
  expect(html).toContain('aria-label="Start preparing order 22222222"')
})

it("groups orders into named status lanes and exposes the filters as tabs", () => {
  const html = renderToStaticMarkup(createElement(OrderDashboard, props))

  expect(html).toContain('role="tablist"')
  expect(html).toContain('role="tab"')
  expect(html).toContain('aria-selected="true"')
  for (const status of [
    "Pending",
    "Preparing",
    "Ready",
    "Completed",
    "Cancelled",
  ]) {
    expect(html).toContain(`data-order-lane="${status}"`)
  }

  expect(html).toContain('data-order-id="22222222-2222-4222-8222-222222222222"')
})

it("hides cached order filters and tickets after restaurant access is revoked", () => {
  useDashboard.mockReturnValue({
    page: null,
    loadError: "forbidden",
    isStale: false,
    pending: null,
    message: null,
    refresh: vi.fn(),
    retry: vi.fn(),
    updateStatus: vi.fn(),
  })

  const html = renderToStaticMarkup(createElement(OrderDashboard, props))

  expect(html).toContain("You don’t have access to these orders.")
  expect(html).not.toContain('aria-label="Filter orders by status"')
  expect(html).not.toContain("22222222-2222-4222-8222-222222222222")
  expect(html).not.toContain("Ada")
})
