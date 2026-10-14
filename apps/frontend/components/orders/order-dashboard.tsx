"use client"

import { Volume2, VolumeX } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { BackLink } from "@/components/organization/back-link"
import { useMemo, useState } from "react"
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
import { useKdsSound } from "@/hooks/use-kds-sound"

export function OrderDashboard(props: OrderDashboardProps) {
  const { tenantId, tenantName, role, selectedStatus, hubUrl } = props
  const t = useTranslations("KitchenOrders")
  const live = useTranslations("LiveWorkspace")
  const router = useRouter()
  const sound = useKdsSound()
  const dashboard = useOrderDashboard(props)
  const { page, loadError, isInitialLoading, isFetching, refresh, pending } =
    dashboard
  const propSearch = props.search ?? ""
  const propPickupMode = props.pickupModeFilter ?? "all"
  const [draftFilters, setDraftFilters] = useState({
    sourceSearch: propSearch,
    sourcePickupMode: propPickupMode,
    search: propSearch,
    pickupMode: propPickupMode,
  })
  const draftMatchesProps =
    draftFilters.sourceSearch === propSearch &&
    draftFilters.sourcePickupMode === propPickupMode
  const search = draftMatchesProps ? draftFilters.search : propSearch
  const pickupModeFilter = draftMatchesProps
    ? draftFilters.pickupMode
    : propPickupMode
  const filters = useMemo(
    () => ({ search, pickupMode: pickupModeFilter }),
    [pickupModeFilter, search]
  )
  const visibleOrders = useMemo(
    () => filterOrders(page?.items ?? [], search, pickupModeFilter),
    [page?.items, pickupModeFilter, search]
  )
  const filtersActive = search.trim().length > 0 || pickupModeFilter !== "all"

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

      <div className="flex flex-wrap items-center justify-between gap-3">
        <OrderRealtimeConnection
          tenantId={tenantId}
          hubUrl={
            loadError === "unauthorized" || loadError === "forbidden"
              ? null
              : hubUrl
          }
          orders={page?.items ?? []}
          serverTime={page?.serverTime ?? null}
          onNewOrder={sound.alertNewOrder}
          onRefresh={refresh}
        />

        <Button
          type="button"
          variant="outline"
          size="sm"
          className="min-h-11"
          aria-pressed={sound.state === "enabled"}
          onClick={() =>
            sound.state === "enabled" ? sound.mute() : void sound.enable()
          }
        >
          {sound.state === "enabled" ? (
            <Volume2 aria-hidden="true" />
          ) : (
            <VolumeX aria-hidden="true" />
          )}

          {t(sound.state === "enabled" ? "sound.mute" : "sound.enable")}
        </Button>
      </div>

      {sound.state === "unavailable" && (
        <p role="status" className="text-sm text-muted-foreground">
          {t("sound.unavailable")}
        </p>
      )}

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
                onSearchChange={(value) =>
                  setDraftFilters({
                    sourceSearch: propSearch,
                    sourcePickupMode: propPickupMode,
                    search: value,
                    pickupMode: pickupModeFilter,
                  })
                }
                onPickupModeChange={(value) =>
                  setDraftFilters({
                    sourceSearch: propSearch,
                    sourcePickupMode: propPickupMode,
                    search,
                    pickupMode: value,
                  })
                }
                onClear={() => {
                  setDraftFilters({
                    sourceSearch: propSearch,
                    sourcePickupMode: propPickupMode,
                    search: "",
                    pickupMode: "all",
                  })
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
