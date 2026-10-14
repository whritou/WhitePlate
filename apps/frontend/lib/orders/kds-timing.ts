import type { OrderSummary } from "@/types/orders"
import type { OrderTiming } from "@/types/kds"

const DUE_SOON_SECONDS = 5 * 60
const terminalStatuses = new Set<OrderSummary["status"]>([
  "Completed",
  "Cancelled",
])

export function getOrderTiming(
  order: Pick<OrderSummary, "createdAt" | "pickupAt" | "status">,
  now: number
): OrderTiming {
  const createdAt = Date.parse(order.createdAt)
  const elapsedSeconds = Number.isFinite(createdAt)
    ? Math.max(0, Math.floor((now - createdAt) / 1000))
    : 0
  const pickupAt = order.pickupAt ? Date.parse(order.pickupAt) : Number.NaN

  if (
    terminalStatuses.has(order.status) ||
    !Number.isFinite(pickupAt) ||
    !Number.isFinite(now)
  )
    return { elapsedSeconds, pickupRemainingSeconds: null, urgency: null }

  const pickupRemainingSeconds = Math.ceil((pickupAt - now) / 1000)

  return {
    elapsedSeconds,
    pickupRemainingSeconds,
    urgency:
      pickupRemainingSeconds <= 0
        ? "overdue"
        : pickupRemainingSeconds <= DUE_SOON_SECONDS
          ? "dueSoon"
          : "onTrack",
  }
}

export function formatKdsDuration(seconds: number): string {
  const totalSeconds = Math.floor(Math.abs(seconds))
  const secondsPart = String(totalSeconds % 60).padStart(2, "0")
  const minutes = Math.floor(totalSeconds / 60)

  if (minutes < 60) return `${String(minutes).padStart(2, "0")}:${secondsPart}`

  return `${Math.floor(minutes / 60)}:${String(minutes % 60).padStart(2, "0")}:${secondsPart}`
}

export function createKdsServerClock(
  serverTime: string,
  monotonicNow: () => number
): () => number {
  const serverTimeMs = Date.parse(serverTime)
  const monotonicAnchor = monotonicNow()

  return () => serverTimeMs + Math.max(0, monotonicNow() - monotonicAnchor)
}

export function resolvePreparationNote(
  notes: Record<string, string> | undefined,
  orderLocale: string | null,
  displayLocale: string
): string | null {
  if (!notes) return null

  const candidates = [
    orderLocale,
    orderLocale?.split("-")[0],
    displayLocale,
    displayLocale.split("-")[0],
  ]

  for (const candidate of candidates) {
    if (!candidate) continue

    const match = Object.entries(notes).find(
      ([locale]) => locale.toLowerCase() === candidate.toLowerCase()
    )

    if (match) return match[1]
  }

  return null
}
