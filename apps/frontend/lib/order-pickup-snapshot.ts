import type { OrderPickupMode, OrderSummary } from "@/types/orders"

export function parsePickupSnapshot(
  value: Record<string, unknown>
): Pick<OrderSummary, "pickupAt" | "pickupTimeZone" | "pickupMode"> | null {
  const pickupMode = value.pickupMode

  if (
    (value.pickupAt !== undefined &&
      value.pickupAt !== null &&
      (typeof value.pickupAt !== "string" ||
        Number.isNaN(Date.parse(value.pickupAt)))) ||
    (value.pickupTimeZone !== undefined &&
      value.pickupTimeZone !== null &&
      typeof value.pickupTimeZone !== "string") ||
    (pickupMode !== undefined &&
      pickupMode !== null &&
      pickupMode !== "Asap" &&
      pickupMode !== "Scheduled")
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
    pickupMode: (pickupMode as OrderPickupMode | null | undefined) ?? null,
  }
}
