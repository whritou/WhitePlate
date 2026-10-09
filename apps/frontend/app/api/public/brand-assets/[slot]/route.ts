import { headers } from "next/headers"
import { createApiRequestFactory } from "@/lib/api/request-factory"
import { getTenantSlug, getTenantApiBaseUrl } from "@/lib/api/tenant-routing"
import { isBrandSlot } from "@/lib/brand-assets"

export async function GET(
  request: Request,
  context: { params: Promise<{ slot: string }> }
) {
  const { slot } = await context.params
  const host = (await headers()).get("host")
  const domain = process.env.STOREFRONT_BASE_DOMAIN
  const slug = getTenantSlug(host, domain)
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
  }

  if (!isBrandSlot(slot) || !baseUrl)
    return new Response(null, { status: 404, headers: responseHeaders })

  const api = createApiRequestFactory({
    baseUrl,
    getToken: async () => null,
    public: true,
  })
  const result = await api.image(`/api/v1/brand-assets/${slot}`, {
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
