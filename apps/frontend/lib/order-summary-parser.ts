import type {
  OrderCancellationReason,
  OrderEmailDeliveryStatus,
  OrderEmailEventType,
  OrderEmailNotification,
  OrderSummary,
  OrderSummaryLine,
  OrderSummaryOption,
} from "@/types/orders"
import { parsePickupSnapshot } from "@/lib/order-pickup-snapshot"

const validUuid = /^[0-9a-f]{8}(?:-[0-9a-f]{4}){3}-[0-9a-f]{12}$/i

export function parseOrderSummary(value: unknown): OrderSummary | null {
  if (!isRecord(value)) return null

  const pickupSnapshot = parsePickupSnapshot(value)
  const lines = parseOrderSummaryLines(value.lines)
  const cancellationReason = parseCancellationReason(value.cancellationReason)
  const emailNotifications = parseOrderEmailNotifications(
    value.emailNotifications
  )

  if (
    pickupSnapshot === null ||
    !isUuid(value.id) ||
    typeof value.customerName !== "string" ||
    typeof value.currency !== "string" ||
    !/^[A-Z]{3}$/.test(value.currency) ||
    (value.menuLocale !== null &&
      value.menuLocale !== undefined &&
      typeof value.menuLocale !== "string") ||
    typeof value.total !== "number" ||
    !Number.isFinite(value.total) ||
    value.total < 0 ||
    !isOrderStatus(value.status) ||
    typeof value.version !== "number" ||
    !Number.isSafeInteger(value.version) ||
    value.version < 1 ||
    typeof value.createdAt !== "string" ||
    Number.isNaN(Date.parse(value.createdAt)) ||
    lines === null ||
    cancellationReason === false ||
    (value.status !== "Cancelled" && cancellationReason !== null) ||
    emailNotifications === null
  )
    return null

  return {
    id: value.id,
    customerName: value.customerName,
    currency: value.currency,
    menuLocale: typeof value.menuLocale === "string" ? value.menuLocale : null,
    total: value.total,
    status: value.status,
    cancellationReason,
    emailNotifications,
    version: value.version,
    createdAt: value.createdAt,
    ...pickupSnapshot,
    lines,
  }
}

function parseOrderSummaryLines(value: unknown): OrderSummaryLine[] | null {
  if (!Array.isArray(value)) return null

  const lines: OrderSummaryLine[] = []

  for (const candidate of value) {
    const line = parseOrderSummaryLine(candidate)

    if (line === null) return null
    lines.push(line)
  }

  return lines
}

function parseOrderSummaryLine(value: unknown): OrderSummaryLine | null {
  if (!isRecord(value)) return null

  const preparationNotes = parsePreparationNotes(value.preparationNotes)
  const options = parseOrderSummaryOptions(value.options)

  if (
    !isUuid(value.productId) ||
    typeof value.productName !== "string" ||
    typeof value.quantity !== "number" ||
    !Number.isSafeInteger(value.quantity) ||
    value.quantity < 1 ||
    (value.preparationMinutes !== undefined &&
      value.preparationMinutes !== null &&
      (typeof value.preparationMinutes !== "number" ||
        !Number.isInteger(value.preparationMinutes) ||
        value.preparationMinutes < 1 ||
        value.preparationMinutes > 1440)) ||
    preparationNotes === null ||
    options === null
  )
    return null

  return {
    productId: value.productId,
    productName: value.productName,
    quantity: value.quantity,
    options,
    ...(value.preparationMinutes !== undefined
      ? { preparationMinutes: value.preparationMinutes as number | null }
      : {}),
    preparationNotes,
  }
}

function parseOrderSummaryOptions(value: unknown): OrderSummaryOption[] | null {
  if (!Array.isArray(value)) return null

  const options: OrderSummaryOption[] = []

  for (const option of value) {
    if (
      !isRecord(option) ||
      !isUuid(option.optionId) ||
      typeof option.name !== "string"
    )
      return null
    options.push({ optionId: option.optionId, name: option.name })
  }

  return options
}

function parseCancellationReason(
  value: unknown
): OrderCancellationReason | null | false {
  if (value === undefined || value === null) return null

  return value === "CustomerRequest" ||
    value === "ItemUnavailable" ||
    value === "RestaurantUnableToFulfill" ||
    value === "DuplicateOrder" ||
    value === "Other"
    ? value
    : false
}

function parseOrderEmailNotifications(
  value: unknown
): OrderEmailNotification[] | null {
  if (value === undefined) return []
  if (!Array.isArray(value)) return null

  const notifications: OrderEmailNotification[] = []

  for (const candidate of value) {
    if (
      !isRecord(candidate) ||
      (candidate.eventType !== "order.created" &&
        candidate.eventType !== "order.preparing" &&
        candidate.eventType !== "order.ready") ||
      (candidate.status !== "Pending" &&
        candidate.status !== "Sending" &&
        candidate.status !== "Accepted" &&
        candidate.status !== "Failed") ||
      typeof candidate.createdAt !== "string" ||
      Number.isNaN(Date.parse(candidate.createdAt)) ||
      (candidate.acceptedAt !== null &&
        (typeof candidate.acceptedAt !== "string" ||
          Number.isNaN(Date.parse(candidate.acceptedAt))))
    )
      return null

    notifications.push({
      eventType: candidate.eventType as OrderEmailEventType,
      status: candidate.status as OrderEmailDeliveryStatus,
      createdAt: candidate.createdAt,
      acceptedAt: candidate.acceptedAt as string | null,
    })
  }

  return notifications
}

function parsePreparationNotes(value: unknown): Record<string, string> | null {
  if (value === undefined || value === null) return {}
  if (!isRecord(value)) return null

  const notes: Record<string, string> = {}

  for (const [locale, note] of Object.entries(value)) {
    if (locale.length > 16 || typeof note !== "string" || note.length > 250)
      return null
    notes[locale] = note
  }

  return notes
}

function isOrderStatus(value: unknown): value is OrderSummary["status"] {
  return (
    value === "Pending" ||
    value === "Preparing" ||
    value === "Ready" ||
    value === "Completed" ||
    value === "Cancelled"
  )
}

function isUuid(value: unknown): value is string {
  return typeof value === "string" && validUuid.test(value)
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value)
}
