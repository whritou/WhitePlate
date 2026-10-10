"use client"
import { CreditCard, Radio, Store } from "lucide-react"
import ReactFlagsSelect from "react-flags-select"
import { useLocale, useTranslations } from "next-intl"
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
  const overviewHref =
    context?.type === "organization"
      ? `/organization?organizationId=${context.id}`
      : context?.type === "restaurant"
        ? `/organization/${restaurants.find((item) => item.id === context.id)?.role === "Kitchen" ? "orders" : "dashboard"}?tenantId=${context.id}`
        : "/organization"
  const parentOrganization =
    context?.type === "restaurant"
      ? organizations.find(
          (item) =>
            item.id ===
            restaurants.find((restaurant) => restaurant.id === context.id)
              ?.organizationId
        )
      : null

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
      router.push(`/organization?organizationId=${id}`)
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
          <nav
            aria-label={v("contextNavigation")}
            className="flex flex-wrap items-center gap-2 border-b px-6 py-2 text-sm"
          >
            <Link
              href="/organization"
              className="inline-flex min-h-11 items-center font-medium hover:underline"
            >
              {v("organizations")}
            </Link>

            {parentOrganization && (
              <>
                <span aria-hidden="true">/</span>

                <Link
                  href={`/organization?organizationId=${parentOrganization.id}`}
                  className="inline-flex min-h-11 items-center font-medium hover:underline"
                >
                  {parentOrganization.name}
                </Link>
              </>
            )}

            {context && (
              <>
                <span aria-hidden="true">/</span>

                <span aria-current="page" className="min-w-0">
                  {context.name}
                </span>
              </>
            )}
          </nav>

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

              {context?.type === "restaurant" && (
                <Button
                  nativeButton={false}
                  role="link"
                  variant="outline"
                  render={
                    <Link href={`/organization/shop?tenantId=${context.id}`} />
                  }
                >
                  <Store />

                  {v("visitShop")}
                </Button>
              )}

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
                  href={overviewHref}
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
                  className={`shrink-0 ${active ? "lovable-selected" : ""}`}
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
