import { createElement } from "react"
import { renderToStaticMarkup } from "react-dom/server"
import { beforeEach, expect, it, vi } from "vitest"
import OrganizationLoading from "@/app/[locale]/(workspace)/organization/(overview)/loading"
import CatalogLoading from "@/app/[locale]/(workspace)/organization/catalog/loading"
import OrdersLoading from "@/app/[locale]/(workspace)/organization/orders/loading"
import MenuLanguagesLoading from "@/app/[locale]/(workspace)/organization/restaurant-languages/loading"
import NewRestaurantLoading from "@/app/[locale]/(workspace)/organization/restaurants/new/loading"
import SettingsLoading from "@/app/[locale]/(workspace)/organization/settings/loading"
import TeamLoading from "@/app/[locale]/(workspace)/organization/team/loading"
import OrganizationSignUpLoading from "@/app/[locale]/organization/sign-up/loading"

const { getTranslations } = vi.hoisted(() => ({ getTranslations: vi.fn() }))

vi.mock("next-intl/server", () => ({ getTranslations }))

const routeLoaders = [
  ["overview", OrganizationLoading, "overview-organizations"],
  ["organizationSignUp", OrganizationSignUpLoading, "organization-signup-card"],
  ["team", TeamLoading, "team-invitation-form"],
  ["restaurant", NewRestaurantLoading, "restaurant-fields"],
  ["catalog", CatalogLoading, "catalog-list"],
  ["menuLanguages", MenuLanguagesLoading, "languages-translations"],
  ["settings", SettingsLoading, "settings-fields"],
  ["orders", OrdersLoading, "orders-list"],
] as const

beforeEach(() => {
  vi.clearAllMocks()
  getTranslations.mockImplementation(
    async () => (key: string) => `Loading ${key}`
  )
})

it("reserves separate team roster and invitation sections in its loading layout", async () => {
  const loading = await TeamLoading()
  const html = renderToStaticMarkup(createElement(() => loading))

  expect(html).toContain('data-skeleton-region="team-roster"')
  expect(html).toContain('data-skeleton-region="team-invitations"')
})

it.each(routeLoaders)(
  "uses the %s page's own loading layout",
  async (page, loader, expectedRegion) => {
    const loading = await loader()
    const html = renderToStaticMarkup(createElement(() => loading))
    const translationKey = page === "overview" ? "workspace" : page

    expect(getTranslations).toHaveBeenCalledWith("WorkspaceLoading")
    expect(html).toContain(`Loading ${translationKey}`)
    expect(html).toContain(`data-skeleton-page="${page}"`)
    expect(html).toContain(`data-skeleton-region="${expectedRegion}"`)
    expect(html).toContain('role="status"')
    expect(html).toContain('aria-busy="true"')
  }
)

it("reserves the overview's independent restaurant and organization sections", async () => {
  const loading = await OrganizationLoading()
  const html = renderToStaticMarkup(createElement(() => loading))

  expect(html).toContain('data-skeleton-region="overview-restaurant-orders"')
  expect(html).toContain('data-skeleton-region="overview-menu-settings"')
  expect(html).toContain('data-skeleton-region="overview-organizations"')
})
