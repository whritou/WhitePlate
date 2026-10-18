import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import { createApiRequestFactory } from "./request-factory"
import { getPublicMenu, getPublicTheme } from "./public-storefront"

vi.mock("server-only", () => ({}))
vi.mock("./request-factory", () => ({
  createApiRequestFactory: vi.fn(),
}))

const get = vi.fn()

beforeEach(() => {
  get.mockReset()
  vi.mocked(createApiRequestFactory).mockReturnValue({ get } as never)
  vi.stubEnv("STOREFRONT_BASE_DOMAIN", "restaurants.whiteplate.test")
  vi.stubEnv("STOREFRONT_PATH_BASE_DOMAIN", "white-plate.vercel.app")
  vi.stubEnv(
    "PUBLIC_TENANT_API_URL_TEMPLATE",
    "https://{tenant}.restaurants.whiteplate.test"
  )
  vi.stubEnv("API_BASE_URL", "https://api.whiteplate.test")
})

afterEach(() => {
  vi.unstubAllEnvs()
  vi.resetAllMocks()
})

describe("public storefront API selection", () => {
  it("loads the French menu from the central slug route for the path preview", async () => {
    get.mockResolvedValue({ ok: false, status: 404, error: "not_found" })

    await getPublicMenu("white-plate.vercel.app", "fr", "bistro")

    expect(createApiRequestFactory).toHaveBeenCalledWith({
      baseUrl: "https://api.whiteplate.test",
      getToken: expect.any(Function),
      public: true,
    })
    expect(get).toHaveBeenCalledWith(
      "/api/v1/public/restaurants/bistro/menu?locale=fr"
    )
  })

  it("loads theme through the central slug route for the path preview", async () => {
    get.mockResolvedValue({ ok: false, status: 404, error: "not_found" })

    await getPublicTheme("white-plate.vercel.app", "bistro")

    expect(createApiRequestFactory).toHaveBeenCalledWith({
      baseUrl: "https://api.whiteplate.test",
      getToken: expect.any(Function),
      public: true,
    })
    expect(get).toHaveBeenCalledWith("/api/v1/public/restaurants/bistro/theme")
  })

  it("keeps a restaurant subdomain on its existing host-derived route", async () => {
    get.mockResolvedValue({ ok: false, status: 404, error: "not_found" })

    await getPublicMenu("bistro.restaurants.whiteplate.test", "en")

    expect(createApiRequestFactory).toHaveBeenCalledWith({
      baseUrl: "https://bistro.restaurants.whiteplate.test",
      getToken: expect.any(Function),
      public: true,
    })
    expect(get).toHaveBeenCalledWith("/api/v1/menu?locale=en")
  })
})
