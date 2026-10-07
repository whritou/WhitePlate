import { createElement } from "react"
import { renderToStaticMarkup } from "react-dom/server"
import { describe, expect, it } from "vitest"
import { WorkspacePageSkeleton } from "./workspace-page-skeletons"

const expectedRegions = {
  organizationSignUp: ["organization-signup-card"],
  team: [
    "team-card",
    "team-header",
    "team-actions",
    "team-restaurants",
    "team-directory",
    "team-roster",
    "team-invitations",
    "team-invitation-form",
  ],
  restaurant: [
    "restaurant-card",
    "restaurant-header",
    "restaurant-fields",
    "restaurant-submit",
  ],
  catalog: ["catalog-header", "catalog-tabs", "catalog-list"],
  menuLanguages: [
    "languages-header",
    "languages-settings",
    "languages-translations",
  ],
  settings: [
    "settings-card",
    "settings-header",
    "settings-fields",
    "settings-submit",
    "settings-archive",
  ],
  orders: ["orders-header", "orders-filters", "orders-list"],
  orderHistory: [
    "order-history-header",
    "order-history-filters",
    "order-history-table",
  ],
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

  it.each(["orders", "orderHistory"] as const)(
    "uses the full workspace width for the %s skeleton",
    (page) => {
      const html = renderToStaticMarkup(
        createElement(WorkspacePageSkeleton, {
          page,
          label: `Loading ${page}`,
        })
      )

      expect(html).toContain("w-full max-w-none")
      expect(html).not.toContain("max-w-5xl")
    }
  )

  it.each([
    ["team", "max-w-3xl", "team-card"],
    ["settings", "max-w-3xl", "settings-card"],
    ["restaurant", "max-w-2xl", "restaurant-card"],
  ] as const)(
    "matches the %s page's width and enclosing card",
    (page, width, card) => {
      const html = renderToStaticMarkup(
        createElement(WorkspacePageSkeleton, {
          page,
          label: `Loading ${page}`,
        })
      )

      expect(html).toContain(width)
      expect(html).toContain(`data-skeleton-region="${card}"`)
    }
  )
})
