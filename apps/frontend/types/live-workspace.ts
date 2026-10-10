import type { ReactNode } from "react"
import type { ApiResult } from "./api"
import type { Restaurant } from "./organization"
import type { Organization } from "./organization"
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
