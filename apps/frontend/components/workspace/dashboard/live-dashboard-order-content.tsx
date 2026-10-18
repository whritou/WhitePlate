"use client"

import { useMemo } from "react"
import { ArrowRight, ArrowUpRight, Clock3, CreditCard } from "lucide-react"
import { useTranslations } from "next-intl"
import { useOrderDashboard } from "@/hooks/use-order-dashboard"
import { getOrderTiming } from "@/lib/orders/kds-timing"
import { buildOrdersHref } from "@/lib/orders/navigation"
import { Link, useRouter } from "@/i18n/navigation"
import { OrderRealtimeConnection } from "@/components/orders/order-realtime-connection"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { OrderingOperationsSummary } from "../orders/operations/ordering-operations-summary"
import {
  formatPickup,
  OrderReadState,
  statusIndicator,
} from "./live-dashboard-order-read-state"
import type { LiveDashboardOrderContentProps } from "@/types/live-workspace"
import type { OrderStatus } from "@/types/orders"

const stages: { key: OrderStatus; tone: string }[] = [
  { key: "Pending", tone: "bg-accent" },
  { key: "Preparing", tone: "bg-primary text-primary-foreground" },
  { key: "Ready", tone: "bg-foreground text-background" },
  { key: "Completed", tone: "bg-secondary" },
]

export function LiveDashboardOrderContent(
  props: LiveDashboardOrderContentProps
) {
  const { tenantId, hubUrl } = props
  const t = useTranslations("KitchenOrders")
  const live = useTranslations("LiveWorkspace")
  const parity = useTranslations("LiveParity")
  const lovableLive = useTranslations("LovableLive")
  const checkout = useTranslations("Checkout")
  const history = useTranslations("OrderHistory")
  const router = useRouter()
  const dashboard = useOrderDashboard(props)
  const { page } = dashboard
  const counts = useMemo(() => {
    const result: Record<OrderStatus, number> = {
      Pending: 0,
      Preparing: 0,
      Ready: 0,
      Completed: 0,
      Cancelled: 0,
    }

    for (const order of page?.items ?? []) result[order.status] += 1

    return result
  }, [page?.items])
  const overdueCount = useMemo(() => {
    if (!page) return 0

    const now = Date.parse(page.serverTime)

    return page.items.filter(
      (order) => getOrderTiming(order, now).urgency === "overdue"
    ).length
  }, [page])
  const recentOrders = useMemo(
    () =>
      [...(page?.items ?? [])]
        .sort(
          (first, second) =>
            Date.parse(second.createdAt) - Date.parse(first.createdAt)
        )
        .slice(0, 4),
    [page?.items]
  )
  const openOrdersHref = buildOrdersHref(tenantId, null, null)

  return (
    <>
      <OrderRealtimeConnection
        tenantId={tenantId}
        hubUrl={
          dashboard.loadError === "forbidden" ||
          dashboard.loadError === "unauthorized"
            ? null
            : hubUrl
        }
        orders={page?.items ?? []}
        serverTime={page?.serverTime ?? null}
        onRefresh={dashboard.refresh}
      />

      <div className="grid min-w-0 gap-8 py-8 xl:grid-cols-[1.55fr_1fr] [&>section]:min-w-0">
        <section aria-labelledby="live-dashboard-kitchen-title">
          <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
            <h2
              id="live-dashboard-kitchen-title"
              className="font-display text-2xl font-bold"
            >
              {live("kitchen")}
            </h2>

            <span className="flex items-center gap-2 text-xs text-muted-foreground">
              <span className="size-2 bg-primary" />

              {live("snapshotHelp")}
            </span>
          </div>

          {dashboard.isInitialLoading ? (
            <div
              aria-hidden="true"
              className="grid grid-cols-2 gap-3 sm:grid-cols-4"
            >
              {stages.map(({ key }) => (
                <div key={key} className="grid gap-4 border p-4">
                  <Skeleton className="h-4 w-2/3 rounded-none" />

                  <Skeleton className="h-10 w-1/3 rounded-none" />

                  <Skeleton className="h-4 w-4 rounded-none" />
                </div>
              ))}
            </div>
          ) : (
            <ul className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {stages.map(({ key, tone }) => (
                <li key={key}>
                  <Link
                    href={buildOrdersHref(tenantId, key, null)}
                    className={`block border p-4 transition-opacity hover:opacity-80 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring ${tone}`}
                    aria-label={
                      page
                        ? t("statusCount", {
                            status: t(`statuses.${key}`),
                            count: counts[key],
                          })
                        : t(`statuses.${key}`)
                    }
                  >
                    <p className="text-sm font-medium">
                      {t(`statuses.${key}`)}
                    </p>

                    <p className="mt-4 text-4xl font-bold tabular-nums">
                      {page ? counts[key] : "—"}
                    </p>

                    <ArrowRight aria-hidden="true" className="mt-5 size-4" />
                  </Link>
                </li>
              ))}
            </ul>
          )}

          {page && page.items.length === 0 && (
            <p className="mt-3 text-sm text-muted-foreground">
              {live("emptyDashboard")}
            </p>
          )}

          <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-y py-4">
            <div className="flex items-center gap-3">
              <Clock3 aria-hidden="true" className="size-5 text-primary" />

              <div>
                <p className="text-sm font-medium">
                  {live("overduePickups", { count: overdueCount })}
                </p>

                <p className="mt-1 text-xs text-muted-foreground">
                  {page
                    ? live("dashboardLoadedScope", { count: page.items.length })
                    : live("orderSnapshotUnavailable")}
                </p>
              </div>
            </div>

            <Button
              nativeButton={false}
              role="link"
              variant="link"
              size="sm"
              render={<Link href={openOrdersHref} />}
            >
              {live("openOrders")}

              <ArrowRight aria-hidden="true" />
            </Button>
          </div>

          <OrderReadState
            isInitialLoading={dashboard.isInitialLoading}
            isFetching={dashboard.isFetching}
            hasPage={page !== null}
            loadError={dashboard.loadError}
            isStale={dashboard.isStale}
            onRetry={() =>
              dashboard.loadError === "invalid"
                ? router.refresh()
                : void dashboard.retry()
            }
          />
        </section>

        <section
          aria-labelledby="live-dashboard-connections-title"
          className="xl:border-s xl:ps-8"
        >
          <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
            <h2
              id="live-dashboard-connections-title"
              className="font-display text-2xl font-bold"
            >
              {parity("connections")}
            </h2>

            <Badge variant="outline">
              {lovableLive("restaurantWorkspace")}
            </Badge>
          </div>

          {props.permissions.includes("billing.manage") && (
            <div className="border-y py-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <h3 className="flex items-center gap-2 font-bold">
                  <CreditCard aria-hidden="true" className="size-5" />

                  {parity("payment")}
                </h3>

                <Badge variant="secondary">{live("paymentsPending")}</Badge>
              </div>

              <p className="mt-3 text-sm text-muted-foreground">
                {live("paymentsUnavailable")}
              </p>

              <div className="mt-3 flex justify-end">
                <Button
                  nativeButton={false}
                  role="link"
                  variant="link"
                  render={
                    <Link
                      href={`/organization/settings?tenantId=${tenantId}&section=payments`}
                    />
                  }
                >
                  {live("paymentSettings")}

                  <ArrowUpRight aria-hidden="true" />
                </Button>
              </div>
            </div>
          )}

          {props.permissions.includes("orders.manage") && (
            <OrderingOperationsSummary
              presentation="compact"
              counts={{
                Pending: page ? counts.Pending : undefined,
                Preparing: page ? counts.Preparing : undefined,
                Ready: page ? counts.Ready : undefined,
              }}
            />
          )}
        </section>
      </div>

      <div className="grid min-w-0 gap-8 border-t pt-7 xl:grid-cols-[1.55fr_1fr] [&>section]:min-w-0">
        <section aria-labelledby="live-dashboard-latest-orders-title">
          <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
            <h2
              id="live-dashboard-latest-orders-title"
              className="font-display text-2xl font-bold"
            >
              {parity("latestOrders")}
            </h2>

            <Button
              nativeButton={false}
              role="link"
              variant="link"
              size="sm"
              render={<Link href={openOrdersHref} />}
            >
              {parity("viewAll")}

              <ArrowRight aria-hidden="true" />
            </Button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[500px] text-left text-sm">
              <thead className="border-b text-xs text-muted-foreground">
                <tr>
                  <th className="pe-3 pb-3 font-normal">{history("order")}</th>

                  <th className="pe-3 pb-3 font-normal">
                    {checkout("pickupTime")}
                  </th>

                  <th className="pe-3 pb-3 font-normal">{history("status")}</th>

                  <th className="pb-3 text-right font-normal">
                    {history("total")}
                  </th>
                </tr>
              </thead>

              <tbody>
                {recentOrders.map((order) => (
                  <tr key={order.id} className="border-b">
                    <td className="py-3 pe-3">
                      <Link
                        href={buildOrdersHref(tenantId, order.status, null)}
                        className="font-bold hover:text-primary"
                      >
                        #{order.id.slice(0, 8).toUpperCase()}
                      </Link>

                      <p className="mt-1 max-w-56 truncate text-xs text-muted-foreground">
                        {order.customerName}
                      </p>
                    </td>

                    <td className="pe-3 tabular-nums">
                      {formatPickup(
                        order.pickupAt,
                        order.pickupTimeZone,
                        props.locale
                      )}
                    </td>

                    <td className="pe-3">
                      <span className="inline-flex items-center gap-2">
                        <span
                          className={`size-2 ${statusIndicator(order.status)}`}
                        />

                        {t(`statuses.${order.status}`)}
                      </span>
                    </td>

                    <td className="text-right font-medium tabular-nums">
                      {new Intl.NumberFormat(props.locale, {
                        style: "currency",
                        currency: order.currency,
                      }).format(order.total)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {page && recentOrders.length === 0 && (
            <p className="py-5 text-sm text-muted-foreground">
              {live("emptyDashboard")}
            </p>
          )}

          {!page && dashboard.loadError && !dashboard.isStale && (
            <p className="py-5 text-sm text-muted-foreground">
              {live("orderSnapshotUnavailable")}
            </p>
          )}
        </section>

        {props.storefront}
      </div>
    </>
  )
}
