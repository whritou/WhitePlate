import { getOrderingOperations } from "@/services/ordering-operations"
import { isValidTenantId } from "@/lib/order-dashboard"
import { getRestaurantMemberships } from "@/services/orders"
import type { RestaurantMembership } from "@/types/orders"

function respond(value: unknown, statusCode: number) {
  return Response.json(value, {
    status: statusCode,
    headers: { "Cache-Control": "private, no-store", Vary: "Cookie" },
  })
}

async function authorizeTenant(
  tenantId: string | null
): Promise<
  | { ok: true; tenantId: string; membership: RestaurantMembership }
  | { ok: false; response: Response }
> {
  if (!isValidTenantId(tenantId))
    return {
      ok: false,
      response: respond({ ok: false, error: "invalid" }, 400),
    }

  const memberships = await getRestaurantMemberships()

  if (!memberships.ok)
    return {
      ok: false,
      response: respond(
        { ok: false, error: memberships.error },
        memberships.status
      ),
    }

  const membership = memberships.data?.find(
    (item) =>
      item.id.toLowerCase() === tenantId.toLowerCase() &&
      item.permissions.includes("orders.manage")
  )

  return membership
    ? { ok: true, tenantId, membership }
    : { ok: false, response: respond({ ok: false, error: "forbidden" }, 403) }
}

export async function GET(request: Request): Promise<Response> {
  const params = new URL(request.url).searchParams
  const tenantId = params.get("tenantId")

  if (params.getAll("tenantId").length !== 1)
    return respond({ ok: false, error: "invalid" }, 400)

  const authorization = await authorizeTenant(tenantId)

  if (!authorization.ok) return authorization.response

  const response = await getOrderingOperations(
    authorization.tenantId,
    request.signal
  )

  return respond(response, response.status)
}
