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
