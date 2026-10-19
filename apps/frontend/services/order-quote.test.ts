import { afterEach, expect, it, vi } from "vitest"
import { createApiRequestFactory } from "@/lib/api/request-factory"
import { getOrderQuote } from "./order-quote"

vi.mock("server-only", () => ({}))
vi.mock("@/lib/api/request-factory", () => ({
  createApiRequestFactory: vi.fn(),
}))
afterEach(() => {
  vi.resetAllMocks()
  vi.unstubAllEnvs()
})

it("keeps the quote tenant scoped and forwards only pricing input", async () => {
  const post = vi
    .fn()
    .mockResolvedValue({ ok: false, status: 404, error: "not_found" })

  vi.mocked(createApiRequestFactory).mockReturnValue({ post } as never)
  vi.stubEnv("STOREFRONT_BASE_DOMAIN", "example.test")
  vi.stubEnv("PUBLIC_TENANT_API_URL_TEMPLATE", "https://{tenant}.example.test")

  const input = {
    menuLocale: "fr",
    discountCode: null,
    items: [
      {
        productId: "11111111-1111-4111-8111-111111111111",
        quantity: 1,
        optionIds: [],
      },
    ],
    customerPhone: "+33123456789",
    orderNotes: "Private",
  }

  await getOrderQuote(
    "bistro.example.test",
    input,
    new AbortController().signal
  )
  expect(post).toHaveBeenCalledWith(
    "/api/v1/orders/quote",
    {
      menuLocale: "fr",
      discountCode: null,
      items: input.items,
    },
    expect.anything()
  )
  post.mockClear()
  await getOrderQuote("foreign.invalid", input, new AbortController().signal)
  expect(post).not.toHaveBeenCalled()
})
