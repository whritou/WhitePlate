import { expect, it } from "vitest"
import { customerMenu, customerCart } from "./customer-presentation"
import type { StorefrontMenu } from "@/types/storefront"

const menu: StorefrontMenu = {
  tenantId: "tenant",
  restaurantName: "Kitchen",
  restaurantDescription: null,
  currency: "EUR",
  locale: "fr",
  defaultLocale: "fr",
  availableLocales: ["fr"],
  categories: [
    {
      id: "category",
      name: "Menu",
      sortOrder: 0,
      products: [
        {
          id: "11111111-1111-4111-8111-111111111111",
          name: "Soup",
          description: "Seasonal",
          basePrice: 8,
          isAvailable: true,
          containsAllergens: ["milk"],
          mayContainAllergens: ["eggs"],
          dietaryTags: ["vegetarian"],
          preparationMinutes: 12,
          photos: [
            {
              id: "22222222-2222-4222-8222-222222222222",
              width: 640,
              height: 480,
              bytes: 2000,
            },
          ],
          optionGroups: [
            {
              id: "size",
              name: "Size",
              minimumSelections: 1,
              maximumSelections: 2,
              options: [{ id: "large", name: "Large", priceAdjustment: 2 }],
            },
          ],
        },
      ],
    },
  ],
}

it("keeps option identities, constraints and tenant-safe photo paths in the shared presentation", () => {
  const shown = customerMenu(menu, "kitchen")
  const product = shown.categories[0].items[0]

  expect(product.options[0]).toMatchObject({
    minimumSelections: 1,
    maximumSelections: 2,
    choices: [{ id: "large", p: 2 }],
  })
  expect(product.images[0]).toContain("restaurantSlug=kitchen")
  expect(
    customerCart(
      shown,
      [{ productId: product.id, quantity: 2, optionIds: ["large"] }],
      "",
      "fr"
    ).lines[0]
  ).toMatchObject({ qty: 2, unit: 10, picks: ["Large"] })
})

it("retains food declarations instead of losing them when changing the card renderer", () => {
  const product = customerMenu(menu).categories[0].items[0]

  expect(product.allergens).toEqual(["milk"])
  expect(customerMenu(menu).allergens).toContainEqual(
    expect.objectContaining({ id: "milk", icon: "🥛" })
  )
  expect(product.details).toEqual(
    expect.arrayContaining([
      expect.stringContaining("eggs"),
      expect.stringContaining("vegetarian"),
    ])
  )
})
