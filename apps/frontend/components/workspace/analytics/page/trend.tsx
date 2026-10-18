"use client"

import { Copy } from "@/components/shared/translated-copy"
import { SourceButton } from "@/components/ui/lovable-controls"
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts"
import { useLocale, useTranslations } from "next-intl"
import { C, formatCurrency } from "./shared"
import { useAnalyticsPageView } from "./context"

export function AnalyticsPageTrend() {
  const { metric, setMetric, d, pageMode } = useAnalyticsPageView()
  const t = useTranslations("AnalyticsLive")
  const locale = useLocale()
  const liveLabel = (key: Parameters<typeof t>[0], demo: string) =>
    pageMode === "live" ? t(key) : demo
  const currencies = [
    ...new Set(
      d.series.flatMap((point) => [
        ...Object.keys(point.revenueByCurrency ?? {}),
        ...Object.keys(point.previousRevenueByCurrency ?? {}),
      ])
    ),
  ]
  const chartColors = [C.primary, C.accent, C.ink]

  return (
    <div className="card-hard bg-background">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b px-5 py-3">
        <p className="font-display text-lg font-bold">
          <Copy>
            {metric === "revenue"
              ? liveLabel("revenue", "Revenue")
              : liveLabel("orders", "Orders")}
          </Copy>{" "}
          <Copy>{liveLabel("overTime", "over time")}</Copy>
        </p>

        <div className="flex border">
          <Copy>
            {(["revenue", "orders"] as const).map((m) => (
              <SourceButton
                key={m}
                onClick={() => setMetric(m)}
                aria-pressed={metric === m}
                className={`label-mono px-3 py-1.5 ${metric === m ? "bg-foreground text-background hover:bg-foreground hover:text-background" : "text-foreground hover:bg-secondary hover:text-secondary-foreground"}`}
              >
                <Copy>
                  {m === "revenue"
                    ? liveLabel("revenue", "revenue")
                    : liveLabel("orders", "orders")}
                </Copy>
              </SourceButton>
            ))}
          </Copy>
        </div>
      </div>

      <div className="h-72 p-4">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={d.series} margin={{ left: 0, right: 8, top: 8 }}>
            <defs>
              <linearGradient id="g" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={C.primary} stopOpacity={0.35} />

                <stop offset="100%" stopColor={C.primary} stopOpacity={0} />
              </linearGradient>
            </defs>

            <CartesianGrid stroke={C.grid} vertical={false} />

            <XAxis
              dataKey="day"
              tick={{ fontSize: 11, fill: C.muted }}
              tickLine={false}
              axisLine={false}
              minTickGap={24}
            />

            <YAxis
              tick={{ fontSize: 11, fill: C.muted }}
              tickLine={false}
              axisLine={false}
              width={50}
              tickFormatter={(v) =>
                metric === "revenue"
                  ? `${currencies.length === 1 ? `${currencies[0]} ` : currencies.length === 0 ? "€" : ""}${v >= 1000 ? `${(v / 1000).toFixed(1)}k` : v}`
                  : v
              }
            />

            <Tooltip
              contentStyle={{
                border: "1px solid var(--color-foreground)",
                borderRadius: 0,
                background: "var(--color-background)",
              }}
              formatter={(v: number, n: string) => [
                metric === "revenue" && currencies.length > 1
                  ? `${v.toLocaleString(locale)} ${n.split(" · ")[0]}`
                  : metric === "revenue"
                    ? formatCurrency(v, currencies[0] ?? "EUR", locale)
                    : v,
                n,
              ]}
            />

            {metric === "revenue" && currencies.length > 0 ? (
              currencies.map((currency, index) => (
                <Copy key={currency}>
                  <Area
                    type="monotone"
                    dataKey={(row: {
                      previousRevenueByCurrency?: Record<string, number>
                    }) => row.previousRevenueByCurrency?.[currency] ?? 0}
                    name={`${currency} · ${t("previousPeriod")}`}
                    stroke={chartColors[index % chartColors.length]}
                    strokeDasharray="4 4"
                    fill="none"
                    strokeWidth={1.5}
                  />

                  <Area
                    type="monotone"
                    dataKey={(row: {
                      revenueByCurrency?: Record<string, number>
                    }) => row.revenueByCurrency?.[currency] ?? 0}
                    name={currency}
                    stroke={chartColors[index % chartColors.length]}
                    fill={index === 0 ? "url(#g)" : "none"}
                    strokeWidth={2.5}
                  />
                </Copy>
              ))
            ) : (
              <>
                <Copy>
                  {metric === "revenue" && (
                    <Area
                      type="monotone"
                      dataKey="prev"
                      name={liveLabel("previousPeriod", "Previous period")}
                      stroke={C.muted}
                      strokeDasharray="4 4"
                      fill="none"
                      strokeWidth={1.5}
                    />
                  )}
                </Copy>

                <Area
                  type="monotone"
                  dataKey={metric}
                  name={
                    metric === "revenue"
                      ? liveLabel("revenue", "revenue")
                      : liveLabel("orders", "orders")
                  }
                  stroke={C.primary}
                  fill="url(#g)"
                  strokeWidth={2.5}
                />
              </>
            )}
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {metric === "revenue" && currencies.length > 1 && (
        <ul className="flex flex-wrap gap-4 border-t px-5 py-3 text-xs text-muted-foreground">
          {currencies.map((currency, index) => (
            <li key={currency} className="flex items-center gap-2">
              <span
                className="h-2 w-2"
                style={{
                  background: chartColors[index % chartColors.length],
                }}
              />

              {currency}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
