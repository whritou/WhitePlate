export const ORDER_STATUSES = [
  "Pending",
  "Preparing",
  "Ready",
  "Completed",
  "Cancelled",
] as const

export type OrderStatus = (typeof ORDER_STATUSES)[number]
export type UpdateableOrderStatus = Exclude<OrderStatus, "Pending">

export type OrderSummaryOption = { optionId: string; name: string }
export type OrderSummaryLine = {
  productId: string
  productName: string
  quantity: number
  options: OrderSummaryOption[]
}
export type OrderSummary = {
  id: string
  customerName: string
  currency: string
  total: number
  status: OrderStatus
  version: number
  createdAt: string
  lines: OrderSummaryLine[]
}
export type OrderPage = { items: OrderSummary[]; nextCursor: string | null }
export type RestaurantMembership = {
  id: string
  name: string
  role: "OrganizationOwner" | "Manager" | "Kitchen"
}

const validUuid = /^[0-9a-f]{8}(?:-[0-9a-f]{4}){3}-[0-9a-f]{12}$/i
const nextStatus: Partial<Record<OrderStatus, UpdateableOrderStatus>> = {
  Pending: "Preparing",
  Preparing: "Ready",
  Ready: "Completed",
}
const eventTypes = new Set([
  "order.created",
  "order.status_changed",
  "order.cancelled",
])

export function parseOrderPage(value: unknown): OrderPage | null {
  if (!isRecord(value) || !Array.isArray(value.items) ||
    !isValidOrderCursor(value.nextCursor, true)) return null

  const items: OrderSummary[] = []
  for (const candidate of value.items) {
    const order = parseOrderSummary(candidate)
    if (!order) return null
    items.push(order)
  }
  return { items, nextCursor: value.nextCursor }
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

export function parseRestaurantMemberships(value: unknown): RestaurantMembership[] | null {
  if (!isRecord(value) || !Array.isArray(value.restaurants)) return null
  const restaurants: RestaurantMembership[] = []
  for (const candidate of value.restaurants) {
    if (!isRecord(candidate) || !isUuid(candidate.id) || typeof candidate.name !== "string" ||
      !isRestaurantRole(candidate.role)) return null
    restaurants.push({ id: candidate.id, name: candidate.name, role: candidate.role })
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
    if ((url.protocol !== "https:" && url.protocol !== "http:") || url.username || url.password ||
      (production && url.protocol !== "https:")) return null
    url.pathname = "/hubs/orders"
    url.search = ""
    url.hash = ""
    return url.toString()
  } catch {
    return null
  }
}

export function getAvailableOrderTransitions(
  role: string,
  status: OrderStatus
): UpdateableOrderStatus[] {
  const result: UpdateableOrderStatus[] = []
  const next = nextStatus[status]
  if (next) result.push(next)
  if ((role === "OrganizationOwner" || role === "Manager") &&
    status !== "Completed" && status !== "Cancelled") result.push("Cancelled")
  return result
}

export class OrderEventTracker {
  private readonly eventIds = new Set<string>()
  private readonly versions = new Map<string, number>()

  constructor(
    private readonly tenantId: string,
    orders: Array<Pick<OrderSummary, "id" | "version">> = []
  ) {
    this.observeOrders(orders)
  }

  observeOrders(orders: Array<Pick<OrderSummary, "id" | "version">>): void {
    for (const order of orders) {
      const current = this.versions.get(order.id)
      if (current === undefined || order.version > current)
        this.versions.set(order.id, order.version)
    }
    this.trim(this.versions, 512)
  }

  shouldRefresh(value: unknown): boolean {
    const event = parseKitchenOrderEvent(value)
    if (!event || event.tenantId !== this.tenantId || this.eventIds.has(event.eventId))
      return false

    this.eventIds.add(event.eventId)
    this.trim(this.eventIds, 512)

    const currentVersion = this.versions.get(event.orderId)
    if (currentVersion !== undefined && event.version <= currentVersion) return false
    this.versions.set(event.orderId, event.version)
    this.trim(this.versions, 512)
    return true
  }

  private trim<T>(values: Set<T> | Map<T, unknown>, limit: number): void {
    while (values.size > limit) {
      const oldest = values.values().next().value as T | undefined
      if (oldest === undefined) return
      values.delete(oldest)
    }
  }
}

export function isOrderStatus(value: unknown): value is OrderStatus {
  return typeof value === "string" && ORDER_STATUSES.includes(value as OrderStatus)
}

function parseOrderSummary(value: unknown): OrderSummary | null {
  if (!isRecord(value) || !isUuid(value.id) || typeof value.customerName !== "string" ||
    typeof value.currency !== "string" || !/^[A-Z]{3}$/.test(value.currency) ||
    typeof value.total !== "number" || !Number.isFinite(value.total) || value.total < 0 ||
    !isOrderStatus(value.status) || typeof value.version !== "number" ||
    !Number.isSafeInteger(value.version) || value.version < 1 ||
    typeof value.createdAt !== "string" || Number.isNaN(Date.parse(value.createdAt)) ||
    !Array.isArray(value.lines)) return null

  const lines: OrderSummaryLine[] = []
  for (const candidate of value.lines) {
    if (!isRecord(candidate) || !isUuid(candidate.productId) ||
      typeof candidate.productName !== "string" || typeof candidate.quantity !== "number" ||
      !Number.isSafeInteger(candidate.quantity) || candidate.quantity < 1 ||
      !Array.isArray(candidate.options)) return null

    const options: OrderSummaryOption[] = []
    for (const option of candidate.options) {
      if (!isRecord(option) || !isUuid(option.optionId) || typeof option.name !== "string")
        return null
      options.push({ optionId: option.optionId, name: option.name })
    }
    lines.push({
      productId: candidate.productId,
      productName: candidate.productName,
      quantity: candidate.quantity,
      options,
    })
  }

  return {
    id: value.id,
    customerName: value.customerName,
    currency: value.currency,
    total: value.total,
    status: value.status,
    version: value.version,
    createdAt: value.createdAt,
    lines,
  }
}

function parseKitchenOrderEvent(value: unknown): {
  eventId: string
  tenantId: string
  orderId: string
  version: number
} | null {
  if (!isRecord(value) || !isUuid(value.eventId) || typeof value.tenantId !== "string" ||
    !isUuid(value.orderId) || typeof value.eventType !== "string" || !eventTypes.has(value.eventType) ||
    !isOrderStatus(value.status) || typeof value.version !== "number" ||
    !Number.isSafeInteger(value.version) || value.version < 1 ||
    typeof value.occurredAt !== "string" || Number.isNaN(Date.parse(value.occurredAt))) return null

  return {
    eventId: value.eventId,
    tenantId: value.tenantId,
    orderId: value.orderId,
    version: value.version,
  }
}

function isUuid(value: unknown): value is string {
  return typeof value === "string" && validUuid.test(value)
}

function isValidOrderCursor(value: unknown, allowNull: boolean): value is string | null {
  if (allowNull && value === null) return true
  return typeof value === "string" && value.length > 0 && value.length <= 128 &&
    /^[A-Za-z0-9_-]+$/.test(value)
}

function isRestaurantRole(value: unknown): value is RestaurantMembership["role"] {
  return value === "OrganizationOwner" || value === "Manager" || value === "Kitchen"
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value)
}
