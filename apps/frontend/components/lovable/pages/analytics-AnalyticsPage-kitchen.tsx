"use client"

import { Copy } from "@/components/lovable/copy"
import { useTranslations } from "next-intl"
import { useAnalyticsPageView } from "./analytics-AnalyticsPage-context"

export function AnalyticsPageKitchen() {
  const { kitchen, pageMode } = useAnalyticsPageView()
  const t = useTranslations("AnalyticsLive")
  const liveLabel = (key: Parameters<typeof t>[0], demo: string) =>
    pageMode === "live" ? t(key) : demo

  return (
    <div className="card-hard bg-ink text-ink-foreground">
      <p className="border-b border-ink-foreground/20 px-5 py-3 font-display text-lg font-bold">
        <Copy>{liveLabel("kitchenPerformance", "Kitchen performance")}</Copy>
      </p>

      <div className="space-y-5 p-5">
        <Copy>
          {[
            [liveLabel("onTimePickups", "On-time pickups"), kitchen.onTime, "%"],
            [liveLabel("acceptedUnderOneMinute", "Accepted < 1 min"), kitchen.accepted, "%"],
            [liveLabel("cancelledOrders", "Cancelled orders"), kitchen.cancelled, "%"],
          ].map(([k, v, u]) => (
            <div key={k as string}>
              <div className="flex justify-between text-sm">
                <span>
                  <Copy>{k}</Copy>
                </span>

                <span className="font-bold">
                  <Copy>{v === null ? t("unavailable") : `${(v as number).toFixed(0)}${u}`}</Copy>
                </span>
              </div>

              <div className="mt-1.5 h-2 bg-ink-foreground/15">
                <div className="h-2 bg-accent" style={{ width: `${Math.min(100, Math.max(0, (v as number | null) ?? 0))}%` }} />
              </div>
            </div>
          ))}
        </Copy>

        <div className="grid grid-cols-2 gap-px border border-ink-foreground/20 bg-ink-foreground/20">
          <Copy>
            {[
              [liveLabel("fastest", "Fastest"), kitchen.fastest],
              [liveLabel("slowest", "Slowest"), kitchen.slowest],
              [liveLabel("discountUses", "Discount uses"), kitchen.discountUses],
              [liveLabel("refunds", "Refunds"), pageMode === "live" ? t("unavailable") : kitchen.refunds],
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
  )
}
