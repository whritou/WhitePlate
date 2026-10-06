import { createElement } from "react"
import { renderToStaticMarkup } from "react-dom/server"
import { beforeEach, expect, it, vi } from "vitest"
import { OrderRequestError } from "@/lib/api/order-browser"
import type { OrderDashboardProps, OrderPage } from "@/types/orders"
import { useOrderDashboard } from "./use-order-dashboard"

const { queryState, client, mutation, mutationOptions, successToast } =
  vi.hoisted(() => ({
    queryState: { value: {} as Record<string, unknown> },
    client: {
      invalidateQueries: vi.fn(),
      removeQueries: vi.fn(),
      clear: vi.fn(),
    },
    mutation: {
      isPending: false,
      variables: null,
      mutateAsync: vi.fn(),
    },
    mutationOptions: {
      value: {} as { onSuccess?: () => Promise<void> },
    },

    successToast: vi.fn(),
  }))

vi.mock("@tanstack/react-query", () => ({
  useQuery: vi.fn(() => queryState.value),
  useQueryClient: () => client,
  useMutation: (options: { onSuccess?: () => Promise<void> }) => {
    mutationOptions.value = options

    return mutation
  },
}))

vi.mock("@/lib/api/order-browser", () => ({
  fetchOrderPage: vi.fn(),
  OrderRequestError: class OrderRequestError extends Error {
    constructor(readonly code: string) {
      super(code)
    }
  },
}))

vi.mock("@/actions/orders", () => ({ updateOrderStatusAction: vi.fn() }))
vi.mock("@/components/ui/toast", () => ({
  useWorkspaceToast: () => ({ success: successToast }),
}))
vi.mock("next-intl", () => ({
  useTranslations: () => (key: string) => key,
}))
vi.mock("@/i18n/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), refresh: vi.fn() }),
}))
vi.mock("@/lib/query/order-query", () => ({
  orderQueryKeys: {
    page: vi.fn(() => ["orders", "page"]),
    tenant: vi.fn(() => ["orders", "tenant"]),
  },
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
      lines: [
        {
          productId: "11111111-1111-4111-8111-111111111111",
          productName: "Soup",
          quantity: 2,
          options: [],
        },
      ],
    },
  ],
  nextCursor: null,
}

const props: OrderDashboardProps = {
  userId: "user-1",
  tenantId: "33333333-3333-4333-8333-333333333333",
  tenantName: "Bistro",
  role: "Kitchen",
  locale: "en",
  selectedStatus: null,
  cursor: null,
  page: null,
  loadError: "unavailable",
  hubUrl: null,
}

function Probe({ dashboardProps }: { dashboardProps: OrderDashboardProps }) {
  const dashboard = useOrderDashboard(dashboardProps)

  return (
    <output
      data-initial-loading={dashboard.isInitialLoading}
      data-fetching={dashboard.isFetching}
      data-error={dashboard.loadError ?? "none"}
      data-stale={dashboard.isStale}
      data-order-count={dashboard.page?.items.length ?? 0}
    />
  )
}

beforeEach(() => {
  vi.clearAllMocks()
  queryState.value = {
    data: undefined,
    error: null,
    isPending: true,
    isFetching: true,
    refetch: vi.fn(),
  }
})

it("treats a pending first browser query as loading instead of an unavailable error", () => {
  const html = renderToStaticMarkup(
    createElement(Probe, { dashboardProps: props })
  )

  expect(html).toContain('data-initial-loading="true"')
  expect(html).toContain('data-fetching="true"')
  expect(html).toContain('data-error="none"')
})

it("keeps server-provided orders available while a background refresh runs", () => {
  queryState.value = {
    data: orderPage,
    error: null,
    isPending: false,
    isFetching: true,
    refetch: vi.fn(),
  }

  const html = renderToStaticMarkup(
    createElement(Probe, {
      dashboardProps: { ...props, page: orderPage, loadError: null },
    })
  )

  expect(html).toContain('data-initial-loading="false"')
  expect(html).toContain('data-fetching="true"')
  expect(html).toContain('data-order-count="1"')
})

it("keeps a saved order page and marks it stale after a failed refresh", () => {
  queryState.value = {
    data: orderPage,
    error: new OrderRequestError("unavailable"),
    isPending: false,
    isFetching: false,
    refetch: vi.fn(),
  }

  const html = renderToStaticMarkup(
    createElement(Probe, {
      dashboardProps: { ...props, page: orderPage, loadError: null },
    })
  )

  expect(html).toContain('data-stale="true"')
  expect(html).toContain('data-error="unavailable"')
  expect(html).toContain('data-order-count="1"')
})

it("announces successful status changes with the shared toast manager", async () => {
  renderToStaticMarkup(createElement(Probe, { dashboardProps: props }))

  await mutationOptions.value.onSuccess?.()

  expect(successToast).toHaveBeenCalledWith("statusSaved")
})
