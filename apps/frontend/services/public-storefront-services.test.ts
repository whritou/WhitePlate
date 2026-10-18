import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import { createApiRequestFactory } from "@/lib/api/request-factory"
import { getPublicEstablishment } from "./public-establishment"
import { getPublicPickupSlots } from "./public-pickup-slots"

vi.mock("server-only", () => ({}))
vi.mock("@/lib/api/request-factory", () => ({
  createApiRequestFactory: vi.fn(),
}))

const get = vi.fn()

beforeEach(() => {
  vi.mocked(createApiRequestFactory).mockReturnValue({ get } as never)
  get.mockReset()
  get.mockResolvedValue({ ok: false, status: 404, error: "not_found" })
  vi.stubEnv("STOREFRONT_BASE_DOMAIN", "restaurants.whiteplate.test")
  vi.stubEnv("STOREFRONT_PATH_BASE_DOMAIN", "white-plate.vercel.app")
  vi.stubEnv(
    "PUBLIC_TENANT_API_URL_TEMPLATE",
    "https://{tenant}.restaurants.whiteplate.test"
  )
  vi.stubEnv("API_BASE_URL", "https://api.whiteplate.test")
})

afterEach(() => {
  vi.resetAllMocks()
  vi.unstubAllEnvs()
})

describe("public establishment and pickup requests", () => {
  it("loads establishment data from the central slug route with its requested locale", async () => {
    await getPublicEstablishment(
      "white-plate.vercel.app",
      "fr",
      undefined,
      "bistro"
    )

    expect(createApiRequestFactory).toHaveBeenCalledWith(
      expect.objectContaining({
        baseUrl: "https://api.whiteplate.test",
        public: true,
      })
    )
    expect(get).toHaveBeenCalledWith(
      "/api/v1/public/restaurants/bistro/establishment?locale=fr",
      expect.anything()
    )
  })

  it("loads pickup slots from the central slug route", async () => {
    await getPublicPickupSlots("white-plate.vercel.app", undefined, "bistro")

    expect(get).toHaveBeenCalledWith(
      "/api/v1/public/restaurants/bistro/pickup-slots",
      expect.anything()
    )
  })

  it("keeps pickup requests on the restaurant-host route for the final domain", async () => {
    await getPublicPickupSlots("bistro.restaurants.whiteplate.test")

    expect(createApiRequestFactory).toHaveBeenCalledWith(
      expect.objectContaining({
        baseUrl: "https://bistro.restaurants.whiteplate.test",
        public: true,
      })
    )
    expect(get).toHaveBeenCalledWith("/api/v1/pickup-slots", expect.anything())
  })
})
