import { describe, expect, it, vi } from "vitest"
import { createApiRequestFactory } from "./request-factory"

describe("media transport", () => {
  it("sends original binary bytes with server authorization and no JSON encoding", async () => {
    const fetcher = vi.fn().mockResolvedValue(Response.json({ id: "asset" }))
    const api = createApiRequestFactory({
      baseUrl: "https://api.example.test",
      getToken: async () => "token",
      fetcher,
    })
    const blob = new Blob([new Uint8Array([137, 80, 78, 71])], {
      type: "image/png",
    })

    await api.upload("/api/v1/tenants/id/brand-assets/logo/uploads", blob)

    const init = fetcher.mock.calls[0][1]

    expect(init.body).toBe(blob)
    expect(init.headers.get("Authorization")).toBe("Bearer token")
    expect(init.headers.get("Content-Type")).toBe("application/octet-stream")
    expect(init.cache).toBe("no-store")
    expect(init.redirect).toBe("error")
  })

  it("returns only allowlisted image binary and preserves safe failure mapping", async () => {
    const fetcher = vi.fn().mockResolvedValue(
      new Response(new Uint8Array([1, 2]), {
        headers: { "Content-Type": "image/png" },
      })
    )
    const api = createApiRequestFactory({
      baseUrl: "https://api.example.test",
      getToken: async () => "token",
      fetcher,
    })
    const result = await api.image("/api/v1/tenants/id/brand-assets/uploads/id")

    expect(result.ok && result.data?.size).toBe(2)
    fetcher.mockResolvedValue(
      new Response("<svg/>", { headers: { "Content-Type": "image/svg+xml" } })
    )
    expect(
      (await api.image("/api/v1/tenants/id/brand-assets/uploads/id")).ok
    ).toBe(false)
    fetcher.mockResolvedValue(new Response("secret", { status: 404 }))
    expect(
      await api.image("/api/v1/tenants/id/brand-assets/uploads/id")
    ).toEqual({ ok: false, status: 404, error: "not_found" })
  })
})
