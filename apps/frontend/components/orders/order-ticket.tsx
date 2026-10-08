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
  CardDescription,
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
      <Card
        className={`border-t-4 ${order.status === "Pending" ? "border-t-warning-solid" : order.status === "Preparing" ? "border-t-info-solid" : order.status === "Ready" ? "border-t-success-solid" : "border-t-border"}`}
      >
        <CardHeader className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <CardTitle className="text-lg font-semibold">
                <Heading>
                  {t("orderReference", { reference: order.id.slice(0, 8) })}
                </Heading>
              </CardTitle>

              <Badge variant={variant}>
                <Icon aria-hidden="true" />

                {t(`statuses.${order.status}`)}
              </Badge>
            </div>

            <CardDescription className="mt-1 text-sm">
              {order.customerName} <span aria-hidden="true">·</span>{" "}
              <time dateTime={order.createdAt}>{date}</time>
            </CardDescription>
          </div>

          <p className="font-semibold tabular-nums">{total}</p>

          {dragAffordance}
        </CardHeader>

        <CardContent>
          <ul className="grid gap-3 border-t border-border pt-4">
            {order.lines.map((line, index) => (
              <li key={`${line.productId}:${index}`}>
                <p className="text-lg font-semibold">
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
