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
    request.signal
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
