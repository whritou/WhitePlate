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

const params = {
  productId: "22222222-2222-4222-8222-222222222222",
  assetId: "33333333-3333-4333-8333-333333333333",
  size: "320",
}

function configure(host: string) {
  vi.stubEnv("STOREFRONT_BASE_DOMAIN", "example.test")
  vi.stubEnv("PUBLIC_TENANT_API_URL_TEMPLATE", "https://{tenant}.example.test")
  vi.mocked(headers).mockResolvedValue(new Headers({ Host: host }) as never)
}

it.each(["example.test", "nested.bistro.example.test", "bistro.evil.test"])(
  "denies image delivery on invalid host %s",
  async (host) => {
    configure(host)

    const result = await GET(
      new Request("https://bistro.example.test/api/public/product-photos"),
      { params: Promise.resolve(params) }
    )

    expect(result.status).toBe(404)
    expect(createApiRequestFactory).not.toHaveBeenCalled()
  }
)

it("ignores browser tenant selectors and prevents host-shared image caching", async () => {
  configure("bistro.example.test")

  const image = vi.fn().mockResolvedValue({
    ok: true,
    status: 200,
    data: new Blob([new Uint8Array([1])], { type: "image/webp" }),
  })

  vi.mocked(createApiRequestFactory).mockReturnValue({ image } as never)

  const result = await GET(
    new Request(
      "https://bistro.example.test/api/public/product-photos?tenantId=foreign"
    ),
    { params: Promise.resolve(params) }
  )

  expect(createApiRequestFactory).toHaveBeenCalledWith(
    expect.objectContaining({
      baseUrl: "https://bistro.example.test",
      public: true,
    })
  )
  expect(image).toHaveBeenCalledWith(
    `/api/v1/products/${params.productId}/photos/${params.assetId}/320`,
    expect.anything()
  )
  expect(result.headers.get("cache-control")).toBe("no-store")
  expect(result.headers.get("vary")).toBe("Host")
})

it("rejects unapproved thumbnail sizes before delivery", async () => {
  configure("bistro.example.test")

  const result = await GET(
    new Request("https://bistro.example.test/api/public/product-photos"),
    { params: Promise.resolve({ ...params, size: "4096" }) }
  )

  expect(result.status).toBe(404)
  expect(createApiRequestFactory).not.toHaveBeenCalled()
})
