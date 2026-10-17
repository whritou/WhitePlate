"use client"
import { Copy } from "@/components/lovable/copy"
import { SourceButton } from "@/components/ui/lovable-controls"
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts"
import { C, eur, formatCurrency } from "./analytics-shared"
import { useAnalyticsPageView } from "./analytics-AnalyticsPage-context"
import { AnalyticsPageKitchen } from "./analytics-AnalyticsPage-kitchen"
import { useLocale, useTranslations } from "next-intl"
export function AnalyticsPageSection1() {
  const { metric, setMetric, d, kpis, maxDish, pageMode, dishBarMetric } =
    useAnalyticsPageView()
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
    <main className="space-y-6 px-6 pb-12">
      <div className="grid grid-cols-2 gap-px border bg-foreground md:grid-cols-3 xl:grid-cols-6">
        <Copy>
          {kpis.map((x) => {
            const good =
              x.delta !== null && (x.invert ? x.delta < 0 : x.delta > 0)

            return (
              <div key={x.k} className="bg-background p-5">
                <p className="label-mono text-muted-foreground">
                  <Copy>{x.k}</Copy>
                </p>

                <p className="mt-2 font-display text-3xl font-bold">
                  <Copy>{x.v}</Copy>
                </p>

                <p
                  className={`label-mono mt-1 ${x.note ? "text-primary" : good ? "text-primary" : "text-destructive"}`}
                >
                  <Copy>
                    {x.note ??
                      (x.delta === null
                        ? t("comparisonUnavailable")
                        : `${x.delta > 0 ? "▲" : "▼"} ${Math.abs(x.delta).toFixed(1)}% ${liveLabel("vsPrevious", "vs previous")}`)}
                  </Copy>
                </p>
              </div>
            )
          })}
        </Copy>
      </div>

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
                  className={`label-mono px-3 py-1.5 ${metric === m ? "bg-foreground text-background" : ""}`}
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

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="card-hard bg-background lg:col-span-2">
          <p className="border-b px-5 py-3 font-display text-lg font-bold">
            <Copy>{liveLabel("peakHours", "Peak hours")}</Copy>
          </p>

          <div className="h-64 p-4">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={d.hours}>
                <CartesianGrid stroke={C.grid} vertical={false} />

                <XAxis
                  dataKey="hour"
                  tick={{ fontSize: 11, fill: C.muted }}
                  tickLine={false}
                  axisLine={false}
                />

                <YAxis
                  tick={{ fontSize: 11, fill: C.muted }}
                  tickLine={false}
                  axisLine={false}
                  width={36}
                />

                <Tooltip
                  cursor={{ fill: C.grid }}
                  contentStyle={{
                    border: "1px solid var(--color-foreground)",
                    borderRadius: 0,
                    background: "var(--color-background)",
                  }}
                />

                <Bar dataKey="orders">
                  <Copy>
                    {d.hours.map((h, i) => (
                      <Cell
                        key={i}
                        fill={
                          h.orders >=
                          Math.max(...d.hours.map((x) => x.orders)) * 0.8
                            ? C.primary
                            : C.ink
                        }
                        fillOpacity={
                          h.orders >=
                          Math.max(...d.hours.map((x) => x.orders)) * 0.8
                            ? 1
                            : 0.25
                        }
                      />
                    ))}
                  </Copy>
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="card-hard bg-background">
          <p className="border-b px-5 py-3 font-display text-lg font-bold">
            <Copy>{liveLabel("orderChannels", "Order channels")}</Copy>
          </p>

          <div className="h-44">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={d.channels}
                  dataKey="value"
                  innerRadius={45}
                  outerRadius={70}
                  stroke="var(--color-background)"
                  strokeWidth={3}
                >
                  <Copy>
                    {d.channels.map((_, i) => (
                      <Cell key={i} fill={[C.primary, C.accent, C.ink][i]} />
                    ))}
                  </Copy>
                </Pie>

                <Tooltip
                  formatter={(v: number) => `${v}%`}
                  contentStyle={{
                    border: "1px solid var(--color-foreground)",
                    borderRadius: 0,
                    background: "var(--color-background)",
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <ul className="space-y-2 px-5 pb-5">
            <Copy>
              {d.channels.map((c, i) => (
                <li
                  key={c.name}
                  className="flex items-center justify-between text-sm"
                >
                  <span className="flex items-center gap-2">
                    <span
                      className="h-3 w-3"
                      style={{ background: [C.primary, C.accent, C.ink][i] }}
                    />

                    <Copy>{c.name}</Copy>
                  </span>

                  <span className="font-bold">
                    <Copy>
                      {c.state === "unavailable"
                        ? "—"
                        : c.state === "untracked"
                          ? t("untracked")
                          : `${c.value}%`}
                    </Copy>
                  </span>
                </li>
              ))}
            </Copy>
          </ul>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="card-hard bg-background lg:col-span-2">
          <p className="border-b px-5 py-3 font-display text-lg font-bold">
            <Copy>{liveLabel("bestSellingDishes", "Best-selling dishes")}</Copy>
          </p>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="label-mono border-b text-left text-muted-foreground">
                  <th className="px-5 py-2">#</th>

                  <th>
                    <Copy>{liveLabel("dish", "Dish")}</Copy>
                  </th>

                  <th className="w-1/3" />

                  <th className="text-right">
                    <Copy>{liveLabel("sold", "Sold")}</Copy>
                  </th>

                  <th className="px-5 text-right">
                    <Copy>{liveLabel("revenue", "Revenue")}</Copy>
                  </th>
                </tr>
              </thead>

              <tbody>
                <Copy>
                  {d.dishes.map((x, i) => (
                    <tr
                      key={`${x.tenantId ?? "demo"}-${x.n}`}
                      className="border-b last:border-0"
                    >
                      <td className="px-5 py-2.5 font-display font-bold">
                        <Copy>{x.rank ?? i + 1}</Copy>
                      </td>

                      <td className="font-semibold">
                        <Copy>
                          {x.restaurant ? `${x.n} · ${x.restaurant}` : x.n}
                        </Copy>
                      </td>

                      <td className="pr-4">
                        <div className="h-2 bg-secondary">
                          <div
                            className="h-2 bg-primary"
                            style={{
                              width: `${
                                ((dishBarMetric === "quantity"
                                  ? x.q
                                  : dishBarMetric === "normalized"
                                    ? (x.barValue ?? 0)
                                    : x.rev) /
                                  maxDish) *
                                100
                              }%`,
                            }}
                          />
                        </div>
                      </td>

                      <td className="text-right">
                        <Copy>{x.q}</Copy>
                      </td>

                      <td className="px-5 text-right font-bold">
                        <Copy>
                          {x.currency
                            ? formatCurrency(x.rev, x.currency, locale)
                            : eur(x.rev)}
                        </Copy>
                      </td>
                    </tr>
                  ))}

                  {d.dishes.length === 0 && (
                    <tr>
                      <td
                        colSpan={5}
                        className="px-5 py-6 text-sm text-muted-foreground"
                      >
                        {t("noDishData")}
                      </td>
                    </tr>
                  )}
                </Copy>
              </tbody>
            </table>
          </div>
        </div>

        <AnalyticsPageKitchen />
      </div>
    </main>
  )
}
