import { afterEach, expect, it, vi } from "vitest"
import { HubConnectionState, type HubConnection } from "@microsoft/signalr"
import {
  attachOrderRealtime,
  createOrderRefreshCoalescer,
} from "@/lib/orders/order-realtime"
import { OrderEventTracker } from "@/lib/order-dashboard"

class FakeConnection {
  state = HubConnectionState.Disconnected
  readonly onHandlers = new Map<string, (value: unknown) => void>()
  reconnecting?: () => void
  reconnected?: () => void | Promise<void>
  closed?: () => void
  start = vi.fn(async () => {
    this.state = HubConnectionState.Connected
  })
  stop = vi.fn(async () => {
    this.state = HubConnectionState.Disconnected
  })
  invoke = vi.fn(async () => undefined)
  on = vi.fn((name: string, handler: (value: unknown) => void) => {
    this.onHandlers.set(name, handler)
  })
  off = vi.fn((name: string) => {
    this.onHandlers.delete(name)
  })
  onreconnecting = vi.fn((handler: () => void) => {
    this.reconnecting = handler
  })
  onreconnected = vi.fn((handler: () => void | Promise<void>) => {
    this.reconnected = handler
  })
  onclose = vi.fn((handler: () => void) => {
    this.closed = handler
  })
  emit(name: string, value: unknown) {
    this.onHandlers.get(name)?.(value)
  }
}

afterEach(() => vi.useRealTimers())

it("coalesces bursts of order events into one REST refresh", () => {
  vi.useFakeTimers()

  const refresh = vi.fn()
  const coalescer = createOrderRefreshCoalescer(refresh)

  coalescer.schedule()
  coalescer.schedule()
  coalescer.schedule()
  vi.advanceTimersByTime(99)
  expect(refresh).not.toHaveBeenCalled()
  vi.advanceTimersByTime(1)
  expect(refresh).toHaveBeenCalledTimes(1)

  coalescer.schedule()
  coalescer.cancel()
  vi.advanceTimersByTime(100)
  expect(refresh).toHaveBeenCalledTimes(1)
})

it("joins the selected restaurant, refreshes on new events, and recovers after reconnect", async () => {
  const connection = new FakeConnection()
  const onRefresh = vi.fn()
  const onStatus = vi.fn()
  const tracker = new OrderEventTracker("tenant-a")
  const stop = attachOrderRealtime(
    connection as unknown as HubConnection,
    "tenant-a",
    tracker,
    { onRefresh, onStatus }
  )

  await new Promise((resolve) => setTimeout(resolve, 0))
  expect(connection.invoke).toHaveBeenNthCalledWith(
    1,
    "JoinRestaurant",
    "tenant-a"
  )
  expect(onRefresh).toHaveBeenCalledTimes(1)

  const event = {
    eventId: "44444444-4444-4444-8444-444444444444",
    tenantId: "tenant-a",
    orderId: "22222222-2222-4222-8222-222222222222",
    eventType: "order.created",
    status: "Pending",
    version: 1,
    occurredAt: "2026-10-01T18:00:00Z",
  }

  connection.emit("order.changed", event)
  connection.emit("order.changed", event)
  connection.emit("order.changed", { ...event, tenantId: "tenant-b" })
  expect(onRefresh).toHaveBeenCalledTimes(2)

  await connection.reconnected?.()
  expect(connection.invoke).toHaveBeenNthCalledWith(
    2,
    "JoinRestaurant",
    "tenant-a"
  )
  expect(onRefresh).toHaveBeenCalledTimes(3)
  expect(onStatus).toHaveBeenCalledWith("connected")

  await stop()
  expect(connection.off).toHaveBeenCalledWith(
    "order.changed",
    expect.any(Function)
  )
  expect(connection.stop).toHaveBeenCalledTimes(1)
})
