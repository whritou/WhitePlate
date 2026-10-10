import { getLocale, getTranslations } from "next-intl/server"
import { headers } from "next/headers"
import { redirect } from "next/navigation"
import { auth } from "@/lib/auth"
import { getRestaurantMemberships } from "@/services/orders"
import { restaurantShopUrl } from "@/lib/restaurant-shop-url"
import { Link } from "@/i18n/navigation"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"
import type { SearchParams } from "@/types/navigation"

export default async function ShopPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>
}) {
  const [locale, params, t] = await Promise.all([
    getLocale(),
    searchParams,
    getTranslations("LiveWorkspace"),
  ])
  const session = await auth.api.getSession({ headers: await headers() })

  if (!session) redirect(`/${locale}/sign-in`)
  if (!session.user.emailVerified) redirect(`/${locale}/verify-email`)

  const result = await getRestaurantMemberships()
  const restaurant = result.ok
    ? result.data?.find((item) => item.id === params.tenantId)
    : null
  const url = restaurantShopUrl(
    restaurant?.subdomain,
    process.env.STOREFRONT_BASE_DOMAIN,
    locale
  )

  if (restaurant && url) redirect(url)

  return (
    <main className="live-page grid gap-4">
      <h1 className="font-display text-3xl font-bold">{t("visitShop")}</h1>

      <Alert>
        <AlertDescription>
          {t(restaurant ? "shopUnavailable" : "unavailable")}
        </AlertDescription>
      </Alert>

      <Button
        variant="outline"
        nativeButton={false}
        role="link"
        render={
          <Link
            href={
              restaurant
                ? `/organization/${restaurant.role === "Kitchen" ? "orders" : "dashboard"}?tenantId=${restaurant.id}`
                : "/organization"
            }
          />
        }
      >
        {t("backToWorkspace")}
      </Button>
    </main>
  )
}
