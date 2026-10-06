import { createElement } from "react"
import { renderToStaticMarkup } from "react-dom/server"
import { describe, expect, it } from "vitest"
import { WorkspacePageSkeleton } from "./workspace-page-skeletons"

const expectedRegions = {
  organizationSignUp: ["organization-signup-card"],
  team: [
    "team-header",
    "team-actions",
    "team-restaurants",
    "team-roster",
    "team-invitations",
    "team-invitation-form",
  ],
  restaurant: ["restaurant-header", "restaurant-fields", "restaurant-submit"],
  catalog: [
    "catalog-header",
    "catalog-category-form",
    "catalog-product-form",
    "catalog-list",
  ],
  menuLanguages: [
    "languages-header",
    "languages-settings",
    "languages-translations",
  ],
  settings: ["settings-header", "settings-fields", "settings-submit"],
  orders: ["orders-header", "orders-filters", "orders-list"],
} as const

describe("WorkspacePageSkeleton", () => {
  it.each(Object.entries(expectedRegions))(
    "renders the %s page's content regions",
    (page, regions) => {
      const html = renderToStaticMarkup(
        createElement(WorkspacePageSkeleton, {
          page: page as keyof typeof expectedRegions,
          label: `Loading ${page}`,
        })
      )

      expect(html).toContain(`data-skeleton-page="${page}"`)
      expect(html).toContain(`>Loading ${page}</p>`)

      const minimumShapes = page === "organizationSignUp" ? 3 : 5

      expect(html.match(/data-slot="skeleton"/g)?.length).toBeGreaterThan(
        minimumShapes
      )

      for (const region of regions) {
        expect(html).toContain(`data-skeleton-region="${region}"`)
      }
    }
  )

  it("keeps decorative shapes hidden and respects reduced motion", () => {
    const html = renderToStaticMarkup(
      createElement(WorkspacePageSkeleton, {
        page: "orders",
        label: "Loading orders",
      })
    )

    expect(html).toContain('aria-busy="true"')
    expect(html).toContain('aria-hidden="true"')
    expect(html).toContain("motion-reduce:animate-none")
  })
})
