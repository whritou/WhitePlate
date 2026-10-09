import { afterEach, expect, it, vi } from "vitest"
import { GET } from "./route"
import { headers } from "next/headers"
import { createApiRequestFactory } from "@/lib/api/request-factory"

vi.mock("next/headers", () => ({ headers: vi.fn() }))
vi.mock("@/lib/api/request-factory", () => ({
  createApiRequestFactory: vi.fn(),
}))

afterEach(() => {
  vi.resetAllMocks()
  vi.unstubAllEnvs()
})

function configure(host: string) {
  vi.stubEnv("STOREFRONT_BASE_DOMAIN", "example.test")
  vi.stubEnv("PUBLIC_TENANT_API_URL_TEMPLATE", "https://{tenant}.example.test")
  vi.mocked(headers).mockResolvedValue(new Headers({ Host: host }) as never)
}

it.each(["example.test", "nested.bistro.example.test", "bistro.evil.test"])(
  "denies invalid public host %s",
  async (host) => {
    configure(host)

    const response = await GET(
      new Request("https://bistro.example.test/api/public/brand-assets/logo"),
      { params: Promise.resolve({ slot: "logo" }) }
    )

    expect(response.status).toBe(404)
    expect(createApiRequestFactory).not.toHaveBeenCalled()
  }
)

it("derives public delivery from the validated host and configured origin", async () => {
  configure("bistro.example.test")

  const image = vi.fn().mockResolvedValue({
    ok: true,
    status: 200,
    data: new Blob([new Uint8Array([1, 2])], { type: "image/png" }),
  })

  vi.mocked(createApiRequestFactory).mockReturnValue({ image } as never)

  const response = await GET(
    new Request(
      "https://bistro.example.test/api/public/brand-assets/logo?tenantId=foreign"
    ),
    { params: Promise.resolve({ slot: "logo" }) }
  )

  expect(createApiRequestFactory).toHaveBeenCalledWith(
    expect.objectContaining({
      baseUrl: "https://bistro.example.test",
      public: true,
    })
  )
  expect(image).toHaveBeenCalledWith(
    "/api/v1/brand-assets/logo",
    expect.anything()
  )
  expect(response.headers.get("cache-control")).toBe("no-store")
  expect(response.headers.get("content-type")).toBe("image/png")
})

it("falls back to the built-in favicon when the tenant has no saved favicon", async () => {
  configure("bistro.example.test")
  vi.mocked(createApiRequestFactory).mockReturnValue({
    image: vi
      .fn()
      .mockResolvedValue({ ok: false, status: 404, error: "not_found" }),
  } as never)

  const response = await GET(
    new Request("https://bistro.example.test/api/public/brand-assets/favicon"),
    { params: Promise.resolve({ slot: "favicon" }) }
  )

  expect(response.status).toBe(307)
  expect(response.headers.get("location")).toBe("/favicon.ico")
})
