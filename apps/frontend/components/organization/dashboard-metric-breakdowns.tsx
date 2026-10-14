"use client"

import { useTranslations } from "next-intl"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import type { DashboardMetrics } from "@/types/dashboard-metrics"

export function HourlyOrdersCard({
  metrics,
  locale,
  formatNumber,
}: {
  metrics: DashboardMetrics
  locale: string
  formatNumber: (value: number) => string
}) {
  const t = useTranslations("LiveWorkspace")
  const maximum = Math.max(
    1,
    ...metrics.hourlyOrders.flatMap((hour) => [hour.current, hour.previous])
  )
  const hourFormatter = new Intl.DateTimeFormat(locale, {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "UTC",
  })

  return (
    <Card>
      <CardHeader>
        <CardTitle>
          <h3>{t("hourlyOrders")}</h3>
        </CardTitle>

        <CardDescription>{t("hourlyOrdersHelp")}</CardDescription>

        <ul className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground">
          <li className="flex items-center gap-2">
            <span
              className="size-2.5 rounded-sm bg-primary"
              aria-hidden="true"
            />

            {t("todayLegend")}
          </li>

          <li className="flex items-center gap-2">
            <span
              className="size-2.5 rounded-sm bg-muted-foreground/40"
              aria-hidden="true"
            />

            {t("yesterdayLegend")}
          </li>
        </ul>
      </CardHeader>

      <CardContent>
        {metrics.orderCount === 0 && metrics.comparisonOrderCount === 0 && (
          <p className="mb-3 text-sm text-muted-foreground">
            {t("noOrderVolume")}
          </p>
        )}

        <figure>
          <div
            aria-hidden="true"
            className="grid h-36 [grid-template-columns:repeat(24,minmax(0,1fr))] items-end border-b"
          >
            {metrics.hourlyOrders.map(({ hour, current, previous }) => (
              <div key={hour} className="grid h-full grid-rows-[1fr_auto]">
                <div className="flex min-h-0 items-end justify-center gap-px px-px">
                  <span
                    className="w-1/2 rounded-t-sm bg-primary"
                    style={{ height: barHeight(current, maximum) }}
                  />

                  <span
                    className="w-1/2 rounded-t-sm bg-muted-foreground/40"
                    style={{ height: barHeight(previous, maximum) }}
                  />
                </div>

                <span className="h-5 text-center text-[0.625rem] leading-5 text-muted-foreground">
                  {hour % 3 === 0
                    ? hourFormatter.format(new Date(Date.UTC(2026, 0, 1, hour)))
                    : ""}
                </span>
              </div>
            ))}
          </div>

          <table className="sr-only">
            <caption>
              {t("hourlyAccessibleSummary", {
                date: metrics.businessDate,
                comparisonDate: metrics.comparisonDate,
                timeZone: metrics.timeZone,
              })}
            </caption>

            <thead>
              <tr>
                <th scope="col">{t("hourColumn")}</th>

                <th scope="col">{t("todayLegend")}</th>

                <th scope="col">{t("yesterdayLegend")}</th>
              </tr>
            </thead>

            <tbody>
              {metrics.hourlyOrders.map(({ hour, current, previous }) => (
                <tr key={hour}>
                  <th scope="row">
                    {hourFormatter.format(new Date(Date.UTC(2026, 0, 1, hour)))}
                  </th>

                  <td>{formatNumber(current)}</td>

                  <td>{formatNumber(previous)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </figure>
      </CardContent>
    </Card>
  )
}

export function TopSellingCard({
  metrics,
  formatNumber,
}: {
  metrics: DashboardMetrics
  formatNumber: (value: number) => string
}) {
  const t = useTranslations("LiveWorkspace")

  return (
    <Card>
      <CardHeader>
        <CardTitle>
          <h3>{t("topSellingItems")}</h3>
        </CardTitle>

        <CardDescription>{t("topSellingItemsHelp")}</CardDescription>
      </CardHeader>

      <CardContent>
        {metrics.topSellingItems.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            {t("noTopSellingItems")}
          </p>
        ) : (
          <ol className="divide-y">
            {metrics.topSellingItems.map((item, index) => (
              <li
                key={`${item.productId}-${item.productName}`}
                className="flex items-center justify-between gap-3 py-3 first:pt-0 last:pb-0"
              >
                <span className="min-w-0 break-words">
                  <span className="me-2 text-muted-foreground">
                    {index + 1}.
                  </span>

                  {item.productName}
                </span>

                <span className="shrink-0 font-semibold tabular-nums">
                  {t("quantityValue", { count: formatNumber(item.quantity) })}
                </span>
              </li>
            ))}
          </ol>
        )}
      </CardContent>
    </Card>
  )
}

function barHeight(value: number, maximum: number) {
  return value === 0 ? "0%" : `${Math.max(4, (value / maximum) * 100)}%`
}
