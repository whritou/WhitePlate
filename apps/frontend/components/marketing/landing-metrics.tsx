"use client"
import { useTranslations } from "next-intl"

export function LandingMetrics() {
  const t = useTranslations("Marketing")

  return (
    <section className="w-full bg-surface-container-low px-4 py-10 sm:px-6 lg:px-8">
      <div className="mx-auto grid max-w-7xl min-w-0 items-center gap-6 xl:grid-cols-2">
        <div className="min-w-0 text-center xl:text-left">
          <h2 className="font-heading text-headline-sm text-on-surface">
            {t("zeroCommissionInfiniteGrowth")}
          </h2>

          <p className="font-sans text-body-sm text-on-surface-variant">
            {t("independentRestaurantsSaveAnAverageOf2")}
          </p>
        </div>

        <div className="grid min-w-0 grid-cols-[repeat(auto-fit,minmax(min(100%,8rem),1fr))] gap-3 text-center">
          <div className="flex min-w-0 flex-col items-center justify-center rounded-xl bg-surface p-3 text-center shadow-xs">
            <p className="font-heading text-headline-md font-extrabold text-brand-text">
              {t("value0")}
            </p>

            <p className="font-sans text-label-sm font-semibold tracking-wider text-on-surface-variant uppercase">
              {t("perOrderFees")}
            </p>
          </div>

          <div className="flex min-w-0 flex-col items-center justify-center rounded-xl bg-surface p-3 text-center shadow-xs">
            <p className="font-heading text-headline-md font-extrabold text-on-surface">
              {t("value15m")}
            </p>

            <p className="font-sans text-label-sm font-semibold tracking-wider text-on-surface-variant uppercase">
              {t("averagePickup")}
            </p>
          </div>

          <div className="flex min-w-0 flex-col items-center justify-center rounded-xl bg-surface p-3 text-center shadow-xs">
            <p className="font-heading text-headline-md font-extrabold text-on-surface">
              {t("value38")}
            </p>

            <p className="font-sans text-label-sm font-semibold tracking-wider text-on-surface-variant uppercase">
              {t("basketSize")}
            </p>
          </div>

          <div className="flex min-w-0 flex-col items-center justify-center rounded-xl bg-surface p-3 text-center shadow-xs">
            <p className="font-heading text-headline-md font-extrabold text-on-tertiary-container">
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
