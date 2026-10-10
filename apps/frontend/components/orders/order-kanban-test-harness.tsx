"use client"

import { useRef, useState } from "react"
import { useLocale, useTranslations } from "next-intl"
import { OrderKanban } from "./order-kanban"
import { OrderStatusTabs } from "./order-status-tabs"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import type {
  OrderStatus,
  OrderSummary,
  RestaurantRole,
  UpdateOrderStatusInput,
} from "@/types/orders"

const fixtureOrder: OrderSummary = {
  id: "22222222-2222-4222-8222-222222222222",
  customerName: "Ada",
  status: "Pending",
  version: 1,
  currency: "EUR",
  menuLocale: "fr",
  total: 19.25,
  createdAt: "2026-10-01T18:00:00Z",
  lines: [
    {
      productId: "11111111-1111-4111-8111-111111111111",
      productName: "Soupe de légumes",
      quantity: 2,
      options: [
        {
          optionId: "44444444-4444-4444-8444-444444444444",
          name: "Pain complet",
        },
      ],
    },
  ],
}

export function OrderKanbanTestHarness({ role }: { role: RestaurantRole }) {
  const t = useTranslations("KitchenOrders")
  const locale = useLocale()
  const [orders, setOrders] = useState([fixtureOrder])
  const [status, setStatus] = useState<OrderStatus | null>(null)
  const [pending, setPending] = useState<UpdateOrderStatusInput | null>(null)
  const [reject, setReject] = useState(false)
  const [message, setMessage] = useState(false)
  const [count, setCount] = useState(0)
  const inFlight = useRef(false)

  async function update(input: Omit<UpdateOrderStatusInput, "tenantId">) {
    if (inFlight.current) return
    inFlight.current = true
    setPending({ ...input, tenantId: "33333333-3333-4333-8333-333333333333" })
    setCount((value) => value + 1)
    setMessage(false)
    await new Promise((resolve) => setTimeout(resolve, 500))
    if (reject) setMessage(true)
    else
      setOrders((orders) =>
        orders.map((order) =>
          order.id === input.orderId
            ? { ...order, status: input.status, version: order.version + 1 }
            : order
        )
      )
    setPending(null)
    inFlight.current = false
  }

  return (
    <main className="live-order-board grid min-w-0 gap-5 p-3 sm:p-4 lg:p-6">
      <h1 className="text-2xl font-semibold">{t("title")}</h1>

      <Label className="flex items-center gap-2">
        <Checkbox
          checked={reject}
          onCheckedChange={setReject}
          aria-label={t("testRejectUpdates")}
        />

        {t("testRejectUpdates")}
      </Label>

      <output data-testid="mutation-count">{count}</output>

      {message && (
        <Alert variant="destructive" role="alert">
          <AlertDescription>{t("errors.conflict")}</AlertDescription>
        </Alert>
      )}

      <OrderStatusTabs
        selectedStatus={status}
        onStatusChange={setStatus}
        disabled={pending !== null}
      >
        <OrderKanban
          orders={orders.filter(
            (order) => status === null || order.status === status
          )}
          role={role}
          locale={locale}
          pending={pending}
          onUpdate={update}
        />
      </OrderStatusTabs>
    </main>
  )
}
