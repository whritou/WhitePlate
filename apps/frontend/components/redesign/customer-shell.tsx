import { MarketingHeader } from "@/components/marketing/marketing-header"
import { MarketingFooter } from "@/components/marketing/marketing-footer"

export function CustomerShell({ children }: { children: React.ReactNode }) {
  return (
    <>
      <MarketingHeader />

      {children}

      <MarketingFooter />
    </>
  )
}
