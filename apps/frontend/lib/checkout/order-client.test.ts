import { describe, expect, it } from "vitest"
import { submitGuestOrder, type OrderReceipt } from "./order-client"

const productId = "11111111-1111-4111-8111-111111111111"
const tenantId = "22222222-2222-4222-8222-222222222222"
const input = {
  customerName: "Alice",
  discountCode: null,
  items: [{ productId, quantity: 2, optionIds: [] }],
}
const config = {
  baseDomain: "localhost",
  apiTemplate: "http://{tenant}.localhost:5182",
}
const receipt: OrderReceipt = {
  id: "33333333-3333-4333-8333-333333333333",
  tenantId,
  currency: "EUR",
  customerName: "Alice",
  discountCode: null,
  subtotal: 20,
  discountAmount: 0,
  taxAmount: 2,
  total: 22,
  status: "Pending",
  version: 1,
  createdAt: "2026-10-01T12:00:00Z",
  lines: [
    {
      productId,
      productName: "Soup",
      baseUnitPrice: 10,
      taxRatePercent: 10,
      quantity: 2,
      subtotal: 20,
      discountAmount: 0,
      taxAmount: 2,
      total: 22,
      options: [],
    },
  ],
}

describe("public guest checkout", () => {
  it("uses only the validated host target, forwards the key, and returns the server receipt", async () => {
    const requests: { url: string; init?: RequestInit }[] = []
    const fetcher: typeof fetch = async (url, init) => {
      requests.push({ url: String(url), init })
      return Response.json(receipt, { status: 201 })
    }
    expect(
      await submitGuestOrder(
        "bistro.localhost:3000",
        config,
        input,
        "checkout-key-123456",
        fetcher
      )
    ).toEqual({ ok: true, receipt })
    expect(requests[0].url).toBe("http://bistro.localhost:5182/api/v1/orders")
    expect(new Headers(requests[0].init?.headers).get("Idempotency-Key")).toBe(
      "checkout-key-123456"
    )
    expect(new Headers(requests[0].init?.headers).has("Authorization")).toBe(
      false
    )
    expect(new Headers(requests[0].init?.headers).has("Host")).toBe(false)
    expect(JSON.parse(String(requests[0].init?.body))).toEqual(input)
  })

  it.each([
    "localhost:3000",
    "bistro.attacker.test",
    "nested.bistro.localhost",
    "bistro.localhost@attacker.test",
    "bistro.localhost/",
    "bistro.localhost\r\nX-Host: other",
  ])("rejects untrusted host %s before contacting the API", async (host) => {
    let calls = 0
    const fetcher: typeof fetch = async () => {
      calls++
      return Response.json(receipt)
    }
    expect(
      await submitGuestOrder(
        host,
        config,
        input,
        "checkout-key-123456",
        fetcher
      )
    ).toEqual({ ok: false, error: "not_found" })
    expect(calls).toBe(0)
  })

  it("rejects a configured target that does not match the tenant host", async () => {
    let calls = 0
    const result = await submitGuestOrder(
      "bistro.localhost",
      { ...config, apiTemplate: "http://{tenant}.attacker.test" },
      input,
      "checkout-key-123456",
      async () => {
        calls++
        return Response.json(receipt)
      }
    )
    expect(result).toEqual({ ok: false, error: "unavailable" })
    expect(calls).toBe(0)
  })

  it("replays one receipt for duplicate keys and surfaces a changed-payload conflict", async () => {
    const stored = new Map<string, { body: string; receipt: OrderReceipt }>()
    const fetcher: typeof fetch = async (_url, init) => {
      const key = new Headers(init?.headers).get("Idempotency-Key")!
      const body = String(init?.body)
      const previous = stored.get(key)
      if (previous && previous.body !== body)
        return Response.json(
          { detail: "secret upstream detail" },
          { status: 409 }
        )
      if (!previous) stored.set(key, { body, receipt })
      return Response.json(stored.get(key)!.receipt, { status: 201 })
    }
    const first = await submitGuestOrder(
      "bistro.localhost",
      config,
      input,
      "checkout-key-123456",
      fetcher
    )
    expect(first).toEqual({ ok: true, receipt })
    expect(
      await submitGuestOrder(
        "bistro.localhost",
        config,
        input,
        "checkout-key-123456",
        fetcher
      )
    ).toEqual(first)
    expect(
      await submitGuestOrder(
        "bistro.localhost",
        config,
        { ...input, customerName: "Bob" },
        "checkout-key-123456",
        fetcher
      )
    ).toEqual({ ok: false, error: "conflict" })
    expect(stored.size).toBe(1)
  })

  it.each([
    [400, "invalid"],
    [404, "not_found"],
    [429, "rate_limited"],
    [500, "unavailable"],
  ] as const)("sanitizes HTTP %i", async (status, error) => {
    expect(
      await submitGuestOrder(
        "bistro.localhost",
        config,
        input,
        "checkout-key-123456",
        async () => Response.json({ detail: "secret" }, { status })
      )
    ).toEqual({ ok: false, error })
  })

  it("treats malformed success receipts as uncertain rather than confirming an order", async () => {
    expect(
      await submitGuestOrder(
        "bistro.localhost",
        config,
        input,
        "checkout-key-123456",
        async () => Response.json({ ...receipt, total: "22" })
      )
    ).toEqual({ ok: false, error: "unavailable" })
  })

  it("rejects invalid payloads and keys before contacting the API", async () => {
    let calls = 0
    const fetcher: typeof fetch = async () => {
      calls++
      return Response.json(receipt)
    }
    expect(
      await submitGuestOrder(
        "bistro.localhost",
        config,
        {},
        "checkout-key-123456",
        fetcher
      )
    ).toEqual({ ok: false, error: "invalid" })
    expect(
      await submitGuestOrder(
        "bistro.localhost",
        config,
        input,
        "bad\r\nkey",
        fetcher
      )
    ).toEqual({ ok: false, error: "invalid" })
    expect(calls).toBe(0)
  })
})
