import { getPublicPickupSlots } from "@/services/public-pickup-slots"
import { getRestaurantSlugSelector } from "@/lib/storefront-preview-routing"

export async function GET(request: Request) {
  const restaurantSlug = getRestaurantSlugSelector(request.url)
  const result =
    restaurantSlug === null
      ? { ok: false as const, status: 400, error: "invalid" as const }
      : await getPublicPickupSlots(
          request.headers.get("host"),
          request.signal,
          restaurantSlug
        )

  return Response.json(result.ok && "data" in result ? result.data : result, {
    status: result.status,
    headers: { "Cache-Control": "no-store", Vary: "Host" },
  })
}
