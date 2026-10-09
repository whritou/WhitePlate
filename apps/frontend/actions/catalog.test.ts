import { afterEach, expect, it, vi } from "vitest"
import { whitePlateApi } from "@/lib/api"
import {
  archiveCatalogItemAction,
  saveCategoryAction,
  deactivateDiscountAction,
  saveDiscountAction,
  saveOptionAction,
  saveOptionGroupAction,
  saveProductAction,
  setCategoryVisibilityAction,
} from "./catalog"

vi.mock("server-only", () => ({}))
vi.mock("@/lib/api", () => ({
  whitePlateApi: { post: vi.fn(), put: vi.fn(), delete: vi.fn() },
}))

const tenantId = "11111111-1111-4111-8111-111111111111"
const categoryId = "22222222-2222-4222-8222-222222222222"
const productId = "33333333-3333-4333-8333-333333333333"
const optionGroupId = "44444444-4444-4444-8444-444444444444"
const optionId = "55555555-5555-4555-8555-555555555555"
const discountId = "66666666-6666-4666-8666-666666666666"

function form(fields: Record<string, string>) {
  const input = new FormData()

  for (const [name, value] of Object.entries(fields)) input.set(name, value)

  return input
}

function product(overrides: Partial<Record<string, string>> = {}) {
  return form({
    tenantId,
    categoryId,
    name: " Soup ",
    description: " Fresh soup ",
    basePrice: "7.50",
    taxRatePercent: "5.50",
    sortOrder: "2",
    ...overrides,
  } as Record<string, string>)
}

afterEach(() => vi.resetAllMocks())

it("returns the saved category for immediate selection in a product draft", async () => {
  vi.mocked(whitePlateApi.post).mockResolvedValue({
    ok: true,
    status: 201,
    data: { id: categoryId, name: "Mains", sortOrder: 2 },
  })
  expect(
    await saveCategoryAction(form({ tenantId, name: "Mains", sortOrder: "2" }))
  ).toEqual({
    ok: true,
    category: {
      id: categoryId,
      name: "Mains",
      sortOrder: 2,
      isVisible: true,
      isArchived: false,
      translations: {},
    },
  })
})

it("includes selected category in product updates", async () => {
  vi.mocked(whitePlateApi.put).mockResolvedValue({
    ok: true,
    status: 200,
    data: {},
  })
  await saveProductAction(product({ id: productId, isAvailable: "true" }))
  expect(whitePlateApi.put).toHaveBeenCalledWith(
    `/api/v1/tenants/${tenantId}/products/${productId}`,
    {
      categoryId,
      name: "Soup",
      description: "Fresh soup",
      basePrice: 7.5,
      taxRatePercent: 5.5,
      sortOrder: 2,
      isAvailable: true,
    }
  )
})

it.each(["true", "false"])(
  "sends explicit category visibility %s to the tenant-scoped endpoint",
  async (isVisible) => {
    vi.mocked(whitePlateApi.put).mockResolvedValue({
      ok: true,
      status: 204,
      data: null,
    })

    expect(
      await setCategoryVisibilityAction(
        form({ tenantId, id: categoryId, isVisible, role: "OrganizationOwner" })
      )
    ).toEqual({ ok: true })
    expect(whitePlateApi.put).toHaveBeenCalledWith(
      `/api/v1/tenants/${tenantId}/categories/${categoryId}/visibility`,
      { isVisible: isVisible === "true" }
    )
  }
)

it.each([
  { tenantId, id: categoryId, isVisible: "0" },
  { tenantId, id: categoryId, isVisible: "" },
  { tenantId: "foreign", id: categoryId, isVisible: "false" },
  { tenantId, id: "bad", isVisible: "true" },
])(
  "rejects malformed visibility form data without making a request: %o",
  async (fields) => {
    expect(await setCategoryVisibilityAction(form(fields))).toEqual({
      ok: false,
      error: "invalid",
    })
    expect(whitePlateApi.put).not.toHaveBeenCalled()
  }
)

it("creates a normalized category with only its API contract fields", async () => {
  vi.mocked(whitePlateApi.post).mockResolvedValue({
    ok: true,
    status: 201,
    data: {},
  })
  expect(
    await saveCategoryAction(
      form({
        tenantId,
        name: " Lunch ",
        sortOrder: "3",
        role: "OrganizationOwner",
      })
    )
  ).toEqual({ ok: true })
  expect(whitePlateApi.post).toHaveBeenCalledWith(
    `/api/v1/tenants/${tenantId}/categories`,
    { name: "Lunch", sortOrder: 3 }
  )
})

it("updates an existing category rather than creating a second category", async () => {
  vi.mocked(whitePlateApi.put).mockResolvedValue({
    ok: true,
    status: 200,
    data: {},
  })
  expect(
    await saveCategoryAction(
      form({ tenantId, id: categoryId, name: "Dinner", sortOrder: "0" })
    )
  ).toEqual({ ok: true })
  expect(whitePlateApi.put).toHaveBeenCalledWith(
    `/api/v1/tenants/${tenantId}/categories/${categoryId}`,
    { name: "Dinner", sortOrder: 0 }
  )
  expect(whitePlateApi.post).not.toHaveBeenCalled()
})

it("creates products with normalized decimal amounts and no browser authorization fields", async () => {
  vi.mocked(whitePlateApi.post).mockResolvedValue({
    ok: true,
    status: 201,
    data: {},
  })
  expect(
    await saveProductAction(product({ role: "Manager", isAvailable: "false" }))
  ).toEqual({ ok: true })
  expect(whitePlateApi.post).toHaveBeenCalledWith(
    `/api/v1/tenants/${tenantId}/products`,
    {
      categoryId,
      name: "Soup",
      description: "Fresh soup",
      basePrice: 7.5,
      taxRatePercent: 5.5,
      sortOrder: 2,
    }
  )
})

it("updates product availability with its selected category", async () => {
  vi.mocked(whitePlateApi.put).mockResolvedValue({
    ok: true,
    status: 200,
    data: {},
  })
  expect(
    await saveProductAction(
      product({ id: productId, isAvailable: "false", description: " " })
    )
  ).toEqual({ ok: true })
  expect(whitePlateApi.put).toHaveBeenCalledWith(
    `/api/v1/tenants/${tenantId}/products/${productId}`,
    {
      name: "Soup",
      description: null,
      categoryId,
      basePrice: 7.5,
      taxRatePercent: 5.5,
      sortOrder: 2,
      isAvailable: false,
    }
  )
})

it("creates option groups with only the supported API request fields", async () => {
  vi.mocked(whitePlateApi.post).mockResolvedValue({
    ok: true,
    status: 201,
    data: {},
  })
  expect(
    await saveOptionGroupAction(
      form({
        tenantId,
        productId,
        name: " Size ",
        minimumSelections: "0",
        maximumSelections: "2",
        sortOrder: "1",
        role: "OrganizationOwner",
      })
    )
  ).toEqual({ ok: true })
  expect(whitePlateApi.post).toHaveBeenCalledWith(
    `/api/v1/tenants/${tenantId}/products/${productId}/option-groups`,
    { name: "Size", minimumSelections: 0, maximumSelections: 2, sortOrder: 1 }
  )
})

it("updates option groups without sending resource identity in the body", async () => {
  vi.mocked(whitePlateApi.put).mockResolvedValue({
    ok: true,
    status: 200,
    data: {},
  })
  expect(
    await saveOptionGroupAction(
      form({
        tenantId,
        id: optionGroupId,
        productId,
        name: "Meal",
        minimumSelections: "1",
        maximumSelections: "1",
        sortOrder: "0",
      })
    )
  ).toEqual({ ok: true })
  expect(whitePlateApi.put).toHaveBeenCalledWith(
    `/api/v1/tenants/${tenantId}/option-groups/${optionGroupId}`,
    { name: "Meal", minimumSelections: 1, maximumSelections: 1, sortOrder: 0 }
  )
})

it("creates fixed-price options with only the supported API request fields", async () => {
  vi.mocked(whitePlateApi.post).mockResolvedValue({
    ok: true,
    status: 201,
    data: {},
  })
  expect(
    await saveOptionAction(
      form({
        tenantId,
        groupId: optionGroupId,
        name: " Large ",
        priceAdjustment: "1.25",
        sortOrder: "2",
        currency: "GBP",
      })
    )
  ).toEqual({ ok: true })
  expect(whitePlateApi.post).toHaveBeenCalledWith(
    `/api/v1/tenants/${tenantId}/option-groups/${optionGroupId}/options`,
    { name: "Large", priceAdjustment: 1.25, sortOrder: 2 }
  )
})

it("updates options using only the API's mutable fields", async () => {
  vi.mocked(whitePlateApi.put).mockResolvedValue({
    ok: true,
    status: 200,
    data: {},
  })
  expect(
    await saveOptionAction(
      form({
        tenantId,
        id: optionId,
        groupId: optionGroupId,
        name: "Extra",
        priceAdjustment: "0",
        sortOrder: "0",
      })
    )
  ).toEqual({ ok: true })
  expect(whitePlateApi.put).toHaveBeenCalledWith(
    `/api/v1/tenants/${tenantId}/options/${optionId}`,
    { name: "Extra", priceAdjustment: 0, sortOrder: 0 }
  )
})

it("creates a normalized discount with only the API create fields", async () => {
  vi.mocked(whitePlateApi.post).mockResolvedValue({
    ok: true,
    status: 201,
    data: {},
  })
  expect(
    await saveDiscountAction(
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
  ).toEqual({ ok: true })
  expect(whitePlateApi.post).toHaveBeenCalledWith(
    `/api/v1/tenants/${tenantId}/discounts`,
    { code: "LUNCH-10", name: "Lunch offer", kind: "FixedAmount", value: 5.25 }
  )
})

it("updates discount details without sending a replacement code or active flag", async () => {
  vi.mocked(whitePlateApi.put).mockResolvedValue({
    ok: true,
    status: 200,
    data: {},
  })
  expect(
    await saveDiscountAction(
      form({
        tenantId,
        id: discountId,
        code: "ATTEMPTED-CHANGE",
        name: "New name",
        kind: "Percentage",
        value: "15",
        isActive: "false",
      })
    )
  ).toEqual({ ok: true })
  expect(whitePlateApi.put).toHaveBeenCalledWith(
    `/api/v1/tenants/${tenantId}/discounts/${discountId}`,
    { name: "New name", kind: "Percentage", value: 15 }
  )
})

it("deactivates only the validated discount in its selected tenant", async () => {
  vi.mocked(whitePlateApi.delete).mockResolvedValue({
    ok: true,
    status: 204,
    data: null,
  })
  expect(
    await deactivateDiscountAction(
      form({ tenantId, id: discountId, isActive: "true" })
    )
  ).toEqual({ ok: true })
  expect(whitePlateApi.delete).toHaveBeenCalledWith(
    `/api/v1/tenants/${tenantId}/discounts/${discountId}`
  )
})

it("rejects malformed discount mutations before calling the API", async () => {
  expect(
    await saveDiscountAction(
      form({
        tenantId,
        code: "LUNCH10",
        name: "Lunch",
        kind: "Percentage",
        value: "100.01",
      })
    )
  ).toEqual({ ok: false, error: "invalid" })
  expect(
    await deactivateDiscountAction(form({ tenantId, id: "invalid" }))
  ).toEqual({ ok: false, error: "invalid" })
  expect(whitePlateApi.post).not.toHaveBeenCalled()
  expect(whitePlateApi.put).not.toHaveBeenCalled()
  expect(whitePlateApi.delete).not.toHaveBeenCalled()
})

it.each([
  { tenantId: "../foreign" },
  { categoryId: "bad" },
  { id: "bad" },
  { name: " " },
  { name: "a".repeat(161) },
  { description: "a".repeat(1001) },
  { basePrice: "" },
  { basePrice: "-1" },
  { basePrice: "1.001" },
  { basePrice: "NaN" },
  { basePrice: "1e3" },
  { basePrice: "10000000000" },
  { taxRatePercent: "100.01" },
  { taxRatePercent: "-1" },
  { taxRatePercent: "0.001" },
  { sortOrder: "-1" },
  { sortOrder: "1.5" },
  { sortOrder: "2147483648" },
  { id: productId, isAvailable: "on" },
])("rejects malformed product inputs before any request: %o", async (input) => {
  expect(await saveProductAction(product(input))).toEqual({
    ok: false,
    error: "invalid",
  })
  expect(whitePlateApi.post).not.toHaveBeenCalled()
  expect(whitePlateApi.put).not.toHaveBeenCalled()
})

it("rejects file fields and unsupported archive entities", async () => {
  const input = product()

  input.set("name", new Blob(["Soup"]), "name.txt")
  expect(await saveProductAction(input)).toEqual({
    ok: false,
    error: "invalid",
  })
  expect(
    await archiveCatalogItemAction(
      form({ tenantId, id: productId, entityType: "organizations" })
    )
  ).toEqual({ ok: false, error: "invalid" })
  expect(whitePlateApi.delete).not.toHaveBeenCalled()
})

it.each(["categories", "products", "option-groups", "options"] as const)(
  "archives only a validated %s resource in its tenant",
  async (entityType) => {
    vi.mocked(whitePlateApi.delete).mockResolvedValue({
      ok: true,
      status: 204,
      data: null,
    })
    expect(
      await archiveCatalogItemAction(
        form({ tenantId, id: productId, entityType })
      )
    ).toEqual({ ok: true })
    expect(whitePlateApi.delete).toHaveBeenCalledWith(
      `/api/v1/tenants/${tenantId}/${entityType}/${productId}`
    )
  }
)

it.each([
  [401, "unauthorized", "unauthorized"],
  [403, "forbidden", "forbidden"],
  [404, "not_found", "forbidden"],
  [409, "conflict", "conflict"],
  [400, "invalid", "invalid"],
  [500, "unavailable", "unavailable"],
] as const)(
  "preserves safe failure for HTTP %i",
  async (status, error, expected) => {
    vi.mocked(whitePlateApi.post).mockResolvedValue({
      ok: false,
      status,
      error,
    })
    expect(await saveProductAction(product())).toEqual({
      ok: false,
      error: expected,
    })
  }
)
