import { headers } from "next/headers"
import { createApiRequestFactory } from "@/lib/api/request-factory"
import {
  createPublicStorefrontApiTarget,
  getRestaurantSlugSelector,
} from "@/lib/storefront-preview-routing"
import { isUuid } from "@/lib/validation/common"

export async function GET(
  request: Request,
  context: {
    params: Promise<{ productId: string; assetId: string; size: string }>
  }
) {
  const { productId, assetId, size } = await context.params
  const selector = getRestaurantSlugSelector(request.url)
  const target =
    selector === null
      ? null
      : createPublicStorefrontApiTarget(
          (await headers()).get("host"),
          selector,
          {
            baseDomain: process.env.STOREFRONT_BASE_DOMAIN,
            apiTemplate: process.env.PUBLIC_TENANT_API_URL_TEMPLATE,
            pathBaseDomain: process.env.STOREFRONT_PATH_BASE_DOMAIN,
            centralApiUrl: process.env.API_BASE_URL,
          }
        )
  const responseHeaders = {
    "Cache-Control": "no-store",
    "X-Content-Type-Options": "nosniff",
    Vary: "Host",
  }

  if (
    !isUuid(productId) ||
    !isUuid(assetId) ||
    !["320", "640", "1200"].includes(size) ||
    !target
  )
    return new Response(null, { status: 404, headers: responseHeaders })
  if (!target.apiBaseUrl)
    return new Response(null, {
      status: target.kind === "path" ? 503 : 404,
      headers: responseHeaders,
    })

  const api = createApiRequestFactory({
    baseUrl: target.apiBaseUrl,
    getToken: async () => null,
    public: true,
  })
  const result = await api.image(
    `${target.apiPrefix}/products/${productId}/photos/${assetId}/${size}`,
    { signal: request.signal }
  )

  return result.ok && result.data
    ? new Response(result.data, {
        headers: { ...responseHeaders, "Content-Type": result.data.type },
      })
    : new Response(null, { status: result.status, headers: responseHeaders })
}
