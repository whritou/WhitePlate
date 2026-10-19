"use client"

import {
  ArrowRight,
  Clock,
  TriangleAlert,
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
import {
  formatKdsDuration,
  getOrderTiming,
  resolvePreparationNote,
} from "@/lib/orders/kds-timing"
import type {
  OrderCancellationReason,
  OrderStatus,
  OrderTicketProps,
} from "@/types/orders"
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

const emailEventKeys = {
  "order.created": "created",
  "order.preparing": "preparing",
  "order.ready": "ready",
} as const

export function OrderTicket({
  order,
  permissions,
  locale,
  now,
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
  const transitions = getAvailableOrderTransitions(order.status, permissions)
  const { variant, Icon } = statusPresentation[order.status]
  const isActive = order.status !== "Completed" && order.status !== "Cancelled"
  const timing = getOrderTiming(order, now)
  const pickupTime = timing.pickupRemainingSeconds
  const urgency = timing.urgency
  const pickupTimerLabel =
    pickupTime === null || urgency === null
      ? null
      : urgency === "overdue"
        ? pickupTime === 0
          ? t("pickupDueNow")
          : t("pickupOverdue", { time: formatKdsDuration(pickupTime) })
        : urgency === "dueSoon"
          ? t("pickupDueSoon", { time: formatKdsDuration(pickupTime) })
          : t("pickupIn", { time: formatKdsDuration(pickupTime) })
  const pickupUrgencyVariant =
    urgency === "overdue"
      ? "destructive"
      : urgency === "dueSoon"
        ? "warning"
        : "neutral"
  const PickupUrgencyIcon = urgency === "overdue" ? TriangleAlert : Clock
  const emailNotifications = order.emailNotifications ?? []
  const terminal = !isActive
  const formatRecordedAt = (value: string) =>
    new Intl.DateTimeFormat(locale, {
      dateStyle: "medium",
      timeStyle: "short",
    }).format(new Date(value))

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

              {order.pickupMode && (
                <Badge variant="outline">
                  {t(`pickupModes.${order.pickupMode}`)}
                </Badge>
              )}
            </div>
          </div>

          {dragAffordance}
        </CardHeader>

        <CardContent className="px-4 py-3">
          <p className="mb-2 font-semibold">{order.customerName}</p>

          {order.customerPhone && (
            <p className="mb-2 text-sm">{order.customerPhone}</p>
          )}

          {order.orderNotes && (
            <p className="mb-3 text-sm break-words whitespace-pre-wrap">
              {order.orderNotes}
            </p>
          )}

          <p className="label-mono mb-3 text-muted-foreground">
            <time dateTime={order.createdAt}>{date}</time>
          </p>

          {order.pickupAt && (
            <p className="mb-3 text-sm font-semibold">
              {t("pickupTime", {
                time: new Intl.DateTimeFormat(locale, {
                  year: "numeric",
                  month: "short",
                  day: "numeric",
                  hour: "numeric",
                  minute: "2-digit",
                  timeZone: order.pickupTimeZone ?? undefined,
                  timeZoneName: "shortOffset",
                }).format(new Date(order.pickupAt)),
              })}
            </p>
          )}

          {isActive && (
            <div className="mb-3 flex flex-wrap items-center gap-2">
              <Badge
                variant="outline"
                aria-label={t("elapsedTimer", {
                  time: formatKdsDuration(timing.elapsedSeconds),
                })}
              >
                <Clock aria-hidden="true" />

                <time role="timer" aria-live="off" dateTime={order.createdAt}>
                  {formatKdsDuration(timing.elapsedSeconds)}
                </time>
              </Badge>

              {pickupTimerLabel && (
                <Badge
                  variant={pickupUrgencyVariant}
                  aria-label={pickupTimerLabel}
                >
                  <PickupUrgencyIcon aria-hidden="true" />

                  {pickupTimerLabel}
                </Badge>
              )}
            </div>
          )}

          <ul className="grid gap-2">
            {order.lines.map((line, index) => {
              const preparationNote = resolvePreparationNote(
                line.preparationNotes,
                order.menuLocale,
                locale
              )

              return (
                <li key={`${line.productId}:${index}`}>
                  <p className="text-sm font-semibold">
                    {t("lineItem", {
                      quantity: line.quantity,
                      product: line.productName,
                    })}
                  </p>

                  {line.preparationMinutes && (
                    <p className="mt-1 text-xs text-muted-foreground">
                      {t("preparationGuide", {
                        minutes: line.preparationMinutes,
                      })}
                    </p>
                  )}

                  {preparationNote && (
                    <p className="mt-1 border-l-2 border-primary pl-2 text-sm">
                      <span className="font-semibold">
                        {t("preparationNotesLabel")}:
                      </span>{" "}
                      {preparationNote}
                    </p>
                  )}

                  {line.options.length > 0 && (
                    <ul className="mt-1 ml-5 list-disc text-muted-foreground">
                      {line.options.map((option) => (
                        <li key={option.optionId}>{option.name}</li>
                      ))}
                    </ul>
                  )}
                </li>
              )
            })}
          </ul>

          {terminal && (
            <section
              aria-label={t("serviceDetails.title")}
              className="mt-4 grid gap-3 border-t border-border pt-4"
            >
              <h3 className="font-semibold">{t("serviceDetails.title")}</h3>

              {order.status === "Cancelled" && (
                <p className="text-sm">
                  <span className="font-semibold">
                    {t("serviceDetails.cancellationReason")}:
                  </span>{" "}
                  {order.cancellationReason
                    ? t(
                        `cancellationReasons.${order.cancellationReason as OrderCancellationReason}`
                      )
                    : t("serviceDetails.reasonNotRecorded")}
                </p>
              )}

              <div className="grid gap-2">
                <h4 className="text-sm font-semibold">
                  {t("serviceDetails.emailSection")}
                </h4>

                {emailNotifications.length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    {t("serviceDetails.noEmailEvents")}
                  </p>
                ) : (
                  <ul className="grid gap-2 text-sm">
                    {emailNotifications.map((notification, index) => (
                      <li
                        key={`${notification.eventType}:${notification.createdAt}:${index}`}
                        className="grid gap-1 border-s-2 border-border ps-3"
                      >
                        <p className="font-medium">
                          {t(
                            `emailEvents.${emailEventKeys[notification.eventType]}`
                          )}{" "}
                          · {t(`emailStatuses.${notification.status}`)}
                        </p>

                        <p className="text-muted-foreground">
                          {t("serviceDetails.eventCreatedAt", {
                            time: formatRecordedAt(notification.createdAt),
                          })}
                        </p>

                        {notification.status === "Accepted" &&
                          notification.acceptedAt && (
                            <p className="text-muted-foreground">
                              {t("serviceDetails.acceptedAt", {
                                time: formatRecordedAt(notification.acceptedAt),
                              })}
                            </p>
                          )}

                        {notification.status === "Accepted" && (
                          <p className="text-muted-foreground">
                            {t("serviceDetails.acceptedCaveat")}
                          </p>
                        )}
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              <div className="grid gap-1 border-t border-border pt-3">
                <h4 className="text-sm font-semibold">
                  {t("serviceDetails.paymentSection")}
                </h4>

                <p className="text-sm text-muted-foreground">
                  {t("serviceDetails.paymentUnavailable")}
                </p>
              </div>
            </section>
          )}
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
