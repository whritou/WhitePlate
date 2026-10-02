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
      retry: "Try again",
      filterLabel: "Filter orders by status",
      title: "Kitchen orders",
      description: "Review incoming orders.",
      backToOrganizations: "All organizations",
      orderReference: `Order ${values?.reference ?? ""}`,
      lineItem: `${values?.quantity ?? ""} × ${values?.product ?? ""}`,
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
    pending: null,
    message: null,
    refresh: vi.fn(),
    retry: vi.fn(),
    updateStatus: vi.fn(),
  })
})

it("shows the signed-in restaurant role and names each order action accessibly", () => {
  const html = renderToStaticMarkup(createElement(OrderDashboard, props))

  expect(html).toContain("Kitchen staff")
  expect(html).toContain('aria-label="Start preparing order 22222222"')
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
