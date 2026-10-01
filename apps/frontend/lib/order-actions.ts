"use server"

import { whitePlateApi } from "@/lib/api"

type UpdateableOrderStatus = "Preparing" | "Ready" | "Completed" | "Cancelled"
type OrderActionError = "unauthorized" | "forbidden" | "invalid" | "conflict" | "unavailable"
type UpdateOrderStatusResult = { ok: true } | { ok: false; error: OrderActionError }

const validUuid = /^[0-9a-f]{8}(?:-[0-9a-f]{4}){3}-[0-9a-f]{12}$/i

export async function updateOrderStatusAction(input: unknown): Promise<UpdateOrderStatusResult> {
  if (!input || typeof input !== "object" || Array.isArray(input))
    return { ok: false, error: "invalid" }

  const value = input as Record<string, unknown>
  if (typeof value.tenantId !== "string" || !validUuid.test(value.tenantId) ||
    typeof value.orderId !== "string" || !validUuid.test(value.orderId) ||
    typeof value.version !== "number" || !Number.isSafeInteger(value.version) || value.version < 1 ||
    !isUpdateableOrderStatus(value.status)) return { ok: false, error: "invalid" }

  const response = await whitePlateApi.patch<void, { status: UpdateableOrderStatus }>(
    `/api/v1/tenants/${value.tenantId}/orders/${value.orderId}/status`,
    { status: value.status },
    { ifMatch: `"${value.version}"` },
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

function isUpdateableOrderStatus(value: unknown): value is UpdateableOrderStatus {
  return value === "Preparing" || value === "Ready" || value === "Completed" || value === "Cancelled"
}
