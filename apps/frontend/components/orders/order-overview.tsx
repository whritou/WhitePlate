"use client"

import { CookingPot, ShoppingBag, Wallet } from "lucide-react"
import { useMemo, useState } from "react"
import { useOrderDashboard } from "@/hooks/use-order-dashboard"
import { useKdsClock } from "@/hooks/use-kds-clock"
import { Link, useRouter } from "@/i18n/navigation"
import { OrderRealtimeConnection } from "@/components/orders/order-realtime-connection"
import { OrderTicket } from "@/components/orders/order-ticket"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { useTranslations } from "next-intl"
import type {
  OrderDashboardProps,
  OrderOverviewFilter,
  OrderStatus,
} from "@/types/orders"

const statuses = [
  "Pending",
  "Preparing",
  "Ready",
  "Completed",
  "Cancelled",
] as const
const filters: OrderOverviewFilter[] = ["all", ...statuses]

export function OrderOverview(props: OrderDashboardProps) {
  const { tenantId, role, hubUrl } = props
  const t = useTranslations("KitchenOrders")
  const live = useTranslations("LiveWorkspace")
  const router = useRouter()
  const dashboard = useOrderDashboard(props)
  const now = useKdsClock(dashboard.page?.serverTime ?? null)
  const {
    page,
    loadError,
    isStale,
    isInitialLoading,
    isFetching,
    message,
    pending,
    refresh,
    retry,
    updateStatus,
  } = dashboard
  const [selectedFilter, setSelectedFilter] =
    useState<OrderOverviewFilter>("all")
  const orders = useMemo(() => {
    return [...(page?.items ?? [])]
      .filter(
        (order) => selectedFilter === "all" || order.status === selectedFilter
      )
      .sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt))
  }, [page?.items, selectedFilter])
  const latestOrders = orders.slice(0, 4)
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
  const activeCount = counts.Pending + counts.Preparing + counts.Ready
  const loadedTotal = useMemo(() => {
    const totals = new Map<string, number>()

    for (const order of page?.items ?? [])
      totals.set(
        order.currency,
        (totals.get(order.currency) ?? 0) + order.total
      )

    return (
      [...totals]
        .map(([currency, total]) =>
          new Intl.NumberFormat(props.locale, {
            style: "currency",
            currency,
          }).format(total)
        )
        .join(" · ") || "—"
    )
  }, [page?.items, props.locale])
  const metrics = [
    {
      label: live("loadedOrders"),
      value: page?.items.length ?? "—",
      Icon: ShoppingBag,
    },
    {
      label: live("activeOrders"),
      value: page ? activeCount : "—",
      Icon: CookingPot,
    },
    ...(role === "Kitchen"
      ? []
      : [
          {
            label: live("loadedTotal"),
            value: page ? loadedTotal : "—",
            Icon: Wallet,
          },
        ]),
  ]

  return (
    <section
      aria-labelledby="dashboard-order-flow"
      aria-busy={isInitialLoading}
      className="grid min-w-0 gap-5"
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

      <div
        className={`grid gap-px border-y ${metrics.length === 3 ? "sm:grid-cols-3" : "sm:grid-cols-2"}`}
      >
        {metrics.map(({ label, value, Icon }, index) => (
          <section
            key={label}
            className={`min-w-0 py-5 ${index ? "sm:border-l sm:pl-5" : ""} ${index < metrics.length - 1 ? "border-b sm:border-b-0" : ""}`}
          >
            <div className="flex items-center justify-between gap-3 text-muted-foreground">
              <h2 className="text-sm">{label}</h2>

              <Icon aria-hidden="true" className="size-4 shrink-0" />
            </div>

            <p className="mt-2 font-display text-3xl font-bold break-words tabular-nums sm:text-4xl">
              {value}
            </p>
          </section>
        ))}
      </div>

      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2
            id="dashboard-order-flow"
            className="font-display text-2xl font-bold"
          >
            {live("kitchen")}
          </h2>

          <p className="mt-1 max-w-3xl text-sm text-muted-foreground">
            {live("dashboardLoadedScope")}
          </p>
        </div>

        <Button
          nativeButton={false}
          role="link"
          variant="outline"
          render={<Link href={`/organization/orders?tenantId=${tenantId}`} />}
        >
          {live("openOrders")}
        </Button>
      </div>

      <div
        role="group"
        aria-label={t("filterLabel")}
        className="grid grid-cols-2 gap-2 sm:grid-cols-3 xl:grid-cols-6"
      >
        {filters.map((status) => {
          const count =
            status === "all" ? (page?.items.length ?? 0) : counts[status]

          return (
            <Button
              key={status}
              type="button"
              size="lg"
              variant={selectedFilter === status ? "secondary" : "outline"}
              aria-pressed={selectedFilter === status}
              disabled={!page || isInitialLoading}
              onClick={() => setSelectedFilter(status)}
              className="min-h-12 justify-between gap-2 px-3"
            >
              <span className="truncate">{t(`statuses.${status}`)}</span>

              <Badge variant="outline" className="shrink-0 tabular-nums">
                {page ? count : "—"}
              </Badge>
            </Button>
          )
        })}
      </div>

      {page && (
        <p className="text-sm text-muted-foreground">
          {live("showingDashboardOrders", {
            visibleCount: Math.min(latestOrders.length, orders.length),
            loadedCount: page.items.length,
          })}
        </p>
      )}

      {isInitialLoading ? (
        <div
          aria-hidden="true"
          className="grid min-w-0 gap-4 sm:grid-cols-2 2xl:grid-cols-4"
        >
          {Array.from({ length: 4 }, (_, index) => (
            <div
              key={index}
              aria-hidden="true"
              className="grid gap-3 rounded-lg border p-4"
            >
              <Skeleton className="h-6 w-2/3" />

              <Skeleton className="h-4 w-1/2" />

              <Skeleton className="h-20 w-full" />

              <Skeleton className="h-10 w-1/3" />
            </div>
          ))}
        </div>
      ) : page && latestOrders.length > 0 ? (
        <div className="grid min-w-0 items-start gap-4 sm:grid-cols-2 2xl:grid-cols-4">
          {latestOrders.map((order) => (
            <OrderTicket
              key={order.id}
              order={order}
              role={role}
              locale={props.locale}
              now={now}
              pending={pending}
              onUpdate={updateStatus}
              headingLevel="h3"
            />
          ))}
        </div>
      ) : page ? (
        <Card className="border-dashed p-6 text-center">
          <h3 className="font-display text-lg font-bold">
            {page.items.length === 0 && selectedFilter === "all"
              ? live("emptyDashboard")
              : t("noFilterResults")}
          </h3>
        </Card>
      ) : null}
    </section>
  )
}
