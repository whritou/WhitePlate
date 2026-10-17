import { getOrganizationAnalytics } from "@/services/analytics"
import { isValidTenantId } from "@/lib/order-dashboard"

const headers = { "Cache-Control": "private, no-store", Vary: "Cookie" }

export const dynamic = "force-dynamic"

function respond(value: unknown, status: number) {
  return Response.json(value, { status, headers })
}

export async function GET(request: Request) {
  const query = new URL(request.url).searchParams
  const restaurant = query.get("restaurant") ?? "all"
  const days = Number(query.get("days") ?? "30")

  if (query.getAll("restaurant").length > 1 || query.getAll("days").length > 1 ||
      !(restaurant === "all" || isValidTenantId(restaurant)) || ![7, 30, 90].includes(days))
    return respond({ ok: false, error: "invalid" }, 400)

  const response = await getOrganizationAnalytics(restaurant, days, request.signal)

  return respond(response, response.status)
}
