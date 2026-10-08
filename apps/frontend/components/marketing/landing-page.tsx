import { MarketingHeader } from "./marketing-header"
import { MarketingFooter } from "./marketing-footer"
import { LandingHero } from "./landing-hero"
import { LandingMetrics } from "./landing-metrics"
import { LandingFeatures } from "./landing-features"
import { LandingPreviews } from "./landing-previews"
import { LandingPricing } from "./landing-pricing"
import { LandingFaq } from "./landing-faq"
import { LandingCta } from "./landing-cta"

export function LandingPage() {
  return (
    <>
      <MarketingHeader />

      <main className="flex flex-col items-center">
        <LandingHero />

        <LandingMetrics />

        <LandingFeatures />

        <LandingPreviews />

        <LandingPricing />

        <LandingFaq />

        <LandingCta />
      </main>

      <MarketingFooter />
    </>
  )
}
