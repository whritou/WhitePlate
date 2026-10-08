"use client"

import { useState } from "react"
import {
  AlarmClock,
  ArrowRight,
  Bell,
  CalendarPlus,
  MapPin,
  Wallet,
  Store,
} from "lucide-react"
import { useTranslations } from "next-intl"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { CustomerShell } from "./customer-shell"
import { TrackingProgress } from "./tracking-progress"
import { TrackingBag } from "./tracking-bag"
import { useDemo } from "./demo-provider"

export function DemoTracking() {
  const t = useTranslations("Redesign")
  const demo = useDemo()
  const [message, setMessage] = useState("")
  const [alerts, setAlerts] = useState(true)

  return (
    <CustomerShell>
      <main className="pb-10">
        <section className="tracking-hero bg-muted">
          <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-8 px-4 pt-10 pb-16 sm:px-8">
            <div className="max-w-3xl">
              <div className="mb-5 flex flex-wrap items-center gap-3 text-xs">
                <Badge>{t("liveKitchen")}</Badge>

                <span className="text-muted-foreground">
                  {t("order")} #WP-1049 · Artisan Burger Co. Downtown
                </span>
              </div>

              <h1 className="font-heading text-display-hero-mobile lg:text-display-hero">
                {t(`trackingTitle${demo.status}`)}
              </h1>

              <p className="mt-4 flex items-center gap-2 text-sm">
                <AlarmClock
                  aria-hidden="true"
                  className="size-5 text-primary"
                />

                {demo.status === "Preparing"
                  ? t("trackingEta")
                  : t(`stage${demo.status}`)}
              </p>
            </div>

            <Card className="flex-col items-stretch gap-4 border-0 p-5 shadow-md sm:flex-row sm:items-center sm:gap-6">
              <div>
                <p className="text-xs text-muted-foreground">
                  {t("counterPin")}
                </p>

                <strong className="mt-1 block font-heading text-3xl tracking-widest text-primary">
                  4892
                </strong>

                <p className="mt-2 max-w-36 text-xs leading-5 text-muted-foreground">
                  {t("pinInstruction")}
                </p>
              </div>

              <div className="grid gap-2">
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => setMessage(t("walletPreview"))}
                >
                  <Wallet aria-hidden="true" />

                  {t("addWallet")}
                </Button>

                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => setMessage(t("calendarPreview"))}
                >
                  <CalendarPlus aria-hidden="true" />

                  {t("syncAlert")}
                </Button>
              </div>
            </Card>
          </div>
        </section>

        <div className="relative mx-auto -mt-6 max-w-7xl px-4 sm:px-8">
          <TrackingProgress status={demo.status} />

          <div className="my-4 flex flex-wrap items-center justify-between gap-3">
            <p role="status" className="text-xs text-muted-foreground">
              {message || t("trackingDemoNotice")}
            </p>

            <Button
              size="sm"
              variant="secondary"
              disabled={demo.status === "Completed"}
              onClick={demo.advanceOrder}
            >
              {t("advancePreview")}

              <ArrowRight aria-hidden="true" />
            </Button>
          </div>

          <div className="mt-8 grid items-start gap-8 lg:grid-cols-[minmax(0,1.35fr)_minmax(320px,0.95fr)]">
            <div className="grid gap-6">
              <Card className="gap-6 border-0 p-6 sm:p-8">
                <CardHeader className="flex items-center justify-between p-0">
                  <CardTitle>
                    <h2 className="flex items-center gap-3 text-xl">
                      <Store
                        aria-hidden="true"
                        className="size-5 text-primary"
                      />

                      {t("storeLocation")}
                    </h2>
                  </CardTitle>

                  <Badge variant="neutral">850 m</Badge>
                </CardHeader>

                <CardContent className="p-0">
                  <div className="map-preview grid h-60 place-items-center overflow-hidden rounded-lg bg-muted">
                    <div className="flex items-center gap-3 rounded-lg bg-card p-5 shadow-lg">
                      <MapPin
                        aria-hidden="true"
                        className="size-6 text-primary"
                      />

                      <p className="text-sm font-semibold">
                        Artisan Burger Co.
                        <span className="mt-1 block text-xs font-normal text-muted-foreground">
                          {t("fullAddress")}
                        </span>
                      </p>
                    </div>
                  </div>

                  <div className="mt-6 flex flex-wrap items-center justify-between gap-4">
                    <p className="text-sm font-semibold">
                      <span>{`Artisan Burger Co. · ${t("flagship")}`}</span>

                      <span className="mt-2 block text-xs font-normal text-muted-foreground">
                        {t("fullAddress")}
                      </span>
                    </p>

                    <Button
                      variant="secondary"
                      onClick={() => setMessage(t("directionsPreview"))}
                    >
                      <MapPin aria-hidden="true" />

                      {t("directions")}
                    </Button>
                  </div>
                </CardContent>
              </Card>

              <Card className="gap-6 border-0 p-6 sm:p-8">
                <CardHeader className="p-0">
                  <CardTitle>
                    <h2 className="text-xl">{t("pickupProtocol")}</h2>
                  </CardTitle>
                </CardHeader>

                <CardContent className="grid gap-4 p-0 sm:grid-cols-3">
                  {["walkIn", "providePin", "grabGo"].map((step, index) => (
                    <div key={step} className="rounded-md bg-muted p-4">
                      <span className="mb-3 grid size-7 place-items-center rounded-full bg-primary text-sm font-semibold text-primary-foreground">
                        {index + 1}
                      </span>

                      <h3 className="text-sm font-semibold">{t(step)}</h3>

                      <p className="mt-2 text-xs leading-5 text-muted-foreground">
                        {t(`${step}Description`)}
                      </p>
                    </div>
                  ))}
                </CardContent>
              </Card>

              <Card className="flex-row items-center justify-between gap-3 border-0 bg-muted p-6">
                <div className="flex items-center gap-3">
                  <Bell aria-hidden="true" className="size-5 text-primary" />

                  <p className="text-sm font-semibold">
                    {alerts ? t("alertsActive") : t("alertsPaused")}

                    <span className="mt-1 block text-xs font-normal text-muted-foreground">
                      {t("alertsDescription")}
                    </span>
                  </p>
                </div>

                <Button
                  variant="secondary"
                  size="sm"
                  aria-pressed={alerts}
                  onClick={() => setAlerts(!alerts)}
                >
                  {t("manageAlerts")}
                </Button>
              </Card>

              <Card className="flex-row flex-wrap items-center justify-between gap-4 border-0 p-5">
                <p className="text-sm">{t("needAdjustments")}</p>

                <Button
                  variant="secondary"
                  onClick={() => setMessage(t("supportPreview"))}
                >
                  {t("chatKitchen")}
                </Button>
              </Card>
            </div>

            <TrackingBag />
          </div>
        </div>
      </main>
    </CustomerShell>
  )
}
