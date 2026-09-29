import { describe, expect, it, vi } from "vitest"
import { createApiRequestFactory } from "./request-factory"

function makeResponse(body: unknown, status = 200, headers = new Headers({ "Content-Type": "application/json" })) {
  return new Response(body === null ? null : JSON.stringify(body), { status, headers })
}

describe("createApiRequestFactory", () => {
  it("supports GET, POST, PUT, and DELETE with a server token and safe defaults", async () => {
    const fetcher = vi.fn(async (_input: RequestInfo | URL, _init?: RequestInit) => makeResponse({ id: "item" }))
    const api = createApiRequestFactory({ baseUrl: "https://api.example.test/", getToken: async () => "server-token", fetcher })

    await api.get("/api/v1/items")
    await api.post("/api/v1/items", { name: "Soup" })
    await api.put("/api/v1/items/1", { name: "Updated soup" })
    await api.delete("/api/v1/items/1")

    expect(fetcher).toHaveBeenCalledTimes(4)
    for (const [input, init] of fetcher.mock.calls) {
      expect(String(input)).toMatch(/^https:\/\/api\.example\.test\/api\/v1\//)
      expect(new Headers(init?.headers).get("Authorization")).toBe("Bearer server-token")
      expect(init).toMatchObject({ cache: "no-store", credentials: "omit", redirect: "error" })
    }
    expect(fetcher.mock.calls.map(([, init]) => init?.method)).toEqual(["GET", "POST", "PUT", "DELETE"])
    expect(fetcher.mock.calls[1]?.[1]?.body).toBe(JSON.stringify({ name: "Soup" }))
  })

  it("does not call the API without a token and returns a safe unauthorized result", async () => {
    const fetcher = vi.fn()
    const api = createApiRequestFactory({ baseUrl: "https://api.example.test", getToken: async () => null, fetcher })

    await expect(api.get("/api/v1/items")).resolves.toEqual({ ok: false, status: 401, error: "unauthorized" })
    expect(fetcher).not.toHaveBeenCalled()
  })

  it("rejects paths outside the API namespace without making a request", async () => {
    const fetcher = vi.fn()
    const api = createApiRequestFactory({ baseUrl: "https://api.example.test", getToken: async () => "server-token", fetcher })

    await expect(api.get("//attacker.example/api/v1/items")).resolves.toMatchObject({ ok: false, status: 400, error: "invalid" })
    await expect(api.get("/api/v2/items")).resolves.toMatchObject({ ok: false, status: 400, error: "invalid" })
    expect(fetcher).not.toHaveBeenCalled()
  })

  it("maps API failures to safe messages and logs only diagnostic metadata", async () => {
    const onDiagnostic = vi.fn()
    const fetcher = vi.fn(async () => new Response(JSON.stringify({ detail: "database password leaked" }), {
      status: 500,
      headers: { "Content-Type": "application/problem+json", "x-error-code": "DatabaseUnavailable", "x-request-id": "request-123" },
    }))
    const api = createApiRequestFactory({ baseUrl: "https://api.example.test", getToken: async () => "secret-token", fetcher, onDiagnostic })

    const result = await api.get("/api/v1/items?access_token=secret-in-query")

    expect(result).toEqual({ ok: false, status: 500, error: "unavailable" })
    expect(JSON.stringify(result)).not.toContain("database password")
    expect(onDiagnostic).toHaveBeenCalledWith(expect.objectContaining({ method: "GET", path: "/api/v1/items", status: 500, code: "DatabaseUnavailable", traceId: "request-123" }))
    expect(JSON.stringify(onDiagnostic.mock.calls)).not.toContain("secret-token")
    expect(JSON.stringify(onDiagnostic.mock.calls)).not.toContain("database password")
    expect(JSON.stringify(onDiagnostic.mock.calls)).not.toContain("secret-in-query")
  })

  it("keeps forbidden distinct from missing authentication", async () => {
    const fetcher = vi.fn(async () => makeResponse({ detail: "forbidden" }, 403))
    const api = createApiRequestFactory({ baseUrl: "https://api.example.test", getToken: async () => "server-token", fetcher })

    await expect(api.get("/api/v1/items")).resolves.toEqual({ ok: false, status: 403, error: "forbidden" })
  })

  it("turns network failures into a safe unavailable result", async () => {
    const onDiagnostic = vi.fn()
    const fetcher = vi.fn(async () => { throw new TypeError("connection failed with credential=secret") })
    const api = createApiRequestFactory({ baseUrl: "https://api.example.test", getToken: async () => "server-token", fetcher, onDiagnostic })

    await expect(api.get("/api/v1/items")).resolves.toEqual({ ok: false, status: 503, error: "unavailable" })
    expect(onDiagnostic).toHaveBeenCalledWith(expect.objectContaining({ method: "GET", status: 503, causeName: "TypeError" }))
    expect(JSON.stringify(onDiagnostic.mock.calls)).not.toContain("credential=secret")
  })
})
