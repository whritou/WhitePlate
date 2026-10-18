import { afterEach, expect, it, vi } from "vitest"
import { GET } from "./route"
import { getPublicPickupSlots } from "@/services/public-pickup-slots"

vi.mock("@/services/public-pickup-slots", () => ({
  getPublicPickupSlots: vi.fn(),
}))

afterEach(() => vi.resetAllMocks())

it("passes an explicit restaurant slug to pickup availability", async () => {
  vi.mocked(getPublicPickupSlots).mockResolvedValue({
    ok: false,
    status: 404,
    error: "not_found",
  })

  const request = new Request(
    "https://white-plate.vercel.app/api/public/pickup-slots?restaurantSlug=bistro",
    { headers: { host: "white-plate.vercel.app" } }
  )

  await GET(request)

  expect(getPublicPickupSlots).toHaveBeenCalledWith(
    "white-plate.vercel.app",
    request.signal,
    "bistro"
  )
})

it("rejects duplicate restaurant selectors", async () => {
  const response = await GET(
    new Request(
      "https://white-plate.vercel.app/api/public/pickup-slots?restaurantSlug=bistro&restaurantSlug=other"
    )
  )

  expect(response.status).toBe(400)
  expect(getPublicPickupSlots).not.toHaveBeenCalled()
})
