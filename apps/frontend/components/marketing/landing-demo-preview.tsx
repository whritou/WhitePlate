"use client"
import { useTranslations } from "next-intl"
import { ReferenceIcon } from "./reference-icon"
import { Button } from "@/components/ui/button"
import Image from "next/image"
import { useState } from "react"
import { useRouter } from "@/i18n/navigation"
export function LandingDemoPreview() {
  const t = useTranslations("Marketing")
  const router = useRouter()
  const [view, setView] = useState("kitchen")
  const [bumped, setBumped] = useState(false)
  const viewTabClassName =
    "min-w-0 flex-1 items-center justify-center gap-1 rounded-md px-1 py-1 text-center font-sans text-label-sm transition-all sm:flex-none sm:gap-1.5 sm:px-3"

  return (
    <div className="min-w-0">
      <div className="relative overflow-hidden rounded-lg bg-surface-container-lowest p-4 shadow-xl sm:p-6">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3 pb-4">
          <div className="flex min-w-0 items-center gap-2">
            <div className="h-3 w-3 rounded-full bg-error-container"></div>

            <div className="h-3 w-3 rounded-full bg-surface-container-high"></div>

            <div className="h-3 w-3 rounded-full bg-on-tertiary-container/30"></div>

            <span className="ml-1 min-w-0 font-mono font-sans text-label-sm break-all text-on-surface-variant sm:ml-2">
              {t("orderLapiccolaBistroCom")}
            </span>
          </div>

          <div className="flex w-full min-w-0 items-center rounded-lg bg-surface-container p-1 sm:w-auto">
            <Button
              className={`${viewTabClassName} ${view === "kitchen" ? "bg-surface-container-lowest font-semibold text-on-surface shadow-xs" : "text-on-surface-variant hover:text-on-surface"}`}
              id="tab-btn-backoffice"
              type="button"
              variant="ghost"
              onClick={() => setView("kitchen")}
              aria-pressed={view === "kitchen"}
            >
              <ReferenceIcon name="cooking" className="text-[16px]" />

              <span className="">{t("kitchenKds")}</span>
            </Button>

            <Button
              className={`${viewTabClassName} ${view === "storefront" ? "bg-surface-container-lowest font-semibold text-on-surface shadow-xs" : "text-on-surface-variant hover:text-on-surface"}`}
              id="tab-btn-storefront"
              type="button"
              variant="ghost"
              onClick={() => setView("storefront")}
              aria-pressed={view === "storefront"}
            >
              <ReferenceIcon name="smartphone" className="text-[16px]" />

              <span className="">{t("customerWeb")}</span>
            </Button>
          </div>
        </div>

        <div
          className="space-y-4"
          id="view-backoffice"
          hidden={view !== "kitchen"}
        >
          <div className="grid grid-cols-1 gap-2 min-[480px]:grid-cols-3 sm:gap-3">
            <div className="rounded-xl bg-surface-container-low p-3">
              <p className="font-sans text-label-sm text-on-surface-variant">
                {t("liveQueue")}
              </p>

              <div className="mt-0.5 flex flex-wrap items-baseline gap-x-1.5 gap-y-1">
                <span className="font-heading text-title-md font-bold text-on-surface">
                  {t("value6Orders")}
                </span>

                <span className="font-sans text-label-sm font-semibold text-on-tertiary-container">
                  {t("onTrack")}
                </span>
              </div>
            </div>

            <div className="rounded-xl bg-surface-container-low p-3">
              <p className="font-sans text-label-sm text-on-surface-variant">
                {t("avgPrepTime")}
              </p>

              <div className="mt-0.5 flex flex-wrap items-baseline gap-x-1.5 gap-y-1">
                <span className="font-heading text-title-md font-bold text-on-surface">
                  {t("value11m40s")}
                </span>

                <span className="font-sans text-label-sm font-semibold text-brand-text">
                  {t("value21m")}
                </span>
              </div>
            </div>

            <div className="rounded-xl bg-surface-container-low p-3">
              <p className="font-sans text-label-sm text-on-surface-variant">
                {t("zeroFeeVolume")}
              </p>

              <div className="mt-0.5 flex flex-wrap items-baseline gap-x-1.5 gap-y-1">
                <span className="font-heading text-title-md font-bold text-on-surface">
                  {t("value1480")}
                </span>

                <span className="font-sans text-label-sm font-semibold text-on-tertiary-container">
                  {t("today")}
                </span>
              </div>
            </div>
          </div>

          <div className="space-y-2.5">
            <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl bg-surface-container-low p-3.5 shadow-xs">
              <div className="flex min-w-0 flex-1 basis-56 items-center gap-3">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-secondary-container/10 font-heading text-title-md font-bold text-brand-text">
                  {t("value48")}
                </div>

                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2 [&>span]:max-w-full [&>span]:min-w-0">
                    <span className="font-heading text-title-md text-on-surface">
                      {t("claraDupont")}
                    </span>

                    <span className="rounded-full bg-secondary-container px-2 py-0.5 font-sans text-label-sm font-semibold text-primary-foreground">
                      {t("readyIn0320")}
                    </span>
                  </div>

                  <p className="font-sans text-body-sm text-on-surface-variant">
                    {t("value2xTruffleGnocchi1xSicilianCannoli")}
                  </p>
                </div>
              </div>

              <Button
                className="ml-auto rounded-lg bg-surface-container-high px-3 py-1.5 font-sans text-label-sm font-semibold text-on-surface transition-colors hover:bg-surface-variant"
                type="button"
                variant="ghost"
                onClick={() => setBumped(!bumped)}
                aria-pressed={bumped}
              >
                {bumped ? t("orderReady") : t("bumpOrderrder")}
              </Button>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl bg-surface-container-low p-3.5 shadow-xs">
              <div className="flex min-w-0 flex-1 basis-56 items-center gap-3">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary-container font-heading text-title-md font-bold text-on-primary">
                  {t("value49")}
                </div>

                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2 [&>span]:max-w-full [&>span]:min-w-0">
                    <span className="font-heading text-title-md text-on-surface">
                      {t("marcAlcantara")}
                    </span>

                    <span className="rounded-full bg-surface-container px-2 py-0.5 font-sans text-label-sm font-semibold text-on-surface-variant">
                      {t("prep0915")}
                    </span>
                  </div>

                  <p className="font-sans text-body-sm text-on-surface-variant">
                    {t("value1xNeapolitanMargheritaGlutenFreeCrust")}
                  </p>
                </div>
              </div>

              <span className="rounded-md bg-surface-container px-2.5 py-1 font-sans text-label-sm text-on-surface-variant">
                {t("station2")}
              </span>
            </div>
          </div>

          <div className="flex items-center justify-between rounded-xl bg-primary-container p-4 text-on-primary">
            <div>
              <p className="font-sans text-label-sm text-on-primary-container">
                {t("commissionSavedTodayVsDeliveryApps")}
              </p>

              <p className="font-heading text-headline-sm font-bold text-on-primary">
                {t("value44400KeptInHouse")}
              </p>
            </div>

            <svg
              className="h-8 w-24 text-primary"
              fill="none"
              viewBox="0 0 100 30"
            >
              <path
                d="M0 25 C20 22, 35 15, 50 18 C65 20, 80 5, 100 2"
                stroke="currentColor"
                strokeLinecap="round"
                strokeWidth="3"
              ></path>
            </svg>
          </div>
        </div>

        <div
          className="space-y-4"
          id="view-storefront"
          hidden={view !== "storefront"}
        >
          <div className="relative h-32 w-full overflow-hidden rounded-xl">
            <Image
              className="h-full w-full object-cover"
              src="/design/photo-6.webp"
              width={160}
              height={160}
              alt=""
            />

            <div className="absolute inset-0 flex items-end bg-gradient-to-t from-primary-container/90 via-primary-container/40 to-transparent p-3">
              <div>
                <h3 className="font-heading text-headline-sm font-bold text-on-primary">
                  {t("laPiccolaTrattoria")}
                </h3>

                <div className="flex flex-wrap items-center gap-2 font-sans text-label-sm text-on-primary-container">
                  <span className="flex items-center gap-1">
                    <ReferenceIcon
                      name="schedule"
                      className="text-[14px] text-brand-text"
                    />

                    {t("value1520MinPickup")}
                  </span>

                  <span className="">{t("separator")}</span>

                  <span className="flex items-center gap-1">
                    <ReferenceIcon
                      name="verified"
                      className="text-[14px] text-on-tertiary-container"
                    />

                    {t("verifiedWhiteLabel")}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="flex gap-2 overflow-x-auto pb-1">
            <span className="shrink-0 rounded-full bg-secondary-container px-3 py-1 font-sans text-label-sm font-semibold text-primary-foreground">
              {t("bestsellers")}
            </span>

            <span className="shrink-0 rounded-full bg-surface-container px-3 py-1 font-sans text-label-sm text-on-surface">
              {t("woodFiredPizza")}
            </span>

            <span className="shrink-0 rounded-full bg-surface-container px-3 py-1 font-sans text-label-sm text-on-surface">
              {t("freshPasta")}
            </span>

            <span className="shrink-0 rounded-full bg-surface-container px-3 py-1 font-sans text-label-sm text-on-surface">
              {t("dolci")}
            </span>
          </div>

          <div className="grid grid-cols-[repeat(auto-fit,minmax(min(100%,8rem),1fr))] gap-3">
            <div className="flex flex-col justify-between rounded-xl bg-surface-container-low p-2.5">
              <div>
                <Image
                  className="mb-2 h-20 w-full rounded-lg object-cover"
                  src="/design/photo-7.webp"
                  width={160}
                  height={160}
                  alt=""
                />

                <p className="line-clamp-1 font-heading text-title-md font-semibold text-on-surface">
                  {t("truffleTagliatelle")}
                </p>

                <p className="mt-0.5 font-sans text-label-sm font-bold text-on-surface-variant">
                  {t("value2200")}
                </p>
              </div>

              <Button
                className="mt-2 w-full rounded-lg bg-surface py-1.5 font-sans text-label-sm font-semibold text-on-surface transition-colors hover:bg-secondary-container hover:text-primary-foreground active:brightness-90"
                type="button"
                variant="ghost"
                onClick={() => router.push("/demo")}
              >
                {t("addToCart")}
              </Button>
            </div>

            <div className="flex flex-col justify-between rounded-xl bg-surface-container-low p-2.5">
              <div>
                <Image
                  className="mb-2 h-20 w-full rounded-lg object-cover"
                  src="/design/photo-8.webp"
                  width={160}
                  height={160}
                  alt=""
                />

                <p className="line-clamp-1 font-heading text-title-md font-semibold text-on-surface">
                  {t("burrataPugliese")}
                </p>

                <p className="mt-0.5 font-sans text-label-sm font-bold text-on-surface-variant">
                  {t("value1650")}
                </p>
              </div>

              <Button
                className="mt-2 w-full rounded-lg bg-surface py-1.5 font-sans text-label-sm font-semibold text-on-surface transition-colors hover:bg-secondary-container hover:text-primary-foreground active:brightness-90"
                type="button"
                variant="ghost"
                onClick={() => router.push("/demo")}
              >
                {t("addToCart")}
              </Button>
            </div>
          </div>

          <div className="flex min-w-0 flex-col items-stretch gap-3 rounded-xl bg-surface-container p-3">
            <div className="flex min-w-0 items-center gap-2">
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-secondary-container font-sans text-label-sm font-bold text-primary-foreground">
                {t("value2")}
              </span>

              <span className="min-w-0 font-heading text-body-md text-on-surface sm:text-title-md">
                {t("value3850Total")}
              </span>
            </div>

            <Button
              className="w-full bg-secondary-container px-3 py-2 text-center font-sans text-[0.75rem] font-bold whitespace-normal text-primary-foreground shadow-sm"
              type="button"
              variant="ghost"
              onClick={() => router.push("/demo")}
            >
              {t("payWithApplePay")}
            </Button>
          </div>
        </div>

        <div className="mt-4 flex flex-wrap items-center justify-between gap-2 pt-3 font-sans text-label-sm text-on-surface-variant">
          <span className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-on-tertiary-container"></span>

            {t("socketIoWebhookActive")}
          </span>

          <span className="font-mono">{t("p99Latency42ms")}</span>
        </div>
      </div>
    </div>
  )
}
