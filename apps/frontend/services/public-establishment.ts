import "server-only"
import { createApiRequestFactory } from "@/lib/api/request-factory"
import { createPublicStorefrontApiTarget } from "@/lib/storefront-preview-routing"
import { parsePublicEstablishment } from "@/lib/validation/establishment-settings"

export async function getPublicEstablishment(
  host: string | null,
  locale: string,
  signal?: AbortSignal,
  restaurantSlug?: string
) {
  const target = createPublicStorefrontApiTarget(host, restaurantSlug, {
    baseDomain: process.env.STOREFRONT_BASE_DOMAIN,
    apiTemplate: process.env.PUBLIC_TENANT_API_URL_TEMPLATE,
    pathBaseDomain: process.env.STOREFRONT_PATH_BASE_DOMAIN,
    centralApiUrl: process.env.API_BASE_URL,
  })

  if (!target)
    return { ok: false as const, status: 404, error: "not_found" as const }
  if (!target.apiBaseUrl)
    return {
      ok: false as const,
      status: target.kind === "path" ? 503 : 404,
      error:
        target.kind === "path"
          ? ("unavailable" as const)
          : ("not_found" as const),
    }

  const api = createApiRequestFactory({
    baseUrl: target.apiBaseUrl,
    getToken: async () => null,
    public: true,
  })
  const route =
    target.kind === "path" ? "establishment" : "tenant/establishment"
  const response = await api.get(
    `${target.apiPrefix}/${route}?${new URLSearchParams({ locale })}`,
    {
      signal: signal
        ? AbortSignal.any([signal, AbortSignal.timeout(10_000)])
        : AbortSignal.timeout(10_000),
    }
  )

  if (!response.ok) return response

  const data = parsePublicEstablishment(response.data)

  return data
    ? { ok: true as const, status: 200, data }
    : { ok: false as const, status: 502, error: "unavailable" as const }
}
