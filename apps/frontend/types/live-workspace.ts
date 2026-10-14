import type { ReactNode } from "react"
import type { ApiResult } from "./api"
import type { Restaurant } from "./organization"
import type { Organization } from "./organization"
import type { ManagedCatalog } from "./catalog-management"
import type { OrderDashboardProps } from "./orders"
import type { DashboardMetrics } from "./dashboard-metrics"
import type { OrderingOperations } from "./ordering-operations"

export type LiveDashboardProps = OrderDashboardProps & {
  initialDashboardMetrics?: DashboardMetrics | null
  initialOrderingOperations?: OrderingOperations | null
  catalog?: ManagedCatalog
  storefrontUrl?: string | null
}

export type LiveDashboardOrderContentProps = OrderDashboardProps & {
  storefront: ReactNode
}

export type LiveWorkspaceLink = {
  href: string
  key:
    | "dashboard"
    | "orders"
    | "orderHistory"
    | "analytics"
    | "catalog"
    | "theming"
    | "team"
    | "settings"
    | "createRestaurant"
}
export type LiveSettingsProps = {
  organization: Organization
  userId: string
  children: ReactNode
  restaurants?: ApiResult<Restaurant[]>
}
