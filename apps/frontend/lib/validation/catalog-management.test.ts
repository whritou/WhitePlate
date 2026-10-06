import { expect, it } from "vitest"
import { parseManagedCatalog } from "./catalog-management"

const tenantId = "11111111-1111-4111-8111-111111111111"
const categoryId = "22222222-2222-4222-8222-222222222222"
const productId = "33333333-3333-4333-8333-333333333333"
const groupId = "44444444-4444-4444-8444-444444444444"
const optionId = "55555555-5555-4555-8555-555555555555"
const optionGroup = {
  id: groupId,
  productId,
  name: "Size",
  minimumSelections: 0,
  maximumSelections: 2,
  sortOrder: 1,
  isArchived: false,
  translations: {},
}
const option = {
  id: optionId,
  groupId,
  name: "Large",
  priceAdjustment: 1.25,
  sortOrder: 2,
  isArchived: false,
  translations: {},
}
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
      id: productId,
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
    optionGroups: [],
    options: [],
  })
})

it("parses option groups and options only when their parent relationships belong to the tenant catalog", () => {
  const managed = { ...catalog, optionGroups: [optionGroup], options: [option] }

  expect(parseManagedCatalog(managed, tenantId)).toEqual({
    tenantId,
    currency: "GBP",
    categories: catalog.categories,
    products: catalog.products,
    optionGroups: [optionGroup],
    options: [option],
  })
})

it.each([
  {
    optionGroups: [{ ...optionGroup, productId: categoryId }],
    options: [option],
  },
  {
    optionGroups: [{ ...optionGroup, minimumSelections: -1 }],
    options: [option],
  },
  {
    optionGroups: [{ ...optionGroup, maximumSelections: 21 }],
    options: [option],
  },
  {
    optionGroups: [
      { ...optionGroup, minimumSelections: 3, maximumSelections: 2 },
    ],
    options: [option],
  },
  {
    optionGroups: [optionGroup],
    options: [{ ...option, priceAdjustment: -1 }],
  },
  {
    optionGroups: [optionGroup],
    options: [{ ...option, priceAdjustment: 1.001 }],
  },
  { optionGroups: [optionGroup], options: [{ ...option, groupId: tenantId }] },
])(
  "rejects invalid option management fields and relationships %o",
  (fields) => {
    expect(
      parseManagedCatalog(
        {
          ...catalog,
          ...fields,
        },
        tenantId
      )
    ).toBeNull()
  }
)

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
