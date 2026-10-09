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
import { C, eur } from "./analytics-shared"
import { useAnalyticsPageView } from "./analytics-AnalyticsPage-context"
export function AnalyticsPageSection1() {
  const { rest, metric, setMetric, d, kpis, maxDish } = useAnalyticsPageView()

  return (
    <main className="space-y-6 px-6 pb-12">
      <div className="grid grid-cols-2 gap-px border bg-foreground md:grid-cols-3 xl:grid-cols-6">
        <Copy>
          {kpis.map((x) => {
            const good = x.invert ? x.delta < 0 : x.delta > 0

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
                      `${x.delta > 0 ? "▲" : "▼"} ${Math.abs(x.delta).toFixed(1)}% vs previous`}
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
            <Copy>{metric === "revenue" ? "Revenue" : "Orders"}</Copy>{" "}
            <Copy> over time</Copy>
          </p>

          <div className="flex border">
            <Copy>
              {(["revenue", "orders"] as const).map((m) => (
                <SourceButton
                  key={m}
                  onClick={() => setMetric(m)}
                  className={`label-mono px-3 py-1.5 ${metric === m ? "bg-foreground text-background" : ""}`}
                >
                  <Copy>{m}</Copy>
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
                    ? `€${v >= 1000 ? `${(v / 1000).toFixed(1)}k` : v}`
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
                  metric === "revenue" ? eur(v) : v,
                  n === "prev" ? "Previous period" : metric,
                ]}
              />

              <Copy>
                {metric === "revenue" && (
                  <Area
                    type="monotone"
                    dataKey="prev"
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
                stroke={C.primary}
                fill="url(#g)"
                strokeWidth={2.5}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="card-hard bg-background lg:col-span-2">
          <p className="border-b px-5 py-3 font-display text-lg font-bold">
            <Copy>Peak hours</Copy>
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
            <Copy>Order channels</Copy>
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
                    <Copy>{c.value}</Copy>%
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
            <Copy>Best-selling dishes</Copy>
          </p>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="label-mono border-b text-left text-muted-foreground">
                  <th className="px-5 py-2">#</th>

                  <th>
                    <Copy>Dish</Copy>
                  </th>

                  <th className="w-1/3" />

                  <th className="text-right">
                    <Copy>Sold</Copy>
                  </th>

                  <th className="px-5 text-right">
                    <Copy>Revenue</Copy>
                  </th>
                </tr>
              </thead>

              <tbody>
                <Copy>
                  {d.dishes.map((x, i) => (
                    <tr key={x.n} className="border-b last:border-0">
                      <td className="px-5 py-2.5 font-display font-bold">
                        <Copy>{i + 1}</Copy>
                      </td>

                      <td className="font-semibold">
                        <Copy>{x.n}</Copy>
                      </td>

                      <td className="pr-4">
                        <div className="h-2 bg-secondary">
                          <div
                            className="h-2 bg-primary"
                            style={{ width: `${(x.rev / maxDish) * 100}%` }}
                          />
                        </div>
                      </td>

                      <td className="text-right">
                        <Copy>{x.q}</Copy>
                      </td>

                      <td className="px-5 text-right font-bold">
                        <Copy>{eur(x.rev)}</Copy>
                      </td>
                    </tr>
                  ))}
                </Copy>
              </tbody>
            </table>
          </div>
        </div>

        <div className="card-hard bg-ink text-ink-foreground">
          <p className="border-b border-ink-foreground/20 px-5 py-3 font-display text-lg font-bold">
            <Copy>Kitchen performance</Copy>
          </p>

          <div className="space-y-5 p-5">
            <Copy>
              {[
                ["On-time pickups", 94 - rest, "%"],
                ["Accepted < 1 min", 88 + rest, "%"],
                ["Cancelled orders", 2 + rest * 0.3, "%"],
              ].map(([k, v, u]) => (
                <div key={k as string}>
                  <div className="flex justify-between text-sm">
                    <span>
                      <Copy>{k}</Copy>
                    </span>

                    <span className="font-bold">
                      <Copy>
                        {(v as number).toFixed(0)}

                        <Copy></Copy>

                        {u}
                      </Copy>
                    </span>
                  </div>

                  <div className="mt-1.5 h-2 bg-ink-foreground/15">
                    <div className="h-2 bg-accent" style={{ width: `${v}%` }} />
                  </div>
                </div>
              ))}
            </Copy>

            <div className="grid grid-cols-2 gap-px border border-ink-foreground/20 bg-ink-foreground/20">
              <Copy>
                {[
                  ["Fastest", `${6 + rest} min`],
                  ["Slowest", `${24 + rest} min`],
                  ["Discount uses", `${42 - rest * 6}`],
                  ["Refunds", eur(86 - rest * 10)],
                ].map(([k, v]) => (
                  <div key={k} className="bg-ink p-3">
                    <p className="label-mono opacity-60">
                      <Copy>{k}</Copy>
                    </p>

                    <p className="font-display text-xl font-bold">
                      <Copy>{v}</Copy>
                    </p>
                  </div>
                ))}
              </Copy>
            </div>
          </div>
        </div>
      </div>
    </main>
  )
}
