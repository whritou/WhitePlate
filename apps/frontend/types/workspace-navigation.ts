import type { ReactNode } from "react"
import type { Organization } from "@/types/organization"
import type { RestaurantMembership } from "@/types/orders"

export type WorkspaceNavigationTranslationKey =
  | "workspace"
  | "overview"
  | "team"
  | "settings"
  | "createRestaurant"
  | "orders"
  | "orderHistory"
  | "catalog"
  | "menuLanguages"

export type WorkspaceNavigationLink = {
  href: string
  label: string
}

export type WorkspaceNavigationSection = {
  id: string
  label: string
  links: WorkspaceNavigationLink[]
}

export type WorkspaceContext = {
  type: "organization" | "restaurant"
  id: string
  name: string
}

export type WorkspaceShellProps = {
  organizations: Organization[]
  restaurants: RestaurantMembership[]
  children?: ReactNode
}

export type WorkspaceLayoutProps = {
  children: ReactNode
}
