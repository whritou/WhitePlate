import { isRecord } from "./common"
import { isUuid } from "@/lib/checkout/cart"
import type { PublicOrderTracking } from "@/types/checkout"

const statuses = new Set([
  "Pending",
  "Preparing",
  "Ready",
  "Completed",
  "Cancelled",
])

export function parsePublicOrderTracking(
  value: unknown,
  orderId: string
): PublicOrderTracking | null {
  if (
    !isRecord(value) ||
    !isUuid(value.id) ||
    value.id !== orderId ||
    typeof value.status !== "string" ||
    !statuses.has(value.status) ||
    !Number.isInteger(value.version) ||
    Number(value.version) < 1 ||
    typeof value.createdAt !== "string" ||
    !Number.isFinite(Date.parse(value.createdAt))
  )
    return null

  return {
    id: value.id,
    status: value.status as PublicOrderTracking["status"],
    version: value.version as number,
    createdAt: value.createdAt,
  }
}
