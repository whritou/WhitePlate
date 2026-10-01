"use client"

import { useCallback, useEffect, useMemo, useState, useSyncExternalStore } from "react"
import { useTranslations } from "next-intl"
import { useRouter } from "@/i18n/navigation"
import { Link } from "@/i18n/navigation"
import {
  getAvailableOrderTransitions,
  OrderEventTracker,
  ORDER_STATUSES,
  type OrderPage,
  type OrderStatus,
  type UpdateableOrderStatus,
} from "../../../../lib/order-dashboard"
import { updateOrderStatusAction } from "../../../../lib/order-actions"
import {
  attachOrderRealtime,
  createOrderHubConnection,
  createOrderRefreshCoalescer,
  type OrderRealtimeStatus,
} from "./order-realtime"

type OrderLoadError = "forbidden" | "invalid" | "unavailable"

type OrderDashboardProps = {
  tenantId: string
  tenantName: string
  role: string
  locale: string
  selectedStatus: OrderStatus | null
  cursor: string | null
  page: OrderPage | null
  loadError: OrderLoadError | null
  hubUrl: string | null
}

export function OrderDashboard(props: OrderDashboardProps) {
  const {
    tenantId,
    tenantName,
    role,
    locale,
    selectedStatus,
    cursor,
    page,
    loadError,
    hubUrl,
  } = props
  const t = useTranslations("KitchenOrders")
  const router = useRouter()
  const viewKey = `${locale}:${tenantId}:${selectedStatus ?? "all"}:${cursor ?? "first"}`
  const pageCache = useMemo(() => createOrderPageCache(), [])
  const subscribeToPageCache = useCallback(
    (listener: () => void) => pageCache.subscribe(listener),
    [pageCache]
  )
  const getCachedPage = useCallback(() => pageCache.getSnapshot(), [pageCache])
  const cachedSnapshot = useSyncExternalStore(subscribeToPageCache, getCachedPage, () => null)
  const [pending, setPending] = useState<{ orderId: string; status: UpdateableOrderStatus } | null>(null)
  const [actionMessage, setActionMessage] = useState<string | null>(null)
  const currentPage = page ?? (loadError !== "invalid" && cachedSnapshot?.viewKey === viewKey ? cachedSnapshot.page : null)
  const isStale = loadError !== null && loadError !== "invalid" && currentPage !== null

  useEffect(() => {
    if (page) pageCache.setSnapshot({ viewKey, page })
  }, [page, pageCache, viewKey])

  async function updateStatus(orderId: string, version: number, status: UpdateableOrderStatus) {
    if (pending) return
    setPending({ orderId, status })
    setActionMessage(null)
    try {
      const result = await updateOrderStatusAction({ tenantId, orderId, version, status })
      if (!result.ok) {
        if (result.error === "unauthorized") {
          router.push("/sign-in")
          return
        }
        setActionMessage(t(`errors.${result.error}`))
        if (result.error === "conflict") router.refresh()
        return
      }
      setActionMessage(t("statusSaved"))
      router.refresh()
    } catch {
      setActionMessage(t("errors.unavailable"))
    } finally {
      setPending(null)
    }
  }

  const statuses: Array<OrderStatus | null> = [null, ...ORDER_STATUSES]
  const orders = currentPage?.items ?? []

  return (
    <section aria-labelledby="kitchen-orders-title" className="grid gap-5">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="mb-1 text-sm font-medium text-primary">{tenantName}</p>
          <h1 id="kitchen-orders-title" className="text-3xl font-semibold tracking-tight">
            {t("title")}
          </h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
            {t("description")}
          </p>
        </div>
        <Link href="/organization" className="text-sm font-medium text-primary underline-offset-4 hover:underline">
          {t("backToOrganizations")}
        </Link>
      </header>

      <OrderRealtimeConnection
        key={tenantId}
        tenantId={tenantId}
        hubUrl={hubUrl}
        orders={orders}
      />

      <nav aria-label={t("filterLabel")} className="flex flex-wrap gap-2">
        {statuses.map((status) => {
          const href = buildOrdersHref(tenantId, status, null)
          const isSelected = selectedStatus === status
          return (
            <Link
              key={status ?? "all"}
              href={href}
              aria-current={isSelected ? "page" : undefined}
              className={`inline-flex min-h-10 items-center rounded-full border px-4 text-sm font-medium transition-colors ${isSelected ? "border-primary bg-primary text-primary-foreground" : "border-border bg-card hover:bg-muted"}`}
            >
              {status === null ? t("statuses.all") : t(`statuses.${status}`)}
            </Link>
          )
        })}
      </nav>

      {loadError && (
        <div role={isStale ? "status" : "alert"} className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">
          <span>{isStale ? t("stale") : t(`errors.${loadError}`)}</span>
          <button type="button" onClick={() => router.refresh()} className="font-semibold underline underline-offset-4">
            {t("retry")}
          </button>
        </div>
      )}

      {actionMessage && (
        <p role="status" aria-live="polite" className="rounded-lg border border-border bg-card p-3 text-sm">
          {actionMessage}
        </p>
      )}

      {currentPage && currentPage.items.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border bg-card px-6 py-12 text-center">
          <h2 className="text-xl font-semibold">{t("emptyTitle")}</h2>
          <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-muted-foreground">
            {t("emptyDescription")}
          </p>
        </div>
      ) : currentPage ? (
        <>
          <ol className="grid gap-3">
            {currentPage.items.map((order) => {
              const transitions = getAvailableOrderTransitions(role, order.status)
              const formattedTotal = formatCurrency(locale, order.total, order.currency)
              const formattedDate = formatDate(locale, order.createdAt)
              return (
                <li key={order.id}>
                  <article className="rounded-2xl border border-border bg-card p-5 shadow-sm">
                    <div className="flex flex-wrap items-start justify-between gap-4">
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <h2 className="font-semibold">{t("orderReference", { reference: order.id.slice(0, 8) })}</h2>
                          <span className="rounded-full bg-muted px-2.5 py-1 text-xs font-medium">
                            {t(`statuses.${order.status}`)}
                          </span>
                        </div>
                        <p className="mt-1 text-sm text-muted-foreground">
                          {order.customerName} <span aria-hidden="true">·</span> <time dateTime={order.createdAt}>{formattedDate}</time>
                        </p>
                      </div>
                      <p className="text-right text-sm font-semibold">{formattedTotal}</p>
                    </div>

                    <ul className="mt-4 grid gap-3 border-t border-border pt-4">
                      {order.lines.map((line) => (
                        <li key={line.productId} className="text-sm">
                          <p className="font-medium">{t("lineItem", { quantity: line.quantity, product: line.productName })}</p>
                          {line.options.length > 0 && (
                            <ul className="mt-1 ml-5 list-disc text-muted-foreground">
                              {line.options.map((option) => <li key={option.optionId}>{option.name}</li>)}
                            </ul>
                          )}
                        </li>
                      ))}
                    </ul>

                    {transitions.length > 0 && (
                      <div className="mt-5 flex flex-wrap gap-2 border-t border-border pt-4">
                        {transitions.map((status) => (
                          <button
                            key={status}
                            type="button"
                            disabled={pending !== null}
                            onClick={() => void updateStatus(order.id, order.version, status)}
                            className="inline-flex min-h-10 items-center rounded-lg bg-primary px-4 text-sm font-medium text-primary-foreground disabled:cursor-not-allowed disabled:opacity-60"
                          >
                            {pending?.orderId === order.id && pending.status === status
                              ? t("updating")
                              : t(`actions.${status}`)}
                          </button>
                        ))}
                      </div>
                    )}
                  </article>
                </li>
              )
            })}
          </ol>

          {currentPage.nextCursor && (
            <div className="flex justify-center">
              <Link
                href={buildOrdersHref(tenantId, selectedStatus, currentPage.nextCursor)}
                className="inline-flex min-h-10 items-center rounded-lg border border-border bg-card px-4 text-sm font-medium hover:bg-muted"
              >
                {t("loadOlder")}
              </Link>
            </div>
          )}
        </>
      ) : null}
    </section>
  )
}

function OrderRealtimeConnection({
  tenantId,
  hubUrl,
  orders,
}: {
  tenantId: string
  hubUrl: string | null
  orders: OrderPage["items"]
}) {
  const t = useTranslations("KitchenOrders")
  const router = useRouter()
  const [status, setStatus] = useState<OrderRealtimeStatus>("connecting")
  const tracker = useMemo(() => new OrderEventTracker(tenantId), [tenantId])

  useEffect(() => {
    tracker.observeOrders(orders)
  }, [orders, tracker])

  useEffect(() => {
    if (!hubUrl) return
    const refreshCoalescer = createOrderRefreshCoalescer(() => router.refresh())
    let stop: (() => Promise<void>) | null = null
    let disposed = false
    void Promise.resolve().then(() => {
      if (disposed) return
      try {
        const connection = createOrderHubConnection(hubUrl)
        stop = attachOrderRealtime(connection, tenantId, tracker, {
          onStatus: setStatus,
          onRefresh: refreshCoalescer.schedule,
        })
      } catch {
        if (!disposed) setStatus("offline")
      }
    })

    return () => {
      disposed = true
      refreshCoalescer.cancel()
      if (stop) void stop()
    }
  }, [hubUrl, router, tenantId, tracker])

  const visibleStatus = hubUrl ? status : "offline"
  const stateLabel = {
    connecting: t("connection.connecting"),
    connected: t("connection.connected"),
    reconnecting: t("connection.reconnecting"),
    offline: t("connection.offline"),
  }[visibleStatus]

  return (
    <p role="status" aria-live="polite" className="flex items-center gap-2 text-sm text-muted-foreground">
      <span aria-hidden="true" className={`size-2 rounded-full ${visibleStatus === "connected" ? "bg-emerald-500" : visibleStatus === "reconnecting" ? "bg-amber-500" : "bg-muted-foreground/50"}`} />
      {stateLabel}
    </p>
  )
}

function createOrderPageCache() {
  let snapshot: { viewKey: string; page: OrderPage } | null = null
  const listeners = new Set<() => void>()
  return {
    getSnapshot: () => snapshot,
    setSnapshot: (value: { viewKey: string; page: OrderPage }) => {
      if (snapshot?.viewKey === value.viewKey && snapshot.page === value.page) return
      snapshot = value
      for (const listener of listeners) listener()
    },
    subscribe: (listener: () => void) => {
      listeners.add(listener)
      return () => listeners.delete(listener)
    },
  }
}

function buildOrdersHref(tenantId: string, status: OrderStatus | null, cursor: string | null): string {
  const query = new URLSearchParams({ tenantId })
  if (status) query.set("status", status)
  if (cursor) query.set("cursor", cursor)
  return `/organization/orders?${query.toString()}`
}

function formatCurrency(locale: string, amount: number, currency: string): string {
  try {
    return new Intl.NumberFormat(locale, { style: "currency", currency }).format(amount)
  } catch {
    return `${amount.toFixed(2)} ${currency}`
  }
}

function formatDate(locale: string, value: string): string {
  return new Intl.DateTimeFormat(locale, { dateStyle: "short", timeStyle: "short" }).format(new Date(value))
}
