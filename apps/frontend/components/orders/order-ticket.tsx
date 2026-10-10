"use client"

import {
  ArrowRight,
  Clock,
  CookingPot,
  Check,
  CheckCheck,
  X,
} from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { getAvailableOrderTransitions } from "@/lib/order-dashboard"
import { cn } from "@/lib/utils"
import type { OrderStatus, OrderTicketProps } from "@/types/orders"
import { useTranslations } from "next-intl"

const statusPresentation = {
  Pending: { variant: "warning", Icon: Clock },
  Preparing: { variant: "info", Icon: CookingPot },
  Ready: { variant: "success", Icon: Check },
  Completed: { variant: "neutral", Icon: CheckCheck },
  Cancelled: { variant: "destructive", Icon: X },
} as const satisfies Record<
  OrderStatus,
  { variant: string; Icon: typeof Clock }
>

export function OrderTicket({
  order,
  role,
  locale,
  pending,
  onUpdate,
  dragAffordance,
  dragHandlers,
  headingLevel: Heading = "h2",
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
  const { variant, Icon } = statusPresentation[order.status]

  return (
    <article
      data-order-id={order.id}
      tabIndex={-1}
      className={cn(
        "rounded-lg outline-none focus-visible:outline-2 focus-visible:outline-ring",
        dragHandlers && "cursor-grab active:cursor-grabbing"
      )}
      aria-describedby={dragHandlers ? "order-drag-instructions" : undefined}
      lang={order.menuLocale ?? undefined}
      {...dragHandlers}
    >
      <Card className="card-hard gap-0 border bg-background p-0">
        <CardHeader className="flex flex-wrap items-start justify-between gap-3 border-b px-4 py-3">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <CardTitle className="font-display text-lg font-bold">
                <Heading>
                  {t("orderReference", { reference: order.id.slice(0, 8) })}
                </Heading>
              </CardTitle>

              <Badge variant={variant}>
                <Icon aria-hidden="true" />

                {t(`statuses.${order.status}`)}
              </Badge>
            </div>
          </div>

          {dragAffordance}
        </CardHeader>

        <CardContent className="px-4 py-3">
          <p className="mb-2 font-semibold">{order.customerName}</p>

          <p className="label-mono mb-3 text-muted-foreground">
            <time dateTime={order.createdAt}>{date}</time>
          </p>

          <ul className="grid gap-2">
            {order.lines.map((line, index) => (
              <li key={`${line.productId}:${index}`}>
                <p className="text-sm font-semibold">
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

        <div className="flex items-center justify-between border-t px-4 py-3">
          <span className="label-mono text-muted-foreground">{t("total")}</span>

          <p className="font-display text-lg font-bold tabular-nums">{total}</p>
        </div>

        {transitions.length > 0 && (
          <CardFooter className="flex flex-wrap gap-2 border-t p-3">
            {transitions.map((status) => (
              <Button
                key={status}
                type="button"
                size="sm"
                className="min-h-12"
                variant={status === "Cancelled" ? "destructive" : "default"}
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

                {status !== "Cancelled" && <ArrowRight aria-hidden="true" />}
              </Button>
            ))}
          </CardFooter>
        )}
      </Card>
    </article>
  )
}
