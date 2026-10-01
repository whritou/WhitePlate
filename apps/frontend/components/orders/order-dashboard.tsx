"use client"

import { Alert, AlertDescription } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { useOrderDashboard } from "@/hooks/use-order-dashboard"
import { Link, useRouter } from "@/i18n/navigation"
import { ORDER_STATUSES } from "@/lib/order-dashboard"
import { buildOrdersHref } from "@/lib/orders/navigation"
import type { OrderDashboardProps } from "@/types/orders"
import { useTranslations } from "next-intl"
import { OrderRealtimeConnection } from "./order-realtime-connection"
import { OrderTicket } from "./order-ticket"

export function OrderDashboard(props: OrderDashboardProps) {
  const { tenantId, tenantName, role, locale, selectedStatus, hubUrl } = props
  const t = useTranslations("KitchenOrders")
  const router = useRouter()
  const {
    page,
    loadError,
    isStale,
    pending,
    message,
    refresh,
    retry,
    updateStatus,
  } = useOrderDashboard(props)

  return (
    <section aria-labelledby="kitchen-orders-title" className="grid gap-5">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="mb-1 text-sm font-medium text-primary">{tenantName}</p>

          <h1
            id="kitchen-orders-title"
            className="text-3xl font-semibold tracking-tight"
          >
            {t("title")}
          </h1>

          <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
            {t("description")}
          </p>
        </div>

        <Link
          href="/organization"
          className="text-sm font-medium text-primary hover:underline"
        >
          {t("backToOrganizations")}
        </Link>
      </header>

      <OrderRealtimeConnection
        tenantId={tenantId}
        hubUrl={
          loadError === "unauthorized" || loadError === "forbidden"
            ? null
            : hubUrl
        }
        orders={page?.items ?? []}
        onRefresh={refresh}
      />

      <nav aria-label={t("filterLabel")} className="flex flex-wrap gap-2">
        {[null, ...ORDER_STATUSES].map((status) => (
          <Button
            key={status ?? "all"}
            variant={selectedStatus === status ? "default" : "outline"}
            size="lg"
            render={
              <Link
                href={buildOrdersHref(tenantId, status, null)}
                aria-current={selectedStatus === status ? "page" : undefined}
              />
            }
          >
            {status === null ? t("statuses.all") : t(`statuses.${status}`)}
          </Button>
        ))}
      </nav>

      {loadError && (
        <Alert variant="destructive" role={isStale ? "status" : "alert"}>
          <AlertDescription>
            {isStale ? t("stale") : t(`errors.${loadError}`)}

            <Button
              variant="link"
              onClick={() =>
                loadError === "invalid" ? router.refresh() : void retry()
              }
            >
              {t("retry")}
            </Button>
          </AlertDescription>
        </Alert>
      )}

      {message && (
        <Alert role="status" aria-live="polite">
          <AlertDescription>{t(message)}</AlertDescription>
        </Alert>
      )}

      {page?.items.length === 0 ? (
        <Card className="rounded-2xl border border-dashed px-6 py-12 text-center">
          <CardHeader className="px-0">
            <CardTitle className="text-xl font-semibold">
              <h2>{t("emptyTitle")}</h2>
            </CardTitle>

            <CardDescription className="text-sm">
              {t("emptyDescription")}
            </CardDescription>
          </CardHeader>
        </Card>
      ) : (
        page && (
          <>
            <ol className="grid gap-3">
              {page.items.map((order) => (
                <li key={order.id}>
                  <OrderTicket
                    order={order}
                    role={role}
                    locale={locale}
                    pending={pending}
                    onUpdate={updateStatus}
                  />
                </li>
              ))}
            </ol>

            {page.nextCursor && (
              <div className="flex justify-center">
                <Button
                  variant="outline"
                  size="lg"
                  render={
                    <Link
                      href={buildOrdersHref(
                        tenantId,
                        selectedStatus,
                        page.nextCursor
                      )}
                    />
                  }
                >
                  {t("loadOlder")}
                </Button>
              </div>
            )}
          </>
        )
      )}
    </section>
  )
}
