import { describe, expect, it } from "vitest"
import { readdirSync } from "node:fs"
import { join } from "node:path"
import { fileURLToPath } from "node:url"
import {
  appendRestaurantSlugQuery,
  createPublicStorefrontApiTarget,
  getRestaurantSlugSelector,
  getStorefrontPreviewRewrite,
  getStorefrontMenuHref,
  getStorefrontTrackingHref,
  resolvePublicStorefrontTarget,
} from "./storefront-preview-routing"

const domains = {
  baseDomain: "restaurants.whiteplate.test",
  pathBaseDomain: "white-plate.vercel.app",
}

const localeAppDirectory = fileURLToPath(
  new URL("../app/[locale]", import.meta.url)
)

function hasPageFile(directory: string): boolean {
  return readdirSync(directory, { withFileTypes: true }).some((entry) => {
    const path = join(directory, entry.name)

    return entry.isFile()
      ? /^page\.(tsx|ts|jsx|js)$/.test(entry.name)
      : entry.isDirectory() && hasPageFile(path)
  })
}

function localizedRootPageSegments(directory = localeAppDirectory): string[] {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    if (!entry.isDirectory()) return []

    const routeGroup = entry.name.startsWith("(") && entry.name.endsWith(")")
    const path = join(directory, entry.name)

    if (routeGroup) return localizedRootPageSegments(path)
    if (entry.name.startsWith("[") && hasPageFile(path))
      throw new Error(
        `Dynamic localized root route ${entry.name} may overlap restaurant aliases`
      )
    if (!hasPageFile(path)) return []

    return [entry.name]
  })
}

describe("localized storefront preview routing", () => {
  it.each(["en", "fr"])(
    "does not treat any existing /%s top-level page as a restaurant slug",
    (locale) => {
      for (const segment of localizedRootPageSegments())
        expect(
          getStorefrontPreviewRewrite(
            "white-plate.vercel.app",
            `/${locale}/${segment}`,
            domains.pathBaseDomain
          ),
          `/${locale}/${segment} must stay on its existing application page`
        ).toBeNull()
    }
  )

  it.each(["en", "fr"])(
    "rewrites /%s/{slug} only on the configured shared host",
    (locale) => {
      expect(
        getStorefrontPreviewRewrite(
          "white-plate.vercel.app",
          `/${locale}/bistro`,
          domains.pathBaseDomain
        )
      ).toEqual({
        locale,
        restaurantSlug: "bistro",
        rewritePath: `/${locale}/storefront-preview/bistro`,
      })
    }
  )

  it.each(["en", "fr"])(
    "keeps /%s/{slug}/order/{id} under the same restaurant preview",
    (locale) => {
      const orderId = "11111111-1111-4111-8111-111111111111"

      expect(
        getStorefrontPreviewRewrite(
          "white-plate.vercel.app",
          `/${locale}/bistro/order/${orderId}`,
          domains.pathBaseDomain
        )
      ).toEqual({
        locale,
        restaurantSlug: "bistro",
        rewritePath: `/${locale}/storefront-preview/bistro/order/${orderId}`,
      })
    }
  )

  it.each([
    ["white-plate.vercel.app", "/en", null],
    ["white-plate.vercel.app", "/fr/-invalid", null],
    ["white-plate.vercel.app", "/de/bistro", null],
    ["white-plate.vercel.app", "/en/bistro/account", null],
    ["restaurant.whiteplate.test", "/en/bistro", null],
  ])(
    "does not alias reserved or unsupported route %s %s",
    (host, path, result) => {
      expect(
        getStorefrontPreviewRewrite(host, path, domains.pathBaseDomain)
      ).toBe(result)
    }
  )

  it("selects central API scope only for an explicit slug on the exact path host", () => {
    expect(
      resolvePublicStorefrontTarget("white-plate.vercel.app", "bistro", domains)
    ).toEqual({ kind: "path", restaurantSlug: "bistro" })
  })

  it("keeps the final host-based tenant route and rejects mismatched selectors", () => {
    expect(
      resolvePublicStorefrontTarget(
        "bistro.restaurants.whiteplate.test",
        undefined,
        domains
      )
    ).toEqual({ kind: "host", restaurantSlug: "bistro" })
    expect(
      resolvePublicStorefrontTarget(
        "bistro.restaurants.whiteplate.test",
        "bistro",
        domains
      )
    ).toEqual({ kind: "host", restaurantSlug: "bistro" })
    expect(
      resolvePublicStorefrontTarget(
        "bistro.restaurants.whiteplate.test",
        "other",
        domains
      )
    ).toBeNull()
  })

  it("requires a valid explicit selector on the path host", () => {
    expect(
      resolvePublicStorefrontTarget(
        "white-plate.vercel.app",
        undefined,
        domains
      )
    ).toBeNull()
    expect(
      resolvePublicStorefrontTarget(
        "white-plate.vercel.app",
        "../bistro",
        domains
      )
    ).toBeNull()
    expect(
      resolvePublicStorefrontTarget("attacker.test", "bistro", domains)
    ).toBeNull()
  })

  it("uses the central API for path previews and keeps tenant API routing for subdomains", () => {
    const configuration = {
      ...domains,
      apiTemplate: "https://{tenant}.restaurants.whiteplate.test",
      centralApiUrl: "https://api.whiteplate.test",
    }

    expect(
      createPublicStorefrontApiTarget(
        "white-plate.vercel.app",
        "bistro",
        configuration
      )
    ).toEqual({
      kind: "path",
      restaurantSlug: "bistro",
      apiBaseUrl: "https://api.whiteplate.test",
      apiPrefix: "/api/v1/public/restaurants/bistro",
    })
    expect(
      createPublicStorefrontApiTarget(
        "bistro.restaurants.whiteplate.test",
        undefined,
        configuration
      )
    ).toEqual({
      kind: "host",
      restaurantSlug: "bistro",
      apiBaseUrl: "https://bistro.restaurants.whiteplate.test",
      apiPrefix: "/api/v1",
    })
  })

  it("preserves existing query state when adding the public tenant selector", () => {
    expect(
      appendRestaurantSlugQuery("/api/public/establishment?locale=fr", "bistro")
    ).toBe("/api/public/establishment?locale=fr&restaurantSlug=bistro")
    expect(
      getRestaurantSlugSelector(
        "https://white-plate.vercel.app/?restaurantSlug=bistro"
      )
    ).toBe("bistro")
    expect(
      getRestaurantSlugSelector(
        "https://white-plate.vercel.app/?restaurantSlug=bistro&restaurantSlug=other"
      )
    ).toBeNull()
    expect(
      getRestaurantSlugSelector("https://bistro.whiteplate.test/")
    ).toBeUndefined()
  })

  it("keeps the selected slug and menu locale through checkout and tracking paths", () => {
    expect(getStorefrontMenuHref("bistro", "fr", "checkout")).toBe(
      "/bistro?menuLocale=fr&step=checkout"
    )
    expect(
      getStorefrontTrackingHref(
        "bistro",
        "11111111-1111-4111-8111-111111111111",
        "a".repeat(43)
      )
    ).toBe(
      `/bistro/order/11111111-1111-4111-8111-111111111111#${"a".repeat(43)}`
    )
  })
})
