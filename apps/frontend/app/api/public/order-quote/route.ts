import { getRestaurantSlugSelector } from "@/lib/storefront-preview-routing"
import { getOrderQuote } from "@/services/order-quote"
import type { OrderQuoteInput } from "@/types/checkout"

export async function POST(request: Request) {
  const headers = { "Cache-Control": "no-store", Vary: "Host" }
  const origin = request.headers.get("origin")

  if (origin && origin !== new URL(request.url).origin)
    return Response.json({ error: "forbidden" }, { status: 403, headers })

  try {
    const body = await request.text()

    if (body.length > 16_384)
      return Response.json({ error: "invalid" }, { status: 413, headers })

    const restaurantSlug = getRestaurantSlugSelector(request.url)

    if (restaurantSlug === null)
      return Response.json({ error: "invalid" }, { status: 400, headers })

    const input = JSON.parse(body) as OrderQuoteInput
    const result = await getOrderQuote(
      request.headers.get("host"),
      input,
      request.signal,
      restaurantSlug
    )

    return Response.json(result.ok ? result.data : result, {
      status: result.status,
      headers,
    })
  } catch {
    return Response.json({ error: "invalid" }, { status: 400, headers })
  }
}
