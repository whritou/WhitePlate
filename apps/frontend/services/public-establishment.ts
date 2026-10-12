import "server-only"
import { createApiRequestFactory } from "@/lib/api/request-factory"
import { getTenantSlug, getTenantApiBaseUrl } from "@/lib/api/tenant-routing"
import { parsePublicEstablishment } from "@/lib/validation/establishment-settings"

export async function getPublicEstablishment(
  host: string | null,
  locale: string,
  signal?: AbortSignal
) {
  const slug = getTenantSlug(host, process.env.STOREFRONT_BASE_DOMAIN)
  const baseUrl = slug
    ? getTenantApiBaseUrl(
        slug,
        process.env.PUBLIC_TENANT_API_URL_TEMPLATE,
        process.env.STOREFRONT_BASE_DOMAIN
      )
    : null

  if (!baseUrl)
    return { ok: false as const, status: 404, error: "not_found" as const }

  const api = createApiRequestFactory({
    baseUrl,
    getToken: async () => null,
    public: true,
  })
  const response = await api.get(
    `/api/v1/tenant/establishment?${new URLSearchParams({ locale })}`,
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
