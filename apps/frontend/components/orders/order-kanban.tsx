"use client"

import { useRef } from "react"
import { GripVertical } from "lucide-react"
import { useTranslations } from "next-intl"
import { Badge } from "@/components/ui/badge"
import {
  ORDER_STATUSES,
  getAvailableOrderTransitions,
} from "@/lib/order-dashboard"
import { cn } from "@/lib/utils"
import { useOrderDrag } from "@/hooks/use-order-drag"
import type { OrderKanbanProps } from "@/types/orders"
import { OrderTicket } from "./order-ticket"

const laneColors = {
  Pending: "bg-accent",
  Preparing: "bg-primary",
  Ready: "bg-foreground",
  Completed: "bg-muted-foreground",
  Cancelled: "bg-destructive",
}

export function OrderKanban(props: OrderKanbanProps) {
  const { orders, role, locale, pending, onUpdate } = props
  const t = useTranslations("KitchenOrders")
  const container = useRef<HTMLDivElement>(null)

  async function update(input: Parameters<OrderKanbanProps["onUpdate"]>[0]) {
    const focused = document.activeElement
    const ticket = focused?.closest("[data-order-id]")
    const restore =
      ticket?.getAttribute("data-order-id") === input.orderId &&
      container.current?.contains(ticket)

    await onUpdate(input)
    if (restore)
      requestAnimationFrame(() => {
        if (document.activeElement !== document.body && focused?.isConnected)
          return
        if (
          document.activeElement !== document.body &&
          document.activeElement !== focused
        )
          return

        const target = container.current?.querySelector<HTMLElement>(
          `[data-order-id="${input.orderId}"]`
        )

        const nextFocus = target ?? container.current

        nextFocus?.focus()
      })
  }

  const {
    drag,
    start,
    move,
    end,
    cancel,
    pointerCancel,
    touchStart,
    touchMove,
    touchEnd,
  } = useOrderDrag({ ...props, onUpdate: update }, container)
  const available = drag
    ? getAvailableOrderTransitions(role, drag.order.status)
    : []

  return (
    <div
      ref={container}
      tabIndex={-1}
      className="grid min-w-0 gap-4 outline-none focus-visible:outline-2 focus-visible:outline-ring"
    >
      <p className="text-sm text-muted-foreground">{t("boardHelp")}</p>

      <div className="grid items-stretch gap-4 md:grid-cols-2 xl:grid-cols-4">
        {ORDER_STATUSES.map((status) => {
          const items = orders.filter((order) => order.status === status)
          const allowed =
            available.some((next) => next === status) && pending === null

          return (
            <section
              key={status}
              data-order-lane={status}
              aria-label={t(`statuses.${status}`)}
              className={cn(
                "flex min-h-[60vh] min-w-0 flex-col border border-border bg-secondary",
                allowed && "border-input",
                allowed &&
                  drag?.destination === status &&
                  "bg-accent outline-2 outline-ring"
              )}
            >
              <header
                className={cn(
                  "flex min-h-12 items-center justify-between gap-2 border-b bg-background px-4 py-3"
                )}
              >
                <h2 className="flex items-center gap-2 font-display text-lg font-bold">
                  <span
                    className={`size-3 ${laneColors[status]}`}
                    aria-hidden="true"
                  />

                  {t(`statuses.${status}`)}
                </h2>

                <Badge
                  variant="outline"
                  aria-label={t("loadedCount", { count: items.length })}
                >
                  {items.length}
                </Badge>
              </header>

              <ol className="grid min-h-24 content-start gap-3 p-3">
                {items.map((order) => (
                  <li
                    key={order.id}
                    className={cn(
                      "min-w-0 rounded-lg transition-transform",
                      drag?.active &&
                        drag.order.id === order.id &&
                        "scale-[1.01] opacity-70 outline-2 outline-ring"
                    )}
                  >
                    <OrderTicket
                      order={order}
                      role={role}
                      locale={locale}
                      pending={pending}
                      onUpdate={update}
                      headingLevel="h3"
                      dragAffordance={
                        getAvailableOrderTransitions(role, order.status)
                          .length > 0 ? (
                          <span
                            aria-hidden="true"
                            className="pointer-events-none inline-flex size-11 shrink-0 items-center justify-center text-muted-foreground"
                          >
                            <GripVertical aria-hidden="true" />
                          </span>
                        ) : undefined
                      }
                      dragHandlers={
                        getAvailableOrderTransitions(role, order.status)
                          .length > 0 && pending === null
                          ? {
                              onPointerDown: (event) => start(event, order),
                              onPointerMove: move,
                              onPointerUp: (event) => void end(event),
                              onPointerCancel: pointerCancel,
                              onLostPointerCapture: pointerCancel,
                              onTouchStart: (event) => touchStart(event, order),
                              onTouchMove: touchMove,
                              onTouchEnd: (event) => void touchEnd(event),
                              onTouchCancel: cancel,
                            }
                          : undefined
                      }
                    />
                  </li>
                ))}
              </ol>

              {items.length === 0 && (
                <p className="py-4 text-center text-sm text-muted-foreground">
                  {t("emptyLane")}
                </p>
              )}
            </section>
          )
        })}
      </div>

      <p id="order-drag-instructions" className="sr-only">
        {t("dragInstructions")}
      </p>

      <p role="status" aria-live="polite" className="sr-only">
        {drag?.active &&
          t("draggingOrder", {
            reference: drag.order.id.slice(0, 8),
            destination: available.some((next) => next === drag.destination)
              ? t(`statuses.${drag.destination}`)
              : t("invalidDrop"),
          })}
      </p>

      {drag?.active && (
        <div
          aria-hidden="true"
          className="pointer-events-none fixed z-30 max-w-40 rounded-md border border-input bg-card p-3 text-sm font-semibold text-foreground"
          style={{
            left: Math.max(0, Math.min(drag.x + 12, window.innerWidth - 164)),
            top: Math.max(0, Math.min(drag.y + 12, window.innerHeight - 64)),
          }}
        >
          {t("orderReference", { reference: drag.order.id.slice(0, 8) })}
        </div>
      )}
    </div>
  )
}
