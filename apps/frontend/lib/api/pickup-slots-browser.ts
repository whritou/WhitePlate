import { browserRequest } from "./browser-request"
import type { PickupAvailability, PickupSlot } from "@/types/checkout"

export async function loadPublicPickupSlots(signal: AbortSignal) {
  const response = await browserRequest<unknown>("/api/public/pickup-slots", {
    signal,
  })

  if (!response.ok) return { ok: false as const, error: response.error }
  if (!isAvailability(response.data))
    return { ok: false as const, error: "unavailable" as const }

  return { ok: true as const, data: response.data }
}

function isAvailability(value: unknown): value is PickupAvailability {
  if (!value || typeof value !== "object") return false

  const availability = value as Record<string, unknown>

  return (
    [
      "available",
      "schedule_not_configured",
      "no_slots_available",
      "orders_paused",
    ].includes(String(availability.state)) &&
    (availability.timeZone === null ||
      typeof availability.timeZone === "string") &&
    Array.isArray(availability.slots) &&
    (availability.acceptingOrders === undefined ||
      typeof availability.acceptingOrders === "boolean") &&
    (availability.rushHoldEnabled === undefined ||
      typeof availability.rushHoldEnabled === "boolean") &&
    (availability.rushBufferMinutes === undefined ||
      (Number.isInteger(availability.rushBufferMinutes) &&
        Number(availability.rushBufferMinutes) >= 0)) &&
    availability.slots.every(isPickupSlot)
  )
}

function isPickupSlot(value: unknown): value is PickupSlot {
  if (!value || typeof value !== "object") return false

  const slot = value as Record<string, unknown>

  return (
    typeof slot.startsAt === "string" &&
    Number.isFinite(Date.parse(slot.startsAt)) &&
    typeof slot.endsAt === "string" &&
    Number.isFinite(Date.parse(slot.endsAt)) &&
    Number.isInteger(slot.remainingCapacity) &&
    Number(slot.remainingCapacity) >= 0 &&
    typeof slot.timeZone === "string" &&
    slot.timeZone.length > 0
  )
}
