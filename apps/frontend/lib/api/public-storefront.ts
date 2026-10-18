import "server-only"
import { createApiRequestFactory } from "./request-factory"
import { createPublicStorefrontApiTarget } from "@/lib/storefront-preview-routing"
import { parseStorefrontMenu } from "@/lib/validation/responses"
import type { PublicMenuResult } from "@/types/storefront"
import { parsePublishedTheme } from "@/lib/validation/theme-publication"
import type { PublishedTheme } from "@/types/theme"

export async function getPublicMenu(
  hostHeader: string | null,
  requestedLocale?: string,
  restaurantSlug?: string
): Promise<PublicMenuResult> {
  const target = createPublicStorefrontApiTarget(hostHeader, restaurantSlug, {
    baseDomain: process.env.STOREFRONT_BASE_DOMAIN,
    apiTemplate: process.env.PUBLIC_TENANT_API_URL_TEMPLATE,
    pathBaseDomain: process.env.STOREFRONT_PATH_BASE_DOMAIN,
    centralApiUrl: process.env.API_BASE_URL,
  })

  if (!target)
    return restaurantSlug ? { kind: "unavailable" } : { kind: "not-tenant" }
  if (!target.apiBaseUrl) return { kind: "unavailable" }

  const api = createApiRequestFactory({
    baseUrl: target.apiBaseUrl,
    getToken: async () => null,
    public: true,
  })
  const localeQuery = requestedLocale
    ? `?locale=${encodeURIComponent(requestedLocale)}`
    : ""
  const response = await api.get<unknown>(
    `${target.apiPrefix}/menu${localeQuery}`
  )
  const menu = response.ok ? parseStorefrontMenu(response.data) : null

  return menu
    ? { kind: "menu", tenantSlug: target.restaurantSlug, menu }
    : { kind: "unavailable" }
}

export async function getPublicTheme(
  hostHeader: string | null,
  restaurantSlug?: string
): Promise<PublishedTheme | null> {
  const target = createPublicStorefrontApiTarget(hostHeader, restaurantSlug, {
    baseDomain: process.env.STOREFRONT_BASE_DOMAIN,
    apiTemplate: process.env.PUBLIC_TENANT_API_URL_TEMPLATE,
    pathBaseDomain: process.env.STOREFRONT_PATH_BASE_DOMAIN,
    centralApiUrl: process.env.API_BASE_URL,
  })

  if (!target?.apiBaseUrl) return null

  const api = createApiRequestFactory({
    baseUrl: target.apiBaseUrl,
    getToken: async () => null,
    public: true,
  })
  const response = await api.get<unknown>(`${target.apiPrefix}/theme`)

  return response.ok ? parsePublishedTheme(response.data) : null
}
