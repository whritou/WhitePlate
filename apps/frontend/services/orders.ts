import "server-only"
import {
  parseOrderPage,
  parseOrderHistoryPage,
  parseRestaurantMemberships,
} from "@/lib/order-dashboard"
import { whitePlateApi } from "@/lib/api"
import type { ApiResult } from "@/types/api"
import type {
  OrderPage,
  OrderHistoryPage,
  OrderHistoryFilters,
  OrderStatus,
  RestaurantMembership,
  UpdateOrderStatusInput,
  UpdateOrderStatusResult,
} from "@/types/orders"

export async function getRestaurantMemberships(): Promise<
  ApiResult<RestaurantMembership[]>
> {
  const response = await whitePlateApi.get<unknown>("/api/v1/me")

  if (!response.ok) return response

  const data = parseRestaurantMemberships(response.data)

  return data
    ? { ok: true, status: 200, data }
    : { ok: false, status: 502, error: "unavailable" }
}

export async function getOrderPage(
  tenantId: string,
  status: OrderStatus | null,
  cursor: string | null,
  signal?: AbortSignal
): Promise<ApiResult<OrderPage>> {
  const query = new URLSearchParams({ pageSize: "50" })

  if (status) query.set("status", status)
  if (cursor) query.set("cursor", cursor)

  const response = await whitePlateApi.get<unknown>(
    `/api/v1/tenants/${tenantId}/orders?${query}`,
    { signal }
  )

  if (!response.ok) return response

  const data = parseOrderPage(response.data)

  return data
    ? { ok: true, status: 200, data }
    : { ok: false, status: 502, error: "unavailable" }
}

export async function getOrderHistory(
  filters: OrderHistoryFilters
): Promise<ApiResult<OrderHistoryPage>> {
  const query = new URLSearchParams({
    sort: filters.sort,
    direction: filters.direction,
    page: String(filters.page),
    pageSize: String(filters.pageSize),
  })

  if (filters.status) query.set("status", filters.status)
  if (filters.search) query.set("search", filters.search)
  if (filters.from) query.set("from", filters.from)
  if (filters.through) query.set("through", filters.through)

  const response = await whitePlateApi.get<unknown>(
    `/api/v1/tenants/${filters.tenantId}/orders/history?${query}`
  )

  if (!response.ok) return response

  const data = parseOrderHistoryPage(response.data)

  return data
    ? { ok: true, status: 200, data }
    : { ok: false, status: 502, error: "unavailable" }
}

export async function updateOrderStatus(
  input: UpdateOrderStatusInput
): Promise<UpdateOrderStatusResult> {
  const { tenantId, orderId, version, status } = input
  const response = await whitePlateApi.patch<void>(
    `/api/v1/tenants/${tenantId}/orders/${orderId}/status`,
    { status },
    { ifMatch: `"${version}"` }
  )

  if (response.ok) return { ok: true }
  if (response.status === 401) return { ok: false, error: "unauthorized" }
  if (response.status === 403) return { ok: false, error: "forbidden" }
  if (response.status === 400 || response.status === 422)
    return { ok: false, error: "invalid" }
  if (response.status === 409 || response.status === 412)
    return { ok: false, error: "conflict" }

  return { ok: false, error: "unavailable" }
}
