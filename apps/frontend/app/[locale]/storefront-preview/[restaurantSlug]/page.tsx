import { RestaurantMenu } from "@/components/storefront/restaurant-menu"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { getPublicMenu, getPublicTheme } from "@/lib/api/public-storefront"
import { publishedStoreTheme } from "@/lib/lovable/storeTheme"
import {
  appendRestaurantSlugQuery,
  isRestaurantSlug,
} from "@/lib/storefront-preview-routing"
import { getTranslations } from "next-intl/server"
import { headers } from "next/headers"
import { notFound } from "next/navigation"

export async function generateMetadata({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string; restaurantSlug: string }>
  searchParams: Promise<{ menuLocale?: string }>
}) {
  const [{ locale, restaurantSlug }, query, requestHeaders, t] =
    await Promise.all([
      params,
      searchParams,
      headers(),
      getTranslations("HomePage"),
    ])

  if (!isSupportedLocale(locale) || !isRestaurantSlug(restaurantSlug))
    return { title: t("title"), description: t("description") }

  const [storefront, publication] = await Promise.all([
    getPublicMenu(requestHeaders.get("host"), query.menuLocale, restaurantSlug),
    getPublicTheme(requestHeaders.get("host"), restaurantSlug),
  ])

  return storefront.kind === "menu"
    ? {
        title: storefront.menu.restaurantName,
        icons: {
          icon: [
            {
              url: publication?.hasFavicon
                ? appendRestaurantSlugQuery(
                    `/api/public/brand-assets/favicon?v=${publication.version}`,
                    restaurantSlug
                  )
                : "/favicon.ico",
            },
          ],
        },
        description: t("storefrontDescription", {
          restaurant: storefront.menu.restaurantName,
        }),
      }
    : { title: t("title"), description: t("description") }
}

export default async function Page({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string; restaurantSlug: string }>
  searchParams: Promise<{ menuLocale?: string; step?: string }>
}) {
  const [{ locale, restaurantSlug }, query, requestHeaders] = await Promise.all(
    [params, searchParams, headers()]
  )

  if (!isSupportedLocale(locale) || !isRestaurantSlug(restaurantSlug))
    notFound()

  const [storefront, publication] = await Promise.all([
    getPublicMenu(requestHeaders.get("host"), query.menuLocale, restaurantSlug),
    getPublicTheme(requestHeaders.get("host"), restaurantSlug),
  ])

  if (storefront.kind === "menu")
    return (
      <RestaurantMenu
        key={storefront.menu.tenantId}
        menu={storefront.menu}
        theme={publishedStoreTheme(
          storefront.menu.restaurantName,
          publication,
          restaurantSlug
        )}
        step={query.step === "checkout" ? "checkout" : "shop"}
        restaurantSlug={restaurantSlug}
      />
    )

  const t = await getTranslations("Storefront")

  return (
    <main className="mx-auto flex min-h-svh max-w-3xl items-center px-5 py-16">
      <Alert variant="destructive" role="alert" className="w-full">
        <AlertDescription>{t("unavailable")}</AlertDescription>
      </Alert>
    </main>
  )
}

function isSupportedLocale(locale: string): locale is "en" | "fr" {
  return locale === "en" || locale === "fr"
}
