"use client"
import { useTranslations } from "next-intl"
import { ReferenceIcon } from "./reference-icon"

export function LandingFeatures() {
  const t = useTranslations("Marketing")

  return (
    <section
      className="mx-auto w-full max-w-7xl px-4 py-12 sm:px-6 sm:py-16 lg:px-8 lg:py-20"
      id="features"
    >
      <div className="mx-auto mb-8 max-w-3xl space-y-3 text-center sm:mb-12">
        <div className="inline-flex items-center gap-1.5 rounded-full bg-surface-container px-3 py-1 font-sans text-label-sm font-semibold tracking-wider text-on-surface uppercase">
          {t("architectureDeepDive")}
        </div>

        <h2 className="font-heading text-headline-lg-mobile text-balance text-on-surface sm:text-headline-lg">
          {t("engineeredForKitchenHeatAndEnterpriseScale")}
        </h2>

        <p className="font-sans text-body-lg text-on-surface-variant">
          {t("everyDetailIsArchitectedSoYourStaff")}
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="flex min-w-0 flex-col justify-between rounded-lg bg-surface-container-lowest p-5 shadow-sm transition-shadow hover:shadow-md sm:p-6">
          <div className="space-y-5">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-surface-container text-on-surface">
              <ReferenceIcon
                name="hub"
                className="text-[28px] text-secondary-container"
              />
            </div>

            <h3 className="font-heading text-headline-sm text-on-surface">
              {t("multiTenantArchitectureFleetControl")}
            </h3>

            <p className="font-sans text-body-md text-on-surface-variant">
              {t("whetherYouOperateANeighborhoodMicroBistro")}
            </p>

            <ul className="space-y-2.5 pt-2 font-sans text-body-sm text-on-surface">
              <li className="flex items-center gap-2">
                <ReferenceIcon
                  name="check_circle"
                  className="text-[18px] text-secondary-container"
                />

                <span className="">
                  {t("centralizedOrGranularLocationInventoryToggles")}
                </span>
              </li>

              <li className="flex items-center gap-2">
                <ReferenceIcon
                  name="check_circle"
                  className="text-[18px] text-secondary-container"
                />

                <span className="">
                  {t("isolatedTenantDataStoresCustomSubdomains")}
                </span>
              </li>

              <li className="flex items-center gap-2">
                <ReferenceIcon
                  name="check_circle"
                  className="text-[18px] text-secondary-container"
                />

                <span className="">
                  {t("multiTieredStaffPermissionsKitchenManagerFinance")}
                </span>
              </li>
            </ul>
          </div>

          <div className="mt-8 rounded-xl bg-surface-container-low p-4 pt-6">
            <div className="mb-2 flex flex-wrap items-center justify-between gap-2 font-sans text-label-sm">
              <span className="font-semibold text-on-surface">
                {t("activeFleetsManaged")}
              </span>

              <span className="font-bold text-on-tertiary-container">
                {t("value128HubsLive")}
              </span>
            </div>

            <div className="h-2 w-full overflow-hidden rounded-full bg-surface-container-high">
              <div className="h-full w-4/5 rounded-full bg-secondary-container"></div>
            </div>
          </div>
        </div>

        <div className="flex min-w-0 flex-col justify-between rounded-lg bg-surface-container-lowest p-5 shadow-sm transition-shadow hover:shadow-md sm:p-6">
          <div className="space-y-5">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-surface-container text-on-surface">
              <ReferenceIcon
                name="palette"
                className="text-[28px] text-secondary-container"
              />
            </div>

            <h3 className="font-heading text-headline-sm text-on-surface">
              {t("infiniteStorefrontCustomizationWhiteLabeling")}
            </h3>

            <p className="font-sans text-body-md text-on-surface-variant">
              {t("giveDinersAnUbereatsGradeBuyingFlow")}
            </p>

            <ul className="space-y-2.5 pt-2 font-sans text-body-sm text-on-surface">
              <li className="flex items-center gap-2">
                <ReferenceIcon
                  name="check_circle"
                  className="text-[18px] text-secondary-container"
                />

                <span className="">
                  {t("realTimeCssVariableTokensForRadius")}
                </span>
              </li>

              <li className="flex items-center gap-2">
                <ReferenceIcon
                  name="check_circle"
                  className="text-[18px] text-secondary-container"
                />

                <span className="">
                  {t("value1ClickApplePayGooglePayStripe")}
                </span>
              </li>

              <li className="flex items-center gap-2">
                <ReferenceIcon
                  name="check_circle"
                  className="text-[18px] text-secondary-container"
                />

                <span className="">
                  {t("brandedPrintableQrTableWindowPickupStickers")}
                </span>
              </li>
            </ul>
          </div>

          <div className="mt-8 flex flex-wrap items-center justify-between gap-3 rounded-xl bg-surface-container-low p-4">
            <div className="flex flex-wrap items-center gap-2">
              <span className="h-5 w-5 rounded-full bg-secondary-container"></span>

              <span className="h-5 w-5 rounded-full bg-on-background"></span>

              <span className="h-5 w-5 rounded-full bg-surface-dim"></span>

              <span className="ml-1 font-sans text-label-sm text-on-surface-variant">
                {t("themeTokens")}
              </span>
            </div>

            <span className="rounded-md bg-surface px-2.5 py-1 font-mono font-sans text-label-sm font-semibold text-on-surface">
              {t("dnsVerified")}
            </span>
          </div>
        </div>

        <div className="flex min-w-0 flex-col justify-between rounded-lg bg-surface-container-lowest p-5 shadow-sm transition-shadow hover:shadow-md sm:p-6">
          <div className="space-y-5">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-surface-container text-on-surface">
              <ReferenceIcon
                name="insights"
                className="text-[28px] text-secondary-container"
              />
            </div>

            <h3 className="font-heading text-headline-sm text-on-surface">
              {t("realTimeKitchenKdsOrderAnalytics")}
            </h3>

            <p className="font-sans text-body-md text-on-surface-variant">
              {t("eliminatePrinterPaperJamsWithTouchReady")}
            </p>

            <ul className="space-y-2.5 pt-2 font-sans text-body-sm text-on-surface">
              <li className="flex items-center gap-2">
                <ReferenceIcon
                  name="check_circle"
                  className="text-[18px] text-secondary-container"
                />

                <span className="">
                  {t("audibleChimeTriggersColorCodedOverdueTimers")}
                </span>
              </li>

              <li className="flex items-center gap-2">
                <ReferenceIcon
                  name="check_circle"
                  className="text-[18px] text-secondary-container"
                />

                <span className="">
                  {t("rushHourPrepTimeSurgeControls10m")}
                </span>
              </li>

              <li className="flex items-center gap-2">
                <ReferenceIcon
                  name="check_circle"
                  className="text-[18px] text-secondary-container"
                />

                <span className="">
                  {t("zeroDataMaskingExportFullDinerContact")}
                </span>
              </li>
            </ul>
          </div>

          <div className="mt-8 flex flex-wrap items-center justify-between gap-3 rounded-xl bg-surface-container-low p-4">
            <div>
              <p className="font-sans text-label-sm text-on-surface-variant">
                {t("rushHourThrottle")}
              </p>

              <p className="font-heading text-title-md font-bold text-on-surface">
                {t("autoPacingActive")}
              </p>
            </div>

            <span className="rounded-full bg-on-tertiary-container/10 px-2.5 py-1 font-sans text-label-sm font-semibold text-on-tertiary-container">
              {t("latency50ms")}
            </span>
          </div>
        </div>
      </div>
    </section>
  )
}
