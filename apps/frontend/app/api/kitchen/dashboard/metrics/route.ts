import { getDashboardMetrics, getRestaurantMemberships } from "@/services/orders"
import { isValidTenantId } from "@/lib/order-dashboard"

export async function GET(request: Request) {
  const params = new URL(request.url).searchParams
  const tenantId = params.get("tenantId")
  const respond = (value: unknown, statusCode: number) =>
    Response.json(value, {
      status: statusCode,
      headers: { "Cache-Control": "private, no-store", Vary: "Cookie" },
    })

  if (!isValidTenantId(tenantId) || params.getAll("tenantId").length !== 1)
    return respond({ ok: false, error: "invalid" }, 400)

  const memberships = await getRestaurantMemberships()

  if (!memberships.ok)
    return respond({ ok: false, error: memberships.error }, memberships.status)
  if (
    !memberships.data?.some(
      (item) => item.id.toLowerCase() === tenantId.toLowerCase()
    )
  )
    return respond({ ok: false, error: "forbidden" }, 403)

  const response = await getDashboardMetrics(tenantId, request.signal)

  return respond(response, response.status)
}
