"use client"
import { useTranslations } from "next-intl"
import { Link } from "@/i18n/navigation"
import { Button } from "@/components/ui/button"

export function LandingCta() {
  const t = useTranslations("Marketing")

  return (
    <section className="mx-auto w-full max-w-7xl px-4 py-12 sm:px-6 sm:py-16 lg:px-8 lg:py-20">
      <div className="relative grid min-w-0 items-center gap-6 overflow-hidden rounded-xl bg-primary-container p-5 text-on-primary shadow-2xl sm:p-8 xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] xl:gap-10 xl:p-12">
        <div className="pointer-events-none absolute -right-20 -bottom-20 h-80 w-80 rounded-full bg-secondary-container/20 blur-3xl"></div>

        <div className="z-10 max-w-[36rem] min-w-0 space-y-4">
          <span className="inline-block rounded-full bg-surface-container/20 px-3 py-1 font-sans text-label-sm font-bold tracking-wider text-primary-hover uppercase">
            {t("takeBackYourMargins")}
          </span>

          <h2 className="font-heading text-headline-lg-mobile font-extrabold tracking-tight text-balance sm:text-headline-lg lg:text-display-hero-mobile">
            {t("readyToStopGiving30ToDelivery")}
          </h2>

          <p className="font-sans text-body-lg text-on-primary-container">
            {t("launchYourWhiteLabelClickCollectStorefront")}
          </p>
        </div>

        <div className="z-10 grid min-w-0 auto-rows-fr gap-3 sm:grid-cols-2 xl:grid-cols-1">
          <Button
            size="lg"
            className="min-h-14 w-full text-sm"
            nativeButton={false}
            role="link"
            render={<Link href="/sign-up" />}
          >
            {t("start14DayFreeTrial")}
          </Button>

          <Button
            size="lg"
            variant="secondary"
            className="min-h-14 w-full text-sm"
            nativeButton={false}
            role="link"
            render={<Link href="/demo" />}
          >
            {t("exploreLiveRestaurantDemo")}
          </Button>
        </div>
      </div>
    </section>
  )
}
