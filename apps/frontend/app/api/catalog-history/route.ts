import { getCatalogHistory } from "@/services/catalog-management"
import { getRestaurantMemberships } from "@/services/orders"
import { isUuid } from "@/lib/validation/common"

export async function GET(request: Request) {
  const query = new URL(request.url).searchParams
  const tenantId = query.get("tenantId")
  const beforeValue = query.get("beforeVersion")
  const pageSizeValue = query.get("pageSize") ?? "25"
  const beforeVersion = beforeValue === null ? null : Number(beforeValue)
  const pageSize = Number(pageSizeValue)
  const respond = (value: unknown, status: number) =>
    Response.json(value, {
      status,
      headers: { "Cache-Control": "private, no-store", Vary: "Cookie" },
    })

  if (
    !isUuid(tenantId) ||
    query.getAll("tenantId").length !== 1 ||
    query.getAll("beforeVersion").length > 1 ||
    query.getAll("pageSize").length > 1 ||
    (beforeValue !== null &&
      (!Number.isSafeInteger(beforeVersion) || beforeVersion! < 1)) ||
    !Number.isSafeInteger(pageSize) ||
    pageSize < 1 ||
    pageSize > 100
  )
    return respond({ ok: false, error: "invalid" }, 400)

  const memberships = await getRestaurantMemberships()

  if (!memberships.ok) return respond(memberships, memberships.status)
  if (
    !memberships.data?.some(
      (item) =>
        item.id.toLowerCase() === tenantId.toLowerCase() &&
        (item.role === "OrganizationOwner" || item.role === "Manager")
    )
  )
    return respond({ ok: false, error: "forbidden" }, 403)

  const result = await getCatalogHistory(
    tenantId,
    beforeVersion,
    pageSize,
    request.signal
  )

  return respond(result, result.status)
}
