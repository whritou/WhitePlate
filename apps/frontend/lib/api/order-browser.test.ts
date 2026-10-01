import { afterEach, expect, it, vi } from "vitest"
import {
  fetchOrderPage,
  getSignalRToken,
  OrderRequestError,
} from "./order-browser"

afterEach(() => vi.unstubAllGlobals())

it("requests a fresh SignalR token through the protected same-origin POST adapter", async () => {
  const fetch = vi
    .fn()
    .mockResolvedValue(Response.json({ accessToken: "test-token" }))
  vi.stubGlobal("fetch", fetch)
  expect(await getSignalRToken()).toBe("test-token")
  expect(fetch).toHaveBeenCalledWith(
    "/api/kitchen/signalr-token",
    expect.objectContaining({
      method: "POST",
      credentials: "same-origin",
      cache: "no-store",
      redirect: "error",
    })
  )
})

it.each([null, { accessToken: "" }, { accessToken: 123 }])(
  "rejects malformed SignalR credentials: %j",
  async (body) => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(Response.json(body)))
    await expect(getSignalRToken()).rejects.toThrow(
      "SignalR authentication is unavailable."
    )
  }
)

it("uses the same-origin BFF without a token and forwards cancellation", async () => {
  const fetch = vi.fn().mockResolvedValue(
    Response.json({
      ok: true,
      data: { items: [], nextCursor: null },
    })
  )
  vi.stubGlobal("fetch", fetch)
  const signal = new AbortController().signal
  expect(await fetchOrderPage("tenant", "Ready", "older", signal)).toEqual({
    items: [],
    nextCursor: null,
  })
  expect(fetch).toHaveBeenCalledWith(
    "/api/kitchen/orders?tenantId=tenant&status=Ready&cursor=older",
    expect.objectContaining({
      signal,
      credentials: "same-origin",
      cache: "no-store",
      redirect: "error",
    })
  )
  expect(fetch.mock.calls[0]![1].headers).toEqual({
    Accept: "application/json",
  })
})

it.each([
  [401, "unauthorized"],
  [403, "forbidden"],
  [404, "forbidden"],
  [400, "invalid"],
  [500, "unavailable"],
])("maps HTTP %s to a safe query error", async (status, code) => {
  vi.stubGlobal(
    "fetch",
    vi.fn().mockResolvedValue(new Response(null, { status: Number(status) }))
  )
  await expect(
    fetchOrderPage("tenant", null, null, new AbortController().signal)
  ).rejects.toMatchObject({ code })
})

it("rejects malformed order data instead of caching it as a successful page", async () => {
  vi.stubGlobal(
    "fetch",
    vi.fn().mockResolvedValue(
      Response.json({
        ok: true,
        data: { items: [{ id: "not-an-order" }], nextCursor: null },
      })
    )
  )
  await expect(
    fetchOrderPage("tenant", null, null, new AbortController().signal)
  ).rejects.toEqual(new OrderRequestError("unavailable"))
})
