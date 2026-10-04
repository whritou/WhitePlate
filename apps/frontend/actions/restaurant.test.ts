import { afterEach, expect, it, vi } from "vitest"
import { createRestaurantAction } from "./restaurant"
import { whitePlateApi } from "@/lib/api"

vi.mock("server-only", () => ({}))
vi.mock("@/lib/api", () => ({ whitePlateApi: { post: vi.fn() } }))

const organizationId = "11111111-1111-4111-8111-111111111111"
const restaurantId = "22222222-2222-4222-8222-222222222222"

function form(overrides: Partial<Record<string, string>> = {}) {
  const value = new FormData()

  for (const [key, field] of Object.entries({
    organizationId,
    name: "  Bistro  ",
    subdomain: "  My-Bistro  ",
    currency: "eur",
    ...overrides,
  }))
    value.set(key, field ?? "")

  return value
}

afterEach(() => vi.resetAllMocks())

it("creates a normalized restaurant with only contract fields", async () => {
  vi.mocked(whitePlateApi.post).mockResolvedValue({
    ok: true,
    status: 201,
    data: {
      id: restaurantId,
      name: "Bistro",
      subdomain: "my-bistro",
      currency: "EUR",
    },
  })

  const input = form()

  input.set("role", "OrganizationOwner")
  expect(await createRestaurantAction(input)).toEqual({
    ok: true,
    restaurant: {
      id: restaurantId,
      name: "Bistro",
      subdomain: "my-bistro",
      currency: "EUR",
    },
  })
  expect(whitePlateApi.post).toHaveBeenCalledWith(
    `/api/v1/organizations/${organizationId}/restaurants`,
    { name: "Bistro", subdomain: "my-bistro", currency: "EUR" }
  )
})

it.each([
  { organizationId: "../foreign" },
  { name: " " },
  { name: "a".repeat(201) },
  { subdomain: "api" },
  { subdomain: "admin" },
  { subdomain: "www" },
  { subdomain: "app" },
  { subdomain: "-bistro" },
  { subdomain: "bistro-" },
  { subdomain: "bistro.other" },
  { subdomain: "a".repeat(64) },
  { currency: "BTC" },
])(
  "rejects invalid creation before sending an API request: %o",
  async (input) => {
    expect(await createRestaurantAction(form(input))).toEqual({
      ok: false,
      message: "invalid",
    })
    expect(whitePlateApi.post).not.toHaveBeenCalled()
  }
)

it("rejects non-form and file input rather than coercing it", async () => {
  const input = form()

  input.set("name", new Blob(["Bistro"]), "name.txt")
  expect(await createRestaurantAction(input)).toEqual({
    ok: false,
    message: "invalid",
  })
  expect(await createRestaurantAction({ organizationId })).toEqual({
    ok: false,
    message: "invalid",
  })
  expect(whitePlateApi.post).not.toHaveBeenCalled()
})

it.each([
  [409, "conflict", "conflict"],
  [401, "unauthorized", "unauthorized"],
  [403, "forbidden", "forbidden"],
  [404, "not_found", "forbidden"],
  [400, "invalid", "invalid"],
  [500, "unavailable", "unavailable"],
] as const)(
  "preserves the safe creation failure for HTTP %i",
  async (status, error, message) => {
    vi.mocked(whitePlateApi.post).mockResolvedValue({
      ok: false,
      status,
      error,
    })
    expect(await createRestaurantAction(form())).toEqual({ ok: false, message })
  }
)

it("does not report success for a malformed API restaurant", async () => {
  vi.mocked(whitePlateApi.post).mockResolvedValue({
    ok: true,
    status: 201,
    data: { id: "foreign" },
  })
  expect(await createRestaurantAction(form())).toEqual({
    ok: false,
    message: "unavailable",
  })
})
