"use client"

import { useTranslations } from "next-intl"
import { Link, usePathname } from "@/i18n/navigation"
import { BackofficeProvider } from "@/lib/lovable/backoffice"
import { BackofficeAppbar } from "@/components/lovable/BackofficeAppbar"
import { DemoNotice } from "./demo-notice"

export function DemoLayout({ children }: { children: React.ReactNode }) {
  const t = useTranslations("Redesign")
  const pathname = usePathname()

  return (
    <BackofficeProvider>
      <div className="lovable-surface min-h-screen">
        <div className="bg-secondary/70">
          <nav
            aria-label={t("demoNavigation")}
            className="mx-auto flex max-w-7xl flex-wrap items-center justify-center gap-x-5 px-4 py-2 text-xs font-semibold"
          >
            {(["menu", "checkout", "tracking", "dashboard"] as const).map(
              (screen) => (
                <Link
                  key={screen}
                  href={screen === "menu" ? "/demo" : `/demo/${screen}`}
                  aria-current={
                    pathname ===
                    (screen === "menu" ? "/demo" : `/demo/${screen}`)
                      ? "page"
                      : undefined
                  }
                  className="inline-flex min-h-11 items-center border-b-2 border-transparent px-1 text-center aria-[current=page]:border-primary"
                >
                  {t(screen)}
                </Link>
              )
            )}
          </nav>
        </div>

        {!["/demo", "/demo/checkout", "/demo/tracking"].includes(pathname) && (
          <BackofficeAppbar />
        )}

        {children}

        <DemoNotice />
      </div>
    </BackofficeProvider>
  )
}
