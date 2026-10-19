"use client"

import { ShoppingBag } from "lucide-react"
import { Copy } from "@/components/shared/translated-copy"
import { useQuery } from "@tanstack/react-query"
import { useLocale, useTranslations } from "next-intl"
import { useSyncExternalStore } from "react"
import { LiveCustomerShell } from "./live-customer-shell"
import { CustomerTracking } from "./demo/tracking/customer-tracking"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Button } from "@/components/ui/lovable-button"
import { Link } from "@/i18n/navigation"
import {
  fetchPublicOrderTracking,
  PublicOrderTrackingError,
} from "@/lib/api/order-browser"
import { CustomerPickupLocation } from "./customer-pickup-location"
import { CurrentCollectionInformation } from "./current-collection-information"
import type { StoreTheme } from "@/types/lovable/storeTheme"
import type { CustomerOrder } from "@/types/lovable/customerOrder"
import type { StorefrontMenu } from "@/types/storefront"
import { customerMenu } from "@/lib/checkout/customer-presentation"
import { cartItemKey } from "@/lib/checkout/cart"
import { customerAddressLines } from "@/lib/collection-presentation"
import { getStorefrontMenuHref } from "@/lib/storefront-preview-routing"

function subscribeToHash(onChange: () => void) {
  window.addEventListener("hashchange", onChange)

  return () => window.removeEventListener("hashchange", onChange)
}

function readTrackingToken() {
  const token = window.location.hash.slice(1)

  return /^[A-Za-z0-9_-]{43}$/.test(token) ? token : ""
}

export function OrderTracking({
  orderId,
  name,
  theme,
  restaurantSlug,
  menu,
}: {
  orderId: string
  name: string
  theme: StoreTheme
  restaurantSlug?: string
  menu?: StorefrontMenu
}) {
  const text = useTranslations("OrderTracking")
  const checkout = useTranslations("Checkout")
  const redesign = useTranslations("Redesign")
  const locale = useLocale()
  const token = useSyncExternalStore(
    subscribeToHash,
    readTrackingToken,
    () => ""
  )
  const host = useSyncExternalStore(
    subscribeToHash,
    () => window.location.host,
    () => ""
  )
  const tracking = useQuery({
    queryKey: ["public-order-tracking", host, restaurantSlug, orderId, token],
    queryFn: ({ signal }) =>
      fetchPublicOrderTracking(orderId, token, signal, restaurantSlug),
    enabled: token.length > 0,
    refetchInterval: (query) =>
      ["Completed", "Cancelled"].includes(query.state.data?.status ?? "")
        ? false
        : 15_000,
    refetchIntervalInBackground: false,
    retry: false,
  })
  const order = tracking.data
  const menuHref = getStorefrontMenuHref(
    restaurantSlug,
    order?.menuLocale ?? locale
  )
  const menuAction = (
    <Link
      href={menuHref}
      locale={locale}
      className="flex items-center gap-2 text-sm"
    >
      <ShoppingBag size={16} />
      <Copy> Click & collect</Copy>
    </Link>
  )

  if (!token || tracking.isPending || tracking.error || !order)
    return (
      <LiveCustomerShell
        name={name}
        theme={theme}
        homeHref={menuHref}
        showCover
        headerActions={menuAction}
      >
        <h1 className="mb-6 text-3xl font-bold">{text("title")}</h1>

        {tracking.isPending && token ? (
          <p role="status">{text("loading")}</p>
        ) : (
          <Alert role="alert">
            <AlertDescription>
              {!token
                ? text("missingLink")
                : tracking.error instanceof PublicOrderTrackingError &&
                    tracking.error.code === "not_found"
                  ? text("notFound")
                  : text("unavailable")}
            </AlertDescription>
          </Alert>
        )}
      </LiveCustomerShell>
    )

  const summary = order.summary
  const products = menu
    ? customerMenu(menu, restaurantSlug).categories.flatMap(
        (category) => category.items
      )
    : []
  const presentation: CustomerOrder = {
    id: order.id,
    name: "",
    pickup: order.pickupAt ?? "As soon as possible",
    notes: "",
    createdAt: order.createdAt,
    lang: order.menuLocale ?? locale,
    subtotal: summary?.subtotal ?? 0,
    discount: summary?.discountAmount ?? 0,
    total: summary?.total ?? 0,
    lines:
      summary?.lines.map((line) => ({
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
          p: line.subtotal / line.quantity,
          images:
            products.find((product) => product.id === line.productId)?.images ??
            [],
          options: [],
        },
      })) ?? [],
  }
  const stage = ["Pending", "Preparing", "Ready", "Completed"].indexOf(
    order.status
  )
  const pickup = order.pickupAt
    ? new Intl.DateTimeFormat(locale, {
        hour: "2-digit",
        minute: "2-digit",
        timeZone: order.pickupTimeZone ?? undefined,
      }).format(new Date(order.pickupAt))
    : checkout("asapPickup")

  return (
    <div className="lovable-surface">
      <CustomerTracking
        t={{
          ...theme,
          address: menu?.establishment
            ? customerAddressLines(menu.establishment, locale).join(", ")
            : theme.address,
          phone: menu?.establishment?.phone ?? theme.phone,
        }}
        order={presentation}
        binding={{
          money: (value) =>
            summary?.currency === "EUR"
              ? `€${value.toFixed(2)}`
              : new Intl.NumberFormat(locale, {
                  style: "currency",
                  currency: summary?.currency ?? "EUR",
                }).format(value),
          stage,
          statusLabel: checkout(`status.${order.status}`),
          heading:
            order.status === "Cancelled"
              ? checkout("status.Cancelled")
              : text(`heading${order.status}`),
          description:
            order.status === "Cancelled"
              ? text("cancelledDescription")
              : order.status === "Preparing"
                ? text("descriptionPreparing")
                : redesign(`liveStageDescription${order.status}`),
          pickup,
          headerActions: menuAction,
          taxAmount: summary?.taxAmount,
          summary: summary ? undefined : (
            <aside className="customer-summary min-w-0 border-t pt-6">
              <h2 className="text-lg font-bold">{text("orderDetails")}</h2>

              <p className="mt-4 text-sm text-muted-foreground">
                {text("summaryUnavailable")}
              </p>

              <Button
                variant="outline"
                className="mt-6 w-full"
                disabled={tracking.isFetching}
                onClick={() => void tracking.refetch()}
              >
                {tracking.isFetching ? text("refreshing") : text("refresh")}
              </Button>
            </aside>
          ),
          location: (
            <CustomerPickupLocation name={name} orderId={order.id}>
              <CurrentCollectionInformation
                locale={order.menuLocale ?? locale}
                restaurantSlug={restaurantSlug}
                customer
                muted
              />
            </CustomerPickupLocation>
          ),
          actions: (
            <div className="mt-6 grid gap-3">
              <Button
                variant="outline"
                disabled={tracking.isFetching}
                onClick={() => void tracking.refetch()}
              >
                {tracking.isFetching ? text("refreshing") : text("refresh")}
              </Button>

              <Button asChild variant="outline">
                <Link href={menuHref} locale={locale}>
                  {text("backToMenu")}
                </Link>
              </Button>
            </div>
          ),
        }}
      />
    </div>
  )
}
