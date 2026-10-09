import { notFound } from "next/navigation"
import { getLocale } from "next-intl/server"
import { RestaurantMenu } from "@/components/storefront/restaurant-menu"
import { FixtureReady } from "../catalog-design-test/ready"

export const dynamic = "force-dynamic"

export default async function PhotoGuestFixture() {
  if (process.env.NODE_ENV !== "development") notFound()

  const locale = await getLocale()

  return (
    <>
      <FixtureReady />

      <RestaurantMenu
        step="shop"
        menu={{
          tenantId: "11111111-1111-4111-8111-111111111111",
          restaurantName: "Bistro Madeleine",
          restaurantDescription: null,
          currency: "EUR",
          locale,
          defaultLocale: "fr",
          availableLocales: ["fr", "en"],
          categories: [
            {
              id: "22222222-2222-4222-8222-222222222222",
              name: "Burgers",
              sortOrder: 0,
              products: [
                {
                  id: "22222222-2222-4222-8222-222222222222",
                  name: "Burger",
                  description: null,
                  basePrice: 18.5,
                  isAvailable: true,
                  photos: [
                    "33333333-3333-4333-8333-333333333333",
                    "44444444-4444-4444-8444-444444444444",
                  ].map((id) => ({ id, width: 640, height: 640, bytes: 4000 })),
                  optionGroups: [],
                },
              ],
            },
          ],
        }}
      />
    </>
  )
}
