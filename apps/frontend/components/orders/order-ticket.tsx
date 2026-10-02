"use client"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { getAvailableOrderTransitions } from "@/lib/order-dashboard"
import type { OrderTicketProps } from "@/types/orders"
import { useTranslations } from "next-intl"

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
    <article lang={order.menuLocale ?? undefined}>
      <Card className="rounded-2xl text-sm">
        <CardHeader className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <CardTitle className="text-sm font-semibold">
                <h2>
                  {t("orderReference", { reference: order.id.slice(0, 8) })}
                </h2>
              </CardTitle>

              <Badge variant="secondary">{t(`statuses.${order.status}`)}</Badge>
            </div>

            <CardDescription className="mt-1 text-sm">
              {order.customerName} <span aria-hidden="true">·</span>{" "}
              <time dateTime={order.createdAt}>{date}</time>
            </CardDescription>
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
        </CardContent>

        {transitions.length > 0 && (
          <CardFooter className="flex flex-wrap gap-2">
            {transitions.map((status) => (
              <Button
                key={status}
                type="button"
                size="lg"
                aria-label={t("actionForOrder", {
                  action: t(`actions.${status}`),
                  reference: order.id.slice(0, 8),
                })}
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
          </CardFooter>
        )}
      </Card>
    </article>
  )
}
