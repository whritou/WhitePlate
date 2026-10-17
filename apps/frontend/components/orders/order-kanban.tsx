"use client"

import { useRef, useState } from "react"
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
import { useKdsClock } from "@/hooks/use-kds-clock"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import {
  ORDER_CANCELLATION_REASONS,
  type OrderCancellationReason,
  type UpdateOrderStatusInput,
} from "@/types/orders"

const laneColors = {
  Pending: "bg-accent",
  Preparing: "bg-primary",
  Ready: "bg-foreground",
  Completed: "bg-muted-foreground",
  Cancelled: "bg-destructive",
}

export function OrderKanban(props: OrderKanbanProps) {
  const { orders, role, locale, serverTime, pending, onUpdate } = props
  const t = useTranslations("KitchenOrders")
  const container = useRef<HTMLDivElement>(null)
  const [cancellationRequest, setCancellationRequest] = useState<{
    input: Omit<UpdateOrderStatusInput, "tenantId">
    restoreFocus: boolean
  } | null>(null)
  const [cancellationReason, setCancellationReason] =
    useState<OrderCancellationReason | null>(null)
  const now = useKdsClock(serverTime)

  function shouldRestoreTicketFocus(
    input: Parameters<OrderKanbanProps["onUpdate"]>[0]
  ) {
    const focused = document.activeElement
    const ticket = focused?.closest("[data-order-id]")

    return (
      ticket?.getAttribute("data-order-id") === input.orderId &&
      Boolean(container.current?.contains(ticket))
    )
  }

  async function persist(
    input: Parameters<OrderKanbanProps["onUpdate"]>[0],
    restoreFocus = shouldRestoreTicketFocus(input)
  ) {
    const focused = document.activeElement

    await onUpdate(input)
    if (restoreFocus)
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

  async function update(input: Parameters<OrderKanbanProps["onUpdate"]>[0]) {
    if (pending !== null) return
    if (input.status === "Cancelled" && !input.cancellationReason) {
      setCancellationRequest({
        input,
        restoreFocus: shouldRestoreTicketFocus(input),
      })
      setCancellationReason(null)

      return
    }

    await persist(input)
  }

  function dismissCancellation() {
    const restoreFocus = cancellationRequest?.restoreFocus ?? false

    setCancellationRequest(null)
    setCancellationReason(null)
    if (restoreFocus) {
      requestAnimationFrame(() => {
        container.current
          ?.querySelector<HTMLElement>(
            `[data-order-id="${cancellationRequest?.input.orderId}"]`
          )
          ?.focus()
      })
    }
  }

  async function confirmCancellation() {
    if (!cancellationRequest || !cancellationReason || pending !== null) return

    const { input, restoreFocus } = cancellationRequest

    setCancellationRequest(null)
    setCancellationReason(null)
    await persist({ ...input, cancellationReason }, restoreFocus)
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

      <div className="grid min-w-0 [grid-template-columns:repeat(auto-fit,minmax(min(100%,18rem),1fr))] items-stretch gap-4">
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
                      now={now}
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

      <Dialog
        open={cancellationRequest !== null}
        onOpenChange={(open) => {
          if (!open && cancellationRequest !== null) dismissCancellation()
        }}
      >
        <DialogContent className="gap-5 border bg-background p-6">
          <div className="grid gap-2">
            <DialogTitle className="font-display text-xl font-bold">
              {t("cancellationDialog.title")}
            </DialogTitle>

            <DialogDescription className="text-sm text-muted-foreground">
              {t("cancellationDialog.description")}
            </DialogDescription>
          </div>

          <RadioGroup
            aria-label={t("cancellationDialog.reasonLabel")}
            value={cancellationReason ?? ""}
            onValueChange={(value) => {
              if (
                ORDER_CANCELLATION_REASONS.includes(
                  value as OrderCancellationReason
                )
              )
                setCancellationReason(value as OrderCancellationReason)
            }}
            className="grid gap-2"
          >
            {ORDER_CANCELLATION_REASONS.map((reason) => (
              <Label
                key={reason}
                htmlFor={`cancellation-reason-${reason}`}
                className="flex min-h-11 items-center gap-3 rounded-md border border-border px-3 py-2"
              >
                <RadioGroupItem
                  id={`cancellation-reason-${reason}`}
                  value={reason}
                />

                {t(`cancellationReasons.${reason}`)}
              </Label>
            ))}
          </RadioGroup>

          <div className="flex flex-wrap justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={dismissCancellation}
            >
              {t("cancellationDialog.dismiss")}
            </Button>

            <Button
              type="button"
              variant="destructive"
              disabled={cancellationReason === null || pending !== null}
              onClick={() => void confirmCancellation()}
            >
              {t("cancellationDialog.confirm")}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

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
