"use client"

import { Activity, Clock3, ShoppingBag, Wallet } from "lucide-react"
import { useTranslations } from "next-intl"
import { useDashboardMetrics } from "@/hooks/use-dashboard-metrics"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import type { DashboardMetricsStripProps } from "@/types/dashboard-metrics"

export function DashboardMetricsStrip(props: DashboardMetricsStripProps) {
  const t = useTranslations("LiveWorkspace")
  const dashboard = useDashboardMetrics(props)
  const metrics = dashboard.metrics
  const number = new Intl.NumberFormat(props.locale, {
    maximumFractionDigits: 1,
  })
  const money = metrics
    ? new Intl.NumberFormat(props.locale, {
        style: "currency",
        currency: metrics.currency,
      })
    : null
  const columns = dashboard.canViewOrderValue
    ? "xl:grid-cols-4"
    : "xl:grid-cols-3"
  const statusMessage = dashboard.isInitialLoading
    ? t("metricsLoading")
    : dashboard.isFetching && metrics
      ? t("metricsRefreshing")
      : null

  return (
    <>
      {statusMessage && (
        <p
          role="status"
          aria-live="polite"
          aria-atomic="true"
          className="text-sm text-muted-foreground"
        >
          {statusMessage}
        </p>
      )}

      {dashboard.loadError && (
        <Alert
          variant={metrics ? "warning" : "destructive"}
          role={metrics ? "status" : "alert"}
        >
          <AlertDescription>
            {metrics
              ? t("metricsStale")
              : dashboard.loadError === "unauthorized"
                ? t("metricsErrors.unauthorized")
                : dashboard.loadError === "forbidden"
                  ? t("metricsErrors.forbidden")
                  : dashboard.loadError === "invalid"
                    ? t("metricsErrors.invalid")
                    : t("metricsErrors.unavailable")}

            <Button
              variant="link"
              onClick={() => void dashboard.retry()}
              className="ms-2"
            >
              {t("retry")}
            </Button>
          </AlertDescription>
        </Alert>
      )}

      {dashboard.isInitialLoading ? (
        <div
          aria-hidden="true"
          className={`grid grid-cols-2 border-y sm:grid-cols-2 ${columns}`}
        >
          {Array.from({ length: dashboard.canViewOrderValue ? 4 : 3 }).map(
            (_, index) => (
              <div
                key={index}
                className={`grid gap-3 border-b py-6 pe-6 xl:border-b-0 ${index ? "xl:border-s xl:ps-6" : ""}`}
              >
                <Skeleton className="h-4 w-2/3" />

                <Skeleton className="h-10 w-1/3" />

                <Skeleton className="h-4 w-1/2" />
              </div>
            )
          )}
        </div>
      ) : metrics ? (
        <section
          aria-label={t("metricsTitle")}
          className={`grid grid-cols-2 border-y sm:grid-cols-2 ${columns}`}
        >
          <Metric
            index={0}
            title={t("todayOrders")}
            value={number.format(metrics.orderCount)}
            note={t("ordersYesterday", {
              count: number.format(metrics.comparisonOrderCount),
            })}
            icon={Activity}
          />

          <Metric
            index={1}
            title={t("activeQueue")}
            value={number.format(metrics.activeOrders.total)}
            note={t("queueBreakdown", {
              pending: number.format(metrics.activeOrders.pending),
              preparing: number.format(metrics.activeOrders.preparing),
              ready: number.format(metrics.activeOrders.ready),
            })}
            icon={ShoppingBag}
          />

          {dashboard.canViewOrderValue && (
            <Metric
              index={2}
              title={t("orderValue")}
              value={money!.format(metrics.orderValue ?? 0)}
              note={t("orderValueCompared", {
                value: money!.format(metrics.comparisonOrderValue ?? 0),
              })}
              icon={Wallet}
            />
          )}

          <Metric
            index={dashboard.canViewOrderValue ? 3 : 2}
            title={t("averagePrep")}
            value={
              metrics.averagePreparationMinutes === null
                ? "—"
                : t("minutesValue", {
                    minutes: number.format(metrics.averagePreparationMinutes),
                  })
            }
            note={
              metrics.preparationSampleCount > 0
                ? t("prepSampleCount", {
                    count: number.format(metrics.preparationSampleCount),
                  })
                : t("prepInsufficient")
            }
            icon={Clock3}
          />
        </section>
      ) : null}
    </>
  )
}

function Metric({
  index,
  title,
  value,
  note,
  icon: Icon,
}: {
  index: number
  title: string
  value: string
  note: string
  icon: typeof Activity
}) {
  return (
    <div
      className={`border-b py-6 pe-6 xl:border-b-0 ${index % 2 ? "ps-4" : ""} ${index ? "xl:border-s xl:ps-6" : ""}`}
    >
      <div className="flex flex-wrap items-center justify-between gap-2 text-muted-foreground">
        <span className="text-sm">{title}</span>

        <Icon aria-hidden="true" className="size-4" />
      </div>

      <p className="mt-3 font-display text-4xl font-bold tabular-nums">
        {value}
      </p>

      <p className="mt-2 text-xs text-muted-foreground">{note}</p>
    </div>
  )
}
