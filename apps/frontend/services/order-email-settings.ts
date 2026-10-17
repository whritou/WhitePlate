import "server-only"
import { whitePlateApi } from "@/lib/api"
import { parseOrderEmailSettings } from "@/lib/validation/order-email-settings"
import type { ApiResult } from "@/types/api"
import type {
  OrderEmailLocaleTemplates,
  OrderEmailSettings,
} from "@/types/order-email-settings"

export async function getOrderEmailSettings(
  tenantId: string
): Promise<ApiResult<OrderEmailSettings>> {
  const result = await whitePlateApi.get<unknown>(
    `/api/v1/tenants/${tenantId}/order-email-settings`,
    { signal: AbortSignal.timeout(10_000) }
  )

  if (!result.ok) return result

  const data = parseOrderEmailSettings(result.data)

  return data
    ? { ok: true, status: 200, data }
    : { ok: false, status: 502, error: "unavailable" }
}

export async function saveOrderEmailSettings(input: {
  tenantId: string
  version: number
  templates: OrderEmailLocaleTemplates[]
}): Promise<ApiResult<OrderEmailSettings>> {
  const result = await whitePlateApi.put<unknown>(
    `/api/v1/tenants/${input.tenantId}/order-email-settings`,
    { templates: input.templates },
    { ifMatch: `"${input.version}"`, signal: AbortSignal.timeout(10_000) }
  )

  if (!result.ok) return result

  const data = parseOrderEmailSettings(result.data)

  return data
    ? { ok: true, status: 200, data }
    : { ok: false, status: 502, error: "unavailable" }
}
