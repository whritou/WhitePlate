import { expect, it, vi } from "vitest"
import { createJsonRequestClient } from "./json-request-client"

it("uses one no-store policy and forwards cancellation for same-origin reads", async () => {
  const fetcher = vi.fn<typeof fetch>(async () => Response.json({ value: 42 }))
  const client = createJsonRequestClient({
    credentials: "same-origin",
    fetcher,
  })
  const signal = new AbortController().signal

  await expect(
    client.request<{ value: number }>("/api/kitchen/orders", { signal })
  ).resolves.toEqual({ ok: true, status: 200, data: { value: 42 } })

  const init = fetcher.mock.calls[0]![1]!

  expect(init).toMatchObject({
    method: "GET",
    credentials: "same-origin",
    cache: "no-store",
    redirect: "error",
    signal,
  })
  expect(new Headers(init.headers).get("Accept")).toBe("application/json")
  expect(new Headers(init.headers).get("Content-Type")).toBeNull()
  expect(new Headers(init.headers).get("Authorization")).toBeNull()
  expect(init.body).toBeUndefined()
})

it("serializes mutation bodies and owns bearer, version and idempotency headers", async () => {
  const fetcher = vi.fn<typeof fetch>(
    async () => new Response(null, { status: 204 })
  )
  const client = createJsonRequestClient({ fetcher })

  await expect(
    client.request("https://api.example.test/api/v1/orders", {
      method: "PATCH",
      body: { status: "Ready" },
      bearerToken: "private-token",
      ifMatch: '"3"',
      idempotencyKey: "attempt-123",
    })
  ).resolves.toEqual({ ok: true, status: 204, data: null })

  const init = fetcher.mock.calls[0]![1]!
  const headers = new Headers(init.headers)

  expect(init.credentials).toBe("omit")
  expect(init.body).toBe('{"status":"Ready"}')
  expect(headers.get("Content-Type")).toBe("application/json")
  expect(headers.get("Authorization")).toBe("Bearer private-token")
  expect(headers.get("If-Match")).toBe('"3"')
  expect(headers.get("Idempotency-Key")).toBe("attempt-123")
})

it("returns a safe malformed-JSON failure without revealing the body or query", async () => {
  const diagnostics = vi.fn()
  const client = createJsonRequestClient({
    fetcher: async () =>
      new Response("private malformed body", {
        headers: { "Content-Type": "application/json" },
      }),
    onDiagnostic: diagnostics,
  })

  await expect(
    client.request("https://api.example.test/api/v1/me?token=private-query")
  ).resolves.toEqual({ ok: false, status: 502, error: "unavailable" })
  expect(diagnostics).toHaveBeenCalledWith(
    expect.objectContaining({
      path: "/api/v1/me",
      status: 502,
      causeName: "SyntaxError",
    })
  )
  expect(JSON.stringify(diagnostics.mock.calls)).not.toContain("private")
})

it("maps failures even when the diagnostic sink throws", async () => {
  const client = createJsonRequestClient({
    fetcher: async () =>
      new Response("private upstream failure", { status: 412 }),
    onDiagnostic: () => {
      throw new Error("logging is unavailable")
    },
  })

  await expect(client.request("/api/kitchen/orders")).resolves.toEqual({
    ok: false,
    status: 412,
    error: "conflict",
  })
})

it("allows provider acknowledgements without parsing an unused response body", async () => {
  const client = createJsonRequestClient({
    fetcher: async () =>
      new Response("unused provider response", {
        status: 202,
        headers: { "Content-Type": "application/json" },
      }),
  })

  await expect(
    client.request("https://provider.example.test/emails", {
      method: "POST",
      responseType: "none",
    })
  ).resolves.toEqual({ ok: true, status: 202, data: null })
})
