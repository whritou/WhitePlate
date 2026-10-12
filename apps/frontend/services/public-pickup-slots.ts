import "server-only"
import { createApiRequestFactory } from "@/lib/api/request-factory"
import { getTenantSlug, getTenantApiBaseUrl } from "@/lib/api/tenant-routing"
import type { PickupAvailability, PickupSlot } from "@/types/checkout"

export async function getPublicPickupSlots(
  host: string | null,
  signal?: AbortSignal
) {
  const slug = getTenantSlug(host, process.env.STOREFRONT_BASE_DOMAIN)
  const baseUrl = slug
    ? getTenantApiBaseUrl(
        slug,
        process.env.PUBLIC_TENANT_API_URL_TEMPLATE,
        process.env.STOREFRONT_BASE_DOMAIN
      )
    : null

  if (!baseUrl)
    return { ok: false as const, status: 404, error: "not_found" as const }

  const api = createApiRequestFactory({
    baseUrl,
    getToken: async () => null,
    public: true,
  })
  const response = await api.get<unknown>("/api/v1/pickup-slots", {
    signal: signal
      ? AbortSignal.any([signal, AbortSignal.timeout(10_000)])
      : AbortSignal.timeout(10_000),
  })

  if (!response.ok) return response
  if (!isAvailability(response.data))
    return { ok: false as const, status: 502, error: "unavailable" as const }

  return { ok: true as const, status: 200, data: response.data }
}

function isAvailability(value: unknown): value is PickupAvailability {
  if (!value || typeof value !== "object") return false

  const availability = value as Record<string, unknown>

  return (
    ["available", "schedule_not_configured", "no_slots_available"].includes(
      String(availability.state)
    ) &&
    (availability.timeZone === null ||
      typeof availability.timeZone === "string") &&
    Array.isArray(availability.slots) &&
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
