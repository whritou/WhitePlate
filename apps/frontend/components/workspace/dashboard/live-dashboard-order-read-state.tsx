"use client"

import { useTranslations } from "next-intl"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import type { OrderStatus } from "@/types/orders"

export function OrderReadState({
  isInitialLoading,
  isFetching,
  hasPage,
  loadError,
  isStale,
  onRetry,
}: {
  isInitialLoading: boolean
  isFetching: boolean
  hasPage: boolean
  loadError: string | null
  isStale: boolean
  onRetry: () => void
}) {
  const t = useTranslations("KitchenOrders")

  return (
    <>
      {(isInitialLoading || (isFetching && hasPage)) && (
        <p
          role="status"
          aria-live="polite"
          aria-atomic="true"
          className="min-h-5 text-sm text-muted-foreground"
        >
          {isInitialLoading ? t("loadingOrders") : t("refreshingOrders")}
        </p>
      )}

      {loadError && (
        <Alert
          variant={isStale ? "warning" : "destructive"}
          role={isStale ? "status" : "alert"}
        >
          <AlertDescription>
            {isStale ? t("stale") : t(`errors.${loadError}`)}

            <Button type="button" variant="link" onClick={onRetry}>
              {t("retry")}
            </Button>
          </AlertDescription>
        </Alert>
      )}
    </>
  )
}

export function statusIndicator(status: OrderStatus) {
  return {
    Pending: "bg-warning",
    Preparing: "bg-info",
    Ready: "bg-success",
    Completed: "bg-muted-foreground",
    Cancelled: "bg-destructive",
  }[status]
}

export function formatPickup(
  value: string | null | undefined,
  timeZone: string | null | undefined,
  locale: string
) {
  if (!value) return "—"

  const date = new Date(value)

  try {
    return new Intl.DateTimeFormat(locale, {
      hour: "2-digit",
      minute: "2-digit",
      ...(timeZone ? { timeZone } : {}),
    }).format(date)
  } catch {
    return new Intl.DateTimeFormat(locale, {
      hour: "2-digit",
      minute: "2-digit",
    }).format(date)
  }
}
