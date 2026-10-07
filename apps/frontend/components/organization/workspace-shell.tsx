"use client"

import { Menu, Moon, Sun, X } from "lucide-react"
import ReactFlagsSelect from "react-flags-select"
import { useLocale, useTranslations } from "next-intl"
import { useTheme } from "next-themes"
import { useSearchParams } from "next/navigation"
import { useState } from "react"
import { SignOutButton } from "@/components/auth/sign-out-button"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"
import { Link, usePathname, useRouter } from "@/i18n/navigation"
import {
  buildWorkspaceNavigation,
  isWorkspaceLinkActive,
  resolveWorkspaceContext,
} from "@/lib/workspace-navigation"
import type {
  WorkspaceNavigationSection,
  WorkspaceShellProps,
} from "@/types/workspace-navigation"

export function WorkspaceShell({
  organizations,
  restaurants,
  children,
}: WorkspaceShellProps) {
  const t = useTranslations("Workspace")
  const locale = useLocale()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const { resolvedTheme, setTheme } = useTheme()
  const [mobileNavigationOpen, setMobileNavigationOpen] = useState(false)
  const sections = buildWorkspaceNavigation(organizations, restaurants, (key) =>
    t(key)
  )
  const currentSearchParams = new URLSearchParams(searchParams.toString())
  const context = resolveWorkspaceContext(
    currentSearchParams,
    organizations,
    restaurants
  )
  const contextName = context?.name ?? t("workspace")
  const localeSearchParams = new URLSearchParams(currentSearchParams)

  if (!context) {
    localeSearchParams.delete("organizationId")
    localeSearchParams.delete("tenantId")
  }

  const query = localeSearchParams.toString()
  const currentHref = `${pathname}${query ? `?${query}` : ""}`

  function toggleTheme() {
    setTheme(resolvedTheme === "dark" ? "light" : "dark")
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Link
        href="#workspace-content"
        className="sr-only z-[60] rounded-md bg-background p-3 text-sm font-medium text-foreground focus:not-sr-only focus:fixed focus:top-4 focus:left-4"
      >
        {t("skipToContent")}
      </Link>

      <div className="flex min-h-screen">
        <aside className="sticky top-0 hidden h-screen w-64 shrink-0 flex-col border-r border-border bg-card md:flex">
          <div className="px-5 py-6">
            <Link href="/organization" className="text-lg font-semibold">
              WhitePlate
            </Link>

            <p className="mt-1 truncate text-sm text-muted-foreground">
              {contextName}
            </p>
          </div>

          <Separator />

          <WorkspaceNavigation
            sections={sections}
            pathname={pathname}
            searchParams={currentSearchParams}
            label={t("navigationLabel")}
          />
        </aside>

        <div className="flex min-w-0 flex-1 flex-col">
          <header className="sticky top-0 z-30 flex min-h-16 flex-wrap items-center gap-2 border-b border-border bg-background px-3 py-2 sm:px-6 md:justify-end">
            <div className="md:hidden">
              <Sheet
                open={mobileNavigationOpen}
                onOpenChange={setMobileNavigationOpen}
              >
                <SheetTrigger
                  render={
                    <Button
                      variant="outline"
                      size="icon"
                      aria-label={t("openNavigation")}
                    />
                  }
                >
                  <Menu aria-hidden="true" />
                </SheetTrigger>

                <SheetContent
                  side="left"
                  className="w-[min(20rem,calc(100vw-2.5rem))]"
                >
                  <SheetHeader className="relative pr-12">
                    <SheetTitle className="sr-only">
                      {t("navigationLabel")}
                    </SheetTitle>

                    <SheetClose
                      aria-label={t("closeNavigation")}
                      className="absolute top-0 right-0 inline-flex size-11 items-center justify-center rounded-md text-foreground hover:bg-muted focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
                    >
                      <X aria-hidden="true" className="size-4" />
                    </SheetClose>
                  </SheetHeader>

                  <WorkspaceNavigation
                    sections={sections}
                    pathname={pathname}
                    searchParams={currentSearchParams}
                    label={t("navigationLabel")}
                    onNavigate={() => setMobileNavigationOpen(false)}
                  />
                </SheetContent>
              </Sheet>
            </div>

            <LocaleSelector currentHref={currentHref} locale={locale} />

            <Separator orientation="vertical" className="hidden h-6 sm:block" />

            <Button
              variant="outline"
              size="icon"
              aria-label={t("toggleTheme")}
              onClick={toggleTheme}
            >
              <Sun aria-hidden="true" className="hidden dark:block" />

              <Moon aria-hidden="true" className="dark:hidden" />
            </Button>

            <SignOutButton />
          </header>

          <div id="workspace-content" tabIndex={-1} className="min-w-0 flex-1">
            {children}
          </div>
        </div>
      </div>
    </div>
  )
}

function WorkspaceNavigation({
  sections,
  pathname,
  searchParams,
  label,
  onNavigate,
}: {
  sections: WorkspaceNavigationSection[]
  pathname: string
  searchParams: URLSearchParams
  label: string
  onNavigate?: () => void
}) {
  return (
    <nav
      aria-label={label}
      className="min-h-0 flex-1 overflow-y-auto overscroll-contain p-3"
    >
      {sections.map((section) => (
        <section key={section.id} className="mb-5 last:mb-0">
          <h2 className="mb-2 px-3 text-sm font-semibold text-muted-foreground">
            {section.label}
          </h2>

          <ul className="grid gap-1">
            {section.links.map((link) => {
              const active = isWorkspaceLinkActive(
                link.href,
                pathname,
                searchParams
              )

              return (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    aria-current={active ? "page" : undefined}
                    onClick={onNavigate}
                    className={`flex min-h-11 items-center rounded-md px-3 py-2 text-sm transition-colors hover:bg-muted focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring ${active ? "bg-accent font-semibold text-accent-foreground" : "text-muted-foreground"}`}
                  >
                    {link.label}
                  </Link>
                </li>
              )
            })}
          </ul>
        </section>
      ))}
    </nav>
  )
}

const localeOptions = [
  { locale: "en", countryCode: "GB", label: "english" },
  { locale: "fr", countryCode: "FR", label: "french" },
] as const

export function localeToFlagCountryCode(locale: string) {
  return localeOptions.find((option) => option.locale === locale)?.countryCode
}

export function localeFromFlagCountryCode(countryCode: string) {
  return localeOptions.find((option) => option.countryCode === countryCode)
    ?.locale
}

export function navigateToLocale(
  router: Pick<ReturnType<typeof useRouter>, "replace">,
  currentHref: string,
  requestedLocale: string
) {
  const selectedLocale = localeOptions.find(
    (option) => option.locale === requestedLocale
  )

  if (selectedLocale) {
    router.replace(currentHref, { locale: selectedLocale.locale })
  }
}

function LocaleSelector({
  currentHref,
  locale,
}: {
  currentHref: string
  locale: string
}) {
  const t = useTranslations("Workspace")
  const router = useRouter()
  const countryCode = localeToFlagCountryCode(locale) ?? "GB"
  const customLabels = Object.fromEntries(
    localeOptions.map((option) => [option.countryCode, t(option.label)])
  )

  return (
    <div role="group" aria-label={t("language")} className="shrink-0">
      <ReactFlagsSelect
        id="workspace-language"
        rfsKey="workspace-language"
        selected={countryCode}
        onSelect={(selectedCountryCode) => {
          const nextLocale = localeFromFlagCountryCode(selectedCountryCode)

          if (nextLocale) navigateToLocale(router, currentHref, nextLocale)
        }}
        countries={localeOptions.map((option) => option.countryCode)}
        customLabels={customLabels}
        placeholder={t("language")}
        selectedSize={14}
        optionsSize={14}
        fullWidth={false}
        alignOptionsToRight
        className="workspace-language-select"
        selectButtonClassName="workspace-language-select__button"
      />
    </div>
  )
}
