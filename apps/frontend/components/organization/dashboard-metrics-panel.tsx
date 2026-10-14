"use client"

import { useTranslations } from "next-intl"
import { useDashboardMetrics } from "@/hooks/use-dashboard-metrics"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import type { DashboardMetrics } from "@/types/dashboard-metrics"
import type { RestaurantRole } from "@/types/orders"
import { HourlyOrdersCard, TopSellingCard } from "./dashboard-metric-breakdowns"

export function DashboardMetricsPanel({
  userId,
  tenantId,
  locale,
  role,
  initialMetrics,
}: {
  userId: string
  tenantId: string
  locale: string
  role: RestaurantRole
  initialMetrics: DashboardMetrics | null
}) {
  const t = useTranslations("LiveWorkspace")
  const dashboard = useDashboardMetrics({
    userId,
    tenantId,
    locale,
    role,
    initialMetrics,
  })
  const metrics = dashboard.metrics
  const money = metrics
    ? new Intl.NumberFormat(locale, {
        style: "currency",
        currency: metrics.currency,
      })
    : null
  const number = new Intl.NumberFormat(locale, { maximumFractionDigits: 1 })
  const today = metrics ? formatDate(locale, metrics.businessDate) : ""
  const yesterday = metrics ? formatDate(locale, metrics.comparisonDate) : ""

  return (
    <section
      aria-labelledby="dashboard-metrics-title"
      aria-busy={dashboard.isInitialLoading}
      className="grid min-w-0 gap-4 border-t pt-7"
    >
      <header>
        <h2
          id="dashboard-metrics-title"
          className="font-display text-2xl font-bold"
        >
          {t("metricsTitle")}
        </h2>

        {metrics ? (
          <p className="mt-1 text-sm text-muted-foreground">
            {t("metricsPeriod", {
              date: today,
              comparisonDate: yesterday,
              timeZone: metrics.timeZone,
            })}
          </p>
        ) : (
          <p className="mt-1 text-sm text-muted-foreground">
            {t("metricsHelp")}
          </p>
        )}
      </header>

      <p
        role="status"
        aria-live="polite"
        aria-atomic="true"
        className="min-h-5 text-sm text-muted-foreground"
      >
        {dashboard.isInitialLoading
          ? t("metricsLoading")
          : dashboard.isFetching && metrics
            ? t("metricsRefreshing")
            : null}
      </p>

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
        <MetricsLoading />
      ) : metrics ? (
        <>
          <div className="grid min-w-0 gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <MetricCard
              title={t("todayOrders")}
              value={number.format(metrics.orderCount)}
              description={t("ordersYesterday", {
                count: metrics.comparisonOrderCount,
              })}
              help={t("ordersIncludesCancelled")}
            />

            <MetricCard
              title={t("activeQueue")}
              value={number.format(metrics.activeOrders.total)}
              description={t("queueBreakdown", {
                pending: metrics.activeOrders.pending,
                preparing: metrics.activeOrders.preparing,
                ready: metrics.activeOrders.ready,
              })}
            />

            {dashboard.canViewOrderValue && (
              <MetricCard
                title={t("orderValue")}
                value={money!.format(metrics.orderValue ?? 0)}
                description={t("orderValueCompared", {
                  value: money!.format(metrics.comparisonOrderValue ?? 0),
                })}
                help={t("orderValueHelp")}
              />
            )}

            <MetricCard
              title={t("averagePrep")}
              value={
                metrics.averagePreparationMinutes === null
                  ? "—"
                  : t("minutesValue", {
                      minutes: number.format(metrics.averagePreparationMinutes),
                    })
              }
              description={
                metrics.preparationSampleCount > 0
                  ? t("prepSampleCount", {
                      count: metrics.preparationSampleCount,
                    })
                  : t("prepInsufficient")
              }
            />
          </div>

          <div className="grid min-w-0 gap-3 xl:grid-cols-[minmax(0,1.6fr)_minmax(18rem,0.8fr)]">
            <HourlyOrdersCard
              metrics={metrics}
              locale={locale}
              formatNumber={(value) => number.format(value)}
            />

            <TopSellingCard metrics={metrics} formatNumber={number.format} />
          </div>
        </>
      ) : null}
    </section>
  )
}

function MetricCard({
  title,
  value,
  description,
  help,
}: {
  title: string
  value: string
  description: string
  help?: string
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>
          <h3>{title}</h3>
        </CardTitle>

        <CardDescription>{description}</CardDescription>
      </CardHeader>

      <CardContent>
        <p className="font-display text-3xl font-bold break-words tabular-nums">
          {value}
        </p>

        {help && <p className="mt-2 text-sm text-muted-foreground">{help}</p>}
      </CardContent>
    </Card>
  )
}

function MetricsLoading() {
  return (
    <div className="grid gap-3" aria-hidden="true">
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }, (_, index) => (
          <div key={index} className="grid gap-3 rounded-lg border p-4">
            <Skeleton className="h-5 w-2/3" />

            <Skeleton className="h-4 w-1/2" />

            <Skeleton className="h-9 w-1/3" />
          </div>
        ))}
      </div>

      <div className="grid gap-3 xl:grid-cols-[minmax(0,1.6fr)_minmax(18rem,0.8fr)]">
        <Skeleton className="h-64 rounded-lg" />

        <Skeleton className="h-64 rounded-lg" />
      </div>
    </div>
  )
}

function formatDate(locale: string, date: string) {
  return new Intl.DateTimeFormat(locale, {
    dateStyle: "long",
    timeZone: "UTC",
  }).format(new Date(`${date}T12:00:00Z`))
}
