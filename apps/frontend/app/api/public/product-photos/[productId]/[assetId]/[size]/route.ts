import { headers } from "next/headers"
import { createApiRequestFactory } from "@/lib/api/request-factory"
import { getTenantSlug, getTenantApiBaseUrl } from "@/lib/api/tenant-routing"
import { isUuid } from "@/lib/validation/common"

export async function GET(
  request: Request,
  context: {
    params: Promise<{ productId: string; assetId: string; size: string }>
  }
) {
  const { productId, assetId, size } = await context.params
  const domain = process.env.STOREFRONT_BASE_DOMAIN
  const slug = getTenantSlug((await headers()).get("host"), domain)
  const baseUrl = slug
    ? getTenantApiBaseUrl(
        slug,
        process.env.PUBLIC_TENANT_API_URL_TEMPLATE,
        domain
      )
    : undefined
  const responseHeaders = {
    "Cache-Control": "no-store",
    "X-Content-Type-Options": "nosniff",
    Vary: "Host",
  }

  if (
    !isUuid(productId) ||
    !isUuid(assetId) ||
    !["320", "640", "1200"].includes(size) ||
    !baseUrl
  )
    return new Response(null, { status: 404, headers: responseHeaders })

  const api = createApiRequestFactory({
    baseUrl,
    getToken: async () => null,
    public: true,
  })
  const result = await api.image(
    `/api/v1/products/${productId}/photos/${assetId}/${size}`,
    { signal: request.signal }
  )

  return result.ok && result.data
    ? new Response(result.data, {
        headers: { ...responseHeaders, "Content-Type": result.data.type },
      })
    : new Response(null, { status: result.status, headers: responseHeaders })
}
