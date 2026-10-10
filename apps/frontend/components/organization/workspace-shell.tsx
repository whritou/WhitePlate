"use client"
import { Moon, Sun, CreditCard, Radio } from "lucide-react"
import ReactFlagsSelect from "react-flags-select"
import { useLocale, useTranslations } from "next-intl"
import { useTheme } from "next-themes"
import { useSearchParams } from "next/navigation"
import { WorkspaceLinkIcon } from "./workspace-link-icon"
import { SignOutButton } from "@/components/auth/sign-out-button"
import { Button } from "@/components/ui/button"
import {
  NativeSelect,
  NativeSelectOption,
  NativeSelectOptGroup,
} from "@/components/ui/native-select"
import { VisualScopeProvider } from "@/components/ui/visual-scope"
import { Link, usePathname, useRouter } from "@/i18n/navigation"
import { liveWorkspaceLinks } from "@/lib/live-workspace-navigation"
import {
  isWorkspaceLinkActive,
  resolveWorkspaceContext,
} from "@/lib/workspace-navigation"
import type { WorkspaceShellProps } from "@/types/workspace-navigation"

export function WorkspaceShell({
  organizations,
  restaurants,
  children,
}: WorkspaceShellProps) {
  const t = useTranslations("Workspace")
  const v = useTranslations("LiveWorkspace")
  const locale = useLocale()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const router = useRouter()
  const { resolvedTheme, setTheme } = useTheme()
  const search = new URLSearchParams(searchParams.toString())
  const context = resolveWorkspaceContext(search, organizations, restaurants)
  const links = liveWorkspaceLinks(search, organizations, restaurants)
  const localeSearch = new URLSearchParams(search)

  if (!context) {
    localeSearch.delete("tenantId")
    localeSearch.delete("organizationId")
  }

  const query = localeSearch.toString()
  const currentHref = `${pathname}${query ? `?${query}` : ""}`
  const settingsHref =
    context?.type === "organization"
      ? `/organization/settings?organizationId=${context.id}&section=payments`
      : "/organization"

  function changeContext(value: string) {
    const [type, id] = value.split(":")

    if (type === "restaurant" && restaurants.some((item) => item.id === id)) {
      const role = restaurants.find((item) => item.id === id)!.role

      router.push(
        `/organization/${role === "Kitchen" ? "orders" : "dashboard"}?tenantId=${id}`
      )
    } else if (
      type === "organization" &&
      organizations.some((item) => item.id === id)
    ) {
      router.push(`/organization/settings?organizationId=${id}`)
    } else if (!value) router.push("/organization")
  }

  return (
    <VisualScopeProvider value={{ className: "lovable-surface lovable-live" }}>
      <div className="lovable-surface lovable-live min-h-screen bg-background text-foreground">
        <Link
          href="#workspace-content"
          className="sr-only z-[60] bg-background p-3 text-sm font-medium focus:not-sr-only focus:fixed focus:top-4 focus:left-4"
        >
          {t("skipToContent")}
        </Link>

        <header className="border-b bg-background print:hidden">
          <div className="flex flex-wrap items-center justify-between gap-3 px-6 py-4">
            <div className="flex max-w-full flex-wrap items-center gap-5">
              <Link
                href="/organization"
                className="font-display text-2xl font-bold"
              >
                White<span className="text-primary">Plate</span>
              </Link>

              <NativeSelect
                aria-label={v("context")}
                value={context ? `${context.type}:${context.id}` : ""}
                className="w-72 max-w-full"
                onChange={(event) => changeContext(event.target.value)}
              >
                <NativeSelectOption value="">
                  {t("workspace")}
                </NativeSelectOption>

                <NativeSelectOptGroup label={v("organizations")}>
                  {organizations.map((item) => (
                    <NativeSelectOption
                      key={item.id}
                      value={`organization:${item.id}`}
                    >
                      {item.name}
                    </NativeSelectOption>
                  ))}
                </NativeSelectOptGroup>

                <NativeSelectOptGroup label={v("restaurants")}>
                  {restaurants.map((item) => (
                    <NativeSelectOption
                      key={item.id}
                      value={`restaurant:${item.id}`}
                    >
                      {item.name}
                    </NativeSelectOption>
                  ))}
                </NativeSelectOptGroup>
              </NativeSelect>
            </div>

            <div className="flex max-w-full flex-wrap items-center gap-2">
              {context?.type === "organization" && (
                <Button
                  nativeButton={false}
                  role="link"
                  variant="ghost"
                  render={<Link href={settingsHref} />}
                >
                  <CreditCard />

                  {v("paymentsPending")}
                </Button>
              )}

              {context?.type === "restaurant" && (
                <Button
                  nativeButton={false}
                  role="link"
                  variant="secondary"
                  render={
                    <Link
                      href={`/organization/orders?tenantId=${context.id}`}
                    />
                  }
                >
                  <Radio />

                  {v("realOrders")}
                </Button>
              )}

              <LocaleSelector currentHref={currentHref} locale={locale} />

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

              <SignOutButton />
            </div>
          </div>

          <nav
            aria-label={t("navigationLabel")}
            className="flex min-w-0 gap-1 overflow-x-auto border-t px-4 py-2"
          >
            <Button
              nativeButton={false}
              role="link"
              variant={pathname === "/organization" ? "secondary" : "ghost"}
              className="shrink-0"
              render={
                <Link
                  href="/organization"
                  aria-current={
                    pathname === "/organization" ? "page" : undefined
                  }
                />
              }
            >
              {t("overview")}
            </Button>

            {links.map(({ href, key }) => {
              const active = isWorkspaceLinkActive(href, pathname, search)

              return (
                <Button
                  nativeButton={false}
                  role="link"
                  key={href}
                  variant="ghost"
                  className={`shrink-0 ${active ? "bg-foreground text-background hover:bg-foreground hover:text-background" : ""}`}
                  render={
                    <Link
                      href={href}
                      aria-current={active ? "page" : undefined}
                    />
                  }
                >
                  <WorkspaceLinkIcon href={href} />

                  {key === "dashboard" || key === "analytics" ? v(key) : t(key)}
                </Button>
              )
            })}
          </nav>
        </header>

        <div id="workspace-content" tabIndex={-1} className="min-w-0">
          {children}
        </div>
      </div>
    </VisualScopeProvider>
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
