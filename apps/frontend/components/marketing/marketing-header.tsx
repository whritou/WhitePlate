"use client"

import { Menu, X } from "lucide-react"
import { useLocale, useTranslations } from "next-intl"

import { useRef, useState } from "react"
import { Button } from "@/components/ui/button"
import { Brand } from "@/components/ui/brand"
import { Link, usePathname, useRouter } from "@/i18n/navigation"

export function MarketingHeader() {
  const t = useTranslations("Redesign")
  const locale = useLocale()
  const pathname = usePathname()
  const router = useRouter()

  const [open, setOpen] = useState(false)
  const menuTrigger = useRef<HTMLButtonElement>(null)
  const sections = [
    "features",
    "solutions",
    "previews",
    "pricing",
    "faq",
  ] as const

  return (
    <header
      className="sticky top-0 z-50 bg-background/90 shadow-xs backdrop-blur-xl"
      onKeyDown={(event) => {
        if (event.key === "Escape" && open) {
          setOpen(false)
          menuTrigger.current?.focus()
        }
      }}
    >
      <div className="mx-auto flex min-h-20 max-w-7xl flex-wrap items-center justify-between gap-2 px-4 py-3 sm:gap-4 sm:px-6 lg:px-8">
        <div className="flex min-w-0 items-center gap-8">
          <Link href="/" aria-label={t("home")}>
            <Brand compactOnMobile />
          </Link>

          <nav
            aria-label={t("navigation")}
            className="hidden items-center gap-5 2xl:flex"
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

        <div className="flex max-w-full flex-wrap items-center gap-1 sm:gap-3">
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
                className={`grid min-h-11 min-w-11 place-items-center rounded-md text-xs font-semibold uppercase transition-colors ${locale === language ? "bg-card shadow-xs" : "text-muted-foreground"}`}
              >
                {language}
              </Link>
            ))}
          </div>

          <Button
            className="hidden text-sm lg:inline-flex"
            variant="secondary"
            nativeButton={false}
            render={<Link href="/demo" />}
          >
            {t("tryDemo")}
          </Button>

          <Button
            className="hidden text-sm lg:inline-flex"
            nativeButton={false}
            render={<Link href="/sign-up" />}
          >
            {t("getStarted")}
          </Button>

          <Button
            ref={menuTrigger}
            variant="ghost"
            size="icon"
            aria-label={t("menu")}
            aria-expanded={open}
            aria-controls="marketing-mobile-navigation"
            className="2xl:hidden"
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
          className="absolute inset-x-0 top-full grid max-h-[calc(100dvh-5rem)] gap-1 overflow-y-auto overscroll-contain border-t border-border bg-card p-4 shadow-lg 2xl:hidden"
        >
          {sections.map((section) => (
            <Link
              key={section}
              className="rounded-md p-3 font-medium hover:bg-surface-variant active:bg-surface-dim"
              href={`/#${section === "solutions" ? "features" : section}`}
              onClick={() => setOpen(false)}
            >
              {t(section)}
            </Link>
          ))}

          <Link
            href="/demo"
            className="rounded-md bg-secondary p-3 font-medium hover:bg-surface-variant active:bg-surface-dim"
            onClick={() => setOpen(false)}
          >
            {t("tryDemo")}
          </Link>

          <Link
            href="/sign-up"
            className="rounded-md bg-primary p-3 font-semibold text-primary-foreground hover:bg-primary-hover active:brightness-90"
            onClick={() => setOpen(false)}
          >
            {t("getStarted")}
          </Link>
        </nav>
      )}
    </header>
  )
}
