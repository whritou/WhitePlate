import { afterEach, expect, it, vi } from "vitest"
import { whitePlateApi } from "@/lib/api"
import {
  archiveCatalogItemAction,
  saveCategoryAction,
  saveProductAction,
} from "./catalog"

vi.mock("server-only", () => ({}))
vi.mock("@/lib/api", () => ({
  whitePlateApi: { post: vi.fn(), put: vi.fn(), delete: vi.fn() },
}))

const tenantId = "11111111-1111-4111-8111-111111111111"
const categoryId = "22222222-2222-4222-8222-222222222222"
const productId = "33333333-3333-4333-8333-333333333333"

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

it("updates product availability without attempting to move categories", async () => {
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
      basePrice: 7.5,
      taxRatePercent: 5.5,
      sortOrder: 2,
      isAvailable: false,
    }
  )
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

it.each(["categories", "products"])(
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
