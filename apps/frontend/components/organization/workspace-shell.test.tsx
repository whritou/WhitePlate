import { createElement } from "react"
import { renderToStaticMarkup } from "react-dom/server"
import { beforeEach, expect, it, vi } from "vitest"
import { WorkspaceShell } from "./workspace-shell"

const mocks = vi.hoisted(() => ({
  pathname: "/organization/catalog",
  search: "tenantId=22222222-2222-4222-8222-222222222222",
  locale: "en",
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
      catalog: "Catalog",
      menuLanguages: "Menu languages",
      navigationLabel: "Workspace navigation",
      openNavigation: "Open navigation",
      closeNavigation: "Close navigation",
      navigationTitle: "Workspace navigation",
      organization: "Organization",
      restaurant: "Restaurant",
      toggleTheme: "Toggle theme",
      skipToContent: "Skip to content",
      language: "Language",
      switchToEnglish: "Switch to English",
      switchToFrench: "Switch to French",
    })[key] ?? key,
}))

vi.mock("next-themes", () => ({
  useTheme: () => ({ resolvedTheme: "light", setTheme: vi.fn() }),
}))

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
        organizations: [{ id: organizationId, name: "White Plate Group" }],
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
  expect(html).toContain(`href="/en/organization/catalog?tenantId=${tenantId}"`)
  expect(html).toContain(`href="/fr/organization/catalog?tenantId=${tenantId}"`)
  expect(html).toContain('aria-label="Workspace navigation"')
  expect(html).toContain('aria-label="Open navigation"')
  expect(html).toContain('aria-label="Toggle theme"')
  expect(html).toContain("md:flex")
  expect(html).toContain("md:hidden")
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
