import "server-only"
import { whitePlateApi } from "@/lib/api"
import { parseOrderingOperations } from "@/lib/validation/ordering-operations"
import type { ApiResult } from "@/types/api"
import type {
  OrderingOperations,
  OrderingOperationsUpdate,
} from "@/types/ordering-operations"

export async function getOrderingOperations(
  tenantId: string,
  signal?: AbortSignal
): Promise<ApiResult<OrderingOperations>> {
  const response = await whitePlateApi.get<unknown>(
    `/api/v1/tenants/${tenantId}/ordering-operations`,
    { signal }
  )

  if (!response.ok) return response

  const data = parseOrderingOperations(response.data)

  return data
    ? { ok: true, status: 200, data }
    : { ok: false, status: 502, error: "unavailable" }
}

export async function updateOrderingOperations(
  input: OrderingOperationsUpdate
): Promise<ApiResult<OrderingOperations>> {
  const { tenantId, version, ...body } = input
  const response = await whitePlateApi.put<unknown>(
    `/api/v1/tenants/${tenantId}/ordering-operations`,
    body,
    { ifMatch: `"${version}"` }
  )

  if (!response.ok) return response

  const data = parseOrderingOperations(response.data)

  return data
    ? { ok: true, status: 200, data }
    : { ok: false, status: 502, error: "unavailable" }
}
