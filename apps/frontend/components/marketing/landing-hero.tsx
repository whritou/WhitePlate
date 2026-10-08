"use client"
import { useTranslations } from "next-intl"
import { ReferenceIcon } from "./reference-icon"
import { Button } from "@/components/ui/button"
import Image from "next/image"
import { Link } from "@/i18n/navigation"
import { LandingDemoPreview } from "./landing-demo-preview"
import { useRouter } from "@/i18n/navigation"

export function LandingHero() {
  const t = useTranslations("Marketing")
  const router = useRouter()

  return (
    <section className="relative mx-auto w-full max-w-7xl overflow-hidden px-6 py-12 lg:px-12 lg:py-20">
      <div className="pointer-events-none absolute -top-32 -left-32 h-96 w-96 rounded-full bg-secondary-container/10 blur-3xl"></div>

      <div className="pointer-events-none absolute top-1/2 -right-48 h-96 w-96 rounded-full bg-surface-container-high/40 blur-3xl"></div>

      <div className="grid grid-cols-1 items-center gap-12 lg:grid-cols-12 lg:gap-16">
        <div className="flex flex-col space-y-6 lg:col-span-6">
          <div className="inline-flex w-fit items-center gap-2 rounded-full bg-surface-container px-3 py-1.5 shadow-sm">
            <span className="flex h-2 w-2 rounded-full bg-secondary-container motion-safe:animate-pulse"></span>

            <span className="font-sans text-label-sm font-semibold tracking-wide text-on-surface uppercase">
              {t("theNextGenWhiteLabelClickCollect")}
            </span>
          </div>

          <h1 className="font-heading text-headline-lg-mobile leading-tight tracking-tight text-balance text-on-surface sm:text-display-hero-mobile sm:leading-none lg:text-display-hero">
            {t("turnDinersIntoDirectCustomers")}{" "}
            <span className="text-secondary-container">
              {t("value0MarketplaceFees")}
            </span>
          </h1>

          <p className="max-w-[36rem] font-sans text-body-lg text-on-surface-variant">
            {t("launchYourOwnBrandedWebStorefrontIn")}
          </p>

          <div className="flex flex-col items-stretch gap-4 pt-2 sm:flex-row sm:items-center">
            <Link
              className="group inline-flex items-center justify-center gap-2 rounded-xl bg-secondary-container px-4 py-3 font-heading text-label-md text-primary-foreground shadow-md transition-all hover:bg-secondary active:scale-[0.98] sm:gap-3 sm:px-7 sm:py-3.5 sm:text-title-md"
              href="/sign-up"
            >
              <span className="">{t("joinWhiteplate14DaysFree")}</span>

              <ReferenceIcon
                name="arrow_forward"
                className="text-[20px] transition-transform group-hover:translate-x-0.5"
              />
            </Link>

            <Button
              className="inline-flex items-center justify-center gap-2.5 rounded-xl bg-surface-container px-6 py-3.5 font-sans text-label-md text-on-surface shadow-sm transition-all hover:bg-surface-container-high active:scale-[0.98]"
              id="hero-quick-demo-btn"
              type="button"
              variant="ghost"
              onClick={() => router.push("/demo")}
            >
              <ReferenceIcon
                name="play_circle"
                className="text-[20px] text-secondary-container"
              />

              <span className="">{t("tryInteractiveDemo")}</span>
            </Button>
          </div>

          <div className="flex flex-wrap items-center gap-6 pt-6">
            <div className="flex items-center -space-x-2">
              <Image
                className="h-10 w-10 rounded-full object-cover shadow-sm ring-2 ring-surface"
                src="/design/photo-3.webp"
                width={160}
                height={160}
                alt=""
              />

              <Image
                className="h-10 w-10 rounded-full object-cover shadow-sm ring-2 ring-surface"
                src="/design/photo-4.webp"
                width={160}
                height={160}
                alt=""
              />

              <Image
                className="h-10 w-10 rounded-full object-cover shadow-sm ring-2 ring-surface"
                src="/design/photo-5.webp"
                width={160}
                height={160}
                alt=""
              />

              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary-container font-sans text-label-sm font-bold text-on-primary shadow-sm ring-2 ring-surface">
                {t("value12k")}
              </div>
            </div>

            <div className="flex flex-col">
              <div className="flex items-center gap-1 text-secondary-container">
                <ReferenceIcon name="star" className="text-[18px]" />

                <ReferenceIcon name="star" className="text-[18px]" />

                <ReferenceIcon name="star" className="text-[18px]" />

                <ReferenceIcon name="star" className="text-[18px]" />

                <ReferenceIcon name="star" className="text-[18px]" />

                <span className="ml-1 font-heading text-title-md font-bold text-on-surface">
                  {t("value495")}
                </span>
              </div>

              <p className="font-sans text-body-sm text-on-surface-variant">
                {t("trustedBy1200IndependentEateriesMulti")}
              </p>
            </div>
          </div>
        </div>

        <LandingDemoPreview />
      </div>
    </section>
  )
}
