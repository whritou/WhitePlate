"use client"

import { useEffect, useRef, useState } from "react"
import type { PointerEvent, RefObject } from "react"
import { getAvailableOrderTransitions } from "@/lib/order-dashboard"
import { resolveOrderDrop } from "@/lib/orders/kanban"
import type {
  OrderDragState,
  OrderKanbanProps,
  OrderSummary,
} from "@/types/orders"

export function useOrderDrag(
  props: OrderKanbanProps,
  container: RefObject<HTMLDivElement | null>
) {
  const current = useRef<OrderDragState | null>(null)
  const saving = useRef(false)
  const [drag, setDrag] = useState<OrderDragState | null>(null)

  function cancel() {
    current.current = null
    setDrag(null)
  }

  useEffect(() => {
    function escape(event: KeyboardEvent) {
      if (event.key === "Escape") cancel()
    }

    window.addEventListener("keydown", escape)
    window.addEventListener("blur", cancel)

    return () => {
      window.removeEventListener("keydown", escape)
      window.removeEventListener("blur", cancel)
    }
  }, [])

  function destination(x: number, y: number) {
    const lane = document.elementFromPoint(x, y)?.closest("[data-order-lane]")

    return lane && container.current?.contains(lane)
      ? lane.getAttribute("data-order-lane")
      : null
  }

  function start(event: PointerEvent<HTMLButtonElement>, order: OrderSummary) {
    if (
      event.button !== 0 ||
      !event.isPrimary ||
      saving.current ||
      props.pending ||
      getAvailableOrderTransitions(props.role, order.status).length === 0
    )
      return

    event.currentTarget.setPointerCapture(event.pointerId)
    current.current = {
      order,
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      x: event.clientX,
      y: event.clientY,
      active: false,
      destination: null,
    }
  }

  function move(event: PointerEvent<HTMLButtonElement>) {
    const previous = current.current

    if (!previous || previous.pointerId !== event.pointerId) return

    const active =
      previous.active ||
      Math.hypot(
        event.clientX - previous.startX,
        event.clientY - previous.startY
      ) >= 8
    const next = {
      ...previous,
      active,
      x: event.clientX,
      y: event.clientY,
      destination: destination(event.clientX, event.clientY),
    }

    current.current = next
    if (active) setDrag(next)
  }

  async function end(event: PointerEvent<HTMLButtonElement>) {
    const snapshot = current.current

    if (!snapshot || snapshot.pointerId !== event.pointerId) return

    cancel()
    if (!snapshot.active) return

    const input = resolveOrderDrop(
      snapshot.order,
      props.orders,
      props.role,
      destination(event.clientX, event.clientY),
      props.pending !== null || saving.current
    )

    if (!input) return
    saving.current = true
    try {
      await props.onUpdate(input)
    } finally {
      saving.current = false
    }
  }

  return { drag, start, move, end, cancel }
}
