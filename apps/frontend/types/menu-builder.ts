import type { ManagedCatalog } from "./catalog-management"
import type {
  MenuLanguageSettings,
  RestaurantDescriptionTranslations,
} from "./catalog"

export type MenuBuilderView =
  | "products"
  | "categories"
  | "translations"
  | "allergens"
  | "discounts"
  | "languages"
export type MenuBuilderProps = {
  userId?: string
  catalog: ManagedCatalog
  restaurantName?: string
  settings?: MenuLanguageSettings
  description?: RestaurantDescriptionTranslations
  initialView?: MenuBuilderView
}

export type CategoryVisibilityInput = {
  tenantId: string
  id: string
  isVisible: boolean
}

export type MenuBuilderToolbarProps = {
  catalog: ManagedCatalog
  title: string
  search: string
  onSearch: (value: string) => void
  visibility: string
  onVisibility: (value: string) => void
  pending: boolean
  onPendingChange: (pending: boolean) => void
}
