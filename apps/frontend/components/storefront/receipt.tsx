"use client"

import { Link } from "@/i18n/navigation"
import { Button } from "@/components/ui/lovable-button"
import { CustomerTracking } from "./demo/tracking/customer-tracking"
import { getStorefrontTrackingHref } from "@/lib/storefront-preview-routing"
import { DEFAULT_THEME } from "@/lib/lovable/storeTheme"
import type { StoreTheme } from "@/types/lovable/storeTheme"
import type { OrderReceipt } from "@/types/checkout"
import type { CustomerOrder } from "@/types/lovable/customerOrder"
import { useLocale, useTranslations } from "next-intl"
import { CustomerPickupLocation } from "./customer-pickup-location"
import { CurrentCollectionInformation } from "./current-collection-information"
import { photoUrl } from "@/lib/product-photos"
import { cartItemKey } from "@/lib/checkout/cart"

export function Receipt({
  receipt,
  trackingToken,
  restaurantSlug,
  restaurantPhone,
  theme = DEFAULT_THEME,
  name,
  products = [],
  notes = "",
}: {
  receipt: OrderReceipt
  trackingToken: string | null
  restaurantSlug?: string
  restaurantPhone?: string | null
  theme?: StoreTheme
  name?: string
  products?: import("@/types/storefront").Product[]
  notes?: string
}) {
  const text = useTranslations("Checkout")
  const locale = useLocale()
  const price = new Intl.NumberFormat(locale, {
    style: "currency",
    currency: receipt.currency,
  })
  const order: CustomerOrder = {
    id: receipt.id,
    name: receipt.customerName,
    pickup: receipt.pickupAt ?? "As soon as possible",
    notes,
    createdAt: receipt.createdAt,
    lang: receipt.menuLocale ?? locale,
    subtotal: receipt.subtotal,
    discount: receipt.discountAmount,
    total: receipt.total,
    lines: receipt.lines.map((line) => ({
      key: cartItemKey({
        productId: line.productId,
        optionIds: line.options.map((option) => option.optionId),
      }),
      qty: line.quantity,
      unit: line.subtotal / line.quantity,
      picks: line.options.map((option) => option.name),
      product: {
        id: line.productId,
        n: line.productName,
        d: "",
        p: line.baseUnitPrice,
        images:
          products
            .find((product) => product.id === line.productId)
            ?.photos?.flatMap((photo) => {
              const url = photoUrl(
                line.productId,
                photo.id,
                640,
                undefined,
                restaurantSlug
              )

              return url ? [url] : []
            }) ?? [],
        options: [],
      },
    })),
  }

  return (
    <CustomerTracking
      t={{ ...theme, phone: restaurantPhone ?? "" }}
      order={order}
      binding={{
        embedded: true,
        stage: ["Pending", "Preparing", "Ready", "Completed"].indexOf(
          receipt.status
        ),
        statusLabel: text(`status.${receipt.status}`),
        heading: text("orderConfirmed"),
        description: receipt.customerName,
        pickup: receipt.pickupAt
          ? new Intl.DateTimeFormat(locale, {
              hour: "2-digit",
              minute: "2-digit",
              timeZone: receipt.pickupTimeZone ?? undefined,
            }).format(new Date(receipt.pickupAt))
          : text("asapPickup"),
        taxAmount: receipt.taxAmount,
        money: (value) =>
          receipt.currency === "EUR"
            ? `€${value.toFixed(2)}`
            : price.format(value),
        headerActions: null,
        location: (
          <CustomerPickupLocation
            name={name ?? theme.name}
            orderId={receipt.id}
          >
            <CurrentCollectionInformation
              locale={receipt.menuLocale ?? locale}
              restaurantSlug={restaurantSlug}
              customer
              muted
            />
          </CustomerPickupLocation>
        ),
        actions: trackingToken ? (
          <Button asChild className="mt-6 w-full">
            <Link
              href={getStorefrontTrackingHref(
                restaurantSlug,
                receipt.id,
                trackingToken
              )}
              locale={locale}
              referrerPolicy="no-referrer"
            >
              {text("trackOrder")}
            </Link>
          </Button>
        ) : null,
      }}
    />
  )
}
