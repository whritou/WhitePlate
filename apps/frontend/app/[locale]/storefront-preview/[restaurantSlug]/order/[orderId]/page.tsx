import { OrderTracking } from "@/components/storefront/order-tracking"
import { isUuid } from "@/lib/checkout/cart"
import { getPublicMenu, getPublicTheme } from "@/lib/api/public-storefront"
import { publishedStoreTheme } from "@/lib/lovable/storeTheme"
import { isRestaurantSlug } from "@/lib/storefront-preview-routing"
import { getTranslations } from "next-intl/server"
import { headers } from "next/headers"
import { notFound } from "next/navigation"

export async function generateMetadata({
  params,
}: {
  params: Promise<{
    locale: string
    restaurantSlug: string
    orderId: string
  }>
}) {
  const [{ locale, restaurantSlug }, requestHeaders, t] = await Promise.all([
    params,
    headers(),
    getTranslations("OrderTracking"),
  ])

  if (!isSupportedLocale(locale) || !isRestaurantSlug(restaurantSlug))
    return { title: t("title"), robots: { index: false, follow: false } }

  const [menu, publication] = await Promise.all([
    getPublicMenu(requestHeaders.get("host"), locale, restaurantSlug),
    getPublicTheme(requestHeaders.get("host"), restaurantSlug),
  ])
  const restaurantName = menu.kind === "menu" ? menu.menu.restaurantName : null

  return {
    title: restaurantName ? `${restaurantName} · ${t("title")}` : t("title"),
    icons: {
      icon: [
        {
          url: publication?.hasFavicon
            ? `/api/public/brand-assets/favicon?v=${publication.version}&restaurantSlug=${encodeURIComponent(restaurantSlug)}`
            : "/favicon.ico",
        },
      ],
    },
    robots: { index: false, follow: false },
  }
}

export default async function Page({
  params,
}: {
  params: Promise<{
    locale: string
    restaurantSlug: string
    orderId: string
  }>
}) {
  const { locale, restaurantSlug, orderId } = await params

  if (
    !isSupportedLocale(locale) ||
    !isRestaurantSlug(restaurantSlug) ||
    !isUuid(orderId)
  )
    notFound()

  const requestHeaders = await headers()
  const [menu, publication] = await Promise.all([
    getPublicMenu(requestHeaders.get("host"), locale, restaurantSlug),
    getPublicTheme(requestHeaders.get("host"), restaurantSlug),
  ])

  if (menu.kind !== "menu") notFound()

  return (
    <OrderTracking
      orderId={orderId}
      name={menu.menu.restaurantName}
      menu={menu.menu}
      theme={publishedStoreTheme(
        menu.menu.restaurantName,
        publication,
        restaurantSlug
      )}
      restaurantSlug={restaurantSlug}
    />
  )
}

function isSupportedLocale(locale: string): locale is "en" | "fr" {
  return locale === "en" || locale === "fr"
}
