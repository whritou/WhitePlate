import {
  HubConnectionBuilder,
  LogLevel,
  type HubConnection,
} from "@microsoft/signalr"
import type { OrderEventTracker } from "@/lib/orders/order-event-tracker"
import type { OrderRealtimeStatus } from "@/types/orders"
import { getSignalRToken } from "@/lib/api/order-browser"

export function createOrderRefreshCoalescer(onRefresh: () => void) {
  let timer: ReturnType<typeof setTimeout> | null = null

  return {
    schedule() {
      if (timer !== null) return
      timer = setTimeout(() => {
        timer = null
        onRefresh()
      }, 100)
    },
    cancel() {
      if (timer === null) return
      clearTimeout(timer)
      timer = null
    },
  }
}

export function createOrderHubConnection(hubUrl: string): HubConnection {
  return new HubConnectionBuilder()
    .withUrl(hubUrl, { accessTokenFactory: getSignalRToken })
    .withAutomaticReconnect()
    .configureLogging(LogLevel.None)
    .build()
}

export function attachOrderRealtime(
  connection: HubConnection,
  tenantId: string,
  tracker: OrderEventTracker,
  callbacks: {
    onStatus: (status: OrderRealtimeStatus) => void
    onRefresh: () => void
    onNewOrder?: (orderId: string) => void
  }
): () => Promise<void> {
  let disposed = false
  let retryAttempt = 0
  let retryTimer: number | null = null

  const scheduleRestart = () => {
    if (disposed || retryTimer !== null) return

    const delay = Math.min(1000 * 2 ** retryAttempt, 30_000)

    retryAttempt += 1
    retryTimer = window.setTimeout(() => {
      retryTimer = null
      void start()
    }, delay)
  }

  const onOrderChanged = (event: unknown) =>
    handleOrderChanged(event, tracker, callbacks)

  const onReconnecting = () => callbacks.onStatus("reconnecting")
  const onReconnected = async () => {
    if (disposed) return
    try {
      await connection.invoke("JoinRestaurant", tenantId)
      if (disposed) return
      retryAttempt = 0
      callbacks.onStatus("connected")
      callbacks.onRefresh()
    } catch {
      callbacks.onStatus("offline")
      await connection.stop().catch(() => undefined)
    }
  }

  const onClose = () => {
    if (disposed) return
    callbacks.onStatus("offline")
    scheduleRestart()
  }

  async function start(): Promise<void> {
    if (disposed) return
    callbacks.onStatus("connecting")
    try {
      await connection.start()
      if (disposed) {
        await connection.stop()

        return
      }

      await connection.invoke("JoinRestaurant", tenantId)
      if (disposed) {
        await connection.stop()

        return
      }

      retryAttempt = 0
      callbacks.onStatus("connected")
      callbacks.onRefresh()
    } catch {
      if (disposed) return
      callbacks.onStatus("offline")
      await connection.stop().catch(() => undefined)
      scheduleRestart()
    }
  }

  connection.on("order.changed", onOrderChanged)
  connection.onreconnecting(onReconnecting)
  connection.onreconnected(onReconnected)
  connection.onclose(onClose)
  void start()

  return async () => {
    disposed = true
    if (retryTimer !== null) window.clearTimeout(retryTimer)
    connection.off("order.changed", onOrderChanged)
    await connection.stop()
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value)
}

function handleOrderChanged(
  event: unknown,
  tracker: OrderEventTracker,
  callbacks: {
    onRefresh: () => void
    onNewOrder?: (orderId: string) => void
  }
) {
  const result = tracker.processEvent(event)

  if (result.newOrder && isRecord(event) && typeof event.orderId === "string")
    callbacks.onNewOrder?.(event.orderId)
  if (result.refresh) callbacks.onRefresh()
}
