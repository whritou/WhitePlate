"use client"

import { OrderEventTracker } from "@/lib/order-dashboard"
import {
  attachOrderRealtime,
  createOrderHubConnection,
  createOrderRefreshCoalescer,
} from "@/lib/orders/order-realtime"
import type { OrderRealtimeProps, OrderRealtimeStatus } from "@/types/orders"
import { useTranslations } from "next-intl"
import { useEffect, useMemo, useState } from "react"

export function OrderRealtimeConnection({
  tenantId,
  hubUrl,
  orders,
  onRefresh,
}: OrderRealtimeProps) {
  const t = useTranslations("KitchenOrders")
  const [status, setStatus] = useState<OrderRealtimeStatus>("connecting")
  const tracker = useMemo(() => new OrderEventTracker(tenantId), [tenantId])

  useEffect(() => {
    tracker.observeOrders(orders)
  }, [orders, tracker])

  useEffect(() => {
    if (!hubUrl) return

    const refresh = createOrderRefreshCoalescer(() => void onRefresh())
    let stop: (() => Promise<void>) | null = null
    let disposed = false

    void Promise.resolve().then(() => {
      if (disposed) return
      try {
        stop = attachOrderRealtime(
          createOrderHubConnection(hubUrl),
          tenantId,
          tracker,
          {
            onStatus: setStatus,
            onRefresh: refresh.schedule,
          }
        )
      } catch {
        if (!disposed) setStatus("offline")
      }
    })

    return () => {
      disposed = true
      refresh.cancel()
      if (stop) void stop().catch(() => undefined)
    }
  }, [hubUrl, onRefresh, tenantId, tracker])

  const visibleStatus = hubUrl ? status : "offline"

  return (
    <p
      role="status"
      aria-live="polite"
      className="flex items-center gap-2 text-sm text-muted-foreground"
    >
      <span
        aria-hidden="true"
        className={`size-2 rounded-full ${visibleStatus === "connected" ? "bg-primary" : "bg-muted-foreground/50"}`}
      />

      {t(`connection.${visibleStatus}`)}
    </p>
  )
}
