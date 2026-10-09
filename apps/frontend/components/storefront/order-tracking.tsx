"use client"

import { CustomerShell } from "@/components/redesign/customer-shell"
import { TrackingProgress } from "@/components/redesign/tracking-progress"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Link } from "@/i18n/navigation"
import {
  fetchPublicOrderTracking,
  PublicOrderTrackingError,
} from "@/lib/api/order-browser"
import { useQuery } from "@tanstack/react-query"
import { useLocale, useTranslations } from "next-intl"
import { useSyncExternalStore } from "react"

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

export function OrderTracking({ orderId }: { orderId: string }) {
  const t = useTranslations("OrderTracking")
  const checkout = useTranslations("Checkout")
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
    queryKey: ["public-order-tracking", host, orderId],
    queryFn: ({ signal }) => fetchPublicOrderTracking(orderId, token, signal),
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

  return (
    <CustomerShell>
      <main className="mx-auto min-h-[60vh] max-w-7xl px-4 py-10 sm:px-8">
        <Card className="w-full gap-0 border-0 bg-transparent p-0 shadow-none">
          <CardHeader className="px-0">
            <p className="text-sm font-medium text-brand-text">
              {t("clickCollect")}
            </p>

            <CardTitle>
              <h1 className="max-w-3xl font-heading text-display-hero-mobile sm:text-display-hero">
                {t("title")}
              </h1>
            </CardTitle>

            <CardDescription className="mt-2 break-all">
              {t("reference", { id: orderId })}
            </CardDescription>
          </CardHeader>

          <CardContent className="px-0">
            {!token ? (
              <Alert role="alert" className="mt-6">
                <AlertDescription>{t("missingLink")}</AlertDescription>
              </Alert>
            ) : tracking.isPending ? (
              <p role="status" className="mt-6 text-sm text-muted-foreground">
                {t("loading")}
              </p>
            ) : tracking.error ? (
              <Alert variant="destructive" role="alert" className="mt-6">
                <AlertDescription>
                  {tracking.error instanceof PublicOrderTrackingError &&
                  tracking.error.code === "not_found"
                    ? t("notFound")
                    : t("unavailable")}
                </AlertDescription>
              </Alert>
            ) : order ? (
              <div className="mt-6 grid gap-6">
                {order.status === "Cancelled" ? (
                  <Alert variant="destructive" role="status">
                    <AlertDescription>
                      {checkout("status.Cancelled")}
                    </AlertDescription>
                  </Alert>
                ) : (
                  <TrackingProgress
                    status={order.status}
                    illustrative={false}
                  />
                )}

                <p aria-live="polite" className="text-sm text-muted-foreground">
                  {t("placedAt", {
                    date: new Intl.DateTimeFormat(locale, {
                      dateStyle: "medium",
                      timeStyle: "short",
                    }).format(new Date(order.createdAt)),
                  })}
                </p>

                <div className="flex flex-wrap gap-3">
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
                    render={<Link href="/" locale={locale} />}
                  >
                    {t("backToMenu")}
                  </Button>
                </div>
              </div>
            ) : null}
          </CardContent>
        </Card>
      </main>
    </CustomerShell>
  )
}
