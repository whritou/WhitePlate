"use client"

import {
  Banknote,
  CookingPot,
  Timer,
  UsersRound,
  TrendingUp,
} from "lucide-react"
import { useLocale, useTranslations } from "next-intl"
import { Card } from "@/components/ui/card"

export function OperationalMetrics({
  activeCount = 14,
}: {
  activeCount?: number
}) {
  const t = useTranslations("Redesign")
  const locale = useLocale()
  const number = new Intl.NumberFormat(locale, { maximumFractionDigits: 1 })
  const percent = new Intl.NumberFormat(locale, {
    style: "percent",
    maximumFractionDigits: 1,
  })
  const metrics = [
    {
      label: "pickupRevenue",
      value: new Intl.NumberFormat(locale, {
        style: "currency",
        currency: "USD",
      }).format(3482.5),
      trend: `+${percent.format(0.184)}`,
      note: "lastTuesday",
      Icon: Banknote,
    },
    {
      label: "activeQueue",
      value: String(activeCount),
      trend: "4 / 6 / 4",
      note: "queueBreakdown",
      Icon: CookingPot,
    },
    {
      label: "averagePrep",
      value: `${number.format(12.8)} min`,
      trend: `−${number.format(1.5)} min`,
      note: "targetPrep",
      Icon: Timer,
    },
    {
      label: "repeatDiners",
      value: percent.format(0.642),
      trend: `+${percent.format(0.048)}`,
      note: "directOrders",
      Icon: UsersRound,
    },
  ]

  return (
    <section
      aria-label={t("illustrativeMetrics")}
      className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4"
    >
      {metrics.map(({ label, value, trend, note, Icon }) => (
        <Card
          key={label}
          className="justify-between gap-6 border-0 p-5 shadow-xs"
        >
          <div className="flex items-start justify-between gap-3">
            <div>
              <h2 className="text-xs leading-6 font-medium tracking-wide text-muted-foreground uppercase">
                {t(label)}
              </h2>

              <p className="mt-2 font-heading text-kpi-number tabular-nums">
                {value}
              </p>
            </div>

            <span className="grid size-11 shrink-0 place-items-center rounded-lg bg-secondary text-primary">
              <Icon aria-hidden="true" className="size-5" />
            </span>
          </div>

          <div className="flex items-center justify-between gap-2 text-xs">
            <span className="flex items-center gap-1 text-success">
              <TrendingUp aria-hidden="true" className="size-4" />

              {trend}
            </span>

            <span className="max-w-24 text-muted-foreground">{t(note)}</span>

            <svg
              aria-hidden="true"
              className="h-7 w-20 shrink-0 text-success"
              viewBox="0 0 80 24"
              fill="none"
            >
              <path
                d="M0 18Q15 22 25 14T48 10T65 6L80 3"
                stroke="currentColor"
                strokeWidth="2.5"
              />
            </svg>
          </div>
        </Card>
      ))}
    </section>
  )
}
