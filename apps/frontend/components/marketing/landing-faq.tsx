"use client"
import { useTranslations } from "next-intl"
import { ReferenceIcon } from "./reference-icon"

export function LandingFaq() {
  const t = useTranslations("Marketing")

  return (
    <section
      className="w-full bg-surface-container-low px-4 py-12 sm:px-6 sm:py-16 lg:px-8"
      id="faq"
    >
      <div className="mx-auto max-w-4xl space-y-10">
        <div className="space-y-2 text-center">
          <span className="font-sans text-label-sm font-bold tracking-wider text-secondary-container uppercase">
            {t("clarityHardware")}
          </span>

          <h2 className="font-heading text-headline-lg-mobile text-balance text-on-surface sm:text-headline-lg">
            {t("frequentlyAskedQuestions")}
          </h2>

          <p className="font-sans text-body-md text-on-surface-variant">
            {t("everythingYouNeedToKnowAboutSetting")}
          </p>
        </div>

        <div className="space-y-4" id="faq-accordion">
          <details className="group rounded-lg bg-surface shadow-xs">
            <summary className="flex min-h-12 cursor-pointer items-center justify-between gap-4 p-5 font-heading text-title-md">
              <span className="">{t("doYouReallyTake0CommissionOn")}</span>

              <ReferenceIcon
                name="expand_more"
                className="size-5 shrink-0 transition-transform group-open:rotate-180"
              />
            </summary>

            <div className="px-5 pb-5 text-body-md text-on-surface-variant">
              {t("yesStrictly0UnlikeThirdPartyMarketplace")}
            </div>
          </details>

          <details className="group rounded-lg bg-surface shadow-xs">
            <summary className="flex min-h-12 cursor-pointer items-center justify-between gap-4 p-5 font-heading text-title-md">
              <span className="">{t("canIUseMyExistingKitchenHardware")}</span>

              <ReferenceIcon
                name="expand_more"
                className="size-5 shrink-0 transition-transform group-open:rotate-180"
              />
            </summary>

            <div className="px-5 pb-5 text-body-md text-on-surface-variant">
              {t("whiteplateRunsDirectlyInsideAnyModernWeb")}
            </div>
          </details>

          <details className="group rounded-lg bg-surface shadow-xs">
            <summary className="flex min-h-12 cursor-pointer items-center justify-between gap-4 p-5 font-heading text-title-md">
              <span className="">{t("howDoesDomainMappingWorkForWhite")}</span>

              <ReferenceIcon
                name="expand_more"
                className="size-5 shrink-0 transition-transform group-open:rotate-180"
              />
            </summary>

            <div className="px-5 pb-5 text-body-md text-on-surface-variant">
              {t("onTheGrowthAndFranchiseTiersYou")}
            </div>
          </details>

          <details className="group rounded-lg bg-surface shadow-xs">
            <summary className="flex min-h-12 cursor-pointer items-center justify-between gap-4 p-5 font-heading text-title-md">
              <span className="">
                {t("canIManageMultipleKitchenStationsE")}
              </span>

              <ReferenceIcon
                name="expand_more"
                className="size-5 shrink-0 transition-transform group-open:rotate-180"
              />
            </summary>

            <div className="px-5 pb-5 text-body-md text-on-surface-variant">
              {t("yesThroughOurStationRoutingRulesMenu")}
            </div>
          </details>

          <details className="group rounded-lg bg-surface shadow-xs">
            <summary className="flex min-h-12 cursor-pointer items-center justify-between gap-4 p-5 font-heading text-title-md">
              <span className="">{t("doIOwnMyGuestListAnd")}</span>

              <ReferenceIcon
                name="expand_more"
                className="size-5 shrink-0 transition-transform group-open:rotate-180"
              />
            </summary>

            <div className="px-5 pb-5 text-body-md text-on-surface-variant">
              {t("value100AggregatorsDeliberatelyShieldDinerContactInfo")}
            </div>
          </details>
        </div>
      </div>
    </section>
  )
}
