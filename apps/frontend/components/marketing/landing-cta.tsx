"use client"
import { useTranslations } from "next-intl"
import { Link } from "@/i18n/navigation"

export function LandingCta() {
  const t = useTranslations("Marketing")

  return (
    <section className="mx-auto w-full max-w-7xl px-6 py-20 lg:px-12">
      <div className="relative flex flex-col items-center justify-between gap-10 overflow-hidden rounded-xl bg-primary-container p-8 text-on-primary shadow-2xl sm:p-14 md:flex-row">
        <div className="pointer-events-none absolute -right-20 -bottom-20 h-80 w-80 rounded-full bg-secondary-container/20 blur-3xl"></div>

        <div className="z-10 max-w-[36rem] space-y-4">
          <span className="inline-block rounded-full bg-surface-container/20 px-3 py-1 font-sans text-label-sm font-bold tracking-wider text-secondary-container uppercase">
            {t("takeBackYourMargins")}
          </span>

          <h2 className="font-heading text-headline-lg font-extrabold tracking-tight text-balance lg:text-display-hero lg:text-display-hero-mobile">
            {t("readyToStopGiving30ToDelivery")}
          </h2>

          <p className="font-sans text-body-lg text-on-primary-container">
            {t("launchYourWhiteLabelClickCollectStorefront")}
          </p>
        </div>

        <div className="z-10 flex w-full shrink-0 flex-col gap-3.5 sm:flex-row md:w-auto md:flex-col">
          <Link
            className="rounded-xl bg-secondary-container px-8 py-4 text-center font-heading text-headline-sm font-bold text-primary-foreground shadow-lg transition-all hover:bg-secondary active:scale-95"
            href="/sign-up"
          >
            {t("start14DayFreeTrial")}
          </Link>

          <Link
            className="rounded-xl bg-surface-container/15 px-8 py-3.5 text-center font-sans text-label-md font-semibold text-on-primary transition-colors hover:bg-surface-container/25"
            href="/demo"
          >
            {t("exploreLiveRestaurantDemo")}
          </Link>
        </div>
      </div>
    </section>
  )
}
