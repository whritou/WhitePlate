import { expect, it, vi } from "vitest"
import RestaurantMenuLanguagesPage from "./page"

vi.mock("next-intl/server", () => ({ getLocale: async () => "fr" }))
vi.mock("next/navigation", () => ({
  redirect: (href: string) => {
    throw new Error(href)
  },
}))

it("migrates language bookmarks with tenant, repeated query parameters and interface locale intact", async () => {
  await expect(
    RestaurantMenuLanguagesPage({
      searchParams: Promise.resolve({
        tenantId: "11111111-1111-4111-8111-111111111111",
        locale: "de",
        filter: ["missing", "products"],
        view: "old",
      }),
    })
  ).rejects.toThrow(
    "/fr/organization/catalog?tenantId=11111111-1111-4111-8111-111111111111&locale=de&filter=missing&filter=products&view=translations"
  )
})
