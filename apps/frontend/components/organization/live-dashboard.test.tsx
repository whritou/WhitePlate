import { isValidElement, type ReactElement, type ReactNode } from "react"
import { expect, it, vi } from "vitest"
import type { LiveDashboardProps } from "@/types/live-workspace"
import { LiveDashboard } from "./live-dashboard"
import { ProductAvailabilityControls } from "./product-availability-controls"

vi.mock("@/components/orders/order-overview", () => ({
  OrderOverview: () => null,
}))
vi.mock("@/components/organization/dashboard-metrics-panel", () => ({
  DashboardMetricsPanel: () => null,
}))
vi.mock("@/components/organization/ordering-operations-panel", () => ({
  OrderingOperationsPanel: () => null,
}))
vi.mock("./product-availability-controls", () => ({
  ProductAvailabilityControls: () => null,
}))
vi.mock("./live-product-cover", () => ({ LiveProductCover: () => null }))
vi.mock("./menu-builder-retry", () => ({ MenuBuilderRetry: () => null }))
vi.mock("./storefront-shortcuts", () => ({ StorefrontShortcuts: () => null }))
vi.mock("next-intl/server", () => ({
  getTranslations: async () => (key: string) => key,
}))
vi.mock("@/i18n/navigation", () => ({ Link: () => null }))

const props: LiveDashboardProps = {
  userId: "manager-1",
  tenantId: "11111111-1111-4111-8111-111111111111",
  tenantName: "Bistro",
  role: "Kitchen",
  locale: "en",
  selectedStatus: null,
  cursor: null,
  page: null,
  loadError: null,
  hubUrl: null,
  productAvailability: [
    {
      id: "22222222-2222-4222-8222-222222222222",
      name: "Soup",
      isAvailable: true,
    },
  ],
}

function findChild(
  node: ReactNode,
  type: unknown
):
  | ReactElement<{
      children?: ReactNode
      userId?: string
      canManageAvailability?: boolean
    }>
  | undefined {
  if (Array.isArray(node)) {
    for (const child of node) {
      const found = findChild(child, type)

      if (found) return found
    }

    return undefined
  }

  if (
    !isValidElement<{
      children?: ReactNode
      userId?: string
      canManageAvailability?: boolean
    }>(node)
  )
    return undefined
  if (node.type === type) return node

  return findChild(node.props.children, type)
}

it("keeps Kitchen read-only and withholds product photo access", async () => {
  const tree = await LiveDashboard(props)
  const availability = findChild(
    tree.props.children,
    ProductAvailabilityControls
  )

  expect(availability).toBeDefined()
  expect(availability?.props.userId).toBeUndefined()
  expect(availability?.props.canManageAvailability).toBe(false)
})

it("provides product photo access to managers", async () => {
  const tree = await LiveDashboard({ ...props, role: "Manager" })
  const availability = findChild(
    tree.props.children,
    ProductAvailabilityControls
  )

  expect(availability?.props.userId).toBe("manager-1")
  expect(availability?.props.canManageAvailability).toBe(true)
})
