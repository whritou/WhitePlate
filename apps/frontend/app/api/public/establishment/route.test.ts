import { afterEach, expect, it, vi } from "vitest"
import { GET } from "./route"
import { getPublicEstablishment } from "@/services/public-establishment"

vi.mock("@/services/public-establishment", () => ({
  getPublicEstablishment: vi.fn(),
}))
afterEach(() => vi.resetAllMocks())

it("uses only the incoming host and locale, ignoring browser tenant selectors", async () => {
  vi.mocked(getPublicEstablishment).mockResolvedValue({
    ok: false,
    status: 404,
    error: "not_found",
  })

  const request = new Request(
    "http://bistro.localhost/api/public/establishment?locale=fr&tenantId=foreign",
    { headers: { host: "bistro.localhost", "x-tenant-id": "foreign" } }
  )
  const response = await GET(request)

  expect(getPublicEstablishment).toHaveBeenCalledWith(
    "bistro.localhost",
    "fr",
    request.signal,
    undefined
  )
  expect(response.headers.get("cache-control")).toBe("no-store")
})

it.each(["locale=fr&locale=en", "locale=../private", "locale="])(
  "rejects malformed locale %s",
  async (query) => {
    expect(
      (
        await GET(
          new Request(
            `http://bistro.localhost/api/public/establishment?${query}`
          )
        )
      ).status
    ).toBe(400)
    expect(getPublicEstablishment).not.toHaveBeenCalled()
  }
)

it("passes an explicit restaurant slug to the localized establishment service", async () => {
  vi.mocked(getPublicEstablishment).mockResolvedValue({
    ok: false,
    status: 404,
    error: "not_found",
  })

  const request = new Request(
    "https://white-plate.vercel.app/api/public/establishment?locale=fr&restaurantSlug=bistro",
    { headers: { host: "white-plate.vercel.app" } }
  )

  await GET(request)

  expect(getPublicEstablishment).toHaveBeenCalledWith(
    "white-plate.vercel.app",
    "fr",
    request.signal,
    "bistro"
  )
})

it("rejects duplicate restaurant selectors", async () => {
  const response = await GET(
    new Request(
      "https://white-plate.vercel.app/api/public/establishment?locale=fr&restaurantSlug=bistro&restaurantSlug=other"
    )
  )

  expect(response.status).toBe(400)
  expect(getPublicEstablishment).not.toHaveBeenCalled()
})
