import { afterEach, expect, it, vi } from "vitest"
import { POST } from "./route"

const orderId = "33333333-3333-4333-8333-333333333333"
const token = "A".repeat(42) + "A"

afterEach(() => {
  vi.unstubAllGlobals()
  vi.unstubAllEnvs()
})

function request(host: string, origin = `http://${host}`) {
  return new Request(`http://${host}/api/public/orders/${orderId}/tracking`, {
    method: "POST",
    headers: { host, origin, "content-type": "application/json" },
    body: JSON.stringify({ token }),
  })
}

it("rejects a foreign Origin before contacting the tenant API", async () => {
  vi.stubEnv("STOREFRONT_BASE_DOMAIN", "localhost")

  const fetcher = vi.fn()

  vi.stubGlobal("fetch", fetcher)

  const response = await POST(
    request("bistro.localhost:3000", "https://attacker.test"),
    {
      params: Promise.resolve({ orderId }),
    }
  )

  expect(response.status).toBe(403)
  expect(response.headers.get("cache-control")).toBe("no-store")
  expect(fetcher).not.toHaveBeenCalled()
})

it("forwards only the capability body to the validated restaurant API host", async () => {
  vi.stubEnv("STOREFRONT_BASE_DOMAIN", "localhost")
  vi.stubEnv("PUBLIC_TENANT_API_URL_TEMPLATE", "http://{tenant}.localhost:5182")

  const calls: { url: string; init?: RequestInit }[] = []

  vi.stubGlobal("fetch", async (url: string | URL, init?: RequestInit) => {
    calls.push({ url: String(url), init })

    return Response.json({
      id: orderId,
      status: "Ready",
      version: 3,
      createdAt: "2026-10-08T08:00:00Z",
      customerName: "must not be returned",
    })
  })

  const response = await POST(request("bistro.localhost:3000"), {
    params: Promise.resolve({ orderId }),
  })

  expect(response.status).toBe(200)
  expect(response.headers.get("cache-control")).toBe("no-store")
  expect(calls[0].url).toBe(
    `http://bistro.localhost:5182/api/v1/orders/${orderId}/tracking`
  )
  expect(new Headers(calls[0].init?.headers).has("Authorization")).toBe(false)
  expect(calls[0].url).not.toContain(token)
  expect(JSON.parse(String(calls[0].init?.body))).toEqual({ token })
  await expect(response.json()).resolves.toEqual({
    id: orderId,
    status: "Ready",
    version: 3,
    createdAt: "2026-10-08T08:00:00Z",
  })
})

it("loads path-preview tracking through the central slug-scoped API", async () => {
  vi.stubEnv("STOREFRONT_BASE_DOMAIN", "restaurants.example.test")
  vi.stubEnv("STOREFRONT_PATH_BASE_DOMAIN", "white-plate.vercel.app")
  vi.stubEnv(
    "PUBLIC_TENANT_API_URL_TEMPLATE",
    "https://{tenant}.restaurants.example.test"
  )
  vi.stubEnv("API_BASE_URL", "https://api.example.test")

  const calls: { url: string; init?: RequestInit }[] = []

  vi.stubGlobal("fetch", async (url: string | URL, init?: RequestInit) => {
    calls.push({ url: String(url), init })

    return Response.json({
      id: orderId,
      status: "Ready",
      version: 3,
      createdAt: "2026-10-08T08:00:00Z",
    })
  })

  const response = await POST(
    new Request(
      `https://white-plate.vercel.app/api/public/orders/${orderId}/tracking?restaurantSlug=bistro`,
      {
        method: "POST",
        headers: {
          host: "white-plate.vercel.app",
          origin: "https://white-plate.vercel.app",
          "content-type": "application/json",
        },
        body: JSON.stringify({ token }),
      }
    ),
    { params: Promise.resolve({ orderId }) }
  )

  expect(calls[0]?.url).toBe(
    `https://api.example.test/api/v1/public/restaurants/bistro/orders/${orderId}/tracking`
  )
  expect(response.status).toBe(200)
  expect(response.headers.get("cache-control")).toBe("no-store")
})
