"use client"

import { Check, CookingPot, PackageCheck, ShoppingBag } from "lucide-react"
import { useTranslations } from "next-intl"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"

const stages = ["Pending", "Preparing", "Ready", "Completed"] as const
const icons = [Check, CookingPot, ShoppingBag, PackageCheck]

export function TrackingProgress({
  status,
  illustrative = true,
}: {
  status: string
  illustrative?: boolean
}) {
  const t = useTranslations("Redesign")
  const active = stages.findIndex((stage) => stage === status)

  return (
    <Card className="gap-6 border-0 p-6 shadow-md sm:p-8">
      <CardHeader className="flex flex-wrap items-center justify-between gap-4 p-0">
        <div>
          <p className="mb-2 text-xs font-semibold text-brand-text">
            {t("trackingStep", { step: active + 1 })}
          </p>

          <CardTitle>
            <h2>{t(`stage${status}`)}</h2>
          </CardTitle>
        </div>

        <div className="flex items-center gap-3 text-sm">
          <span>{t("overallProgress")}</span>

          <div
            role="progressbar"
            aria-label={t("overallProgress")}
            aria-valuenow={Math.round(((active + 1) / 4) * 100)}
            aria-valuemin={0}
            aria-valuemax={100}
            className="h-2 w-24 overflow-hidden rounded-full bg-secondary"
          >
            <div
              className="h-full rounded-full bg-primary"
              style={{ width: `${((active + 1) / 4) * 100}%` }}
            />
          </div>

          <strong className="tabular-nums">
            {Math.round(((active + 1) / 4) * 100)}%
          </strong>
        </div>
      </CardHeader>

      <CardContent className="p-0">
        <ol
          aria-label={t("orderProgress")}
          className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4"
        >
          {stages.map((stage, index) => {
            const Icon = icons[index]

            return (
              <li
                key={stage}
                aria-current={active === index ? "step" : undefined}
                className={`flex items-start gap-3 rounded-md p-3 ${index === active ? "bg-muted" : ""} ${index > active ? "text-muted-foreground" : ""}`}
              >
                <span
                  className={`grid size-10 shrink-0 place-items-center rounded-full ${index < active ? "bg-success-muted text-success" : index === active ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground"}`}
                >
                  <Icon aria-hidden="true" className="size-5" />
                </span>

                <div>
                  <p className="text-sm font-semibold">
                    {index + 1}. {t(`status${stage}`)}
                  </p>

                  <p className="mt-2 text-xs leading-5 text-muted-foreground">
                    {t(
                      `${illustrative ? "stageDescription" : "liveStageDescription"}${stage}`
                    )}
                  </p>

                  {index === active && (
                    <p className="mt-1 text-xs font-semibold text-brand-text">
                      {t("currentStage")}
                    </p>
                  )}
                </div>
              </li>
            )
          })}
        </ol>
      </CardContent>
    </Card>
  )
}
