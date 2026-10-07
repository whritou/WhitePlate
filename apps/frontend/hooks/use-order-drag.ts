"use client"

import { useEffect, useRef, useState } from "react"
import type { PointerEvent, RefObject, TouchEvent } from "react"
import { getAvailableOrderTransitions } from "@/lib/order-dashboard"
import { resolveOrderDrop } from "@/lib/orders/kanban"
import type {
  OrderDragState,
  OrderKanbanProps,
  OrderPendingTouch,
  OrderSummary,
} from "@/types/orders"

const dragThreshold = 8
const touchHoldDelay = 350

export function useOrderDrag(
  props: OrderKanbanProps,
  container: RefObject<HTMLDivElement | null>
) {
  const current = useRef<OrderDragState | null>(null)
  const pendingTouch = useRef<OrderPendingTouch | null>(null)
  const saving = useRef(false)
  const [drag, setDrag] = useState<OrderDragState | null>(null)

  function cancel() {
    if (pendingTouch.current) window.clearTimeout(pendingTouch.current.timer)
    pendingTouch.current = null
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
      if (pendingTouch.current) window.clearTimeout(pendingTouch.current.timer)
    }
  }, [])

  function destination(x: number, y: number) {
    const lane = document.elementFromPoint(x, y)?.closest("[data-order-lane]")

    return lane && container.current?.contains(lane)
      ? lane.getAttribute("data-order-lane")
      : null
  }

  function canStart(order: OrderSummary) {
    return (
      !saving.current &&
      !props.pending &&
      getAvailableOrderTransitions(props.role, order.status).length > 0
    )
  }

  function start(event: PointerEvent<HTMLElement>, order: OrderSummary) {
    if (
      event.pointerType === "touch" ||
      event.button !== 0 ||
      !event.isPrimary ||
      !canStart(order) ||
      (event.target instanceof Element &&
        event.target.closest(
          "button, a, input, select, textarea, [role='button'], [data-no-order-drag]"
        ))
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

  function move(event: PointerEvent<HTMLElement>) {
    const previous = current.current

    if (!previous || previous.pointerId !== event.pointerId) return

    const active =
      previous.active ||
      Math.hypot(
        event.clientX - previous.startX,
        event.clientY - previous.startY
      ) >= dragThreshold
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

  function pointerCancel(event: PointerEvent<HTMLElement>) {
    if (event.pointerType !== "touch") cancel()
  }

  function touchStart(event: TouchEvent<HTMLElement>, order: OrderSummary) {
    if (
      !canStart(order) ||
      event.touches.length !== 1 ||
      (event.target instanceof Element &&
        event.target.closest(
          "button, a, input, select, textarea, [role='button'], [data-no-order-drag]"
        ))
    )
      return

    const touch = event.touches[0]
    const pending = {
      identifier: touch.identifier,
      order,
      startX: touch.clientX,
      startY: touch.clientY,
      timer: 0,
    }

    pending.timer = window.setTimeout(() => {
      if (pendingTouch.current !== pending) return
      current.current = {
        order,
        pointerId: -1,
        startX: pending.startX,
        startY: pending.startY,
        x: pending.startX,
        y: pending.startY,
        active: true,
        destination: destination(pending.startX, pending.startY),
      }
      setDrag(current.current)
    }, touchHoldDelay)
    pendingTouch.current = pending
  }

  function touchMove(event: TouchEvent<HTMLElement>) {
    const pending = pendingTouch.current

    if (!pending) return

    const touch = Array.from(event.touches).find(
      (candidate) => candidate.identifier === pending.identifier
    )

    if (!touch) return

    if (!current.current) {
      if (
        Math.hypot(
          touch.clientX - pending.startX,
          touch.clientY - pending.startY
        ) >= dragThreshold
      ) {
        window.clearTimeout(pending.timer)
        pendingTouch.current = null
      }

      return
    }

    event.preventDefault()

    const next = {
      ...current.current,
      x: touch.clientX,
      y: touch.clientY,
      destination: destination(touch.clientX, touch.clientY),
    }

    current.current = next
    setDrag(next)
  }

  function resolveDrop(snapshot: OrderDragState, x: number, y: number) {
    const input = resolveOrderDrop(
      snapshot.order,
      props.orders,
      props.role,
      destination(x, y),
      props.pending !== null || saving.current
    )

    if (!input) return
    saving.current = true
    void props.onUpdate(input).finally(() => {
      saving.current = false
    })
  }

  async function end(event: PointerEvent<HTMLElement>) {
    const snapshot = current.current

    if (!snapshot || snapshot.pointerId !== event.pointerId) return

    cancel()
    if (snapshot.active) resolveDrop(snapshot, event.clientX, event.clientY)
  }

  function touchEnd(event: TouchEvent<HTMLElement>) {
    const snapshot = current.current
    const pending = pendingTouch.current

    if (!pending) return

    const touch = Array.from(event.changedTouches).find(
      (candidate) => candidate.identifier === pending.identifier
    )

    if (pendingTouch.current) window.clearTimeout(pending.timer)
    pendingTouch.current = null
    current.current = null
    setDrag(null)

    if (snapshot?.active && touch)
      resolveDrop(snapshot, touch.clientX, touch.clientY)
  }

  return {
    drag,
    start,
    move,
    end,
    cancel,
    pointerCancel,
    touchStart,
    touchMove,
    touchEnd,
    touchCancel: cancel,
  }
}
