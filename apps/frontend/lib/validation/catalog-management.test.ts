import { expect, it } from "vitest"
import { parseManagedCatalog } from "./catalog-management"

const tenantId = "11111111-1111-4111-8111-111111111111"
const categoryId = "22222222-2222-4222-8222-222222222222"
const catalog = {
  tenantId,
  currency: "GBP",
  categories: [
    {
      id: categoryId,
      name: "Lunch",
      sortOrder: 0,
      isArchived: false,
      translations: {},
    },
  ],
  products: [
    {
      id: "33333333-3333-4333-8333-333333333333",
      categoryId,
      name: "Soup",
      description: null,
      basePrice: 7.5,
      taxRatePercent: 5.5,
      sortOrder: 2,
      isAvailable: true,
      isArchived: false,
      translations: {},
    },
  ],
  optionGroups: [],
  options: [],
  discounts: [],
}

it("accepts the actual management contract and preserves price, tax, order and currency", () => {
  expect(parseManagedCatalog(catalog, tenantId)).toEqual({
    tenantId,
    currency: "GBP",
    categories: catalog.categories,
    products: catalog.products,
  })
})

it("rejects a response belonging to another tenant", () => {
  expect(
    parseManagedCatalog({ ...catalog, tenantId: categoryId }, tenantId)
  ).toBeNull()
})

it.each([
  { currency: "gbp" },
  { products: [{ ...catalog.products[0], basePrice: "7.50" }] },
  { products: [{ ...catalog.products[0], taxRatePercent: 101 }] },
  { products: [{ ...catalog.products[0], basePrice: -1 }] },
  { products: [{ ...catalog.products[0], sortOrder: 1.5 }] },
  { products: [{ ...catalog.products[0], isAvailable: "true" }] },
  { products: [{ ...catalog.products[0], categoryId: tenantId }] },
  { categories: [{ ...catalog.categories[0], sortOrder: -1 }] },
])("rejects unsafe management fields %o", (fields) => {
  expect(parseManagedCatalog({ ...catalog, ...fields }, tenantId)).toBeNull()
})
