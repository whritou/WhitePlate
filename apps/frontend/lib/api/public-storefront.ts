import "server-only"

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

export async function getPublicMenu(hostHeader: string | null, requestedLocale?: string) : Promise<PublicMenuResult> {
  const tenantSlug = getTenantSlug(hostHeader, process.env.STOREFRONT_BASE_DOMAIN)
  if (!tenantSlug) return { kind: "not-tenant" }

  const baseUrl = getTenantApiBaseUrl(tenantSlug, process.env.PUBLIC_TENANT_API_URL_TEMPLATE,
    process.env.STOREFRONT_BASE_DOMAIN)
  if (!baseUrl) return { kind: "unavailable" }

  const api = createApiRequestFactory({
    baseUrl,
    getToken: async () => null,
    public: true,
  })
  const localeQuery = requestedLocale ? `?locale=${encodeURIComponent(requestedLocale)}` : ""
  const response: ApiResult<StorefrontMenu> = await api.get(`/api/v1/menu${localeQuery}`)
  return response.ok && response.data
    ? { kind: "menu", tenantSlug, menu: response.data }
    : { kind: "unavailable" }
}

function getTenantSlug(hostHeader: string | null, configuredDomain: string | undefined): string | null {
  if (!hostHeader || !configuredDomain || hostHeader.length > 255 || /[\r\n,/@]/.test(hostHeader)) return null
  try {
    const incoming = new URL(`http://${hostHeader}`)
    const configured = new URL(`http://${configuredDomain}`)
    if (incoming.username || incoming.password || incoming.pathname !== "/" || incoming.search || incoming.hash ||
      configured.username || configured.password || configured.pathname !== "/" || configured.port ||
      configured.hostname.split(".").some((part) => !part)) return null
    const suffix = `.${configured.hostname.toLowerCase()}`
    const hostname = incoming.hostname.toLowerCase()
    if (!hostname.endsWith(suffix)) return null
    const slug = hostname.slice(0, -suffix.length)
    return /^[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?$/.test(slug) ? slug : null
  } catch {
    return null
  }
}

function getTenantApiBaseUrl(tenantSlug: string, template: string | undefined,
  configuredDomain: string | undefined): string | undefined {
  if (!template || !configuredDomain || template.split("{tenant}").length !== 2) return undefined
  try {
    const substituted = template.replace("{tenant}", tenantSlug)
    const target = new URL(substituted)
    const domain = new URL(`http://${configuredDomain}`).hostname.toLowerCase()
    const expectedHost = `${tenantSlug}.${domain}`
    if ((target.protocol !== "http:" && target.protocol !== "https:") ||
      (process.env.NODE_ENV === "production" && target.protocol !== "https:") || target.username || target.password ||
      target.hostname.toLowerCase() !== expectedHost || target.pathname !== "/" || target.search || target.hash) {
      return undefined
    }
    return target.origin
  } catch {
    return undefined
  }
}
