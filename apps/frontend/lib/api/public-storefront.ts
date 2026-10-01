import "server-only"
import { getTenantSlug, getTenantApiBaseUrl } from "./tenant-routing"

import { createApiRequestFactory, type ApiResult } from "./request-factory"

export type StorefrontMenu = {
  tenantId: string
  restaurantName: string
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

export async function getPublicMenu(
  hostHeader: string | null,
  requestedLocale?: string
): Promise<PublicMenuResult> {
  const tenantSlug = getTenantSlug(
    hostHeader,
    process.env.STOREFRONT_BASE_DOMAIN
  )
  if (!tenantSlug) return { kind: "not-tenant" }

  const baseUrl = getTenantApiBaseUrl(
    tenantSlug,
    process.env.PUBLIC_TENANT_API_URL_TEMPLATE,
    process.env.STOREFRONT_BASE_DOMAIN
  )
  if (!baseUrl) return { kind: "unavailable" }

  const api = createApiRequestFactory({
    baseUrl,
    getToken: async () => null,
    public: true,
  })
  const localeQuery = requestedLocale
    ? `?locale=${encodeURIComponent(requestedLocale)}`
    : ""
  const response: ApiResult<StorefrontMenu> = await api.get(
    `/api/v1/menu${localeQuery}`
  )
  return response.ok && response.data
    ? { kind: "menu", tenantSlug, menu: response.data }
    : { kind: "unavailable" }
}
