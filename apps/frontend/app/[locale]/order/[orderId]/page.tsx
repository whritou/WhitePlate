import { OrderTracking } from "@/components/storefront/order-tracking"
import { isUuid } from "@/lib/checkout/cart"
import { getTranslations } from "next-intl/server"
import { headers } from "next/headers"
import { notFound } from "next/navigation"
import { getPublicMenu, getPublicTheme } from "@/lib/api/public-storefront"
import { publishedStoreTheme } from "@/lib/lovable/storeTheme"

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; orderId: string }>
}) {
  const [{ locale }, requestHeaders, t] = await Promise.all([
    params,
    headers(),
    getTranslations("OrderTracking"),
  ])
  const [menu, publication] = await Promise.all([
    getPublicMenu(requestHeaders.get("host"), locale),
    getPublicTheme(requestHeaders.get("host")),
  ])
  const restaurantName = menu.kind === "menu" ? menu.menu.restaurantName : null

  return {
    title: restaurantName ? `${restaurantName} · ${t("title")}` : t("title"),
    icons: {
      icon: [
        {
          url: publication?.hasFavicon
            ? `/api/public/brand-assets/favicon?v=${publication.version}`
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
  params: Promise<{ locale: string; orderId: string }>
}) {
  const { locale, orderId } = await params

  if (!isUuid(orderId)) notFound()

  const requestHeaders = await headers()
  const [menu, publication] = await Promise.all([
    getPublicMenu(requestHeaders.get("host"), locale),
    getPublicTheme(requestHeaders.get("host")),
  ])
  const restaurantName =
    menu.kind === "menu" ? menu.menu.restaurantName : "WhitePlate"

  return (
    <OrderTracking
      orderId={orderId}
      name={restaurantName}
      menu={menu.kind === "menu" ? menu.menu : undefined}
      theme={publishedStoreTheme(restaurantName, publication)}
    />
  )
}
