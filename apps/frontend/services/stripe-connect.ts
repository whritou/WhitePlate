import "server-only"
import { whitePlateApi } from "@/lib/api"
import {
  parseStripeConnectStart,
  parseStripeConnectStatus,
} from "@/lib/validation/stripe-connect"
import type { ApiResult } from "@/types/api"
import type {
  StripeConnectStart,
  StripeConnectStatus,
} from "@/types/stripe-connect"

export async function getStripeConnectStatus(
  tenantId: string
): Promise<ApiResult<StripeConnectStatus>> {
  const response = await whitePlateApi.get<unknown>(
    `/api/v1/tenants/${tenantId}/stripe-connect`,
    { signal: AbortSignal.timeout(10_000) }
  )

  if (!response.ok) return response

  const data = parseStripeConnectStatus(response.data)

  return data
    ? { ok: true, status: 200, data }
    : { ok: false, status: 502, error: "unavailable" }
}

export async function startStripeConnectOAuth(input: {
  tenantId: string
  locale: "en" | "fr"
}): Promise<ApiResult<StripeConnectStart>> {
  const response = await whitePlateApi.post<unknown, { locale: "en" | "fr" }>(
    `/api/v1/tenants/${input.tenantId}/stripe-connect/oauth/start`,
    { locale: input.locale },
    { signal: AbortSignal.timeout(10_000) }
  )

  if (!response.ok) return response

  const data = parseStripeConnectStart(response.data)

  return data
    ? { ok: true, status: 200, data }
    : { ok: false, status: 502, error: "unavailable" }
}
