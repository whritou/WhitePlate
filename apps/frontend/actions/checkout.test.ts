import { afterEach, expect, it, vi } from "vitest"
import { headers } from "next/headers"
import { checkoutGuestOrder } from "@/actions/checkout"

vi.mock("next/headers", () => ({ headers: vi.fn() }))
afterEach(() => {
  vi.unstubAllGlobals()
  vi.unstubAllEnvs()
})

it.each([null, "https://attacker.test", "ftp://bistro.localhost:3010"])(
  "rejects missing, foreign, or invalid origin %s before submitting",
  async (origin) => {
    const requestHeaders = new Headers({ host: "bistro.localhost:3010" })
    if (origin) requestHeaders.set("origin", origin)
    vi.mocked(headers).mockResolvedValue(
      requestHeaders as Awaited<ReturnType<typeof headers>>
    )
    const fetcher = vi.fn()
    vi.stubGlobal("fetch", fetcher)
    expect(await checkoutGuestOrder({}, "checkout-key-123456")).toEqual({
      ok: false,
      error: "forbidden",
    })
    expect(fetcher).not.toHaveBeenCalled()
  }
)

it("uses the actual host rather than forwarded tenant headers", async () => {
  vi.stubEnv("STOREFRONT_BASE_DOMAIN", "localhost")
  vi.mocked(headers).mockResolvedValue(
    new Headers({
      host: "localhost:3010",
      origin: "http://localhost:3010",
      "x-forwarded-host": "bistro.localhost:3010",
      "x-tenant-id": "another-tenant",
    }) as Awaited<ReturnType<typeof headers>>
  )
  expect(await checkoutGuestOrder({}, "checkout-key-123456")).toEqual({
    ok: false,
    error: "not_found",
  })
})
