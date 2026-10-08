import type { ManagedCatalog } from "./catalog-management"
import type {
  MenuLanguageSettings,
  RestaurantDescriptionTranslations,
} from "./catalog"

export type MenuBuilderView = "products" | "translations"
export type MenuBuilderProps = {
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
