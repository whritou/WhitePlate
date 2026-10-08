"use client"
import { useTranslations } from "next-intl"
import { Brand } from "@/components/ui/brand"
import { Link } from "@/i18n/navigation"
export function MarketingFooter() {
  const t = useTranslations("Marketing")

  return (
    <footer className="mt-8 w-full bg-surface-container-low text-on-surface-variant sm:mt-12">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-5">
          <div className="min-w-0 space-y-4 sm:col-span-2">
            <div className="flex items-center gap-3">
              <Brand className="max-w-full flex-wrap" />
            </div>

            <p className="max-w-[24rem] font-sans text-body-sm text-on-surface-variant">
              {t("highVelocityWhiteLabelClickCollectInfrastructure")}
            </p>
          </div>

          <div>
            <h4 className="mb-4 font-heading text-title-md text-on-surface">
              {t("product")}
            </h4>

            <ul className="space-y-1 font-sans text-body-sm">
              <li className="transition-colors hover:text-on-surface">
                <Link
                  href="/#features"
                  className="inline-flex min-h-11 items-center"
                >
                  {t("whiteLabelOrdering")}
                </Link>
              </li>

              <li className="transition-colors hover:text-on-surface">
                <Link
                  href="/demo/dashboard"
                  className="inline-flex min-h-11 items-center"
                >
                  {t("kitchenDisplayPos")}
                </Link>
              </li>

              <li className="transition-colors hover:text-on-surface">
                <Link
                  href="/demo"
                  className="inline-flex min-h-11 items-center"
                >
                  {t("themingEngine")}
                </Link>
              </li>

              <li className="transition-colors hover:text-on-surface">
                <Link
                  href="/#pricing"
                  className="inline-flex min-h-11 items-center"
                >
                  {t("multiLocationHub")}
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="mb-4 font-heading text-title-md text-on-surface">
              {t("solutions")}
            </h4>

            <ul className="space-y-1 font-sans text-body-sm">
              <li className="transition-colors hover:text-on-surface">
                <Link
                  href="/#features"
                  className="inline-flex min-h-11 items-center"
                >
                  {t("ghostKitchens")}
                </Link>
              </li>

              <li className="transition-colors hover:text-on-surface">
                <Link
                  href="/#features"
                  className="inline-flex min-h-11 items-center"
                >
                  {t("quickServiceQsr")}
                </Link>
              </li>

              <li className="transition-colors hover:text-on-surface">
                <Link
                  href="/#features"
                  className="inline-flex min-h-11 items-center"
                >
                  {t("artisanBakeries")}
                </Link>
              </li>

              <li className="transition-colors hover:text-on-surface">
                <Link
                  href="/#features"
                  className="inline-flex min-h-11 items-center"
                >
                  {t("cafFranchises")}
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="mb-4 font-heading text-title-md text-on-surface">
              {t("legalSecurity")}
            </h4>

            <ul className="space-y-1 font-sans text-body-sm">
              <li className="transition-colors hover:text-on-surface">
                <span>{t("privacyPolicy")}</span>
              </li>

              <li className="transition-colors hover:text-on-surface">
                <span>{t("termsOfService")}</span>
              </li>

              <li className="transition-colors hover:text-on-surface">
                <span>{t("gdprCompliance")}</span>
              </li>

              <li className="transition-colors hover:text-on-surface">
                <span>{t("systemStatus")}</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-12 flex flex-col items-center justify-between gap-4 pt-12 font-sans text-label-sm text-on-surface-variant sm:flex-row">
          <p>{t("value2026WhiteplateTechnologiesIncBuiltForCulinary")}</p>

          <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-3">
            <span>{t("security")}</span>

            <span>{t("cookies")}</span>

            <span>{t("apiPortal")}</span>
          </div>
        </div>
      </div>
    </footer>
  )
}
