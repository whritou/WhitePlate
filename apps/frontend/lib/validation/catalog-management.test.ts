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
const fixedDiscount = {
  id: "66666666-6666-4666-8666-666666666666",
  code: "LUNCH10",
  name: "Lunch discount",
  kind: "FixedAmount",
  value: 10,
  isActive: true,
}
const percentageDiscount = {
  id: "77777777-7777-4777-8777-777777777777",
  code: "WELCOME15",
  name: "Welcome",
  kind: "Percentage",
  value: 15,
  isActive: false,
}
const catalog = {
  tenantId,
  currency: "GBP",
  categories: [
    {
      id: categoryId,
      name: "Lunch",
      sortOrder: 0,
      isVisible: true,
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
    discounts: [],
  })
})

it.each([undefined, null, "false", 0])(
  "rejects invalid category visibility rather than treating it as visible: %s",
  (isVisible) => {
    expect(
      parseManagedCatalog(
        { ...catalog, categories: [{ ...catalog.categories[0], isVisible }] },
        tenantId
      )
    ).toBeNull()
  }
)

it("preserves temporary category hiding independently of archival", () => {
  const parsed = parseManagedCatalog(
    {
      ...catalog,
      categories: [{ ...catalog.categories[0], isVisible: false }],
    },
    tenantId
  )

  expect(parsed?.categories[0].isVisible).toBe(false)
  expect(parsed?.categories[0].isArchived).toBe(false)
})

it("validates and preserves active and inactive discount records from the tenant catalog", () => {
  expect(
    parseManagedCatalog(
      { ...catalog, discounts: [fixedDiscount, percentageDiscount] },
      tenantId
    )?.discounts
  ).toEqual([fixedDiscount, percentageDiscount])
})

it.each([
  { ...fixedDiscount, id: "bad" },
  { ...fixedDiscount, code: "lowercase" },
  { ...fixedDiscount, code: "BAD CODE" },
  { ...fixedDiscount, code: "X".repeat(33) },
  { ...fixedDiscount, name: " " },
  { ...fixedDiscount, kind: "Unrecognized" },
  { ...fixedDiscount, value: 0 },
  { ...fixedDiscount, value: 1.001 },
  { ...percentageDiscount, value: 100.01 },
  { ...fixedDiscount, value: 10000000000 },
  { ...fixedDiscount, isActive: "true" },
])(
  "rejects malformed discount records instead of trusting catalog JSON: %o",
  (discount) => {
    expect(
      parseManagedCatalog({ ...catalog, discounts: [discount] }, tenantId)
    ).toBeNull()
  }
)

it("rejects catalog responses without the required discount collection", () => {
  const withoutDiscounts = Object.fromEntries(
    Object.entries(catalog).filter(([key]) => key !== "discounts")
  )

  expect(parseManagedCatalog(withoutDiscounts, tenantId)).toBeNull()
})

it.each([
  [fixedDiscount, { ...percentageDiscount, id: fixedDiscount.id }],
  [fixedDiscount, { ...percentageDiscount, code: fixedDiscount.code }],
])(
  "rejects duplicate discount identities or codes in one catalog",
  (...discounts) => {
    expect(parseManagedCatalog({ ...catalog, discounts }, tenantId)).toBeNull()
  }
)

it("parses option groups and options only when their parent relationships belong to the tenant catalog", () => {
  const managed = { ...catalog, optionGroups: [optionGroup], options: [option] }

  expect(parseManagedCatalog(managed, tenantId)).toEqual({
    tenantId,
    currency: "GBP",
    categories: catalog.categories,
    products: catalog.products,
    optionGroups: [optionGroup],
    options: [option],
    discounts: [],
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
