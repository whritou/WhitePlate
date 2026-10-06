import { expect, it } from "vitest"
import {
  parseDiscountInput,
  parseDiscountReferenceInput,
  parseOptionGroupInput,
  parseOptionInput,
} from "./catalog-input"

const tenantId = "11111111-1111-4111-8111-111111111111"
const productId = "22222222-2222-4222-8222-222222222222"
const groupId = "33333333-3333-4333-8333-333333333333"
const optionId = "44444444-4444-4444-8444-444444444444"
const discountId = "55555555-5555-4555-8555-555555555555"

function form(fields: Record<string, string>) {
  const input = new FormData()

  for (const [name, value] of Object.entries(fields)) input.set(name, value)

  return input
}

it("parses group create and update fields using the API selection bounds", () => {
  expect(
    parseOptionGroupInput(
      form({
        tenantId,
        productId,
        name: " Size ",
        minimumSelections: "0",
        maximumSelections: "2",
        sortOrder: "1",
      })
    )
  ).toEqual({
    tenantId,
    id: null,
    productId,
    name: "Size",
    minimumSelections: 0,
    maximumSelections: 2,
    sortOrder: 1,
  })
  expect(
    parseOptionGroupInput(
      form({
        tenantId,
        id: groupId,
        productId,
        name: "Meal",
        minimumSelections: "1",
        maximumSelections: "1",
        sortOrder: "0",
      })
    )?.id
  ).toBe(groupId)
})

it.each([
  { minimumSelections: "-1" },
  { maximumSelections: "0" },
  { maximumSelections: "21" },
  { minimumSelections: "3", maximumSelections: "2" },
  { minimumSelections: "1.5" },
  { sortOrder: "2147483648" },
  { productId: "invalid" },
  { name: "x".repeat(121) },
])("rejects invalid group input before it reaches the API: %o", (fields) => {
  expect(
    parseOptionGroupInput(
      form({
        tenantId,
        productId,
        name: "Size",
        minimumSelections: "0",
        maximumSelections: "2",
        sortOrder: "0",
        ...fields,
      })
    )
  ).toBeNull()
})

it("normalizes new discount codes and preserves only supported create fields", () => {
  expect(
    parseDiscountInput(
      form({
        tenantId,
        code: " lunch-10 ",
        name: " Lunch offer ",
        kind: "FixedAmount",
        value: "5.25",
        role: "OrganizationOwner",
        isActive: "false",
      })
    )
  ).toEqual({
    tenantId,
    id: null,
    code: "LUNCH-10",
    name: "Lunch offer",
    kind: "FixedAmount",
    value: 5.25,
  })
})

it("drops browser-supplied discount codes on update because codes are immutable", () => {
  expect(
    parseDiscountInput(
      form({
        tenantId,
        id: discountId,
        code: "REPLACEMENT",
        name: "Welcome",
        kind: "Percentage",
        value: "15",
      })
    )
  ).toEqual({
    tenantId,
    id: discountId,
    code: null,
    name: "Welcome",
    kind: "Percentage",
    value: 15,
  })
})

const invalidDiscountFields: Array<Record<string, string>> = [
  { tenantId: "not-a-uuid" },
  { id: "not-a-uuid" },
  { code: " " },
  { code: "HAS SPACE" },
  { code: "ÉTÉ" },
  { code: "x".repeat(33) },
  { name: " " },
  { name: "x".repeat(121) },
  { kind: "Unknown" },
  { value: "0" },
  { value: "1.001" },
  { value: "10000000000" },
  { kind: "Percentage", value: "100.01" },
]

it.each(invalidDiscountFields)(
  "rejects invalid discount fields before any API request: %o",
  (fields) => {
    expect(
      parseDiscountInput(
        form({
          tenantId,
          code: "LUNCH10",
          name: "Lunch",
          kind: "FixedAmount",
          value: "10.00",
          ...fields,
        })
      )
    ).toBeNull()
  }
)

it("parses option create and update fields with a two-decimal fixed price adjustment", () => {
  expect(
    parseOptionInput(
      form({
        tenantId,
        groupId,
        name: " Large ",
        priceAdjustment: "1.25",
        sortOrder: "2",
      })
    )
  ).toEqual({
    tenantId,
    id: null,
    groupId,
    name: "Large",
    priceAdjustment: 1.25,
    sortOrder: 2,
  })
  expect(
    parseOptionInput(
      form({
        tenantId,
        id: optionId,
        groupId,
        name: "Extra",
        priceAdjustment: "0",
        sortOrder: "0",
      })
    )?.id
  ).toBe(optionId)
})

it.each([
  { priceAdjustment: "-1" },
  { priceAdjustment: "1.001" },
  { priceAdjustment: "10000000000" },
  { priceAdjustment: "1e3" },
  { groupId: "invalid" },
  { sortOrder: "-1" },
  { name: "x".repeat(121) },
])("rejects invalid option input before it reaches the API: %o", (fields) => {
  expect(
    parseOptionInput(
      form({
        tenantId,
        groupId,
        name: "Large",
        priceAdjustment: "1.25",
        sortOrder: "2",
        ...fields,
      })
    )
  ).toBeNull()
})

it("parses only the tenant and discount ID for deactivation", () => {
  expect(
    parseDiscountReferenceInput(
      form({ tenantId, id: discountId, isActive: "true", role: "Manager" })
    )
  ).toEqual({ tenantId, id: discountId })
})

it.each([{ tenantId: "../foreign" }, { id: "invalid" }])(
  "rejects malformed discount references before deactivation: %o",
  (fields) => {
    expect(
      parseDiscountReferenceInput(form({ tenantId, id: discountId, ...fields }))
    ).toBeNull()
  }
)
