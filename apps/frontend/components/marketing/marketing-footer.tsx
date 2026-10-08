"use client"
import { useTranslations } from "next-intl"
import { Brand } from "@/components/ui/brand"
import { Link } from "@/i18n/navigation"
export function MarketingFooter() {
  const t = useTranslations("Marketing")

  return (
    <footer className="mt-16 w-full bg-surface-container-low text-on-surface-variant">
      <div className="mx-auto max-w-7xl px-6 py-16 lg:px-12">
        <div className="grid grid-cols-1 gap-12 md:grid-cols-5">
          <div className="space-y-4 md:col-span-2">
            <div className="flex items-center gap-3">
              <Brand />
            </div>

            <p className="max-w-[24rem] font-sans text-body-sm text-on-surface-variant">
              {t("highVelocityWhiteLabelClickCollectInfrastructure")}
            </p>
          </div>

          <div>
            <h4 className="mb-4 font-heading text-title-md text-on-surface">
              {t("product")}
            </h4>

            <ul className="space-y-3 font-sans text-body-sm">
              <li className="transition-colors hover:text-on-surface">
                <Link href="/#features" className="">
                  {t("whiteLabelOrdering")}
                </Link>
              </li>

              <li className="transition-colors hover:text-on-surface">
                <Link href="/demo/dashboard" className="">
                  {t("kitchenDisplayPos")}
                </Link>
              </li>

              <li className="transition-colors hover:text-on-surface">
                <Link href="/demo" className="">
                  {t("themingEngine")}
                </Link>
              </li>

              <li className="transition-colors hover:text-on-surface">
                <Link href="/#pricing" className="">
                  {t("multiLocationHub")}
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="mb-4 font-heading text-title-md text-on-surface">
              {t("solutions")}
            </h4>

            <ul className="space-y-3 font-sans text-body-sm">
              <li className="transition-colors hover:text-on-surface">
                <Link href="/#features" className="">
                  {t("ghostKitchens")}
                </Link>
              </li>

              <li className="transition-colors hover:text-on-surface">
                <Link href="/#features" className="">
                  {t("quickServiceQsr")}
                </Link>
              </li>

              <li className="transition-colors hover:text-on-surface">
                <Link href="/#features" className="">
                  {t("artisanBakeries")}
                </Link>
              </li>

              <li className="transition-colors hover:text-on-surface">
                <Link href="/#features" className="">
                  {t("cafFranchises")}
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="mb-4 font-heading text-title-md text-on-surface">
              {t("legalSecurity")}
            </h4>

            <ul className="space-y-3 font-sans text-body-sm">
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
          <p className="">
            {t("value2026WhiteplateTechnologiesIncBuiltForCulinary")}
          </p>

          <div className="flex items-center gap-6">
            <span>{t("security")}</span>

            <span>{t("cookies")}</span>

            <span>{t("apiPortal")}</span>
          </div>
        </div>
      </div>
    </footer>
  )
}
