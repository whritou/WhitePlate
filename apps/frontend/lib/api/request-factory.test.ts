import { describe, expect, it, vi } from "vitest"
import { createApiRequestFactory } from "./request-factory"

function makeResponse(
  body: unknown,
  status = 200,
  headers = new Headers({ "Content-Type": "application/json" })
) {
  return new Response(body === null ? null : JSON.stringify(body), {
    status,
    headers,
  })
}

describe("createApiRequestFactory", () => {
  it("maps an expired If-Match version to a conflict", async () => {
    const api = createApiRequestFactory({
      baseUrl: "https://api.example.test",
      getToken: async () => "server-token",
      fetcher: async () => makeResponse(null, 412),
    })

    await expect(
      api.patch("/api/v1/orders/1/status", { status: "Ready" })
    ).resolves.toEqual({
      ok: false,
      status: 412,
      error: "conflict",
    })
  })
  it("sends conditional status updates with a quoted If-Match version", async () => {
    const fetcher = vi.fn<typeof fetch>(async () =>
      makeResponse({ id: "order-1", status: "Preparing", version: 2 })
    )
    const api = createApiRequestFactory({
      baseUrl: "https://api.example.test",
      getToken: async () => "server-token",
      fetcher,
    })

    const result = await api.patch(
      "/api/v1/tenants/tenant-1/orders/order-1/status",
      { status: "Preparing" },
      { ifMatch: '"1"' }
    )

    expect(result).toMatchObject({ ok: true, status: 200 })
    expect(fetcher).toHaveBeenCalledTimes(1)
    const [input, init] = fetcher.mock.calls[0]!
    expect(String(input)).toBe(
      "https://api.example.test/api/v1/tenants/tenant-1/orders/order-1/status"
    )
    expect(init?.method).toBe("PATCH")
    expect(new Headers(init?.headers).get("Authorization")).toBe(
      "Bearer server-token"
    )
    expect(new Headers(init?.headers).get("If-Match")).toBe('"1"')
    expect(init?.body).toBe(JSON.stringify({ status: "Preparing" }))
    expect(init).toMatchObject({
      cache: "no-store",
      credentials: "omit",
      redirect: "error",
    })
  })

  it("sends checkout idempotency keys and preserves rate-limit failures", async () => {
    const requests: RequestInit[] = []
    const fetcher: typeof fetch = async (_url, init) => {
      requests.push(init!)
      return makeResponse(
        { code: "rate_limited", detail: "private upstream text" },
        429
      )
    }
    const api = createApiRequestFactory({
      baseUrl: "https://bistro.example.test",
      getToken: async () => null,
      public: true,
      fetcher,
    })
    const result = await api.post(
      "/api/v1/orders",
      { customerName: "Alice" },
      { idempotencyKey: "order-key-123456" }
    )
    expect(new Headers(requests[0]?.headers).get("Idempotency-Key")).toBe(
      "order-key-123456"
    )
    expect(result).toEqual({ ok: false, status: 429, error: "rate_limited" })
  })
  it("supports GET, POST, PUT, and DELETE with a server token and safe defaults", async () => {
    const fetcher = vi.fn<typeof fetch>(async () =>
      makeResponse({ id: "item" })
    )
    const api = createApiRequestFactory({
      baseUrl: "https://api.example.test/",
      getToken: async () => "server-token",
      fetcher,
    })

    await api.get("/api/v1/items")
    await api.post("/api/v1/items", { name: "Soup" })
    await api.put("/api/v1/items/1", { name: "Updated soup" })
    await api.delete("/api/v1/items/1")

    expect(fetcher).toHaveBeenCalledTimes(4)
    for (const [input, init] of fetcher.mock.calls) {
      expect(String(input)).toMatch(/^https:\/\/api\.example\.test\/api\/v1\//)
      expect(new Headers(init?.headers).get("Authorization")).toBe(
        "Bearer server-token"
      )
      expect(init).toMatchObject({
        cache: "no-store",
        credentials: "omit",
        redirect: "error",
      })
    }
    expect(fetcher.mock.calls.map(([, init]) => init?.method)).toEqual([
      "GET",
      "POST",
      "PUT",
      "DELETE",
    ])
    expect(fetcher.mock.calls[1]?.[1]?.body).toBe(
      JSON.stringify({ name: "Soup" })
    )
  })

  it("does not call the API without a token and returns a safe unauthorized result", async () => {
    const fetcher = vi.fn()
    const api = createApiRequestFactory({
      baseUrl: "https://api.example.test",
      getToken: async () => null,
      fetcher,
    })

    await expect(api.get("/api/v1/items")).resolves.toEqual({
      ok: false,
      status: 401,
      error: "unauthorized",
    })
    expect(fetcher).not.toHaveBeenCalled()
  })

  it("rejects paths outside the API namespace without making a request", async () => {
    const fetcher = vi.fn()
    const api = createApiRequestFactory({
      baseUrl: "https://api.example.test",
      getToken: async () => "server-token",
      fetcher,
    })

    await expect(
      api.get("//attacker.example/api/v1/items")
    ).resolves.toMatchObject({ ok: false, status: 400, error: "invalid" })
    await expect(api.get("/api/v2/items")).resolves.toMatchObject({
      ok: false,
      status: 400,
      error: "invalid",
    })
    expect(fetcher).not.toHaveBeenCalled()
  })

  it("maps API failures to safe messages and logs only diagnostic metadata", async () => {
    const onDiagnostic = vi.fn()
    const fetcher = vi.fn(
      async () =>
        new Response(JSON.stringify({ detail: "database password leaked" }), {
          status: 500,
          headers: {
            "Content-Type": "application/problem+json",
            "x-error-code": "DatabaseUnavailable",
            "x-request-id": "request-123",
          },
        })
    )
    const api = createApiRequestFactory({
      baseUrl: "https://api.example.test",
      getToken: async () => "secret-token",
      fetcher,
      onDiagnostic,
    })

    const result = await api.get("/api/v1/items?access_token=secret-in-query")

    expect(result).toEqual({ ok: false, status: 500, error: "unavailable" })
    expect(JSON.stringify(result)).not.toContain("database password")
    expect(onDiagnostic).toHaveBeenCalledWith(
      expect.objectContaining({
        method: "GET",
        path: "/api/v1/items",
        status: 500,
        code: "DatabaseUnavailable",
        traceId: "request-123",
      })
    )
    expect(JSON.stringify(onDiagnostic.mock.calls)).not.toContain(
      "secret-token"
    )
    expect(JSON.stringify(onDiagnostic.mock.calls)).not.toContain(
      "database password"
    )
    expect(JSON.stringify(onDiagnostic.mock.calls)).not.toContain(
      "secret-in-query"
    )
  })

  it("keeps forbidden distinct from missing authentication", async () => {
    const fetcher = vi.fn(async () =>
      makeResponse({ detail: "forbidden" }, 403)
    )
    const api = createApiRequestFactory({
      baseUrl: "https://api.example.test",
      getToken: async () => "server-token",
      fetcher,
    })

    await expect(api.get("/api/v1/items")).resolves.toEqual({
      ok: false,
      status: 403,
      error: "forbidden",
    })
  })

  it("turns network failures into a safe unavailable result", async () => {
    const onDiagnostic = vi.fn()
    const fetcher = vi.fn(async () => {
      throw new TypeError("connection failed with credential=secret")
    })
    const api = createApiRequestFactory({
      baseUrl: "https://api.example.test",
      getToken: async () => "server-token",
      fetcher,
      onDiagnostic,
    })

    await expect(api.get("/api/v1/items")).resolves.toEqual({
      ok: false,
      status: 503,
      error: "unavailable",
    })
    expect(onDiagnostic).toHaveBeenCalledWith(
      expect.objectContaining({
        method: "GET",
        status: 503,
        causeName: "TypeError",
      })
    )
    expect(JSON.stringify(onDiagnostic.mock.calls)).not.toContain(
      "credential=secret"
    )
  })
})
