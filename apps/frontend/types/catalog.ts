export type LocalizedText = { name: string; description: string | null }

export type TranslationRow = {
  id: string
  type: "categories" | "products" | "option-groups" | "options"
  label: string
  name: string
  description: string | null
  translations: Record<string, LocalizedText>
  isArchived: boolean
}

export type CatalogTranslationData = {
  categories: {
    id: string
    name: string
    isArchived: boolean
    translations: Record<string, LocalizedText>
  }[]
  products: {
    id: string
    categoryId: string
    name: string
    description: string | null
    isArchived: boolean
    translations: Record<string, LocalizedText>
  }[]
  optionGroups: {
    id: string
    productId: string
    name: string
    isArchived: boolean
    translations: Record<string, LocalizedText>
  }[]
  options: {
    id: string
    groupId: string
    name: string
    isArchived: boolean
    translations: Record<string, LocalizedText>
  }[]
}

export type FormState = "idle" | "pending" | "success" | "error"

export type MenuLanguageSettings = {
  tenantId: string
  locales: string[]
  defaultLocale: string
}

export type RestaurantDescriptionTranslations = MenuLanguageSettings & {
  translations: Record<string, string>
}

export type CatalogManagement = CatalogTranslationData
