import { createApiRequestFactory } from "@/lib/api/request-factory"
import {
  createPublicStorefrontApiTarget,
  getRestaurantSlugSelector,
} from "@/lib/storefront-preview-routing"
import { isUuid } from "@/lib/checkout/cart"
import { parsePublicOrderTracking } from "@/lib/validation/public-order-tracking"

const noStoreHeaders = {
  "Cache-Control": "no-store",
  Pragma: "no-cache",
  Vary: "Origin",
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ orderId: string }> }
): Promise<Response> {
  if (!hasSameOrigin(request))
    return Response.json(
      { error: "forbidden" },
      { status: 403, headers: noStoreHeaders }
    )

  const { orderId } = await params

  if (!isUuid(orderId))
    return Response.json(
      { error: "not_found" },
      { status: 404, headers: noStoreHeaders }
    )

  let body: unknown

  try {
    body = await request.json()
  } catch {
    return Response.json(
      { error: "invalid" },
      { status: 400, headers: noStoreHeaders }
    )
  }

  if (
    !body ||
    typeof body !== "object" ||
    !("token" in body) ||
    typeof body.token !== "string" ||
    !/^[A-Za-z0-9_-]{43}$/.test(body.token)
  )
    return Response.json(
      { error: "invalid" },
      { status: 400, headers: noStoreHeaders }
    )

  const restaurantSlug = getRestaurantSlugSelector(request.url)

  if (restaurantSlug === null)
    return Response.json(
      { error: "invalid" },
      { status: 400, headers: noStoreHeaders }
    )

  const target = createPublicStorefrontApiTarget(
    request.headers.get("host"),
    restaurantSlug,
    {
      baseDomain: process.env.STOREFRONT_BASE_DOMAIN,
      apiTemplate: process.env.PUBLIC_TENANT_API_URL_TEMPLATE,
      pathBaseDomain: process.env.STOREFRONT_PATH_BASE_DOMAIN,
      centralApiUrl: process.env.API_BASE_URL,
    }
  )

  if (!target)
    return Response.json(
      { error: "not_found" },
      { status: 404, headers: noStoreHeaders }
    )

  if (!target.apiBaseUrl)
    return Response.json(
      { error: "unavailable" },
      { status: 503, headers: noStoreHeaders }
    )

  const api = createApiRequestFactory({
    baseUrl: target.apiBaseUrl,
    public: true,
    getToken: async () => null,
  })
  const result = await api.post<unknown>(
    `${target.apiPrefix}/orders/${orderId}/tracking`,
    { token: body.token },
    { signal: AbortSignal.timeout(10_000) }
  )

  if (!result.ok) {
    const status =
      result.status === 404
        ? 404
        : result.status >= 400 && result.status < 500
          ? 400
          : 503
    const error =
      status === 404 ? "not_found" : status === 400 ? "invalid" : "unavailable"

    return Response.json({ error }, { status, headers: noStoreHeaders })
  }

  const tracking = parsePublicOrderTracking(result.data, orderId)

  if (!tracking)
    return Response.json(
      { error: "unavailable" },
      { status: 503, headers: noStoreHeaders }
    )

  return Response.json(tracking, { headers: noStoreHeaders })
}

function hasSameOrigin(request: Request): boolean {
  const origin = request.headers.get("origin")
  const host = request.headers.get("host")

  try {
    const url = new URL(origin ?? "")

    return Boolean(host && origin === url.origin && url.host === host)
  } catch {
    return false
  }
}
