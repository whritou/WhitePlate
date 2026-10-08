"use client"

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

const orderStages = ["Pending", "Preparing", "Ready", "Completed"] as const

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
  const currentStage = order
    ? orderStages.indexOf(order.status as (typeof orderStages)[number])
    : -1

  return (
    <main className="mx-auto flex min-h-svh max-w-3xl items-center px-4 py-10 sm:px-6">
      <Card className="w-full gap-0 p-6 sm:p-9">
        <CardHeader className="px-0">
          <p className="text-sm font-medium text-primary">
            {t("clickCollect")}
          </p>

          <CardTitle>
            <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
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
                <ol
                  aria-label={t("progress")}
                  className="grid gap-0 sm:grid-cols-4 sm:gap-3"
                >
                  {orderStages.map((stage, index) => {
                    const complete = index < currentStage
                    const current = index === currentStage

                    return (
                      <li
                        key={stage}
                        aria-current={current ? "step" : undefined}
                        className="border-l-2 border-border py-2 pl-4 sm:border-t-2 sm:border-l-0 sm:py-4 sm:pl-0"
                      >
                        <p
                          className={
                            complete || current
                              ? "font-semibold text-foreground"
                              : "text-muted-foreground"
                          }
                        >
                          {checkout(`status.${stage}`)}
                        </p>

                        {current && (
                          <span className="mt-1 block text-sm text-primary">
                            {t("currentStatus")}
                          </span>
                        )}
                      </li>
                    )
                  })}
                </ol>
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
  )
}
