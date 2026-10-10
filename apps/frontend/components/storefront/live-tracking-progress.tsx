"use client"
import { Check, ChefHat, PackageCheck, ShoppingBag } from "lucide-react"
import { useTranslations } from "next-intl"

const stages = ["Pending", "Preparing", "Ready", "Completed"] as const
const icons = [Check, ChefHat, PackageCheck, ShoppingBag]

export function LiveTrackingProgress({ status }: { status: string }) {
  const t = useTranslations("Redesign")
  const active = stages.findIndex((stage) => stage === status)

  return (
    <section className="customer-rounded border p-6 sm:p-8">
      <h2 className="text-2xl font-bold">{t(`stage${status}`)}</h2>

      <ol aria-label={t("orderProgress")} className="my-8">
        {stages.map((stage, index) => {
          const Icon = icons[index]

          return (
            <li
              key={stage}
              aria-current={index === active ? "step" : undefined}
              className="relative flex min-h-20 gap-4 pb-6 last:min-h-0 last:pb-0"
            >
              {index < stages.length - 1 && (
                <span
                  className={`absolute top-9 bottom-0 left-[17px] w-px ${index < active ? "bg-primary" : "bg-border"}`}
                />
              )}

              <span
                className={`relative flex size-9 shrink-0 items-center justify-center rounded-full ${index <= active ? "bg-primary text-primary-foreground" : "border bg-background text-muted-foreground"}`}
              >
                <Icon size={17} aria-hidden="true" />
              </span>

              <div className="pt-1">
                <p
                  className={`text-sm font-bold ${index > active ? "text-muted-foreground" : ""}`}
                >
                  {t(`status${stage}`)}
                </p>

                <p className="mt-1 text-xs text-muted-foreground">
                  {t(`liveStageDescription${stage}`)}
                </p>

                {index === active && (
                  <p className="mt-1 text-xs font-semibold text-primary">
                    {t("currentStage")}
                  </p>
                )}
              </div>
            </li>
          )
        })}
      </ol>
    </section>
  )
}
