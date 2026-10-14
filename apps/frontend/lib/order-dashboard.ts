import type {
  OrderStatus,
  UpdateableOrderStatus,
  OrderSummaryOption,
  OrderSummaryLine,
  OrderSummary,
  OrderPage,
  OrderPickupModeFilter,
  OrderHistoryPage,
  RestaurantMembership,
  RestaurantRole,
} from "@/types/orders"
import { parsePickupSnapshot } from "@/lib/order-pickup-snapshot"

export const ORDER_STATUSES = [
  "Pending",
  "Preparing",
  "Ready",
  "Completed",
  "Cancelled",
] as const

const validUuid = /^[0-9a-f]{8}(?:-[0-9a-f]{4}){3}-[0-9a-f]{12}$/i
const nextStatus: Partial<Record<OrderStatus, UpdateableOrderStatus>> = {
  Pending: "Preparing",
  Preparing: "Ready",
  Ready: "Completed",
}

export { OrderEventTracker } from "@/lib/orders/order-event-tracker"

export function parseOrderPage(value: unknown): OrderPage | null {
  if (
    !isRecord(value) ||
    !Array.isArray(value.items) ||
    !isValidOrderCursor(value.nextCursor, true) ||
    typeof value.serverTime !== "string" ||
    Number.isNaN(Date.parse(value.serverTime))
  )
    return null

  const items: OrderSummary[] = []

  for (const candidate of value.items) {
    const order = parseOrderSummary(candidate)

    if (!order) return null
    items.push(order)
  }

  return { items, nextCursor: value.nextCursor, serverTime: value.serverTime }
}

export function parseOrderHistoryPage(value: unknown): OrderHistoryPage | null {
  if (
    !isRecord(value) ||
    !Array.isArray(value.items) ||
    typeof value.page !== "number" ||
    !Number.isSafeInteger(value.page) ||
    value.page < 1 ||
    typeof value.pageSize !== "number" ||
    !Number.isSafeInteger(value.pageSize) ||
    value.pageSize < 1 ||
    value.pageSize > 100 ||
    typeof value.totalCount !== "number" ||
    !Number.isSafeInteger(value.totalCount) ||
    value.totalCount < 0
  )
    return null

  const items: OrderSummary[] = []

  for (const candidate of value.items) {
    const order = parseOrderSummary(candidate)

    if (!order) return null
    items.push(order)
  }

  return {
    items,
    page: value.page,
    pageSize: value.pageSize,
    totalCount: value.totalCount,
  }
}

export function parseOrderStatusFilter(
  value: unknown
): { ok: true; status: OrderStatus | null } | { ok: false } {
  if (value === undefined || value === "all") return { ok: true, status: null }

  return isOrderStatus(value) ? { ok: true, status: value } : { ok: false }
}

export function parseOrderCursor(
  value: unknown
): { ok: true; cursor: string | null } | { ok: false } {
  if (value === undefined) return { ok: true, cursor: null }
  if (!isValidOrderCursor(value, false)) return { ok: false }

  return { ok: true, cursor: value }
}

export function parseOrderSearch(
  value: unknown
): { ok: true; search: string } | { ok: false } {
  if (value === undefined) return { ok: true, search: "" }
  if (typeof value !== "string" || value.length > 120) return { ok: false }

  return { ok: true, search: value.trim() }
}

export function parseOrderPickupModeFilter(
  value: unknown
): { ok: true; filter: OrderPickupModeFilter } | { ok: false } {
  if (value === undefined || value === "all") return { ok: true, filter: "all" }

  if (value === "asap" || value === "scheduled" || value === "unrecorded")
    return { ok: true, filter: value }

  return { ok: false }
}

export function parseRestaurantMemberships(
  value: unknown
): RestaurantMembership[] | null {
  if (!isRecord(value) || !Array.isArray(value.restaurants)) return null

  const restaurants: RestaurantMembership[] = []

  for (const candidate of value.restaurants) {
    if (
      !isRecord(candidate) ||
      !isUuid(candidate.id) ||
      typeof candidate.name !== "string" ||
      (candidate.organizationId !== undefined &&
        !isUuid(candidate.organizationId)) ||
      (candidate.subdomain !== undefined &&
        (typeof candidate.subdomain !== "string" ||
          !/^[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?$/.test(
            candidate.subdomain
          ))) ||
      !isRestaurantRole(candidate.role)
    )
      return null
    restaurants.push({
      id: candidate.id,
      name: candidate.name,
      role: candidate.role,
      ...(candidate.organizationId
        ? { organizationId: candidate.organizationId as string }
        : {}),
      ...(candidate.subdomain
        ? { subdomain: candidate.subdomain as string }
        : {}),
    })
  }

  return restaurants
}

export function isValidTenantId(value: unknown): value is string {
  return isUuid(value)
}

export function resolveOrderHubUrl(
  configuredApiUrl: string | undefined,
  production: boolean
): string | null {
  if (!configuredApiUrl) return null
  try {
    const url = new URL(configuredApiUrl)

    if (
      (url.protocol !== "https:" && url.protocol !== "http:") ||
      url.username ||
      url.password ||
      (production && url.protocol !== "https:")
    )
      return null
    url.pathname = "/hubs/orders"
    url.search = ""
    url.hash = ""

    return url.toString()
  } catch {
    return null
  }
}

export function getAvailableOrderTransitions(
  role: RestaurantRole,
  status: OrderStatus
): UpdateableOrderStatus[] {
  const result: UpdateableOrderStatus[] = []
  const next = nextStatus[status]

  if (next) result.push(next)
  if (
    (role === "OrganizationOwner" || role === "Manager") &&
    status !== "Completed" &&
    status !== "Cancelled"
  )
    result.push("Cancelled")

  return result
}

export function isOrderStatus(value: unknown): value is OrderStatus {
  return (
    typeof value === "string" && ORDER_STATUSES.includes(value as OrderStatus)
  )
}

function parseOrderSummary(value: unknown): OrderSummary | null {
  if (!isRecord(value)) return null

  const pickupSnapshot = parsePickupSnapshot(value)

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
    !Array.isArray(value.lines)
  )
    return null

  const lines: OrderSummaryLine[] = []

  for (const candidate of value.lines) {
    if (!isRecord(candidate)) return null

    const preparationNotes = parsePreparationNotes(candidate.preparationNotes)

    if (
      !isUuid(candidate.productId) ||
      typeof candidate.productName !== "string" ||
      typeof candidate.quantity !== "number" ||
      !Number.isSafeInteger(candidate.quantity) ||
      candidate.quantity < 1 ||
      (candidate.preparationMinutes !== undefined &&
        candidate.preparationMinutes !== null &&
        (typeof candidate.preparationMinutes !== "number" ||
          !Number.isInteger(candidate.preparationMinutes) ||
          candidate.preparationMinutes < 1 ||
          candidate.preparationMinutes > 1440)) ||
      !Array.isArray(candidate.options) ||
      preparationNotes === null
    )
      return null

    const options: OrderSummaryOption[] = []

    for (const option of candidate.options) {
      if (
        !isRecord(option) ||
        !isUuid(option.optionId) ||
        typeof option.name !== "string"
      )
        return null
      options.push({ optionId: option.optionId, name: option.name })
    }

    lines.push({
      productId: candidate.productId,
      productName: candidate.productName,
      quantity: candidate.quantity,
      options,
      ...(candidate.preparationMinutes !== undefined
        ? { preparationMinutes: candidate.preparationMinutes as number | null }
        : {}),
      preparationNotes,
    })
  }

  return {
    id: value.id,
    customerName: value.customerName,
    currency: value.currency,
    menuLocale: typeof value.menuLocale === "string" ? value.menuLocale : null,
    total: value.total,
    status: value.status,
    version: value.version,
    createdAt: value.createdAt,
    ...pickupSnapshot,
    lines,
  }
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

function isUuid(value: unknown): value is string {
  return typeof value === "string" && validUuid.test(value)
}

function isValidOrderCursor(
  value: unknown,
  allowNull: boolean
): value is string | null {
  if (allowNull && value === null) return true

  return (
    typeof value === "string" &&
    value.length > 0 &&
    value.length <= 128 &&
    /^[A-Za-z0-9_-]+$/.test(value)
  )
}

function isRestaurantRole(value: unknown): value is RestaurantRole {
  return (
    value === "OrganizationOwner" || value === "Manager" || value === "Kitchen"
  )
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value)
}
