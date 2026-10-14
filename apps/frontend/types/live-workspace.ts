import type { ReactNode } from "react"
import type { ApiResult } from "./api"
import type { Restaurant } from "./organization"
import type { Organization } from "./organization"
import type { ManagedCatalog, ProductAvailability } from "./catalog-management"
import type { OrderDashboardProps } from "./orders"

export type LiveDashboardProps = OrderDashboardProps & {
  catalog?: ManagedCatalog
  productAvailability?: ProductAvailability[]
  availabilityLoadError?: boolean
  storefrontUrl?: string | null
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
