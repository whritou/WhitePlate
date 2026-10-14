import { isValidElement, type ReactElement, type ReactNode } from "react"
import { expect, it, vi } from "vitest"
import type { RestaurantRole } from "@/types/orders"
import type { LiveDashboardProps } from "@/types/live-workspace"
import { OrderingOperationsController } from "./ordering-operations-controller"
import { LiveDashboard } from "./live-dashboard"

vi.mock("@/components/organization/dashboard-metrics-strip", () => ({
  DashboardMetricsStrip: () => null,
}))
vi.mock("@/components/organization/live-dashboard-order-content", () => ({
  LiveDashboardOrderContent: () => null,
}))
vi.mock("@/components/organization/ordering-operations-panel", () => ({
  OrderingOperationsPauseAction: () => null,
}))
vi.mock("./ordering-operations-controller", () => ({
  OrderingOperationsController: () => null,
}))
vi.mock("./live-product-cover", () => ({ LiveProductCover: () => null }))
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
}

function findChild(
  node: ReactNode,
  type: unknown
): ReactElement<{ children?: ReactNode; role?: RestaurantRole }> | undefined {
  if (Array.isArray(node)) {
    for (const child of node) {
      const found = findChild(child, type)

      if (found) return found
    }

    return undefined
  }

  if (!isValidElement<{ children?: ReactNode; role?: RestaurantRole }>(node))
    return undefined
  if (node.type === type) return node

  return findChild(node.props.children, type)
}

it("passes Kitchen role to the real dashboard controls", async () => {
  const tree = await LiveDashboard(props)
  const controller = findChild(tree, OrderingOperationsController)

  expect(controller?.props.role).toBe("Kitchen")
})

it("passes manager role to the real dashboard controls", async () => {
  const tree = await LiveDashboard({ ...props, role: "Manager" })
  const controller = findChild(tree, OrderingOperationsController)

  expect(controller?.props.role).toBe("Manager")
})
