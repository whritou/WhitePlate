"use client"

import { Badge } from "@/components/ui/badge"
import { BackLink } from "@/components/organization/back-link"
import { useEffect, useMemo, useState } from "react"
import { useOrderDashboard } from "@/hooks/use-order-dashboard"
import { useRouter } from "@/i18n/navigation"
import { OrderStatusTabs } from "./order-status-tabs"
import { OrderDashboardContent } from "./order-dashboard-content"
import { OrderFilterToolbar } from "./order-filter-toolbar"
import { buildOrdersHref } from "@/lib/orders/navigation"
import { filterOrders } from "@/lib/orders/filter"
import type { OrderDashboardProps } from "@/types/orders"
import { useTranslations } from "next-intl"
import { OrderRealtimeConnection } from "./order-realtime-connection"

export function OrderDashboard(props: OrderDashboardProps) {
  const { tenantId, tenantName, role, selectedStatus, hubUrl } = props
  const t = useTranslations("KitchenOrders")
  const live = useTranslations("LiveWorkspace")
  const router = useRouter()
  const dashboard = useOrderDashboard(props)
  const { page, loadError, isInitialLoading, isFetching, refresh, pending } =
    dashboard
  const [search, setSearch] = useState(props.search ?? "")
  const [pickupModeFilter, setPickupModeFilter] = useState(
    props.pickupModeFilter ?? "all"
  )
  const filters = useMemo(
    () => ({ search, pickupMode: pickupModeFilter }),
    [pickupModeFilter, search]
  )
  const visibleOrders = useMemo(
    () => filterOrders(page?.items ?? [], search, pickupModeFilter),
    [page?.items, pickupModeFilter, search]
  )
  const filtersActive = search.trim().length > 0 || pickupModeFilter !== "all"

  useEffect(() => setSearch(props.search ?? ""), [props.search])

  useEffect(
    () => setPickupModeFilter(props.pickupModeFilter ?? "all"),
    [props.pickupModeFilter]
  )

  return (
    <div className="live-order-board grid gap-5">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <div className="mb-1 flex flex-wrap items-center gap-2">
            <p className="label-mono text-muted-foreground">{tenantName}</p>

            <Badge variant="outline">{t(`roles.${role}`)}</Badge>
          </div>

          <h1
            id="kitchen-orders-title"
            className="font-display text-4xl font-bold"
          >
            {t("title")}
          </h1>

          <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
            {t("description")}
          </p>
        </div>

        <div className="grid max-w-full grid-cols-3 border">
          {[
            [live("loadedOrders"), page?.items.length ?? "—"],
            [
              t("statuses.Pending"),
              page?.items.filter((item) => item.status === "Pending").length ??
                "—",
            ],
            [
              t("statuses.Ready"),
              page?.items.filter((item) => item.status === "Ready").length ??
                "—",
            ],
          ].map(([label, count], index) => (
            <div key={label} className={`px-5 py-3 ${index ? "border-l" : ""}`}>
              <p className="label-mono text-muted-foreground">{label}</p>

              <p className="font-display text-2xl font-bold">{count}</p>
            </div>
          ))}
        </div>

        <BackLink label={t("backToOrganizations")} className="self-start" />
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
          <OrderDashboardContent
            props={props}
            dashboard={dashboard}
            orders={visibleOrders}
            filters={filters}
            filtersActive={filtersActive}
          />
        ) : (
          <OrderStatusTabs
            selectedStatus={selectedStatus}
            disabled={pending !== null}
            onStatusChange={(status) =>
              router.push(buildOrdersHref(tenantId, status, null, filters))
            }
          >
            {page && (
              <OrderFilterToolbar
                search={search}
                pickupMode={pickupModeFilter}
                visibleCount={visibleOrders.length}
                loadedCount={page.items.length}
                onSearchChange={setSearch}
                onPickupModeChange={setPickupModeFilter}
                onClear={() => {
                  setSearch("")
                  setPickupModeFilter("all")
                  router.replace(
                    buildOrdersHref(tenantId, selectedStatus, props.cursor, {
                      search: "",
                      pickupMode: "all",
                    })
                  )
                }}
              />
            )}

            <OrderDashboardContent
              props={props}
              dashboard={dashboard}
              orders={visibleOrders}
              filters={filters}
              filtersActive={filtersActive}
            />
          </OrderStatusTabs>
        )}
      </section>
    </div>
  )
}
