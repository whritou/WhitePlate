import "server-only"
import {
  parseAnalyticsMetrics,
  aggregateAnalytics,
} from "@/lib/analytics-metrics"
import { whitePlateApi } from "@/lib/api"
import { getRestaurantMemberships } from "@/services/orders"
import type { AnalyticsMetrics } from "@/types/analytics"
import type { ApiResult } from "@/types/api"

const tenantIdPattern = /^[0-9a-f]{8}(?:-[0-9a-f]{4}){3}-[0-9a-f]{12}$/i

export async function getTenantAnalytics(
  tenantId: string,
  days: number,
  signal?: AbortSignal
): Promise<ApiResult<AnalyticsMetrics>> {
  const response = await whitePlateApi.get<unknown>(
    `/api/v1/tenants/${tenantId}/analytics?days=${days}`,
    { signal }
  )

  if (!response.ok) return response

  const data = parseAnalyticsMetrics(response.data)

  return data
    ? { ok: true, status: 200, data }
    : { ok: false, status: 502, error: "unavailable" }
}

export async function getOrganizationAnalytics(
  restaurant: string,
  days: number,
  signal?: AbortSignal
): Promise<ApiResult<AnalyticsMetrics>> {
  if (!([7, 30, 90] as const).includes(days as 7 | 30 | 90))
    return { ok: false, status: 400, error: "invalid" }

  const membershipResult = await getRestaurantMemberships()

  if (!membershipResult.ok) return membershipResult
  if (!membershipResult.data)
    return { ok: false, status: 502, error: "unavailable" }

  const memberships = membershipResult.data.filter(
    (item) => item.role === "OrganizationOwner" || item.role === "Manager"
  )
  const selected =
    restaurant === "all"
      ? memberships
      : tenantIdPattern.test(restaurant)
        ? memberships.filter(
            (item) => item.id.toLowerCase() === restaurant.toLowerCase()
          )
        : []

  if (selected.length === 0)
    return { ok: false, status: 403, error: "forbidden" }

  const results = await Promise.all(
    selected.map((item) => getTenantAnalytics(item.id, days, signal))
  )
  const metrics: AnalyticsMetrics[] = []

  for (const result of results) {
    if (!result.ok) return result
    if (!result.data) return { ok: false, status: 502, error: "unavailable" }
    metrics.push(result.data)
  }

  const data = aggregateAnalytics(metrics)

  return data
    ? { ok: true, status: 200, data }
    : { ok: false, status: 502, error: "unavailable" }
}
