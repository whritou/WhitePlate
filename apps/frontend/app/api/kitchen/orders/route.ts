import { getOrderPage, getRestaurantMemberships } from "@/services/orders"
import {
  isValidTenantId,
  parseOrderCursor,
  parseOrderStatusFilter,
} from "@/lib/order-dashboard"

export async function GET(request: Request) {
  const params = new URL(request.url).searchParams
  const tenantId = params.get("tenantId")
  const status = parseOrderStatusFilter(params.get("status") ?? undefined)
  const cursor = parseOrderCursor(params.get("cursor") ?? undefined)
  const respond = (value: unknown, statusCode: number) =>
    Response.json(value, {
      status: statusCode,
      headers: { "Cache-Control": "private, no-store", Vary: "Cookie" },
    })
  if (
    !isValidTenantId(tenantId) ||
    !status.ok ||
    !cursor.ok ||
    ["tenantId", "status", "cursor"].some(
      (key) => params.getAll(key).length > 1
    )
  ) {
    return respond({ ok: false, error: "invalid" }, 400)
  }

  const memberships = await getRestaurantMemberships()
  if (!memberships.ok)
    return respond({ ok: false, error: memberships.error }, memberships.status)
  if (
    !memberships.data?.some(
      (item) => item.id.toLowerCase() === tenantId.toLowerCase()
    )
  ) {
    return respond({ ok: false, error: "forbidden" }, 403)
  }

  const response = await getOrderPage(
    tenantId,
    status.status,
    cursor.cursor,
    request.signal
  )
  return respond(response, response.status)
}
