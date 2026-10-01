"use client"

import { useTranslations } from "next-intl"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { getAvailableOrderTransitions } from "@/lib/order-dashboard"
import type { OrderTicketProps } from "@/types/orders"

export function OrderTicket({
  order,
  role,
  locale,
  pending,
  onUpdate,
}: OrderTicketProps) {
  const t = useTranslations("KitchenOrders")
  const total = new Intl.NumberFormat(locale, {
    style: "currency",
    currency: order.currency,
  }).format(order.total)
  const date = new Intl.DateTimeFormat(locale, {
    dateStyle: "short",
    timeStyle: "short",
  }).format(new Date(order.createdAt))
  const transitions = getAvailableOrderTransitions(role, order.status)

  return (
    <article>
      <Card className="rounded-2xl text-sm">
        <CardHeader className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="font-semibold">
                {t("orderReference", { reference: order.id.slice(0, 8) })}
              </h2>
              <Badge variant="secondary">{t(`statuses.${order.status}`)}</Badge>
            </div>
            <p className="mt-1 text-muted-foreground">
              {order.customerName} <span aria-hidden="true">·</span>{" "}
              <time dateTime={order.createdAt}>{date}</time>
            </p>
          </div>
          <p className="font-semibold">{total}</p>
        </CardHeader>
        <CardContent>
          <ul className="grid gap-3 border-t border-border pt-4">
            {order.lines.map((line, index) => (
              <li key={`${line.productId}:${index}`}>
                <p className="font-medium">
                  {t("lineItem", {
                    quantity: line.quantity,
                    product: line.productName,
                  })}
                </p>
                {line.options.length > 0 && (
                  <ul className="mt-1 ml-5 list-disc text-muted-foreground">
                    {line.options.map((option) => (
                      <li key={option.optionId}>{option.name}</li>
                    ))}
                  </ul>
                )}
              </li>
            ))}
          </ul>
          {transitions.length > 0 && (
            <div className="mt-5 flex flex-wrap gap-2 border-t border-border pt-4">
              {transitions.map((status) => (
                <Button
                  key={status}
                  type="button"
                  size="lg"
                  disabled={pending !== null}
                  onClick={() =>
                    void onUpdate({
                      orderId: order.id,
                      version: order.version,
                      status,
                    })
                  }
                >
                  {pending?.orderId === order.id && pending.status === status
                    ? t("updating")
                    : t(`actions.${status}`)}
                </Button>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </article>
  )
}
