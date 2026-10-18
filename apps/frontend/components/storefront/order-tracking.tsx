"use client"

import { Clock3, MapPin } from "lucide-react"
import { useQuery } from "@tanstack/react-query"
import { useLocale, useTranslations } from "next-intl"
import { useSyncExternalStore } from "react"
import { LiveCustomerShell as CustomerShell } from "./live-customer-shell"
import { LiveTrackingProgress as TrackingProgress } from "./live-tracking-progress"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Link } from "@/i18n/navigation"
import {
  fetchPublicOrderTracking,
  PublicOrderTrackingError,
} from "@/lib/api/order-browser"
import { CurrentCollectionInformation } from "./current-collection-information"
import type { StoreTheme } from "@/types/lovable/storeTheme"
import { getStorefrontMenuHref } from "@/lib/storefront-preview-routing"

function subscribeToHash(onChange: () => void) {
  window.addEventListener("hashchange", onChange)

  return () => window.removeEventListener("hashchange", onChange)
}

function readTrackingToken() {
  const token = window.location.hash.slice(1)

  return /^[A-Za-z0-9_-]{43}$/.test(token) ? token : ""
}

function readRestaurantHost() {
  return window.location.host
}

export function OrderTracking({
  orderId,
  name,
  theme,
  restaurantSlug,
}: {
  orderId: string
  name: string
  theme: StoreTheme
  restaurantSlug?: string
}) {
  const t = useTranslations("OrderTracking")
  const checkout = useTranslations("Checkout")
  const collection = useTranslations("CollectionInformation")
  const locale = useLocale()
  const token = useSyncExternalStore(
    subscribeToHash,
    readTrackingToken,
    () => ""
  )
  const host = useSyncExternalStore(
    subscribeToHash,
    readRestaurantHost,
    () => ""
  )

  const tracking = useQuery({
    queryKey: ["public-order-tracking", host, restaurantSlug, orderId],
    queryFn: ({ signal }) =>
      fetchPublicOrderTracking(orderId, token, signal, restaurantSlug),
    enabled: token.length > 0,
    refetchInterval: (query) =>
      query.state.data?.status === "Completed" ||
      query.state.data?.status === "Cancelled"
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

  return (
    <CustomerShell
      name={name}
      theme={theme}
      restaurantSlug={restaurantSlug}
      homeHref={menuHref}
      showCover
      headerActions={
        <Button
          type="button"
          variant="ghost"
          nativeButton={false}
          render={<Link href={menuHref} locale={locale} />}
        >
          {t("backToMenu")}
        </Button>
      }
    >
      <main className="customer-shell-content mx-auto min-h-[60vh] max-w-5xl px-5 py-8">
        <header className="mb-8">
          <p className="mb-2 text-sm font-semibold text-primary">
            {t("clickCollect")}
          </p>

          <h1 className="font-display text-3xl font-bold sm:text-4xl">
            {t("title")}
          </h1>

          <p className="mt-2 text-sm break-all text-muted-foreground">
            {t("reference", { id: orderId })}
          </p>
        </header>

        {!token ? (
          <Alert role="alert">
            <AlertDescription>{t("missingLink")}</AlertDescription>
          </Alert>
        ) : tracking.isPending ? (
          <p role="status" className="text-sm text-muted-foreground">
            {t("loading")}
          </p>
        ) : tracking.error ? (
          <Alert variant="destructive" role="alert">
            <AlertDescription>
              {tracking.error instanceof PublicOrderTrackingError &&
              tracking.error.code === "not_found"
                ? t("notFound")
                : t("unavailable")}
            </AlertDescription>
          </Alert>
        ) : order ? (
          <div className="customer-two-column grid min-w-0 items-start gap-10">
            <div className="grid min-w-0 gap-8">
              {order.status === "Cancelled" ? (
                <Alert variant="destructive" role="status">
                  <AlertDescription>
                    {checkout("status.Cancelled")}
                  </AlertDescription>
                </Alert>
              ) : (
                <TrackingProgress status={order.status} />
              )}

              {order.pickupAt && (
                <section className="customer-rounded flex items-center gap-4 border px-5 py-4">
                  <Clock3 size={22} className="shrink-0 text-primary" />

                  <div>
                    <p className="text-xs text-muted-foreground">
                      {checkout("pickupTime")}
                    </p>

                    <p className="mt-1 text-lg font-bold">
                      {checkout("pickupAt", {
                        time: new Intl.DateTimeFormat(locale, {
                          year: "numeric",
                          month: "short",
                          day: "numeric",
                          hour: "numeric",
                          minute: "2-digit",
                          timeZone: order.pickupTimeZone ?? undefined,
                          timeZoneName: "shortOffset",
                        }).format(new Date(order.pickupAt)),
                      })}
                    </p>
                  </div>
                </section>
              )}

              <section className="border-t pt-6">
                <h2 className="flex items-center gap-2 text-lg font-bold">
                  <MapPin size={20} className="text-primary" />

                  {collection("title")}
                </h2>

                <CurrentCollectionInformation
                  locale={order.menuLocale ?? locale}
                  restaurantSlug={restaurantSlug}
                />
              </section>
            </div>

            <aside className="customer-summary min-w-0 border-t pt-6">
              <Card className="customer-rounded gap-0">
                <CardHeader>
                  <CardTitle>{t("orderDetails")}</CardTitle>
                </CardHeader>

                <CardContent className="grid gap-5">
                  <dl className="grid gap-4 text-sm">
                    <div>
                      <dt className="text-muted-foreground">
                        {t("currentStatus")}
                      </dt>

                      <dd className="mt-1 font-semibold">
                        {checkout(`status.${order.status}`)}
                      </dd>
                    </div>

                    <div>
                      <dt className="text-muted-foreground">
                        {checkout("orderReference", { id: order.id })}
                      </dt>

                      <dd className="mt-1 font-semibold break-all">
                        {order.id}
                      </dd>
                    </div>

                    <div>
                      <dt className="text-muted-foreground">
                        {t("placedAt", {
                          date: new Intl.DateTimeFormat(locale, {
                            dateStyle: "medium",
                            timeStyle: "short",
                          }).format(new Date(order.createdAt)),
                        })}
                      </dt>
                    </div>
                  </dl>

                  <div className="grid gap-3 border-t pt-5">
                    <Button
                      type="button"
                      variant="outline"
                      disabled={tracking.isFetching}
                      onClick={() => void tracking.refetch()}
                    >
                      {tracking.isFetching ? t("refreshing") : t("refresh")}
                    </Button>

                    <Button
                      type="button"
                      nativeButton={false}
                      render={<Link href={menuHref} locale={locale} />}
                    >
                      {t("backToMenu")}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </aside>
          </div>
        ) : null}
      </main>
    </CustomerShell>
  )
}
