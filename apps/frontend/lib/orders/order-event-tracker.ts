import type { OrderSummary, OrderStatus } from "@/types/orders"

const validUuid = /^[0-9a-f]{8}(?:-[0-9a-f]{4}){3}-[0-9a-f]{12}$/i
const validStatuses = new Set<OrderStatus>([
  "Pending",
  "Preparing",
  "Ready",
  "Completed",
  "Cancelled",
])
const eventTypes = new Set([
  "order.created",
  "order.status_changed",
  "order.cancelled",
])

export class OrderEventTracker {
  private readonly eventIds = new Set<string>()
  private readonly versions = new Map<string, number>()
  private snapshotAtMs = Number.NEGATIVE_INFINITY

  constructor(
    private readonly tenantId: string,
    orders: Array<Pick<OrderSummary, "id" | "version">> = []
  ) {
    this.observeOrders(orders)
  }

  observeOrders(
    orders: Array<Pick<OrderSummary, "id" | "version">>,
    serverTime?: string | null
  ): void {
    if (serverTime && !Number.isNaN(Date.parse(serverTime)))
      this.snapshotAtMs = Math.max(this.snapshotAtMs, Date.parse(serverTime))

    for (const order of orders) {
      const current = this.versions.get(order.id)

      if (current === undefined || order.version > current)
        this.versions.set(order.id, order.version)
    }

    this.trim(this.versions, 512)
  }

  shouldRefresh(value: unknown): boolean {
    return this.processEvent(value).refresh
  }

  processEvent(value: unknown): { refresh: boolean; newOrder: boolean } {
    const event = parseKitchenOrderEvent(value)

    if (
      !event ||
      event.tenantId !== this.tenantId ||
      this.eventIds.has(event.eventId)
    )
      return { refresh: false, newOrder: false }

    this.eventIds.add(event.eventId)
    this.trim(this.eventIds, 512)

    const currentVersion = this.versions.get(event.orderId)

    if (currentVersion !== undefined && event.version <= currentVersion)
      return { refresh: false, newOrder: false }
    this.versions.set(event.orderId, event.version)
    this.trim(this.versions, 512)

    return {
      refresh: true,
      newOrder:
        event.eventType === "order.created" &&
        currentVersion === undefined &&
        event.occurredAtMs > this.snapshotAtMs,
    }
  }

  private trim<T>(values: Set<T> | Map<T, unknown>, limit: number): void {
    while (values.size > limit) {
      const oldest = values.keys().next().value as T | undefined

      if (oldest === undefined) return
      values.delete(oldest)
    }
  }
}

function parseKitchenOrderEvent(value: unknown): {
  eventId: string
  tenantId: string
  orderId: string
  version: number
  eventType: string
  occurredAtMs: number
} | null {
  if (
    !isRecord(value) ||
    typeof value.eventId !== "string" ||
    !validUuid.test(value.eventId) ||
    typeof value.tenantId !== "string" ||
    typeof value.orderId !== "string" ||
    !validUuid.test(value.orderId) ||
    typeof value.eventType !== "string" ||
    !eventTypes.has(value.eventType) ||
    typeof value.status !== "string" ||
    !validStatuses.has(value.status as OrderStatus) ||
    typeof value.version !== "number" ||
    !Number.isSafeInteger(value.version) ||
    value.version < 1 ||
    typeof value.occurredAt !== "string" ||
    Number.isNaN(Date.parse(value.occurredAt))
  )
    return null

  return {
    eventId: value.eventId,
    tenantId: value.tenantId,
    orderId: value.orderId,
    version: value.version,
    eventType: value.eventType,
    occurredAtMs: Date.parse(value.occurredAt),
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value)
}
