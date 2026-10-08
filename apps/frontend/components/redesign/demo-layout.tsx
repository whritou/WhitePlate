"use client"

import { useTranslations } from "next-intl"
import { Link, usePathname } from "@/i18n/navigation"
import { DemoProvider } from "./demo-provider"
import { DemoNotice } from "./demo-notice"

export function DemoLayout({ children }: { children: React.ReactNode }) {
  const t = useTranslations("Redesign")
  const pathname = usePathname()

  return (
    <DemoProvider>
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
                  pathname === (screen === "menu" ? "/demo" : `/demo/${screen}`)
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

      {children}

      <DemoNotice />
    </DemoProvider>
  )
}
