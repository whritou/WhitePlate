import { afterEach, describe, expect, it, vi } from "vitest"
import type { NextRequest } from "next/server"
import proxy from "./proxy"

vi.mock("next/server", () => ({
  NextResponse: {
    rewrite: (url: URL) =>
      new Response(null, { headers: { "x-middleware-rewrite": String(url) } }),
  },
}))
vi.mock("next-intl/middleware", () => ({
  default: () => () =>
    new Response(null, { headers: { "x-middleware-next": "1" } }),
}))

afterEach(() => vi.unstubAllEnvs())

function makeRequest(url: string) {
  const nextUrl = Object.assign(new URL(url), {
    clone: () => new URL(url),
  })

  return {
    nextUrl,
    headers: new Headers({ host: new URL(url).host }),
    url,
  } as unknown as NextRequest
}

describe("localized storefront path proxy", () => {
  it.each(["en", "fr"])(
    "internally rewrites the %s menu alias",
    async (locale) => {
      vi.stubEnv("STOREFRONT_PATH_BASE_DOMAIN", "white-plate.vercel.app")

      const response = await proxy(
        makeRequest(
          `https://white-plate.vercel.app/${locale}/bistro?menuLocale=fr&step=checkout`
        )
      )

      expect(response.headers.get("x-middleware-rewrite")).toBe(
        `https://white-plate.vercel.app/${locale}/storefront-preview/bistro?menuLocale=fr&step=checkout`
      )
    }
  )

  it.each(["en", "fr"])(
    "internally rewrites the %s order alias",
    async (locale) => {
      vi.stubEnv("STOREFRONT_PATH_BASE_DOMAIN", "white-plate.vercel.app")

      const orderId = "11111111-1111-4111-8111-111111111111"

      const response = await proxy(
        makeRequest(
          `https://white-plate.vercel.app/${locale}/bistro/order/${orderId}`
        )
      )

      expect(response.headers.get("x-middleware-rewrite")).toBe(
        `https://white-plate.vercel.app/${locale}/storefront-preview/bistro/order/${orderId}`
      )
    }
  )

  it.each([
    "https://white-plate.vercel.app/en",
    "https://white-plate.vercel.app/fr",
    "https://bistro.restaurants.whiteplate.test/en/bistro",
  ])(
    "leaves marketing and restaurant-host routes to next-intl: %s",
    async (url) => {
      vi.stubEnv("STOREFRONT_PATH_BASE_DOMAIN", "white-plate.vercel.app")

      const response = await proxy(makeRequest(url))

      expect(response.headers.has("x-middleware-rewrite")).toBe(false)
      expect(response.headers.get("x-middleware-next")).toBe("1")
    }
  )
})
