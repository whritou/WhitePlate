"use client"

import { useState } from "react"
import { useLocale, useTranslations } from "next-intl"
import {
  Sandwich,
  Check,
  Clock,
  CookingPot,
  ExternalLink,
  LayoutDashboard,
  Palette,
  Pause,
  Printer,
  ReceiptText,
  Settings2,
  UtensilsCrossed,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Brand } from "@/components/ui/brand"
import { Link } from "@/i18n/navigation"
import { OperationalMetrics } from "./operational-metrics"
import { OperationalInsights } from "./operational-insights"
import { MarketingHeader } from "@/components/marketing/marketing-header"

export function DemoDashboard() {
  const t = useTranslations("Redesign")
  const locale = useLocale()
  const price = new Intl.NumberFormat(locale, {
    style: "currency",
    currency: "USD",
  })
  const [paused, setPaused] = useState(false)
  const [rush, setRush] = useState(false)
  const [filter, setFilter] = useState("All")
  const [message, setMessage] = useState("")
  const [orders, setOrders] = useState([
    {
      id: "1049",
      name: "Marc D.",
      status: "Pending",
      items: "demoOrderOne",
      total: 22.5,
    },
    {
      id: "1048",
      name: "Sarah J.",
      status: "Preparing",
      items: "demoOrderTwo",
      total: 48.2,
    },
    {
      id: "1047",
      name: "Dave W.",
      status: "Preparing",
      items: "demoOrderThree",
      total: 19.0,
    },
    {
      id: "1046",
      name: "Elena R.",
      status: "Ready",
      items: "demoOrderFour",
      total: 54.8,
    },
  ])

  function updateOrder(id: string, status: string) {
    setOrders((current) =>
      current.map((order) => (order.id === id ? { ...order, status } : order))
    )
    setMessage(t("ticketUpdated", { id }))
  }

  return (
    <div className="flex min-h-svh">
      <aside className="sticky top-0 hidden h-svh w-60 shrink-0 flex-col bg-muted p-4 xl:flex">
        <Link href="/" className="px-2 py-3">
          <Brand />
        </Link>

        <p className="mb-6 ml-14 text-xs tracking-widest text-muted-foreground uppercase">
          {t("operatorOs")}
        </p>

        <div className="mb-5 rounded-md bg-secondary p-4">
          <strong className="text-sm">Le Bistrot Central</strong>

          <p className="mt-1 text-xs text-muted-foreground">
            {t("storeId")} #WP-8821
          </p>
        </div>

        <nav aria-label={t("navigation")} className="grid gap-2">
          {[
            {
              icon: LayoutDashboard,
              key: "dashboard",
              href: "/demo/dashboard",
            },
            {
              icon: ReceiptText,
              key: "liveOrders",
              href: "/demo/dashboard#tickets",
            },
            { icon: UtensilsCrossed, key: "menuBuilder", href: "/demo" },
            { icon: Palette, key: "themingStudio", href: "/demo" },
            { icon: Settings2, key: "settings", href: "/organization" },
          ].map(({ icon: Icon, key, href }) => (
            <Link
              key={key}
              href={href}
              className={`flex min-h-12 items-center gap-3 rounded-md px-3 text-sm ${key === "dashboard" ? "bg-obsidian font-semibold text-white hover:bg-obsidian/90" : "text-muted-foreground hover:bg-surface-variant hover:text-foreground active:bg-surface-dim"}`}
            >
              <Icon aria-hidden="true" className="size-5" />

              {t(key)}
            </Link>
          ))}
        </nav>

        <Link href="/sign-in" className="mt-auto rounded-md p-3 text-sm">
          {t("signIn")}
        </Link>
      </aside>

      <div className="min-w-0 flex-1">
        <MarketingHeader />

        <main className="mx-auto max-w-7xl p-3 sm:p-8">
          <header className="mb-8 flex flex-wrap items-center justify-between gap-5">
            <div className="flex items-center gap-4">
              <span className="grid size-14 place-items-center rounded-lg bg-primary text-primary-foreground shadow-sm">
                <Sandwich aria-hidden="true" className="size-7" />
              </span>

              <div>
                <div className="flex flex-wrap items-center gap-3">
                  <h1 className="font-heading text-headline-md">
                    Artisan Burger Co.
                  </h1>

                  <Badge variant="neutral">{t("downtownBranch")}</Badge>
                </div>

                <p className="mt-2 flex flex-col items-start gap-1 text-xs sm:flex-row sm:items-center sm:gap-2">
                  <span className="flex min-w-0 items-center gap-2">
                    <span
                      className={`size-2 shrink-0 rounded-full ${paused ? "bg-destructive-solid" : "bg-success-solid"}`}
                    />

                    {paused ? t("ordersPaused") : t("acceptingOrders")}
                  </span>

                  <span className="text-muted-foreground sm:ml-2">
                    {t("averagePrep")}: {rush ? "24" : "14"} min
                  </span>
                </p>
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              <Button
                variant="secondary"
                size="sm"
                aria-pressed={rush}
                onClick={() => setRush(!rush)}
              >
                <Clock aria-hidden="true" />

                {rush ? t("clearRush") : t("rushHold")}
              </Button>

              <Button
                variant="secondary"
                size="sm"
                onClick={() => {
                  setOrders((current) => [
                    {
                      id: String(1050 + current.length),
                      name: "Demo",
                      status: "Pending",
                      items: "demoOrderOne",
                      total: 22.5,
                    },
                    ...current,
                  ])
                  setMessage(t("testTicketAdded"))
                }}
              >
                <Printer aria-hidden="true" />

                {t("testTicket")}
              </Button>

              <Button
                variant="destructive"
                size="sm"
                aria-pressed={paused}
                onClick={() => setPaused(!paused)}
              >
                <Pause aria-hidden="true" />

                {paused ? t("resumeOrders") : t("emergencyPause")}
              </Button>
            </div>
          </header>

          <OperationalMetrics
            activeCount={
              orders.filter(
                (order) => !["Completed", "Cancelled"].includes(order.status)
              ).length
            }
          />

          <p
            role="status"
            className="my-4 min-h-5 text-xs text-muted-foreground"
          >
            {message || t("dashboardDemoNotice")}
          </p>

          <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,2fr)_minmax(260px,1fr)]">
            <section id="tickets" className="min-w-0 scroll-mt-24">
              <Card className="mb-4 gap-0 border-0 p-3">
                <div
                  role="group"
                  aria-label={t("orderFilters")}
                  className="flex flex-wrap gap-2"
                >
                  {["All", "Pending", "Preparing", "Ready", "Completed"].map(
                    (status) => (
                      <Button
                        key={status}
                        variant={filter === status ? "default" : "secondary"}
                        aria-pressed={filter === status}
                        onClick={() => setFilter(status)}
                        size="sm"
                      >
                        {status === "All" ? t("all") : t(`status${status}`)} (
                        {status === "All"
                          ? orders.length
                          : orders.filter((order) => order.status === status)
                              .length}
                        )
                      </Button>
                    )
                  )}
                </div>
              </Card>

              <div className="grid gap-4">
                {orders
                  .filter(
                    (order) => filter === "All" || order.status === filter
                  )
                  .map((order) => (
                    <Card
                      key={order.id}
                      className="grid grid-cols-1 gap-3 border-0 p-3 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center sm:gap-5 sm:p-5"
                    >
                      <div className="flex min-w-0 items-start gap-3 sm:gap-4">
                        <span
                          className={`grid size-10 shrink-0 place-items-center rounded-lg sm:size-12 ${order.status === "Pending" ? "bg-warning-muted text-warning" : order.status === "Ready" ? "bg-success-muted text-success" : "bg-secondary"}`}
                        >
                          <CookingPot aria-hidden="true" className="size-6" />
                        </span>

                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-3">
                            <h2 className="font-heading text-lg font-bold sm:text-xl">
                              #WP-{order.id}
                            </h2>

                            <Badge
                              variant={
                                order.status === "Ready"
                                  ? "success"
                                  : order.status === "Pending"
                                    ? "warning"
                                    : "neutral"
                              }
                            >
                              {t(`status${order.status}`)}
                            </Badge>
                          </div>

                          <p className="mt-2 text-sm sm:mt-3">
                            <strong>{order.name}</strong> ·{" "}
                            {price.format(order.total)}
                          </p>

                          <p className="mt-2 text-sm leading-6">
                            {t(order.items)}
                          </p>
                        </div>
                      </div>

                      <div className="flex flex-wrap justify-end gap-2 sm:pl-4">
                        {order.status === "Pending" && (
                          <Button
                            size="sm"
                            variant="secondary"
                            onClick={() => updateOrder(order.id, "Cancelled")}
                          >
                            {t("reject")}
                          </Button>
                        )}

                        {!["Completed", "Cancelled"].includes(order.status) && (
                          <Button
                            size="sm"
                            variant={
                              order.status === "Preparing"
                                ? "secondary"
                                : "default"
                            }
                            onClick={() =>
                              updateOrder(
                                order.id,
                                order.status === "Pending"
                                  ? "Preparing"
                                  : order.status === "Preparing"
                                    ? "Ready"
                                    : "Completed"
                              )
                            }
                          >
                            <Check aria-hidden="true" />

                            {order.status === "Pending"
                              ? t("acceptFire")
                              : order.status === "Preparing"
                                ? t("markReady")
                                : t("handOver")}
                          </Button>
                        )}
                      </div>
                    </Card>
                  ))}

                {!orders.some(
                  (order) => filter === "All" || order.status === filter
                ) && (
                  <p
                    role="status"
                    className="rounded-lg bg-card p-8 text-sm text-muted-foreground"
                  >
                    {t("noOrders")}
                  </p>
                )}
              </div>

              <Button
                nativeButton={false}
                render={<Link href="/demo" />}
                variant="secondary"
                className="mt-5"
              >
                <ExternalLink aria-hidden="true" />

                {t("viewStorefront")}
              </Button>
            </section>

            <OperationalInsights />
          </div>
        </main>
      </div>
    </div>
  )
}
