import { OrderTracking } from "@/components/storefront/order-tracking"
import { isUuid } from "@/lib/checkout/cart"
import { getTranslations } from "next-intl/server"
import { notFound } from "next/navigation"

export async function generateMetadata() {
  const t = await getTranslations("OrderTracking")

  return { title: t("title"), robots: { index: false, follow: false } }
}

export default async function Page({
  params,
}: {
  params: Promise<{ locale: string; orderId: string }>
}) {
  const { orderId } = await params

  if (!isUuid(orderId)) notFound()

  return <OrderTracking orderId={orderId} />
}
