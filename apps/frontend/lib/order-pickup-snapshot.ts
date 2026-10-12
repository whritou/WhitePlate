import type { OrderSummary } from "@/types/orders"

export function parsePickupSnapshot(
  value: Record<string, unknown>
): Pick<OrderSummary, "pickupAt" | "pickupTimeZone"> | null {
  if (
    (value.pickupAt !== undefined &&
      value.pickupAt !== null &&
      (typeof value.pickupAt !== "string" ||
        Number.isNaN(Date.parse(value.pickupAt)))) ||
    (value.pickupTimeZone !== undefined &&
      value.pickupTimeZone !== null &&
      typeof value.pickupTimeZone !== "string")
  )
    return null

  return {
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
  }
}
