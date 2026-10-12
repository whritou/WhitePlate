import { isUuid } from "@/lib/validation/common"
import { getEstablishmentSettings } from "@/services/establishment-settings"

export async function GET(request: Request) {
  const query = new URL(request.url).searchParams
  const tenantId = query.get("tenantId")
  const result =
    isUuid(tenantId) && query.getAll("tenantId").length === 1
      ? await getEstablishmentSettings(tenantId, request.signal)
      : { ok: false, status: 400, error: "invalid" }

  return Response.json(result.ok && "data" in result ? result.data : result, {
    status: result.status,
    headers: { "Cache-Control": "private, no-store", Vary: "Cookie" },
  })
}
