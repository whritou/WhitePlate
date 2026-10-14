"use client"

import { Alert, AlertDescription } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Card, CardHeader, CardTitle } from "@/components/ui/card"
import { Link, useRouter } from "@/i18n/navigation"
import { buildOrdersHref } from "@/lib/orders/navigation"
import type { useOrderDashboard } from "@/hooks/use-order-dashboard"
import type {
  OrderDashboardContentViewProps,
  OrderDashboardProps,
} from "@/types/orders"
import { useTranslations } from "next-intl"
import { OrderKanban } from "./order-kanban"
import { OrderKanbanSkeleton } from "./order-kanban-skeleton"

export function OrderDashboardContent({
  props,
  dashboard,
  orders,
  filters,
  filtersActive,
}: {
  props: OrderDashboardProps
  dashboard: ReturnType<typeof useOrderDashboard>
} & OrderDashboardContentViewProps) {
  const t = useTranslations("KitchenOrders")
  const router = useRouter()
  const {
    page,
    loadError,
    isStale,
    isInitialLoading,
    message,
    pending,
    retry,
    updateStatus,
  } = dashboard

  return (
    <div className="grid gap-5">
      {loadError && (
        <Alert
          variant={isStale ? "warning" : "destructive"}
          role={isStale ? "status" : "alert"}
        >
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
        <Alert variant="destructive" role="alert">
          <AlertDescription>{t(message)}</AlertDescription>
        </Alert>
      )}

      {isInitialLoading ? (
        <OrderKanbanSkeleton />
      ) : (
        page && (
          <>
            {(page.items.length === 0 ||
              (filtersActive && orders.length === 0)) && (
              <Card className="border-dashed text-center">
                <CardHeader>
                  <CardTitle>
                    <h2>
                      {t(filtersActive ? "noFilterResults" : "emptyTitle")}
                    </h2>
                  </CardTitle>
                </CardHeader>
              </Card>
            )}

            {orders.length > 0 && (
              <OrderKanban
                orders={orders}
                role={props.role}
                locale={props.locale}
                serverTime={page.serverTime}
                pending={pending}
                onUpdate={updateStatus}
              />
            )}

            {page.nextCursor && (
              <div className="flex justify-center">
                <Button
                  variant="outline"
                  size="lg"
                  render={
                    <Link
                      href={buildOrdersHref(
                        props.tenantId,
                        props.selectedStatus,
                        page.nextCursor,
                        filters
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
    </div>
  )
}
