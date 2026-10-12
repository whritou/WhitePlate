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
    !Number.isFinite(Date.parse(value.createdAt)) ||
    (value.pickupAt !== undefined &&
      value.pickupAt !== null &&
      (typeof value.pickupAt !== "string" ||
        !Number.isFinite(Date.parse(value.pickupAt))))
  )
    return null

  return {
    id: value.id,
    status: value.status as PublicOrderTracking["status"],
    version: value.version as number,
    createdAt: value.createdAt,
    ...(value.pickupAt !== undefined
      ? { pickupAt: typeof value.pickupAt === "string" ? value.pickupAt : null }
      : {}),
    ...(value.pickupTimeZone !== undefined
      ? {
          pickupTimeZone:
            typeof value.pickupTimeZone === "string"
              ? value.pickupTimeZone
              : null,
        }
      : {}),
    ...(value.menuLocale === null ||
    (typeof value.menuLocale === "string" && value.menuLocale.length <= 128)
      ? { menuLocale: value.menuLocale }
      : {}),
  }
}
