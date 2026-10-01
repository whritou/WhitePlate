import { isRecord, isUuid } from "./common"
import type { UpdateOrderStatusInput } from "@/types/orders"

export function parseOrderStatusUpdate(
  value: unknown
): UpdateOrderStatusInput | null {
  if (
    !isRecord(value) ||
    !isUuid(value.tenantId) ||
    !isUuid(value.orderId) ||
    typeof value.version !== "number" ||
    !Number.isSafeInteger(value.version) ||
    value.version < 1 ||
    !["Preparing", "Ready", "Completed", "Cancelled"].includes(
      String(value.status)
    ) ||
    typeof value.status !== "string"
  )
    return null

  return {
    tenantId: value.tenantId,
    orderId: value.orderId,
    version: value.version,
    status: value.status as UpdateOrderStatusInput["status"],
  }
}
