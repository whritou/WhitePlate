export type StorefrontMenu = {
  tenantId: string
  restaurantName: string
  restaurantDescription: string | null
  currency: string
  locale: string
  defaultLocale: string
  availableLocales: string[]
  categories: {
    id: string
    name: string
    sortOrder: number
    products: {
      id: string
      name: string
      description: string | null
      basePrice: number
      isAvailable: boolean
      optionGroups: {
        id: string
        name: string
        minimumSelections: number
        maximumSelections: number
        options: { id: string; name: string; priceAdjustment: number }[]
      }[]
    }[]
  }[]
}

export type PublicMenuResult =
  | { kind: "not-tenant" }
  | { kind: "unavailable" }
  | { kind: "menu"; tenantSlug: string; menu: StorefrontMenu }

export type Product = StorefrontMenu["categories"][number]["products"][number]
