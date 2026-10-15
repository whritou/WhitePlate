import type { CatalogCategory, ManagedCatalog } from "./catalog-management"
import type {
  MenuLanguageSettings,
  RestaurantDescriptionTranslations,
} from "./catalog"

export type MenuBuilderView =
  "products" | "categories" | "translations" | "discounts" | "languages"
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
  category?: CatalogCategory
  title: string
  search: string
  onSearch: (value: string) => void
  visibility: string
  onVisibility: (value: string) => void
  pending: boolean
  onPendingChange: (pending: boolean) => void
}

export type MenuBuilderDraggedItem = {
  kind: "category" | "product"
  id: string
}

export type MenuBuilderReorderInput = {
  entityType: "categories" | "products"
  orderedIds: string[]
  categoryId?: string
  movedProductId?: string
}

export type ProductExtrasDraggedItem = {
  type: "option-groups" | "options"
  id: string
}
