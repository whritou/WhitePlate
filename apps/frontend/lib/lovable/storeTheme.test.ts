import { expect, it } from "vitest"
import { publishedStoreTheme } from "./storeTheme"

it("scopes published brand asset URLs to the preview restaurant", () => {
  const publication = {
    version: 4,
    theme: {},
    hasLogo: true,
    hasBanner: true,
    hasFavicon: true,
  } as never

  const theme = publishedStoreTheme("Bistro", publication, "bistro")

  expect(theme.logo).toBe(
    "/api/public/brand-assets/logo?v=4&restaurantSlug=bistro"
  )
  expect(theme.banner).toBe(
    "/api/public/brand-assets/banner?v=4&restaurantSlug=bistro"
  )
  expect(theme.favicon).toBe(
    "/api/public/brand-assets/favicon?v=4&restaurantSlug=bistro"
  )
})
