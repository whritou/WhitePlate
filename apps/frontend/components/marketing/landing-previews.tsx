"use client"
import { useTranslations } from "next-intl"
import { ReferenceIcon } from "./reference-icon"
import { Button } from "@/components/ui/button"
import { useRouter } from "@/i18n/navigation"

export function LandingPreviews() {
  const t = useTranslations("Marketing")
  const router = useRouter()

  return (
    <section
      className="w-full bg-surface-container-low px-4 py-12 sm:px-6 sm:py-16 lg:px-8"
      id="previews"
    >
      <div className="mx-auto max-w-7xl space-y-12">
        <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-end lg:gap-8">
          <div className="min-w-0 lg:flex-1">
            <span className="font-sans text-label-sm font-bold tracking-wider text-secondary-container uppercase">
              {t("operationalHarmony")}
            </span>

            <h2 className="mt-1 font-heading text-headline-lg-mobile text-balance text-on-surface sm:text-headline-lg">
              {t("bothSidesOfTheCounterPerfectlyConnected")}
            </h2>
          </div>

          <p className="max-w-[28rem] font-sans text-body-md text-on-surface-variant lg:flex-1">
            {t("aSynchronizedFeedbackLoopBetweenLineCooks")}
          </p>
        </div>

        <div className="grid min-w-0 grid-cols-1 gap-6 xl:grid-cols-2">
          <div className="min-w-0 space-y-5 rounded-lg bg-surface-container-lowest p-4 shadow-sm sm:p-6">
            <div className="flex flex-col items-start gap-2 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex min-w-0 items-center gap-2">
                <ReferenceIcon
                  name="kitchen"
                  className="text-secondary-container"
                />

                <span className="min-w-0 font-heading text-body-md leading-5 break-words text-on-surface sm:text-title-md sm:leading-6">
                  {t("backOfficeLiveKanban")}
                </span>
              </div>

              <span className="shrink-0 rounded-md bg-surface-container px-2.5 py-1 font-sans text-label-sm text-on-surface">
                {t("autoRefreshOn")}
              </span>
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div className="space-y-3 rounded-xl bg-surface-container p-3">
                <div className="flex items-center justify-between font-sans text-label-sm font-semibold text-on-surface">
                  <span className="">{t("newOrders2")}</span>

                  <span className="h-2 w-2 rounded-full bg-secondary-container"></span>
                </div>

                <div className="space-y-1 rounded-lg bg-surface-container-lowest p-3 shadow-xs">
                  <div className="flex flex-wrap justify-between gap-x-3 gap-y-1 font-heading text-body-sm font-bold">
                    <span className="">{t("value104AlexT")}</span>

                    <span className="text-secondary-container">
                      {t("justNow")}
                    </span>
                  </div>

                  <span className="font-sans text-xs text-on-surface-variant">
                    {t("emailUpdateDispatched")}
                  </span>
                </div>

                <div className="space-y-1 rounded-lg bg-surface-container-lowest p-3 shadow-xs">
                  <div className="flex flex-wrap justify-between gap-x-3 gap-y-1 font-heading text-body-sm font-bold">
                    <span className="">{t("value103MiaS")}</span>

                    <span className="text-on-surface-variant">
                      {t("value2mAgo")}
                    </span>
                  </div>

                  <p className="font-sans text-label-sm text-on-surface-variant">
                    {t("value2xMatchaIcedLatte")}
                  </p>
                </div>
              </div>

              <div className="space-y-3 rounded-xl bg-surface-container p-3">
                <div className="flex items-center justify-between font-sans text-label-sm font-semibold text-on-surface">
                  <span className="">{t("readyForPickup3")}</span>

                  <span className="h-2 w-2 rounded-full bg-on-tertiary-container"></span>
                </div>

                <div className="space-y-1 rounded-lg bg-surface-container-lowest p-3 shadow-xs">
                  <div className="flex flex-wrap justify-between gap-x-3 gap-y-1 font-heading text-body-sm font-bold">
                    <span className="">{t("value102DavidR")}</span>

                    <span className="font-semibold text-on-tertiary-container">
                      {t("bayA3")}
                    </span>
                  </div>

                  <span className="font-sans text-xs text-on-surface-variant">
                    {t("emailUpdateDispatched")}
                  </span>
                </div>

                <div className="space-y-1 rounded-lg bg-surface-container-lowest p-3 shadow-xs">
                  <div className="flex flex-wrap justify-between gap-x-3 gap-y-1 font-heading text-body-sm font-bold">
                    <span className="">{t("value101SarahK")}</span>

                    <span className="font-semibold text-on-tertiary-container">
                      {t("bayB1")}
                    </span>
                  </div>

                  <p className="font-sans text-label-sm text-on-surface-variant">
                    {t("customerNotified")}
                  </p>
                </div>
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl bg-surface-container p-4">
              <div className="min-w-0">
                <p className="font-heading text-title-md text-on-surface">
                  {t("rushHourKitchenBuffer")}
                </p>

                <p className="font-sans text-label-sm text-on-surface-variant">
                  {t("adjustGuestWaitTimeEstimatesAcrossThe")}
                </p>
              </div>

              <div className="flex items-center gap-1 rounded-lg bg-surface-container-lowest px-3 py-1.5 font-heading text-title-md font-bold text-secondary-container">
                <span className="">{t("value15m938e")}</span>
              </div>
            </div>
          </div>

          <div className="min-w-0 space-y-5 rounded-lg bg-surface-container-lowest p-4 shadow-sm sm:p-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <ReferenceIcon
                  name="touch_app"
                  className="text-secondary-container"
                />

                <span className="font-heading text-title-md font-bold text-on-surface">
                  {t("customerPickupJourney")}
                </span>
              </div>

              <span className="rounded-md bg-surface-container px-2.5 py-1 font-sans text-label-sm text-on-surface">
                {t("pwaEnabled")}
              </span>
            </div>

            <div className="space-y-3 rounded-xl bg-surface-container p-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="font-heading text-title-md font-bold text-on-surface">
                  {t("order104Status")}
                </span>

                <span className="rounded-full bg-secondary-container px-2.5 py-0.5 font-sans text-label-sm font-semibold text-primary-foreground">
                  {t("inTheSmoker")}
                </span>
              </div>

              <div className="grid grid-cols-4 gap-2 pt-1">
                <div className="h-2 rounded-full bg-secondary-container"></div>

                <div className="h-2 rounded-full bg-secondary-container"></div>

                <div className="h-2 rounded-full bg-surface-container-high"></div>

                <div className="h-2 rounded-full bg-surface-container-high"></div>
              </div>

              <div className="grid grid-cols-2 gap-2 pt-1 font-sans text-label-sm text-on-surface-variant sm:grid-cols-4">
                <span className="">{t("confirmed")}</span>

                <span className="font-bold text-on-surface">
                  {t("preparing")}
                </span>

                <span className="">{t("bagged")}</span>

                <span className="">{t("collected")}</span>
              </div>
            </div>

            <div className="space-y-3 rounded-xl bg-surface p-4">
              <div className="flex flex-wrap items-center justify-between gap-2 text-on-surface">
                <span className="font-heading text-title-md font-semibold">
                  {t("selectedPickupLocation")}
                </span>

                <span className="font-sans text-label-sm font-semibold text-secondary-container">
                  {t("downtownCentral04Mi")}
                </span>
              </div>

              <div className="flex flex-wrap items-center justify-between gap-2 font-sans text-body-sm text-on-surface-variant">
                <span className="">{t("subtotal0PlatformSurcharge")}</span>

                <span className="font-bold text-on-surface">
                  {t("value2400")}
                </span>
              </div>

              <div className="grid auto-rows-fr grid-cols-1 gap-3 pt-2 sm:grid-cols-2">
                <Button
                  className="flex items-center justify-center gap-1.5 rounded-lg bg-obsidian py-2.5 font-heading text-title-md font-bold text-on-primary transition-opacity hover:bg-obsidian/90"
                  type="button"
                  variant="ghost"
                  onClick={() => router.push("/demo")}
                >
                  <span className="">{t("applePay")}</span>
                </Button>

                <Button
                  className="flex items-center justify-center gap-1.5 rounded-lg bg-surface-container py-2.5 font-heading text-title-md font-semibold text-on-surface transition-colors hover:bg-surface-container-high"
                  type="button"
                  variant="ghost"
                  onClick={() => router.push("/demo")}
                >
                  <span className="">{t("cardOrCash")}</span>
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
