import { expect, it } from "vitest"
import { parseOptionGroupInput, parseOptionInput } from "./catalog-input"

const tenantId = "11111111-1111-4111-8111-111111111111"
const productId = "22222222-2222-4222-8222-222222222222"
const groupId = "33333333-3333-4333-8333-333333333333"
const optionId = "44444444-4444-4444-8444-444444444444"

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
