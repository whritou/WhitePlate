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
      className="mx-auto w-full max-w-7xl px-6 py-20 lg:px-12"
      id="pricing"
    >
      <div className="mx-auto mb-12 max-w-3xl space-y-4 text-center">
        <div className="inline-flex items-center gap-1.5 rounded-full bg-surface-container px-3 py-1 font-sans text-label-sm font-semibold tracking-wider text-on-surface uppercase">
          {t("predictableEconomics")}
        </div>

        <h2 className="font-heading text-headline-lg text-on-surface">
          {t("flatSubscriptionAbsolutelyZeroCommission")}
        </h2>

        <p className="font-sans text-body-lg text-on-surface-variant">
          {t("thirdPartyMarketplacesChargeUpTo30")}
        </p>

        <div className="flex items-center justify-center gap-3 pt-4">
          <span
            className="font-sans text-label-md font-semibold text-on-surface"
            id="label-monthly"
          >
            {t("monthlyBilling")}
          </span>

          <Button
            aria-pressed={annual}
            className="relative inline-flex h-7 w-14 shrink-0 cursor-pointer rounded-full bg-surface-container p-1 transition-colors duration-200 ease-in-out focus:outline-none"
            id="billing-toggle"
            type="button"
            variant="ghost"
            onClick={() => setAnnual(!annual)}
            aria-label={t("toggleAnnualBilling")}
          >
            <span
              id="toggle-knob"
              className={`pointer-events-none block size-5 rounded-full bg-secondary-container shadow-sm transition-transform ${annual ? "translate-x-7" : "translate-x-0"}`}
            ></span>
          </Button>

          <span
            className="flex items-center gap-1.5 font-sans text-label-md text-on-surface-variant"
            id="label-annual"
          >
            <span className="">{t("annualBilling")}</span>

            <span className="rounded-full bg-on-tertiary-container/10 px-2 py-0.5 font-sans text-label-sm font-bold text-on-tertiary-container">
              {t("save20")}
            </span>
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 items-stretch gap-8 md:grid-cols-3">
        <div className="flex flex-col justify-between space-y-8 rounded-lg bg-surface-container-lowest p-8 shadow-sm">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
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

            <div className="flex items-baseline gap-1 py-2">
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
                  className="text-[18px] text-secondary-container"
                />

                <span className="">
                  <strong>{t("value1RestaurantLocation")}</strong>
                </span>
              </div>

              <div className="flex items-center gap-2.5">
                <ReferenceIcon
                  name="check"
                  className="text-[18px] text-secondary-container"
                />

                <span className="">{t("fullWhiteLabelCustomStorefront")}</span>
              </div>

              <div className="flex items-center gap-2.5">
                <ReferenceIcon
                  name="check"
                  className="text-[18px] text-secondary-container"
                />

                <span className="">{t("upTo500OrdersMonth")}</span>
              </div>

              <div className="flex items-center gap-2.5">
                <ReferenceIcon
                  name="check"
                  className="text-[18px] text-secondary-container"
                />

                <span className="">{t("standardKdsTabletInterface")}</span>
              </div>

              <div className="flex items-center gap-2.5">
                <ReferenceIcon
                  name="check"
                  className="text-[18px] text-secondary-container"
                />

                <span className="">
                  <strong>{t("value0PlatformCommissionFee")}</strong>
                </span>
              </div>
            </div>
          </div>

          <Link
            className="w-full rounded-xl bg-surface-container py-3 text-center font-heading text-title-md font-semibold text-on-surface transition-colors hover:bg-surface-container-high"
            href="/sign-up"
          >
            {t("start14DayTrial")}
          </Link>
        </div>

        <div className="relative flex flex-col justify-between space-y-8 rounded-lg bg-surface-container-lowest p-8 shadow-xl ring-2 ring-secondary-container">
          <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 rounded-full bg-secondary-container px-4 py-1 font-sans text-label-sm font-bold tracking-wider text-primary-foreground uppercase shadow-md">
            {t("mostPopularForBusyVenues")}
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-heading text-headline-sm text-on-surface">
                {t("growth")}
              </h3>

              <span className="rounded bg-secondary-container/10 px-2.5 py-1 font-sans text-label-sm font-bold text-secondary-container">
                {t("fastPacedQsr")}
              </span>
            </div>

            <p className="font-sans text-body-sm text-on-surface-variant">
              {t("highVolumeRestaurantsRequiringCustomDomainsInstant")}
            </p>

            <div className="flex items-baseline gap-1 py-2">
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
                  className="text-[18px] text-secondary-container"
                />

                <span className="">
                  <strong>{t("unlimitedOrdersZeroCap")}</strong>
                </span>
              </div>

              <div className="flex items-center gap-2.5">
                <ReferenceIcon
                  name="check"
                  className="text-[18px] text-secondary-container"
                />

                <span className="">{t("multiStationKdsKitchenRouting")}</span>
              </div>

              <div className="flex items-center gap-2.5">
                <ReferenceIcon
                  name="check"
                  className="text-[18px] text-secondary-container"
                />

                <span className="">{t("customDomainEGOrderMybrandCom")}</span>
              </div>

              <li className="flex items-center gap-3 text-on-surface">
                <ReferenceIcon
                  name="check"
                  className="text-[18px] text-secondary-container"
                />

                <span className="">{t("automatedEmailPickupOrderAlerts")}</span>
              </li>

              <div className="flex items-center gap-2.5">
                <ReferenceIcon
                  name="check"
                  className="text-[18px] text-secondary-container"
                />

                <span className="">
                  {t("customerReEngagementLoyaltyEngine")}
                </span>
              </div>

              <div className="flex items-center gap-2.5">
                <ReferenceIcon
                  name="check"
                  className="text-[18px] text-secondary-container"
                />

                <span className="">{t("advancedHourlyRevenueAnalytics")}</span>
              </div>
            </div>
          </div>

          <Link
            className="w-full rounded-xl bg-secondary-container py-3.5 text-center font-heading text-title-md font-bold text-primary-foreground shadow-md transition-all hover:bg-secondary active:scale-[0.98]"
            href="/sign-up"
          >
            {t("getStartedWithGrowth")}
          </Link>
        </div>

        <div className="flex flex-col justify-between space-y-8 rounded-lg bg-surface-container-lowest p-8 shadow-sm">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
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

            <div className="flex items-baseline gap-1 py-2">
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
                  className="text-[18px] text-secondary-container"
                />

                <span className="">
                  {t("multiTenantOrganizationFleetControls")}
                </span>
              </div>

              <div className="flex items-center gap-2.5">
                <ReferenceIcon
                  name="check"
                  className="text-[18px] text-secondary-container"
                />

                <span className="">
                  {t("toastSquareMicrosPosBiDirectionalSync")}
                </span>
              </div>

              <div className="flex items-center gap-2.5">
                <ReferenceIcon
                  name="check"
                  className="text-[18px] text-secondary-container"
                />

                <span className="">
                  {t("isolatedDatabaseClustersCustomSlas")}
                </span>
              </div>

              <div className="flex items-center gap-2.5">
                <ReferenceIcon
                  name="check"
                  className="text-[18px] text-secondary-container"
                />

                <span className="">
                  {t("dedicatedKitchenOnboardingEngineer")}
                </span>
              </div>

              <div className="flex items-center gap-2.5">
                <ReferenceIcon
                  name="check"
                  className="text-[18px] text-secondary-container"
                />

                <span className="">{t("roleBasedAccessManagementRbac")}</span>
              </div>
            </div>
          </div>

          <Link
            className="w-full rounded-xl bg-surface-container py-3 text-center font-heading text-title-md font-semibold text-on-surface transition-colors hover:bg-surface-container-high"
            href="/sign-up"
          >
            {t("contactEnterpriseTeam")}
          </Link>
        </div>
      </div>
    </section>
  )
}
