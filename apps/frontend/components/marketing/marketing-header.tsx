"use client"

import { Menu, Moon, Sun, X } from "lucide-react"
import { useLocale, useTranslations } from "next-intl"
import { useTheme } from "next-themes"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Brand } from "@/components/ui/brand"
import { Link, usePathname, useRouter } from "@/i18n/navigation"

export function MarketingHeader() {
  const t = useTranslations("Redesign")
  const locale = useLocale()
  const pathname = usePathname()
  const router = useRouter()
  const { resolvedTheme, setTheme } = useTheme()
  const [open, setOpen] = useState(false)
  const sections = [
    "features",
    "solutions",
    "previews",
    "pricing",
    "faq",
  ] as const

  return (
    <header className="sticky top-0 z-50 bg-background/90 shadow-xs backdrop-blur-xl">
      <div className="mx-auto flex min-h-20 max-w-7xl items-center justify-between gap-2 px-3 sm:gap-4 sm:px-6 lg:px-12">
        <div className="flex min-w-0 items-center gap-8">
          <Link href="/" aria-label={t("home")}>
            <Brand compactOnMobile />
          </Link>

          <nav
            aria-label={t("navigation")}
            className="hidden items-center gap-5 xl:flex"
          >
            {sections.map((section) => (
              <Link
                key={section}
                className="text-sm font-medium text-muted-foreground hover:text-foreground"
                href={`/#${section === "solutions" ? "features" : section}`}
              >
                {t(section)}
              </Link>
            ))}
          </nav>
        </div>

        <div className="flex shrink-0 items-center gap-1 sm:gap-3">
          <div
            aria-label={t("language")}
            role="group"
            className="flex rounded-lg bg-secondary p-1"
          >
            {(["en", "fr"] as const).map((language) => (
              <Link
                key={language}
                href={pathname}
                locale={language}
                onClick={(event) => {
                  event.preventDefault()
                  router.replace(
                    pathname + window.location.search + window.location.hash,
                    { locale: language }
                  )
                }}
                lang={language}
                aria-current={locale === language ? "true" : undefined}
                className={`grid min-h-9 min-w-9 place-items-center rounded-md text-xs font-semibold uppercase transition-colors sm:min-h-10 sm:min-w-10 ${locale === language ? "bg-card shadow-xs" : "text-muted-foreground"}`}
              >
                {language}
              </Link>
            ))}
          </div>

          <Button
            variant="ghost"
            size="icon"
            aria-label={t("toggleTheme")}
            onClick={() =>
              setTheme(resolvedTheme === "dark" ? "light" : "dark")
            }
          >
            <Sun aria-hidden="true" className="hidden dark:block" />

            <Moon aria-hidden="true" className="dark:hidden" />
          </Button>

          <Button
            className="hidden text-sm sm:inline-flex"
            variant="secondary"
            nativeButton={false}
            render={<Link href="/demo" />}
          >
            {t("tryDemo")}
          </Button>

          <Button
            className="hidden text-sm sm:inline-flex"
            nativeButton={false}
            render={<Link href="/sign-up" />}
          >
            {t("getStarted")}
          </Button>

          <Button
            variant="ghost"
            size="icon"
            aria-label={t("menu")}
            aria-expanded={open}
            aria-controls="marketing-mobile-navigation"
            className="xl:hidden"
            onClick={() => setOpen(!open)}
          >
            {open ? <X aria-hidden="true" /> : <Menu aria-hidden="true" />}
          </Button>
        </div>
      </div>

      {open && (
        <nav
          id="marketing-mobile-navigation"
          aria-label={t("navigation")}
          className="grid gap-1 border-t border-border bg-card p-4 xl:hidden"
        >
          {sections.map((section) => (
            <Link
              key={section}
              className="rounded-md p-3 font-medium hover:bg-secondary"
              href={`/#${section === "solutions" ? "features" : section}`}
              onClick={() => setOpen(false)}
            >
              {t(section)}
            </Link>
          ))}

          <Link
            href="/demo"
            className="rounded-md bg-secondary p-3 font-medium"
            onClick={() => setOpen(false)}
          >
            {t("tryDemo")}
          </Link>

          <Link
            href="/sign-up"
            className="rounded-md bg-primary p-3 font-semibold text-primary-foreground"
            onClick={() => setOpen(false)}
          >
            {t("getStarted")}
          </Link>
        </nav>
      )}
    </header>
  )
}
