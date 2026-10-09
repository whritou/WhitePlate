"use client"

import { OperationalMetrics } from "@/components/redesign/operational-metrics"
import { Badge } from "@/components/ui/badge"
import { BackLink } from "@/components/organization/back-link"
import { useOrderDashboard } from "@/hooks/use-order-dashboard"
import { useRouter } from "@/i18n/navigation"
import { OrderStatusTabs } from "./order-status-tabs"
import { OrderDashboardContent } from "./order-dashboard-content"
import { buildOrdersHref } from "@/lib/orders/navigation"
import type { OrderDashboardProps } from "@/types/orders"
import { useTranslations } from "next-intl"
import { OrderRealtimeConnection } from "./order-realtime-connection"

export function OrderDashboard(props: OrderDashboardProps) {
  const { tenantId, tenantName, role, selectedStatus, hubUrl } = props
  const t = useTranslations("KitchenOrders")
  const design = useTranslations("Redesign")
  const router = useRouter()
  const dashboard = useOrderDashboard(props)
  const { page, loadError, isInitialLoading, isFetching, refresh, pending } =
    dashboard

  return (
    <div className="grid gap-5">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <div className="mb-1 flex flex-wrap items-center gap-2">
            <p className="text-sm font-medium text-brand-text">{tenantName}</p>

            <Badge variant="outline">{t(`roles.${role}`)}</Badge>
          </div>

          <h1
            id="kitchen-orders-title"
            className="text-2xl font-semibold tracking-tight sm:text-[2rem]"
          >
            {t("title")}
          </h1>

          <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
            {t("description")}
          </p>
        </div>

        <BackLink label={t("backToOrganizations")} className="self-start" />
      </header>

      <OperationalMetrics />

      <p className="text-xs text-muted-foreground">{design("metricsNotice")}</p>

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

      <p
        role="status"
        aria-live="polite"
        aria-atomic="true"
        className="min-h-5 text-sm text-muted-foreground"
      >
        {isInitialLoading
          ? t("loadingOrders")
          : isFetching && page
            ? t("refreshingOrders")
            : null}
      </p>

      <section
        aria-labelledby="kitchen-orders-title"
        aria-busy={isInitialLoading}
        className="grid gap-5"
      >
        {loadError === "forbidden" || loadError === "unauthorized" ? (
          <OrderDashboardContent props={props} dashboard={dashboard} />
        ) : (
          <OrderStatusTabs
            selectedStatus={selectedStatus}
            disabled={pending !== null}
            onStatusChange={(status) =>
              router.push(buildOrdersHref(tenantId, status, null))
            }
          >
            <OrderDashboardContent props={props} dashboard={dashboard} />
          </OrderStatusTabs>
        )}
      </section>
    </div>
  )
}
