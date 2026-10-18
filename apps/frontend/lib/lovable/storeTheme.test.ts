import { expect, it } from "vitest"
import { publishedStoreTheme, themeVariables } from "./storeTheme"

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

it("applies the published palette to live dialog surfaces", () => {
  const variables = themeVariables({
    name: "Bistro",
    bg: "#101820",
    text: "#f6f4ee",
  } as never) as unknown as Record<string, string | number>

  expect(variables["--popover"]).toBe("#101820")
  expect(variables["--popover-foreground"]).toBe("#f6f4ee")
  expect(variables["--card"]).toBe("#101820")
  expect(variables["--card-foreground"]).toBe("#f6f4ee")
})
