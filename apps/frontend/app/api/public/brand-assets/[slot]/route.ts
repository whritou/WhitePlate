import { createApiRequestFactory } from "@/lib/api/request-factory"
import {
  createPublicStorefrontApiTarget,
  getRestaurantSlugSelector,
} from "@/lib/storefront-preview-routing"
import { isBrandSlot } from "@/lib/brand-assets"

export async function GET(
  request: Request,
  context: { params: Promise<{ slot: string }> }
) {
  const { slot } = await context.params
  const host = request.headers.get("host")
  const selector = getRestaurantSlugSelector(request.url)
  const target =
    selector === null
      ? null
      : createPublicStorefrontApiTarget(host, selector, {
          baseDomain: process.env.STOREFRONT_BASE_DOMAIN,
          apiTemplate: process.env.PUBLIC_TENANT_API_URL_TEMPLATE,
          pathBaseDomain: process.env.STOREFRONT_PATH_BASE_DOMAIN,
          centralApiUrl: process.env.API_BASE_URL,
        })
  const responseHeaders = {
    "Cache-Control": "no-store",
    "X-Content-Type-Options": "nosniff",
    Vary: "Host",
  }

  if (!isBrandSlot(slot) || !target)
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
  const result = await api.image(`${target.apiPrefix}/brand-assets/${slot}`, {
    signal: request.signal,
  })

  if (slot === "favicon" && !result.ok && result.status === 404)
    return new Response(null, {
      status: 307,
      headers: { ...responseHeaders, Location: "/favicon.ico" },
    })

  return result.ok && result.data
    ? new Response(result.data, {
        headers: { ...responseHeaders, "Content-Type": result.data.type },
      })
    : new Response(null, { status: result.status, headers: responseHeaders })
}
