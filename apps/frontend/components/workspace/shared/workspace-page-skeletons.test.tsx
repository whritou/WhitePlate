import { createElement } from "react"
import { renderToStaticMarkup } from "react-dom/server"
import { describe, expect, it } from "vitest"
import { WorkspacePageSkeleton } from "./workspace-page-skeletons"

const expectedRegions = {
  organizationSignUp: ["organization-signup-card"],
  team: ["team-header", "team-summary", "team-directory", "team-members"],
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
    "settings-header",
    "settings-sections",
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
    "matches the %s page's wide workspace container",
    (page) => {
      const html = renderToStaticMarkup(
        createElement(WorkspacePageSkeleton, {
          page,
          label: `Loading ${page}`,
        })
      )

      expect(html).toContain("w-full max-w-[1600px]")
      expect(html).not.toContain("max-w-5xl")
    }
  )

  it.each([
    ["team", "min-w-0 bg-background px-6 pt-8 pb-12", "team-directory"],
    ["settings", "live-settings min-w-0 bg-background", "settings-sections"],
    [
      "restaurant",
      "live-create-page mx-auto min-h-[70vh] max-w-3xl px-6 py-8",
      "restaurant-card",
    ],
  ] as const)(
    "matches the %s page's container and leading content region",
    (page, container, region) => {
      const html = renderToStaticMarkup(
        createElement(WorkspacePageSkeleton, {
          page,
          label: `Loading ${page}`,
        })
      )

      expect(html).toContain(container)
      expect(html).toContain(`data-skeleton-region="${region}"`)
    }
  )
})
