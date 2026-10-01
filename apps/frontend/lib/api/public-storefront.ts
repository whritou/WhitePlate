import "server-only"
import { createApiRequestFactory } from "./request-factory"
import { getTenantSlug, getTenantApiBaseUrl } from "./tenant-routing"
import { parseStorefrontMenu } from "@/lib/validation/responses"
import type { PublicMenuResult } from "@/types/storefront"

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
  const response = await api.get<unknown>(`/api/v1/menu${localeQuery}`)
  const menu = response.ok ? parseStorefrontMenu(response.data) : null

  return menu ? { kind: "menu", tenantSlug, menu } : { kind: "unavailable" }
}
