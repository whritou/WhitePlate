"use client"

import { useMemo } from "react"
import { useOrderDashboard } from "@/hooks/use-order-dashboard"
import { Link, useRouter } from "@/i18n/navigation"
import { OrderRealtimeConnection } from "@/components/orders/order-realtime-connection"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { useTranslations } from "next-intl"
import type { OrderDashboardProps, OrderStatus } from "@/types/orders"

const statuses: OrderStatus[] = [
  "Pending",
  "Preparing",
  "Ready",
  "Completed",
  "Cancelled",
]

const statusVariants = {
  Pending: "warning",
  Preparing: "info",
  Ready: "success",
  Completed: "neutral",
  Cancelled: "destructive",
} as const

export function OrderOverview(props: OrderDashboardProps) {
  const { tenantId, hubUrl } = props
  const t = useTranslations("KitchenOrders")
  const live = useTranslations("LiveWorkspace")
  const router = useRouter()
  const dashboard = useOrderDashboard(props)
  const {
    page,
    loadError,
    isStale,
    isInitialLoading,
    isFetching,
    message,
    refresh,
    retry,
  } = dashboard
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

  return (
    <section
      aria-labelledby="dashboard-order-flow"
      aria-busy={isInitialLoading}
      className="grid min-w-0 gap-3"
    >
      <OrderRealtimeConnection
        tenantId={tenantId}
        hubUrl={
          loadError === "forbidden" || loadError === "unauthorized"
            ? null
            : hubUrl
        }
        orders={page?.items ?? []}
        serverTime={page?.serverTime ?? null}
        onRefresh={refresh}
      />

      <p
        role="status"
        aria-live="polite"
        aria-atomic="true"
        className="min-h-5 text-sm text-muted-foreground"
      >
        {isInitialLoading
          ? t("loadingOrders")
          : isFetching && page
            ? t("refreshingOrders")
            : null}
      </p>

      {loadError && (
        <Alert
          variant={isStale ? "warning" : "destructive"}
          role={isStale ? "status" : "alert"}
        >
          <AlertDescription>
            {isStale ? t("stale") : t(`errors.${loadError}`)}

            <Button
              variant="link"
              onClick={() =>
                loadError === "invalid" ? router.refresh() : void retry()
              }
            >
              {t("retry")}
            </Button>
          </AlertDescription>
        </Alert>
      )}

      {message && (
        <Alert variant="destructive" role="alert">
          <AlertDescription>{t(message)}</AlertDescription>
        </Alert>
      )}

      <Card aria-labelledby="dashboard-order-flow" className="min-w-0">
        <CardHeader className="flex-row flex-wrap items-center justify-between gap-3">
          <div className="min-w-0">
            <CardTitle>
              <h2 id="dashboard-order-flow" className="font-display text-xl">
                {live("kitchen")}
              </h2>
            </CardTitle>

            {page && (
              <CardDescription className="mt-1">
                {live("dashboardLoadedScope", { count: page.items.length })}
              </CardDescription>
            )}
          </div>

          <Button
            nativeButton={false}
            role="link"
            variant="outline"
            render={<Link href={`/organization/orders?tenantId=${tenantId}`} />}
          >
            {live("openOrders")}
          </Button>
        </CardHeader>

        <CardContent>
          {isInitialLoading ? (
            <div
              aria-hidden="true"
              className="grid grid-cols-2 gap-2 sm:grid-cols-5"
            >
              {statuses.map((status) => (
                <div key={status} className="grid gap-2 border p-3">
                  <Skeleton className="h-4 w-2/3 rounded-none" />

                  <Skeleton className="h-6 w-1/3 rounded-none" />
                </div>
              ))}
            </div>
          ) : page ? (
            <>
              <ul className="grid grid-cols-2 gap-2 sm:grid-cols-5">
                {statuses.map((status) => (
                  <li
                    key={status}
                    className="flex min-w-0 items-center justify-between gap-2 rounded-md border bg-muted/30 px-3 py-2"
                  >
                    <span className="min-w-0 truncate text-sm font-medium">
                      {t(`statuses.${status}`)}
                    </span>

                    <Badge
                      variant={statusVariants[status]}
                      className="min-w-8 shrink-0 justify-center tabular-nums"
                      aria-label={t("statusCount", {
                        status: t(`statuses.${status}`),
                        count: counts[status],
                      })}
                    >
                      {counts[status]}
                    </Badge>
                  </li>
                ))}
              </ul>

              {page.items.length === 0 && (
                <p className="mt-3 text-sm text-muted-foreground">
                  {live("emptyDashboard")}
                </p>
              )}
            </>
          ) : null}
        </CardContent>
      </Card>
    </section>
  )
}
