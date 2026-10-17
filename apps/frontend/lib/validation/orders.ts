import { isRecord, isUuid } from "./common"
import {
  ORDER_CANCELLATION_REASONS,
  type UpdateOrderStatusInput,
} from "@/types/orders"

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

  const isCancellation = value.status === "Cancelled"
  const hasValidReason =
    typeof value.cancellationReason === "string" &&
    ORDER_CANCELLATION_REASONS.includes(
      value.cancellationReason as (typeof ORDER_CANCELLATION_REASONS)[number]
    )

  if (
    (isCancellation && !hasValidReason) ||
    (!isCancellation && value.cancellationReason !== undefined)
  )
    return null

  return {
    tenantId: value.tenantId,
    orderId: value.orderId,
    version: value.version,
    status: value.status as UpdateOrderStatusInput["status"],
    ...(hasValidReason
      ? {
          cancellationReason:
            value.cancellationReason as UpdateOrderStatusInput["cancellationReason"],
        }
      : {}),
  }
}
