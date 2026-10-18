import type { ManagedCatalog } from "./catalog-management"
import type {
  MenuLanguageSettings,
  RestaurantDescriptionTranslations,
} from "./catalog"
import type {
  CatalogTranslationGlossaryTerm,
  CatalogTranslationReview,
} from "./catalog-translation-workflow"

export type MenuBuilderView =
  | "products"
  | "categories"
  | "translations"
  | "discounts"
  | "languages"
  | "versions"
export type MenuBuilderProps = {
  userId?: string
  catalog: ManagedCatalog
  restaurantName?: string
  settings?: MenuLanguageSettings
  description?: RestaurantDescriptionTranslations
  translationReviews?: CatalogTranslationReview[]
  translationGlossary?: CatalogTranslationGlossaryTerm[]
  translationWorkflowUnavailable?: boolean
  initialView?: MenuBuilderView
  canManageCatalog?: boolean
  canManageDiscounts?: boolean
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
