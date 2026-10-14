"use client"

import { useLocale, useTranslations } from "next-intl"
import { useState } from "react"
import {
  Activity,
  ArrowUpRight,
  Clock3,
  Radio,
  ShoppingBag,
  Wallet,
} from "lucide-react"
import { Copy } from "@/components/lovable/copy"
import { Link } from "@/components/lovable/navigation"
import { Button } from "@/components/ui/lovable-button"
import { DashboardReviewPreviewActivity } from "./dashboard-review-preview-activity"
import { DashboardReviewPreviewService } from "./dashboard-review-preview-service"

const metrics = [
  { key: "ordersToday", value: "18", icon: Activity },
  { key: "activeQueue", value: "05", icon: ShoppingBag },
  { key: "orderValue", value: "486.5", icon: Wallet },
  { key: "averagePrep", value: "14 min", icon: Clock3 },
] as const

export function DashboardReviewPreview() {
  const t = useTranslations("DashboardReviewPreview")
  const locale = useLocale()
  const [paused, setPaused] = useState(false)
  const money = new Intl.NumberFormat(locale, {
    style: "currency",
    currency: "EUR",
  })

  return (
    <main
      data-testid="dashboard-review-preview"
      className="mx-auto max-w-[1600px] px-6 pb-12"
    >
      <section className="flex flex-wrap items-end justify-between gap-5 py-8">
        <div>
          <p className="label-mono text-muted-foreground">
            <Copy>Maison Verte — Bastille · Sample service</Copy>
          </p>

          <h1 className="mt-2 font-display text-4xl font-bold">{t("title")}</h1>
        </div>

        <div className="flex flex-wrap gap-2">
          <Button
            variant="outline"
            onClick={() => setPaused((value) => !value)}
          >
            <Radio />

            <Copy>{paused ? "Resume demo orders" : "Pause demo orders"}</Copy>
          </Button>

          <Button asChild>
            <Link to="/orders">
              <Copy>Open order board</Copy>

              <ArrowUpRight />
            </Link>
          </Button>
        </div>
      </section>

      <section
        aria-label={t("metricsLabel")}
        className="grid border-y sm:grid-cols-2 xl:grid-cols-4"
      >
        {metrics.map(({ key, value, icon: Icon }, index) => (
          <div
            key={key}
            className={`py-6 ${index ? "xl:border-l xl:pl-6" : ""} ${index < 3 ? "border-b xl:border-b-0" : ""}`}
          >
            <div className="flex flex-wrap items-center justify-between pr-6 text-muted-foreground">
              <span className="text-sm">{t(key)}</span>

              <Icon aria-hidden="true" className="h-4 w-4" />
            </div>

            <p className="mt-3 font-display text-4xl font-bold tabular-nums">
              {key === "orderValue" ? money.format(486.5) : value}
            </p>

            <p className="mt-2 text-xs text-muted-foreground">
              {t(`${key}Note`)}
            </p>
          </div>
        ))}
      </section>

      <DashboardReviewPreviewService paused={paused} />

      <DashboardReviewPreviewActivity />

      <p className="mt-6 text-xs text-muted-foreground">{t("disclaimer")}</p>
    </main>
  )
}
