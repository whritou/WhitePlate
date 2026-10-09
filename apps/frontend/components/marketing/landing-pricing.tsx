"use client"
import { useTranslations, useLocale } from "next-intl"
import { ReferenceIcon } from "./reference-icon"
import { Button } from "@/components/ui/button"
import { Link } from "@/i18n/navigation"
import { useState } from "react"

export function LandingPricing() {
  const t = useTranslations("Marketing")
  const [annual, setAnnual] = useState(false)
  const locale = useLocale()
  const formatPrice = (value: number) =>
    new Intl.NumberFormat(locale, {
      style: "currency",
      currency: "USD",
      maximumFractionDigits: 0,
    }).format(value)

  return (
    <section
      className="mx-auto w-full max-w-7xl px-4 py-12 sm:px-6 sm:py-16 lg:px-8 lg:py-20"
      id="pricing"
    >
      <div className="mx-auto mb-12 max-w-3xl space-y-4 text-center">
        <div className="inline-flex items-center gap-1.5 rounded-full bg-surface-container px-3 py-1 font-sans text-label-sm font-semibold tracking-wider text-on-surface uppercase">
          {t("predictableEconomics")}
        </div>

        <h2 className="font-heading text-headline-lg-mobile text-balance text-on-surface sm:text-headline-lg">
          {t("flatSubscriptionAbsolutelyZeroCommission")}
        </h2>

        <p className="font-sans text-body-lg text-on-surface-variant">
          {t("thirdPartyMarketplacesChargeUpTo30")}
        </p>

        <div className="grid grid-cols-[minmax(0,1fr)_3.5rem_minmax(0,1fr)] items-center gap-x-2 pt-4 sm:flex sm:justify-center sm:gap-3">
          <span
            className="text-center font-sans text-label-md font-semibold text-on-surface sm:text-start"
            id="label-monthly"
          >
            {t("monthlyBilling")}
          </span>

          <Button
            aria-pressed={annual}
            className="relative inline-flex min-h-11 w-14 shrink-0 justify-start rounded-full bg-surface-container p-1"
            id="billing-toggle"
            type="button"
            variant="ghost"
            onClick={() => setAnnual(!annual)}
            aria-label={t("toggleAnnualBilling")}
          >
            <span
              id="toggle-knob"
              className={`pointer-events-none block size-5 rounded-full bg-secondary-container shadow-sm transition-transform ${annual ? "translate-x-6" : "translate-x-0"}`}
            ></span>
          </Button>

          <span
            className="flex min-w-0 flex-wrap items-center justify-center gap-x-1.5 font-sans text-label-md text-on-surface-variant sm:justify-start"
            id="label-annual"
          >
            <span className="">{t("annualBilling")}</span>

            <span className="rounded-full bg-on-tertiary-container/10 px-2 py-0.5 font-sans text-label-sm font-bold text-on-tertiary-container">
              {t("save20")}
            </span>
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 items-stretch gap-6 lg:grid-cols-3">
        <div className="flex min-w-0 flex-col justify-between space-y-6 rounded-lg bg-surface-container-lowest p-5 shadow-sm sm:p-6">
          <div className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h3 className="font-heading text-headline-sm text-on-surface">
                {t("starter")}
              </h3>

              <span className="rounded bg-surface-container px-2.5 py-1 font-sans text-label-sm text-on-surface">
                {t("singleCafeTruck")}
              </span>
            </div>

            <p className="font-sans text-body-sm text-on-surface-variant">
              {t("essentialWhiteLabelOrderingSetupForEmerging")}
            </p>

            <div className="flex flex-wrap items-baseline gap-x-1 gap-y-2 py-2">
              <span className="price-val font-heading text-headline-lg font-bold text-on-surface">
                {formatPrice(annual ? 39 : 49)}
              </span>

              <span className="font-sans text-body-md text-on-surface-variant">
                {t("month")}
              </span>
            </div>

            <div className="space-y-3 pt-4 font-sans text-body-sm text-on-surface">
              <div className="flex items-center gap-2.5">
                <ReferenceIcon
                  name="check"
                  className="text-[18px] text-brand-text"
                />

                <span className="">
                  <strong>{t("value1RestaurantLocation")}</strong>
                </span>
              </div>

              <div className="flex items-center gap-2.5">
                <ReferenceIcon
                  name="check"
                  className="text-[18px] text-brand-text"
                />

                <span className="">{t("fullWhiteLabelCustomStorefront")}</span>
              </div>

              <div className="flex items-center gap-2.5">
                <ReferenceIcon
                  name="check"
                  className="text-[18px] text-brand-text"
                />

                <span className="">{t("upTo500OrdersMonth")}</span>
              </div>

              <div className="flex items-center gap-2.5">
                <ReferenceIcon
                  name="check"
                  className="text-[18px] text-brand-text"
                />

                <span className="">{t("standardKdsTabletInterface")}</span>
              </div>

              <div className="flex items-center gap-2.5">
                <ReferenceIcon
                  name="check"
                  className="text-[18px] text-brand-text"
                />

                <span className="">
                  <strong>{t("value0PlatformCommissionFee")}</strong>
                </span>
              </div>
            </div>
          </div>

          <Button
            variant="secondary"
            size="lg"
            className="w-full text-sm"
            nativeButton={false}
            role="link"
            render={<Link href="/sign-up" />}
          >
            {t("start14DayTrial")}
          </Button>
        </div>

        <div className="relative flex min-w-0 flex-col justify-between space-y-6 rounded-lg bg-surface-container-lowest p-5 shadow-xl ring-2 ring-secondary-container sm:p-6">
          <div className="w-full rounded-md bg-secondary-container px-3 py-2 text-center font-sans text-label-sm font-bold tracking-wider text-primary-foreground uppercase">
            {t("mostPopularForBusyVenues")}
          </div>

          <div className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h3 className="font-heading text-headline-sm text-on-surface">
                {t("growth")}
              </h3>

              <span className="rounded bg-secondary-container/10 px-2.5 py-1 font-sans text-label-sm font-bold text-brand-text">
                {t("fastPacedQsr")}
              </span>
            </div>

            <p className="font-sans text-body-sm text-on-surface-variant">
              {t("highVolumeRestaurantsRequiringCustomDomainsInstant")}
            </p>

            <div className="flex flex-wrap items-baseline gap-x-1 gap-y-2 py-2">
              <span className="price-val font-heading text-headline-lg font-bold text-on-surface">
                {formatPrice(annual ? 95 : 119)}
              </span>

              <span className="font-sans text-body-md text-on-surface-variant">
                {t("month")}
              </span>
            </div>

            <div className="space-y-3 pt-4 font-sans text-body-sm text-on-surface">
              <div className="flex items-center gap-2.5">
                <ReferenceIcon
                  name="check"
                  className="text-[18px] text-brand-text"
                />

                <span className="">
                  <strong>{t("unlimitedOrdersZeroCap")}</strong>
                </span>
              </div>

              <div className="flex items-center gap-2.5">
                <ReferenceIcon
                  name="check"
                  className="text-[18px] text-brand-text"
                />

                <span className="">{t("multiStationKdsKitchenRouting")}</span>
              </div>

              <div className="flex items-center gap-2.5">
                <ReferenceIcon
                  name="check"
                  className="text-[18px] text-brand-text"
                />

                <span className="">{t("customDomainEGOrderMybrandCom")}</span>
              </div>

              <div className="flex items-center gap-2.5 text-on-surface">
                <ReferenceIcon
                  name="check"
                  className="text-[18px] text-brand-text"
                />

                <span className="">{t("automatedEmailPickupOrderAlerts")}</span>
              </div>

              <div className="flex items-center gap-2.5">
                <ReferenceIcon
                  name="check"
                  className="text-[18px] text-brand-text"
                />

                <span className="">
                  {t("customerReEngagementLoyaltyEngine")}
                </span>
              </div>

              <div className="flex items-center gap-2.5">
                <ReferenceIcon
                  name="check"
                  className="text-[18px] text-brand-text"
                />

                <span className="">{t("advancedHourlyRevenueAnalytics")}</span>
              </div>
            </div>
          </div>

          <Button
            size="lg"
            className="w-full text-sm"
            nativeButton={false}
            role="link"
            render={<Link href="/sign-up" />}
          >
            {t("getStartedWithGrowth")}
          </Button>
        </div>

        <div className="flex min-w-0 flex-col justify-between space-y-6 rounded-lg bg-surface-container-lowest p-5 shadow-sm sm:p-6">
          <div className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h3 className="font-heading text-headline-sm text-on-surface">
                {t("franchise")}
              </h3>

              <span className="rounded bg-surface-container px-2.5 py-1 font-sans text-label-sm text-on-surface">
                {t("multiUnitChains")}
              </span>
            </div>

            <p className="font-sans text-body-sm text-on-surface-variant">
              {t("forRestaurantGroupsWith5BranchesRequiring")}
            </p>

            <div className="flex flex-wrap items-baseline gap-x-1 gap-y-2 py-2">
              <span className="price-val font-heading text-headline-lg font-bold text-on-surface">
                {formatPrice(annual ? 199 : 249)}
              </span>

              <span className="font-sans text-body-md text-on-surface-variant">
                {t("month")}
              </span>
            </div>

            <div className="space-y-3 pt-4 font-sans text-body-sm text-on-surface">
              <div className="flex items-center gap-2.5">
                <ReferenceIcon
                  name="check"
                  className="text-[18px] text-brand-text"
                />

                <span className="">
                  {t("multiTenantOrganizationFleetControls")}
                </span>
              </div>

              <div className="flex items-center gap-2.5">
                <ReferenceIcon
                  name="check"
                  className="text-[18px] text-brand-text"
                />

                <span className="">
                  {t("toastSquareMicrosPosBiDirectionalSync")}
                </span>
              </div>

              <div className="flex items-center gap-2.5">
                <ReferenceIcon
                  name="check"
                  className="text-[18px] text-brand-text"
                />

                <span className="">
                  {t("isolatedDatabaseClustersCustomSlas")}
                </span>
              </div>

              <div className="flex items-center gap-2.5">
                <ReferenceIcon
                  name="check"
                  className="text-[18px] text-brand-text"
                />

                <span className="">
                  {t("dedicatedKitchenOnboardingEngineer")}
                </span>
              </div>

              <div className="flex items-center gap-2.5">
                <ReferenceIcon
                  name="check"
                  className="text-[18px] text-brand-text"
                />

                <span className="">{t("roleBasedAccessManagementRbac")}</span>
              </div>
            </div>
          </div>

          <Button
            variant="secondary"
            size="lg"
            className="w-full text-sm"
            nativeButton={false}
            role="link"
            render={<Link href="/sign-up" />}
          >
            {t("contactEnterpriseTeam")}
          </Button>
        </div>
      </div>
    </section>
  )
}
