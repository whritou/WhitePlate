import { createElement } from "react"
import { renderToStaticMarkup } from "react-dom/server"
import { beforeEach, expect, it, vi } from "vitest"
import {
  localeFromFlagCountryCode,
  localeToFlagCountryCode,
  navigateToLocale,
  WorkspaceShell,
} from "./workspace-shell"

const mocks = vi.hoisted(() => ({
  pathname: "/organization/catalog",
  search: "tenantId=22222222-2222-4222-8222-222222222222",
  locale: "en",
  replace: vi.fn(),
}))

vi.mock("@/i18n/navigation", async () => {
  const React = await import("react")

  return {
    Link: ({ href, locale, ...props }: Record<string, unknown>) =>
      React.createElement(
        "a",
        {
          ...props,
          href: locale ? `/${locale}${String(href)}` : `/en${String(href)}`,
        },
        props.children as React.ReactNode
      ),
    usePathname: () => mocks.pathname,
    useRouter: () => ({ replace: mocks.replace }),
  }
})

vi.mock("next/navigation", () => ({
  useSearchParams: () => new URLSearchParams(mocks.search),
}))

vi.mock("next-intl", () => ({
  useLocale: () => mocks.locale,
  useTranslations: () => (key: string) =>
    ({
      workspace: "Workspace",
      overview: "Overview",
      team: "Team",
      settings: "Settings",
      createRestaurant: "Create restaurant",
      orders: "Orders",
      catalog: "Menu Builder & Translations",
      menuLanguages: "Menu languages & translations",
      navigationLabel:
        mocks.locale === "fr"
          ? "Navigation de l’espace de travail"
          : "Workspace navigation",
      openNavigation: "Open navigation",
      closeNavigation: "Close navigation",
      organization: "Organization",
      restaurant: "Restaurant",
      toggleTheme: "Toggle theme",
      skipToContent: "Skip to content",
      language: mocks.locale === "fr" ? "Langue" : "Language",
      english: mocks.locale === "fr" ? "Anglais" : "English",
      french: mocks.locale === "fr" ? "Français" : "French",
    })[key] ?? key,
}))

vi.mock("next-themes", () => ({
  useTheme: () => ({ resolvedTheme: "light", setTheme: vi.fn() }),
}))

vi.mock("@/components/ui/sheet", async () => {
  const React = await import("react")

  return {
    Sheet: ({ children }: { children: React.ReactNode }) =>
      React.createElement(React.Fragment, null, children),
    SheetClose: (props: React.ComponentProps<"button">) =>
      React.createElement("button", props),
    SheetContent: ({ children, ...props }: React.ComponentProps<"div">) =>
      React.createElement("div", props, children),
    SheetHeader: ({ children, ...props }: React.ComponentProps<"div">) =>
      React.createElement("div", props, children),
    SheetTitle: ({ children, ...props }: React.ComponentProps<"h2">) =>
      React.createElement("h2", props, children),
    SheetTrigger: ({
      children,
      render,
      ...props
    }: React.ComponentProps<"button"> & { render?: React.ReactElement }) => {
      const renderProps = render
        ? (render.props as React.ComponentProps<"button">)
        : {}

      return React.createElement(
        "button",
        { ...renderProps, ...props },
        children
      )
    },
  }
})

vi.mock("@/components/auth/sign-out-button", () => ({
  SignOutButton: () => createElement("button", null, "Sign out"),
}))

const organizationId = "11111111-1111-4111-8111-111111111111"
const tenantId = "22222222-2222-4222-8222-222222222222"

beforeEach(() => {
  mocks.pathname = "/organization/catalog"
  mocks.search = `tenantId=${tenantId}`
  mocks.locale = "en"
})

it("renders verified workspace context, active links, and locale-preserving controls", () => {
  const html = renderToStaticMarkup(
    createElement(
      WorkspaceShell,
      {
        organizations: [
          { id: organizationId, name: "White Plate Group", isActive: true },
        ],
        restaurants: [
          {
            id: tenantId,
            name: "Owner Restaurant",
            role: "OrganizationOwner",
          },
        ],
      },
      createElement("main", null, "Workspace content")
    )
  )

  expect(html).toContain("Owner Restaurant")
  expect(html).toContain('aria-current="page"')
  expect(html).toContain("Menu Builder &amp; Translations")
  expect(html).not.toContain("Menu languages &amp; translations")
  expect(html).toContain('role="group" aria-label="Language"')
  expect(html).toContain('data-testid="workspace-language"')
  expect(html).toContain('aria-haspopup="listbox"')
  expect(html).toContain('aria-label="Workspace navigation"')
  expect(html).toContain("lovable-surface lovable-live")
  expect(html).toContain('aria-label="Toggle theme"')

  const appBar = html.match(/<header[^>]*>([\s\S]*?)<\/header>/)?.[1] ?? ""

  expect(appBar).not.toContain(
    '<p class="text-sm font-medium">Owner Restaurant</p>'
  )
  expect(html).toContain("overflow-x-auto")
  expect(html).toContain(`/organization/dashboard?tenantId=${tenantId}`)
  expect(html).toContain("Sign out")
})

it("does not display an unverified URL selection as workspace context", () => {
  mocks.search = "tenantId=55555555-5555-4555-8555-555555555555"

  const html = renderToStaticMarkup(
    createElement(
      WorkspaceShell,
      {
        organizations: [],
        restaurants: [],
      },
      createElement("main", null, "Workspace content")
    )
  )

  expect(html).not.toContain("55555555-5555-4555-8555-555555555555")
  expect(html).toContain("Workspace")
})

it("localizes the flag selector and marks the current locale", () => {
  mocks.locale = "fr"

  const html = renderToStaticMarkup(
    createElement(
      WorkspaceShell,
      { organizations: [], restaurants: [] },
      createElement("main", null, "Workspace content")
    )
  )

  expect(html).toContain('aria-label="Langue"')
  expect(html).toContain('aria-haspopup="listbox"')
  expect(html).toContain('data-testid="workspace-language"')
  expect(html).toContain('id="workspace-language-btn"')
  expect(html).not.toContain("🇬🇧")
  expect(html).not.toContain("🇫🇷")
  expect(html).toContain('aria-label="Navigation de l’espace de travail"')
})

it("maps interface locales to the requested flag country codes", () => {
  expect(localeToFlagCountryCode("en")).toBe("GB")
  expect(localeToFlagCountryCode("fr")).toBe("FR")
  expect(localeFromFlagCountryCode("GB")).toBe("en")
  expect(localeFromFlagCountryCode("FR")).toBe("fr")
  expect(localeFromFlagCountryCode("US")).toBeUndefined()
})

it("switches the locale while preserving the current path and query", () => {
  const replace = vi.fn()
  const router = { replace } as unknown as Parameters<
    typeof navigateToLocale
  >[0]
  const currentHref =
    "/organization/orders?tenantId=22222222-2222-4222-8222-222222222222"

  navigateToLocale(router, currentHref, "fr")
  navigateToLocale(router, currentHref, "de")

  expect(replace).toHaveBeenCalledOnce()
  expect(replace).toHaveBeenCalledWith(currentHref, { locale: "fr" })
})
