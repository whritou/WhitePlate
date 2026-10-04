import "server-only"
import { whitePlateApi } from "@/lib/api"
import { parseRestaurants } from "@/lib/validation/responses"
import type { RestaurantInput, RestaurantResult } from "@/types/restaurant"

export async function createRestaurant({
  organizationId,
  name,
  subdomain,
  currency,
}: RestaurantInput): Promise<RestaurantResult> {
  const response = await whitePlateApi.post<unknown>(
    `/api/v1/organizations/${organizationId}/restaurants`,
    { name, subdomain, currency }
  )

  if (!response.ok) {
    const message =
      response.error === "not_found"
        ? "forbidden"
        : response.error === "unauthorized" ||
            response.error === "forbidden" ||
            response.error === "conflict" ||
            response.error === "invalid"
          ? response.error
          : "unavailable"

    return { ok: false, message }
  }

  const restaurant = parseRestaurants([response.data])?.[0]

  return restaurant
    ? { ok: true, restaurant }
    : { ok: false, message: "unavailable" }
}
