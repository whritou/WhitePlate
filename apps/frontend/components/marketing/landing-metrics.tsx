"use client"
import { useTranslations } from "next-intl"

export function LandingMetrics() {
  const t = useTranslations("Marketing")

  return (
    <section className="w-full bg-surface-container-low px-6 py-10 lg:px-12">
      <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-8 md:flex-row">
        <div className="text-center md:text-left">
          <h4 className="font-heading text-headline-sm text-on-surface">
            {t("zeroCommissionInfiniteGrowth")}
          </h4>

          <p className="font-sans text-body-sm text-on-surface-variant">
            {t("independentRestaurantsSaveAnAverageOf2")}
          </p>
        </div>

        <div className="grid w-full grid-cols-2 gap-6 text-center sm:grid-cols-4 md:w-auto">
          <div className="rounded-xl bg-surface p-3 shadow-xs">
            <p className="font-heading text-kpi-number font-extrabold text-secondary-container">
              {t("value0")}
            </p>

            <p className="font-sans text-label-sm font-semibold tracking-wider text-on-surface-variant uppercase">
              {t("perOrderFees")}
            </p>
          </div>

          <div className="rounded-xl bg-surface p-3 shadow-xs">
            <p className="font-heading text-kpi-number font-extrabold text-on-surface">
              {t("value15m")}
            </p>

            <p className="font-sans text-label-sm font-semibold tracking-wider text-on-surface-variant uppercase">
              {t("averagePickup")}
            </p>
          </div>

          <div className="rounded-xl bg-surface p-3 shadow-xs">
            <p className="font-heading text-kpi-number font-extrabold text-on-surface">
              {t("value38")}
            </p>

            <p className="font-sans text-label-sm font-semibold tracking-wider text-on-surface-variant uppercase">
              {t("basketSize")}
            </p>
          </div>

          <div className="rounded-xl bg-surface p-3 shadow-xs">
            <p className="font-heading text-kpi-number font-extrabold text-on-tertiary-container">
              {t("value9998")}
            </p>

            <p className="font-sans text-label-sm font-semibold tracking-wider text-on-surface-variant uppercase">
              {t("kdsUptime")}
            </p>
          </div>
        </div>
      </div>
    </section>
  )
}
