import { expect, it, vi } from "vitest"
import { loadPublicPickupSlots } from "./pickup-slots-browser"

const { browserRequest } = vi.hoisted(() => ({ browserRequest: vi.fn() }))

vi.mock("./browser-request", () => ({ browserRequest }))

it("parses the paused ordering state and rush buffer from public availability", async () => {
  browserRequest.mockResolvedValue({
    ok: true,
    status: 200,
    data: {
      state: "orders_paused",
      timeZone: "Europe/Paris",
      slots: [],
      acceptingOrders: false,
      rushHoldEnabled: true,
      rushBufferMinutes: 10,
    },
  })

  const result = await loadPublicPickupSlots(new AbortController().signal)

  expect(result).toEqual({
    ok: true,
    data: {
      state: "orders_paused",
      timeZone: "Europe/Paris",
      slots: [],
      acceptingOrders: false,
      rushHoldEnabled: true,
      rushBufferMinutes: 10,
    },
  })
})
