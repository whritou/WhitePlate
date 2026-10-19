import { expect, it } from "vitest"
import { restaurantShopUrl } from "./restaurant-shop-url"

it("builds a localized URL only inside the configured storefront domain", () => {
  expect(restaurantShopUrl("bistro", "shops.example.com", "fr")).toBe(
    "https://bistro.shops.example.com/fr"
  )
  expect(
    restaurantShopUrl("foreign.example", "shops.example.com", "en")
  ).toBeNull()
  expect(restaurantShopUrl("bistro", undefined, "en")).toBeNull()
  expect(restaurantShopUrl("bistro", "example.com@evil.com", "en")).toBeNull()
})

it("prefers the configured localized path storefront when available", () => {
  expect(
    restaurantShopUrl(
      "bistro",
      "shops.example.com",
      "fr",
      "white-plate.vercel.app",
      "white-plate.vercel.app"
    )
  ).toBe("/fr/bistro")
  expect(
    restaurantShopUrl("bistro", undefined, "fr", "localhost", "localhost:3010")
  ).toBe("/fr/bistro")
  expect(
    restaurantShopUrl(
      "bistro",
      "shops.example.com",
      "fr",
      "white-plate.vercel.app",
      "other.example.com"
    )
  ).toBe("https://bistro.shops.example.com/fr")
})

it("falls back to the tenant storefront when path preview is not configured", () => {
  expect(restaurantShopUrl("bistro", "shops.example.com", "en")).toBe(
    "https://bistro.shops.example.com/en"
  )
  expect(
    restaurantShopUrl("bistro", "shops.example.com", "en", "invalid/path")
  ).toBe("https://bistro.shops.example.com/en")
})
